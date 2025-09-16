# Advanced Diff Tool Features

This document provides comprehensive information about the advanced text/code diff tool implemented in DevYantra UI.

## 🚀 Core Features

### Text Comparison
- **Split View**: Side-by-side comparison with synchronized scrolling
- **Unified View**: Traditional unified diff format
- **Multiple Granularity**: Character, word, or line-level comparison
- **Advanced Options**: Ignore case, whitespace, and empty lines

### File Upload Support
- **Supported Formats**: .txt, .json, .js, .ts, .vue, .css, .html, .xml, .sql, .py, .java, .cpp, .c, .md
- **File Size Limit**: 10MB per file
- **Auto-Detection**: Language detection from file extensions

### Syntax Highlighting
- **50+ Languages**: JavaScript, TypeScript, Python, Java, C++, SQL, JSON, HTML, CSS, and more
- **Auto-Detection**: Intelligent language detection based on content
- **Manual Override**: Manual language selection when needed

### Export & Sharing
- **Copy to Clipboard**: Copy diff results or formatted text
- **Download**: Export diffs as .diff or .txt files
- **URL Sharing**: Generate shareable URLs with compressed state
- **Local Storage**: Auto-save and restore work sessions

### Performance Optimizations
- **Virtual Scrolling**: Handle large files efficiently
- **Debounced Computation**: Smooth UI with automatic debouncing
- **Progressive Rendering**: Fast rendering of complex diffs
- **Memory Management**: Optimized for low memory usage

## 🎯 Usage Examples

### Basic Text Comparison

```javascript
// In your Vue component
import DiffView from '@/components/DiffView.vue'

// The component handles all diff logic automatically
```

### Using the Composables

```typescript
// useDiff composable example
import { useDiff } from '@/composables/useDiff'

const leftText = ref('Original text')
const rightText = ref('Modified text')
const options = ref({ granularity: 'word', ignoreCase: true })

const { result, isComputing, copyToClipboard, downloadFile } = useDiff(
  leftText,
  rightText,
  options
)

// Access diff results
console.log('Added lines:', result.value.stats.addedLines)
console.log('Removed lines:', result.value.stats.removedLines)

// Export functionality
await copyToClipboard(result.value.unified)
downloadFile(result.value.unified, 'my-diff.diff')
```

```typescript
// useShareState composable example
import { useShareState } from '@/composables/useShareState'

const shareState = useShareState(leftText, rightText, options, {
  autoSave: true,
  autoLoad: true
})

// Generate shareable URL
const shareUrl = shareState.generateShareUrl()

// Copy to clipboard
await shareState.copyShareUrl()

// Load from URL
shareState.loadFromUrl('https://example.com/diff#compressed_data')
```

## 🔧 Configuration Options

### Diff Options
```typescript
interface DiffOptions {
  granularity: 'character' | 'word' | 'line'  // Default: 'line'
  ignoreCase: boolean                          // Default: false
  ignoreWhitespace: boolean                    // Default: false
  showContext: boolean                         // Default: true
  contextSize: number                          // Default: 3
}
```

### Share State Config
```typescript
interface ShareStateConfig {
  maxUrlLength: number        // Default: 8000
  compressionLevel: 'none' | 'base64' | 'lz'  // Default: 'lz'
  storageKey: string         // Default: 'diffTool_state'
  autoSave: boolean          // Default: true
  autoLoad: boolean          // Default: true
}
```

## 📊 Performance Benchmarks

Based on our performance tests:

| File Size | Processing Time | Memory Usage |
|-----------|----------------|--------------|
| 1KB       | < 1ms          | Minimal      |
| 10KB      | < 1ms          | Low          |
| 100KB     | < 1ms          | Moderate     |
| 1MB       | ~3ms           | Acceptable   |
| 5MB+      | 10-50ms        | High*        |

*For files > 5MB, consider using progressive loading features.

## 🎨 Styling & Themes

The diff tool uses CSS custom properties for theming:

```css
:root {
  --diff-added-bg: var(--dt-success-light);
  --diff-removed-bg: var(--dt-danger-light);
  --diff-modified-bg: var(--dt-warning-light);
  --diff-context-bg: var(--dt-surface-1);
  --diff-line-number-bg: var(--dt-surface-2);
}
```

