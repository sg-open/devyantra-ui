#!/usr/bin/env node

/**
 * Performance testing script for the diff tool
 * Tests diff computation with various file sizes and complexity
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Diff = require('jsdiff')
const { html } = require('diff2html')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test configurations
const TEST_CONFIGS = [
  {
    name: 'Small JSON (1KB)',
    size: 1024,
    type: 'json',
    complexity: 'simple'
  },
  {
    name: 'Medium JavaScript (10KB)',
    size: 10 * 1024,
    type: 'javascript',
    complexity: 'medium'
  },
  {
    name: 'Large SQL (100KB)',
    size: 100 * 1024,
    type: 'sql',
    complexity: 'complex'
  },
  {
    name: 'Very Large Text (1MB)',
    size: 1024 * 1024,
    type: 'text',
    complexity: 'simple'
  },
  {
    name: 'Extra Large Code (5MB)',
    size: 5 * 1024 * 1024,
    type: 'javascript',
    complexity: 'complex'
  }
]

// Content generators
const generators = {
  json: (size) => {
    const baseObject = {
      id: 1,
      name: "test",
      active: true,
      metadata: {
        created: "2024-01-01T00:00:00Z",
        tags: ["test", "demo"]
      }
    }

    let content = '{\n'
    let currentSize = content.length
    let counter = 0

    while (currentSize < size - 100) {
      const obj = { ...baseObject, id: counter++ }
      const line = `  "item${counter}": ${JSON.stringify(obj)},\n`

      if (currentSize + line.length > size - 50) break

      content += line
      currentSize += line.length
    }

    content = content.slice(0, -2) + '\n}' // Remove last comma and close
    return content
  },

  javascript: (size) => {
    const templates = [
      'function test{ID}() {\n  return "Hello World {ID}";\n}\n\n',
      'const variable{ID} = {value: {ID}, active: true};\n\n',
      'class TestClass{ID} {\n  constructor() {\n    this.id = {ID};\n  }\n}\n\n',
      '// Comment for section {ID}\nif (condition{ID}) {\n  processData({ID});\n}\n\n'
    ]

    let content = '// Generated JavaScript file\n\n'
    let counter = 0

    while (content.length < size - 200) {
      const template = templates[counter % templates.length]
      const code = template.replace(/{ID}/g, counter)

      if (content.length + code.length > size - 50) break

      content += code
      counter++
    }

    return content
  },

  sql: (size) => {
    const tables = ['users', 'orders', 'products', 'categories']
    const operations = [
      'SELECT * FROM {table} WHERE id = {ID};',
      'INSERT INTO {table} (name, active) VALUES (\'item{ID}\', true);',
      'UPDATE {table} SET name = \'updated{ID}\' WHERE id = {ID};',
      'DELETE FROM {table} WHERE id = {ID};'
    ]

    let content = '-- Generated SQL file\n\n'
    let counter = 0

    while (content.length < size - 200) {
      const table = tables[counter % tables.length]
      const operation = operations[counter % operations.length]
      const sql = operation.replace(/{table}/g, table).replace(/{ID}/g, counter) + '\n\n'

      if (content.length + sql.length > size - 50) break

      content += sql
      counter++
    }

    return content
  },

  text: (size) => {
    const words = [
      'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
      'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
      'et', 'dolore', 'magna', 'aliqua', 'Ut', 'enim', 'ad', 'minim', 'veniam'
    ]

    let content = ''
    let wordIndex = 0

    while (content.length < size - 100) {
      const word = words[wordIndex % words.length]
      const addition = wordIndex % 10 === 9 ? word + '.\n' : word + ' '

      if (content.length + addition.length > size - 50) break

      content += addition
      wordIndex++
    }

    return content.trim()
  }
}

// Generate modified version with changes
function generateModifiedVersion(original, complexity) {
  const lines = original.split('\n')
  const modifications = []

  switch (complexity) {
    case 'simple':
      // 5% of lines changed
      modifications.push({
        type: 'modify',
        count: Math.max(1, Math.floor(lines.length * 0.05))
      })
      break

    case 'medium':
      // 15% modified, 5% added, 3% removed
      modifications.push(
        { type: 'modify', count: Math.floor(lines.length * 0.15) },
        { type: 'add', count: Math.floor(lines.length * 0.05) },
        { type: 'remove', count: Math.floor(lines.length * 0.03) }
      )
      break

    case 'complex':
      // 25% modified, 10% added, 8% removed
      modifications.push(
        { type: 'modify', count: Math.floor(lines.length * 0.25) },
        { type: 'add', count: Math.floor(lines.length * 0.10) },
        { type: 'remove', count: Math.floor(lines.length * 0.08) }
      )
      break
  }

  let modifiedLines = [...lines]

  // Apply modifications
  modifications.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * modifiedLines.length)

      switch (type) {
        case 'modify':
          if (modifiedLines[randomIndex]) {
            modifiedLines[randomIndex] = modifiedLines[randomIndex] + ' // MODIFIED'
          }
          break

        case 'add':
          modifiedLines.splice(randomIndex, 0, '// ADDED LINE')
          break

        case 'remove':
          if (modifiedLines.length > 10) {
            modifiedLines.splice(randomIndex, 1)
          }
          break
      }
    }
  })

  return modifiedLines.join('\n')
}

// Performance testing function
function testDiffPerformance(original, modified, testName) {
  console.log(`\n🧪 Testing: ${testName}`)
  console.log(`📊 Original size: ${(original.length / 1024).toFixed(1)}KB`)
  console.log(`📊 Modified size: ${(modified.length / 1024).toFixed(1)}KB`)

  const results = {}

  // Test different granularities
  const granularities = ['line', 'word', 'character']

  granularities.forEach(granularity => {
    console.log(`\n  Testing ${granularity} granularity:`)

    let diffFunction
    switch (granularity) {
      case 'character':
        diffFunction = Diff.diffChars
        break
      case 'word':
        diffFunction = Diff.diffWords
        break
      case 'line':
      default:
        diffFunction = Diff.diffLines
        break
    }

    // Measure diff computation time
    const startTime = performance.now()
    const diff = diffFunction(original, modified)
    const endTime = performance.now()

    const computationTime = endTime - startTime
    console.log(`    ⏱️  Computation time: ${computationTime.toFixed(2)}ms`)

    // Measure unified patch generation
    const patchStartTime = performance.now()
    const patch = Diff.createTwoFilesPatch(
      'original',
      'modified',
      original,
      modified,
      'Original',
      'Modified'
    )
    const patchEndTime = performance.now()

    const patchTime = patchEndTime - patchStartTime
    console.log(`    📝 Patch generation: ${patchTime.toFixed(2)}ms`)

    // Measure HTML generation
    const htmlStartTime = performance.now()
    html(patch, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side'
    })
    const htmlEndTime = performance.now()

    const htmlTime = htmlEndTime - htmlStartTime
    console.log(`    🎨 HTML generation: ${htmlTime.toFixed(2)}ms`)

    // Calculate statistics
    const stats = {
      addedLines: diff.filter(d => d.added).reduce((sum, d) => sum + (d.value.split('\n').length - 1), 0),
      removedLines: diff.filter(d => d.removed).reduce((sum, d) => sum + (d.value.split('\n').length - 1), 0),
      totalChanges: diff.filter(d => d.added || d.removed).length
    }

    console.log(`    📈 Added lines: ${stats.addedLines}`)
    console.log(`    📉 Removed lines: ${stats.removedLines}`)
    console.log(`    🔄 Total changes: ${stats.totalChanges}`)

    const totalTime = computationTime + patchTime + htmlTime
    console.log(`    ⏱️  Total time: ${totalTime.toFixed(2)}ms`)

    results[granularity] = {
      computationTime,
      patchTime,
      htmlTime,
      totalTime,
      stats
    }

    // Performance warnings
    if (totalTime > 1000) {
      console.log(`    ⚠️  Warning: Processing took over 1 second`)
    }
    if (totalTime > 5000) {
      console.log(`    🚨 Critical: Processing took over 5 seconds`)
    }
  })

  return results
}

// Memory usage monitoring
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      rss: (usage.rss / 1024 / 1024).toFixed(1) + 'MB',
      heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(1) + 'MB',
      heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(1) + 'MB'
    }
  }
  return null
}

// Main test runner
async function runPerformanceTests() {
  console.log('🚀 Starting Diff Tool Performance Tests')
  console.log('=====================================')

  const initialMemory = getMemoryUsage()
  if (initialMemory) {
    console.log(`💾 Initial memory usage: ${initialMemory.heapUsed}`)
  }

  const allResults = {}

  // Create test files directory
  const testDir = join(__dirname, '../test-files')
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true })
  }

  for (const config of TEST_CONFIGS) {
    console.log(`\n📁 Generating test files for: ${config.name}`)

    // Generate original content
    const originalContent = generators[config.type](config.size)

    // Generate modified version
    const modifiedContent = generateModifiedVersion(originalContent, config.complexity)

    // Save test files for manual inspection
    const originalPath = join(testDir, `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_original.txt`)
    const modifiedPath = join(testDir, `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_modified.txt`)

    try {
      writeFileSync(originalPath, originalContent)
      writeFileSync(modifiedPath, modifiedContent)
      console.log(`✅ Test files saved to ${testDir}`)
    } catch (error) {
      console.log(`⚠️  Could not save test files: ${error.message}`)
    }

    // Run performance test
    const results = testDiffPerformance(originalContent, modifiedContent, config.name)
    allResults[config.name] = results

    const currentMemory = getMemoryUsage()
    if (currentMemory) {
      console.log(`💾 Memory usage: ${currentMemory.heapUsed}`)
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }

  // Summary report
  console.log('\n📊 PERFORMANCE SUMMARY')
  console.log('===================')

  Object.entries(allResults).forEach(([testName, results]) => {
    console.log(`\n${testName}:`)
    Object.entries(results).forEach(([granularity, result]) => {
      console.log(`  ${granularity}: ${result.totalTime.toFixed(2)}ms`)
    })
  })

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS')
  console.log('================')

  const slowTests = Object.entries(allResults).filter(([, results]) => {
    return Object.values(results).some(r => r.totalTime > 1000)
  })

  if (slowTests.length > 0) {
    console.log('⚠️  Performance concerns detected:')
    slowTests.forEach(([testName, results]) => {
      const slowGranularities = Object.entries(results).filter(([, r]) => r.totalTime > 1000)
      slowGranularities.forEach(([gran, result]) => {
        console.log(`   - ${testName} (${gran}): ${result.totalTime.toFixed(2)}ms`)
      })
    })

    console.log('\n🔧 Suggested optimizations:')
    console.log('   - Implement virtual scrolling for large diffs')
    console.log('   - Add processing interruption for very large files')
    console.log('   - Consider using Web Workers for diff computation')
    console.log('   - Implement progressive rendering')
  } else {
    console.log('✅ All tests completed within acceptable time limits!')
  }

  const finalMemory = getMemoryUsage()
  if (finalMemory && initialMemory) {
    const memoryIncrease = parseFloat(finalMemory.heapUsed) - parseFloat(initialMemory.heapUsed)
    console.log(`\n💾 Memory increase: ${memoryIncrease.toFixed(1)}MB`)
  }

  console.log('\n🎉 Performance testing complete!')
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests().catch(console.error)
}

export { runPerformanceTests, testDiffPerformance }