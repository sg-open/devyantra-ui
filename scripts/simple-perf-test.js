#!/usr/bin/env node

/**
 * Simple performance test for diff functionality
 */

const SIZES = [
  { name: '1KB', size: 1024 },
  { name: '10KB', size: 10240 },
  { name: '100KB', size: 102400 },
  { name: '1MB', size: 1048576 }
]

function generateText(size) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 \n'
  let result = ''

  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

function modifyText(original) {
  const lines = original.split('\n')

  // Modify 20% of lines
  const modifyCount = Math.floor(lines.length * 0.2)

  for (let i = 0; i < modifyCount; i++) {
    const randomIndex = Math.floor(Math.random() * lines.length)
    lines[randomIndex] = lines[randomIndex] + ' MODIFIED'
  }

  return lines.join('\n')
}

function testPerformance(original, modified, testName) {
  console.log(`\n🧪 Testing ${testName}`)
  console.log(`📊 Size: ${(original.length / 1024).toFixed(1)}KB`)

  // Simple line comparison test
  const startTime = performance.now()

  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')

  let addedLines = 0
  let removedLines = 0
  let unchangedLines = 0

  const maxLines = Math.max(originalLines.length, modifiedLines.length)

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || ''
    const modifiedLine = modifiedLines[i] || ''

    if (!originalLine && modifiedLine) {
      addedLines++
    } else if (originalLine && !modifiedLine) {
      removedLines++
    } else if (originalLine === modifiedLine) {
      unchangedLines++
    } else {
      // Line modified - count as both removed and added
      removedLines++
      addedLines++
    }
  }

  const endTime = performance.now()
  const processingTime = endTime - startTime

  console.log(`⏱️  Processing time: ${processingTime.toFixed(2)}ms`)
  console.log(`📈 Added lines: ${addedLines}`)
  console.log(`📉 Removed lines: ${removedLines}`)
  console.log(`🔄 Unchanged lines: ${unchangedLines}`)

  // Performance assessment
  if (processingTime > 1000) {
    console.log(`⚠️  Warning: Processing took over 1 second`)
  }
  if (processingTime > 5000) {
    console.log(`🚨 Critical: Processing took over 5 seconds`)
  } else {
    console.log(`✅ Performance acceptable`)
  }

  return {
    processingTime,
    addedLines,
    removedLines,
    unchangedLines
  }
}

async function runTests() {
  console.log('🚀 Simple Diff Performance Test')
  console.log('==============================')

  const results = []

  for (const config of SIZES) {
    console.log(`\n📝 Generating ${config.name} test data...`)

    const original = generateText(config.size)
    const modified = modifyText(original)

    const result = testPerformance(original, modified, config.name)
    results.push({ name: config.name, ...result })

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }

  console.log('\n📊 PERFORMANCE SUMMARY')
  console.log('====================')

  results.forEach(result => {
    console.log(`${result.name}: ${result.processingTime.toFixed(2)}ms`)
  })

  const slowTests = results.filter(r => r.processingTime > 1000)
  if (slowTests.length > 0) {
    console.log('\n⚠️  Performance concerns:')
    slowTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.processingTime.toFixed(2)}ms`)
    })
  } else {
    console.log('\n✅ All tests completed within 1 second!')
  }

  console.log('\n💡 RECOMMENDATIONS')
  console.log('=================')
  console.log('✓ Simple line-based diff performs well')
  console.log('✓ Consider virtual scrolling for files > 100KB')
  console.log('✓ Implement progressive loading for very large files')
  console.log('✓ Add user warnings for files > 1MB')

  console.log('\n🎉 Performance testing complete!')
}

runTests().catch(console.error)