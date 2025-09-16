import * as Diff from 'jsdiff'

console.log('Available Diff functions:')
console.log(Object.keys(Diff))

// Test basic functionality
const text1 = 'Hello world'
const text2 = 'Hello universe'

console.log('\nTesting diffChars:')
try {
  const charDiff = Diff.diffChars(text1, text2)
  console.log('Success:', charDiff.length, 'changes')
} catch (e) {
  console.log('Error:', e.message)
}

console.log('\nTesting diffWords:')
try {
  const wordDiff = Diff.diffWords(text1, text2)
  console.log('Success:', wordDiff.length, 'changes')
} catch (e) {
  console.log('Error:', e.message)
}

console.log('\nTesting diffLines:')
try {
  const lineDiff = Diff.diffLines(text1, text2)
  console.log('Success:', lineDiff.length, 'changes')
} catch (e) {
  console.log('Error:', e.message)
}