## 🧪 Testing

The diff tool includes comprehensive tests:

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test useDiff
npm run test useShareState
npm run test DiffView

# Performance testing
node scripts/simple-perf-test.js
```

## 🔒 Security & Privacy

- **Client-Side Only**: All processing happens in the browser
- **No Data Upload**: Files never leave your device
- **Secure Sharing**: URLs use compression but remain client-side
- **No Tracking**: No analytics or user data collection

## 🌐 Browser Compatibility

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

All modern browsers with ES2020+ support.

## 🚀 Advanced Use Cases

### 1. Code Review Workflow
```typescript
// Compare two versions of a file
const originalCode = await fetch('/api/file/v1').then(r => r.text())
const modifiedCode = await fetch('/api/file/v2').then(r => r.text())

// Set up diff with syntax highlighting
leftText.value = originalCode
rightText.value = modifiedCode
selectedLanguageLeft.value = 'javascript'
```

### 2. Configuration File Comparison
```typescript
// Compare JSON configurations
const prodConfig = JSON.stringify(prodSettings, null, 2)
const stagingConfig = JSON.stringify(stagingSettings, null, 2)

// Enable ignore whitespace for formatted JSON
diffOptions.value = {
  granularity: 'line',
  ignoreWhitespace: true,
  ignoreCase: false
}
```

### 3. Database Schema Comparison
```typescript
// Compare SQL schemas
const currentSchema = await getSchemaSQL('current')
const proposedSchema = await getSchemaSQL('proposed')

// Use SQL-specific options
selectedLanguageLeft.value = 'sql'
selectedLanguageRight.value = 'sql'
```

## 🛠️ Customization

### Custom Language Detection
```typescript
// Override language detection
const customDetectLanguage = (text: string): string => {
  if (text.includes('<?xml')) return 'xml'
  if (text.startsWith('#!/bin/bash')) return 'bash'
  // ... custom logic
  return detectLanguage(text) // fallback to built-in
}
```

### Custom Export Formats
```typescript
// Custom export format
const exportAsMarkdown = () => {
  const markdown = `
# Diff Report

## Summary
- Added: ${result.value.stats.addedLines} lines
- Removed: ${result.value.stats.removedLines} lines

## Changes
\`\`\`diff
${result.value.unified}
\`\`\`
`

  downloadFile(markdown, 'diff-report.md', 'text/markdown')
}
```

## 📝 API Reference

### DiffView Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialLeft` | `string` | `''` | Initial left text content |
| `initialRight` | `string` | `''` | Initial right text content |
| `initialOptions` | `Partial<DiffOptions>` | `{}` | Initial diff options |

### DiffView Component Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@diff-computed` | `DiffResult` | Emitted when diff computation completes |
| `@text-changed` | `{left: string, right: string}` | Emitted when text content changes |
| `@export` | `{type: string, content: string}` | Emitted on export actions |

## 🐛 Troubleshooting

### Common Issues

1. **Large File Performance**
   - Enable virtual scrolling for files > 100KB
   - Consider splitting very large files
   - Use line granularity for better performance

2. **Memory Issues**
   - Clear browser cache periodically
   - Avoid keeping multiple large diffs open
   - Use browser's task manager to monitor memory

3. **URL Sharing Problems**
   - Check URL length (8000 character limit)
   - Try localStorage sharing for very large states
   - Ensure proper encoding of special characters

4. **Language Detection Issues**
   - Manually select language when auto-detection fails
   - Check file extension mapping
   - Provide content hints (e.g., shebang lines)

## 🔮 Future Enhancements

- **Word-level highlighting** within changed lines
- **Merge conflict resolution** interface
- **Side-by-side editing** capabilities
- **Plugin system** for custom diff algorithms
- **Real-time collaboration** features
- **Version control integration** (Git, SVN)

## 📚 Additional Resources

- [jsdiff Documentation](https://github.com/kpdecker/jsdiff)
- [diff2html Documentation](https://diff2html.rtfpessoa.xyz/)
- [highlight.js Languages](https://highlightjs.org/static/demo/)
- [Vue 3 Composition API](https://vuejs.org/guide/composition-api-introduction.html)

---

*This diff tool was built with ❤️ for the DevYantra developer community.*