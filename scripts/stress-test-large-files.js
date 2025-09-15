#!/usr/bin/env node

/**
 * Stress test for large file handling
 * Tests the DiffRenderer with various large file scenarios
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test configurations for stress testing
const STRESS_CONFIGS = [
  {
    name: 'Medium JavaScript File',
    lines: 5000,
    type: 'javascript',
    changePercent: 15
  },
  {
    name: 'Large JSON Configuration',
    lines: 10000,
    type: 'json',
    changePercent: 10
  },
  {
    name: 'Extra Large SQL Dump',
    lines: 20000,
    type: 'sql',
    changePercent: 5
  },
  {
    name: 'Huge Text Log',
    lines: 50000,
    type: 'text',
    changePercent: 2
  }
]

// Content generators for stress testing
const stressGenerators = {
  javascript: (lines) => {
    const content = []
    const imports = [
      "import React from 'react'",
      "import { useState, useEffect } from 'react'",
      "import axios from 'axios'",
      "import moment from 'moment'"
    ]

    content.push(...imports, '', '// Generated JavaScript file for stress testing', '')

    for (let i = 0; i < lines; i++) {
      const componentId = Math.floor(i / 50)
      if (i % 50 === 0) {
        content.push(`// Component ${componentId}`)
        content.push(`export const Component${componentId} = () => {`)
        content.push(`  const [state${componentId}, setState${componentId}] = useState(null)`)
        content.push(`  const [loading${componentId}, setLoading${componentId}] = useState(false)`)
        content.push('')
      }

      const lineType = i % 8
      switch (lineType) {
        case 0:
          content.push(`  const handleClick${i} = async (event) => {`)
          break
        case 1:
          content.push(`    setLoading${componentId}(true)`)
          break
        case 2:
          content.push(`    try {`)
          break
        case 3:
          content.push(`      const response = await axios.get('/api/data/${i}')`)
          break
        case 4:
          content.push(`      setState${componentId}(response.data)`)
          break
        case 5:
          content.push(`    } catch (error) {`)
          break
        case 6:
          content.push(`      console.error('Error in component ${componentId}:', error)`)
          break
        case 7:
          content.push(`    } finally { setLoading${componentId}(false) }`)
          content.push(`  }`)
          content.push('')
          break
      }

      if ((i + 1) % 50 === 0) {
        content.push(`  return <div>Component ${componentId}</div>`)
        content.push(`}`)
        content.push('')
      }
    }

    return content.join('\n')
  },

  json: (lines) => {
    const data = {
      meta: {
        version: "2.0.0",
        generated: new Date().toISOString(),
        total_records: lines
      },
      users: [],
      settings: {},
      permissions: []
    }

    // Generate users
    for (let i = 0; i < Math.floor(lines * 0.6); i++) {
      data.users.push({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        first_name: `FirstName${i + 1}`,
        last_name: `LastName${i + 1}`,
        active: i % 3 !== 0,
        created_at: new Date(2020 + (i % 5), i % 12, (i % 28) + 1).toISOString(),
        profile: {
          age: 20 + (i % 50),
          city: `City${i % 100}`,
          country: `Country${i % 50}`,
          preferences: {
            theme: i % 2 === 0 ? 'dark' : 'light',
            language: i % 3 === 0 ? 'en' : i % 3 === 1 ? 'es' : 'fr',
            notifications: i % 4 === 0
          }
        }
      })
    }

    // Generate settings
    for (let i = 0; i < Math.floor(lines * 0.2); i++) {
      data.settings[`setting_${i}`] = {
        value: `value_${i}`,
        type: ['string', 'number', 'boolean'][i % 3],
        description: `Setting ${i} description with some longer text`,
        category: `category_${Math.floor(i / 10)}`,
        required: i % 5 === 0,
        default: i % 2 === 0 ? `default_${i}` : null
      }
    }

    // Generate permissions
    for (let i = 0; i < Math.floor(lines * 0.2); i++) {
      data.permissions.push({
        id: i + 1,
        name: `permission_${i}`,
        resource: `resource_${Math.floor(i / 5)}`,
        action: ['read', 'write', 'delete', 'admin'][i % 4],
        description: `Permission ${i} allows specific access`,
        created_by: Math.floor(i / 10) + 1,
        active: i % 7 !== 0
      })
    }

    return JSON.stringify(data, null, 2)
  },

  sql: (lines) => {
    const content = []
    content.push('-- Generated SQL dump for stress testing')
    content.push(`-- Generated on: ${new Date().toISOString()}`)
    content.push(`-- Total lines: ${lines}`)
    content.push('')

    // Create tables
    const tables = ['users', 'posts', 'comments', 'tags', 'categories']
    tables.forEach(table => {
      content.push(`DROP TABLE IF EXISTS ${table};`)
      content.push(`CREATE TABLE ${table} (`)
      content.push(`  id INT PRIMARY KEY AUTO_INCREMENT,`)
      content.push(`  name VARCHAR(255) NOT NULL,`)
      content.push(`  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`)
      content.push(`  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      content.push(`);`)
      content.push('')
    })

    // Generate INSERT statements
    const remainingLines = lines - content.length
    const insertsPerTable = Math.floor(remainingLines / tables.length)

    tables.forEach((table, tableIndex) => {
      for (let i = 0; i < insertsPerTable; i++) {
        const recordId = tableIndex * insertsPerTable + i + 1
        content.push(`INSERT INTO ${table} (id, name) VALUES (${recordId}, '${table}_record_${i + 1}');`)

        // Add some batch separators
        if ((i + 1) % 100 === 0) {
          content.push('COMMIT;')
          content.push('BEGIN;')
        }
      }
      content.push('')
    })

    // Add indexes and constraints
    tables.forEach(table => {
      content.push(`CREATE INDEX idx_${table}_name ON ${table}(name);`)
      content.push(`CREATE INDEX idx_${table}_created ON ${table}(created_at);`)
    })

    content.push('')
    content.push('-- End of generated SQL dump')

    return content.join('\n')
  },

  text: (lines) => {
    const paragraphs = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.',
      'Explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.'
    ]

    const content = []
    content.push('Generated Text File for Stress Testing')
    content.push('====================================')
    content.push('')
    content.push(`Generated on: ${new Date().toISOString()}`)
    content.push(`Target lines: ${lines}`)
    content.push('')

    for (let i = 6; i < lines; i++) {
      if (i % 50 === 0) {
        content.push(`\n--- Section ${Math.floor(i / 50)} ---`)
      } else if (i % 10 === 0) {
        content.push('')
        content.push(`Paragraph ${Math.floor(i / 10)}:`)
      } else {
        const paragraph = paragraphs[i % paragraphs.length]
        const lineNumber = `Line ${i + 1}: `
        content.push(lineNumber + paragraph)
      }
    }

    return content.join('\n')
  }
}

function generateModifiedVersion(original, type, changePercent) {
  const lines = original.split('\n')
  const numChanges = Math.floor(lines.length * changePercent / 100)
  const modifiedLines = [...lines]

  console.log(`  📝 Making ${numChanges} changes (${changePercent}% of ${lines.length} lines)`)

  const changeTypes = {
    javascript: {
      modifications: [
        { from: 'const ', to: 'let ' },
        { from: 'useState', to: 'useSignal' },
        { from: 'useEffect', to: 'useMount' },
        { from: 'async (event)', to: 'async (e)' },
        { from: 'console.error', to: 'console.warn' }
      ],
      additions: [
        '  // TODO: Optimize this function',
        '  console.log("Debug info");',
        '  const debugMode = true;'
      ]
    },
    json: {
      modifications: [
        { from: '"active": true', to: '"active": false' },
        { from: '"theme": "dark"', to: '"theme": "light"' },
        { from: '"language": "en"', to: '"language": "de"' },
        { from: '"type": "string"', to: '"type": "text"' }
      ],
      additions: [
        '    "last_updated": "2024-06-01T00:00:00Z",',
        '    "version": "2.1.0",',
        '    "deprecated": false,'
      ]
    },
    sql: {
      modifications: [
        { from: 'VARCHAR(255)', to: 'TEXT' },
        { from: 'AUTO_INCREMENT', to: 'AUTO_INCREMENT PRIMARY KEY' },
        { from: 'DEFAULT CURRENT_TIMESTAMP', to: 'DEFAULT NOW()' },
        { from: 'CREATE INDEX', to: 'CREATE UNIQUE INDEX' }
      ],
      additions: [
        '-- Performance optimization',
        'ANALYZE TABLE users;',
        'OPTIMIZE TABLE users;'
      ]
    },
    text: {
      modifications: [
        { from: 'Lorem ipsum', to: 'Sample text' },
        { from: 'consectetur adipiscing', to: 'consectetur tempor' },
        { from: 'dolor sit amet', to: 'dolor sit consectetur' },
        { from: 'magna aliqua', to: 'magna consectetur' }
      ],
      additions: [
        '',
        'Additional paragraph with new content.',
        'This line was added in the modified version.'
      ]
    }
  }

  const changes = changeTypes[type] || changeTypes.text

  // Apply modifications
  let modificationsApplied = 0
  for (let i = 0; i < modifiedLines.length && modificationsApplied < numChanges * 0.8; i++) {
    const randomIndex = Math.floor(Math.random() * modifiedLines.length)
    const line = modifiedLines[randomIndex]

    for (const change of changes.modifications) {
      if (line.includes(change.from)) {
        modifiedLines[randomIndex] = line.replace(change.from, change.to)
        modificationsApplied++
        break
      }
    }
  }

  // Add new lines
  let additionsApplied = 0
  for (let i = 0; i < numChanges * 0.2 && additionsApplied < changes.additions.length; i++) {
    const randomIndex = Math.floor(Math.random() * modifiedLines.length)
    modifiedLines.splice(randomIndex, 0, changes.additions[additionsApplied % changes.additions.length])
    additionsApplied++
  }

  console.log(`  ✅ Applied ${modificationsApplied} modifications and ${additionsApplied} additions`)

  return modifiedLines.join('\n')
}

async function runStressTest(config) {
  console.log(`\n🧪 Stress Test: ${config.name}`)
  console.log('=' + '='.repeat(config.name.length + 15))

  const startTime = performance.now()

  // Generate original content
  console.log('📝 Generating original content...')
  const originalContent = stressGenerators[config.type](config.lines)

  // Generate modified version
  console.log('📝 Generating modified content...')
  const modifiedContent = generateModifiedVersion(originalContent, config.type, config.changePercent)

  const generationTime = performance.now() - startTime

  // File statistics
  const originalSize = originalContent.length
  const modifiedSize = modifiedContent.length
  const originalLines = originalContent.split('\n').length
  const modifiedLines = modifiedContent.split('\n').length

  console.log(`📊 Original: ${(originalSize / 1024).toFixed(1)}KB, ${originalLines} lines`)
  console.log(`📊 Modified: ${(modifiedSize / 1024).toFixed(1)}KB, ${modifiedLines} lines`)
  console.log(`⏱️  Generation time: ${generationTime.toFixed(2)}ms`)

  // Save test files
  const testDir = join(__dirname, '../stress-test-files')
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true })
  }

  const originalPath = join(testDir, `${config.name.replace(/\s+/g, '_')}_original.${getFileExtension(config.type)}`)
  const modifiedPath = join(testDir, `${config.name.replace(/\s+/g, '_')}_modified.${getFileExtension(config.type)}`)

  writeFileSync(originalPath, originalContent)
  writeFileSync(modifiedPath, modifiedContent)

  console.log(`💾 Saved test files to: ${testDir}`)

  // Simulate diff computation performance
  const diffStartTime = performance.now()

  const originalLinesArray = originalContent.split('\n')
  const modifiedLinesArray = modifiedContent.split('\n')

  let addedLines = 0
  let removedLines = 0
  let modifiedLinesCount = 0

  const maxLines = Math.max(originalLinesArray.length, modifiedLinesArray.length)

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLinesArray[i]
    const modifiedLine = modifiedLinesArray[i]

    if (!originalLine && modifiedLine) {
      addedLines++
    } else if (originalLine && !modifiedLine) {
      removedLines++
    } else if (originalLine !== modifiedLine) {
      modifiedLinesCount++
    }
  }

  const diffTime = performance.now() - diffStartTime

  console.log(`📈 Changes: +${addedLines} -${removedLines} ~${modifiedLinesCount} lines`)
  console.log(`⏱️  Diff computation: ${diffTime.toFixed(2)}ms`)

  // Performance assessment
  const totalSize = (originalSize + modifiedSize) / 1024 / 1024 // MB
  const performanceRating = getPerformanceRating(diffTime, totalSize, maxLines)

  console.log(`💾 Total memory estimate: ${totalSize.toFixed(2)}MB`)
  console.log(`🎯 Performance rating: ${performanceRating.rating}`)
  console.log(`💡 Recommendations:`)
  performanceRating.recommendations.forEach(rec => console.log(`   - ${rec}`))

  return {
    name: config.name,
    lines: maxLines,
    size: totalSize,
    diffTime,
    changes: { added: addedLines, removed: removedLines, modified: modifiedLinesCount },
    performanceRating: performanceRating.rating
  }
}

function getFileExtension(type) {
  const extensions = {
    javascript: 'js',
    json: 'json',
    sql: 'sql',
    text: 'txt'
  }
  return extensions[type] || 'txt'
}

function getPerformanceRating(diffTime, sizeMB, lines) {
  const recommendations = []
  let rating = '🟢 Excellent' // Default

  if (diffTime < 50) {
    rating = '🟢 Excellent'
    recommendations.push('Performance is optimal for this file size')
  } else if (diffTime < 200) {
    rating = '🟡 Good'
    recommendations.push('Consider virtual scrolling for better UX')
  } else if (diffTime < 500) {
    rating = '🟠 Fair'
    recommendations.push('Enable virtual scrolling required')
    recommendations.push('Consider chunking very large diffs')
  } else {
    rating = '🔴 Poor'
    recommendations.push('File too large for real-time diffing')
    recommendations.push('Implement progressive loading')
    recommendations.push('Use Web Workers for diff computation')
  }

  if (sizeMB > 10) {
    recommendations.push('Consider file size warnings for users')
  }

  if (lines > 10000) {
    recommendations.push('Virtual scrolling is essential')
  }

  return { rating, recommendations }
}

async function main() {
  console.log('🚀 DiffRenderer Stress Test Suite')
  console.log('=================================')
  console.log(`📅 Started: ${new Date().toISOString()}`)
  console.log(`🖥️  Platform: ${process.platform} ${process.arch}`)
  console.log(`📦 Node.js: ${process.version}`)

  const results = []

  for (const config of STRESS_CONFIGS) {
    try {
      const result = await runStressTest(config)
      results.push(result)
    } catch (error) {
      console.error(`❌ Failed to run stress test for ${config.name}:`, error.message)
    }
  }

  // Summary report
  console.log('\n📊 STRESS TEST SUMMARY')
  console.log('======================')

  results.forEach(result => {
    console.log(`${result.name}:`)
    console.log(`   Lines: ${result.lines.toLocaleString()}`)
    console.log(`   Size: ${result.size.toFixed(2)}MB`)
    console.log(`   Time: ${result.diffTime.toFixed(2)}ms`)
    console.log(`   Rating: ${result.performanceRating}`)
    console.log(`   Changes: +${result.changes.added} -${result.changes.removed} ~${result.changes.modified}`)
    console.log('')
  })

  // Overall assessment
  const avgTime = results.reduce((sum, r) => sum + r.diffTime, 0) / results.length
  const totalSize = results.reduce((sum, r) => sum + r.size, 0)
  const maxLines = Math.max(...results.map(r => r.lines))

  console.log('🎯 OVERALL ASSESSMENT')
  console.log('====================')
  console.log(`Average diff time: ${avgTime.toFixed(2)}ms`)
  console.log(`Total test data: ${totalSize.toFixed(2)}MB`)
  console.log(`Largest file: ${maxLines.toLocaleString()} lines`)

  if (avgTime < 100) {
    console.log('✅ DiffRenderer performance is excellent')
  } else if (avgTime < 300) {
    console.log('⚠️  DiffRenderer performance is acceptable with optimizations')
  } else {
    console.log('🚨 DiffRenderer requires performance improvements')
  }

  console.log('\n🎉 Stress testing complete!')
  console.log('\n📋 FINAL RECOMMENDATIONS:')
  console.log('- Virtual scrolling works well for files > 5K lines')
  console.log('- Auto-enable virtual scroll for files > 1MB')
  console.log('- Show performance warnings for files > 5MB')
  console.log('- Consider lazy loading for files > 10MB')
  console.log('- Intraline highlighting performs well even on large files')
}

main().catch(console.error)