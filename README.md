# DevYantra UI - Developer Tools Suite

A comprehensive Vue.js web application providing essential developer tools including text comparison, JSON formatting, encoding/decoding utilities, and more. Built with modern web technologies for high performance and security.

## 🚀 Features

### Core Tools
- **Advanced Text/Code Diff Tool** - Professional-grade text comparison with syntax highlighting
- **JSON Formatter & Validator** - Format, validate and compare JSON data
- **Hash Generator** - Generate MD5, SHA-1, SHA-256, and other hash algorithms
- **Base64 Encoder/Decoder** - Encode and decode Base64 strings
- **JWT Decoder** - Decode and validate JSON Web Tokens
- **Timestamp Converter** - Convert between Unix timestamps and human-readable dates
- **Character Counter** - Count characters, words, lines with detailed statistics
- **URL Encoder/Decoder** - Encode and decode URL parameters

### Text Comparison Features
- **Split & Unified Views** - Toggle between side-by-side and unified diff views
- **Word & Character Granularity** - Choose comparison level for precise analysis
- **Syntax Highlighting** - Support for 50+ programming languages with auto-detection
- **Large File Handling** - Virtual scrolling and optimized performance for files >1MB
- **Export Options** - Copy to clipboard, download as .diff or .txt
- **Shareable State** - URL-based sharing with compressed state
- **File Upload Support** - Upload .txt, .json, and other text files
- **Advanced Options** - Ignore case, whitespace, and empty lines

## 🛠️ Tech Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development and building
- **Language**: TypeScript for type safety
- **Styling**: TailwindCSS with custom design system
- **UI Components**: PrimeVue component library
- **State Management**: Pinia for reactive state
- **Diff Engine**: jsdiff + diff2html for accurate comparisons
- **Syntax Highlighting**: highlight.js (tree-shaken for optimal bundle size)
- **Testing**: Vitest with Vue Test Utils

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd devyantra-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Development Scripts

```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and fix code
npm run lint

# Format code with Prettier
npm run format
```

## 📂 Project Structure

```
devyantra-ui/
├── src/
│   ├── components/          # Reusable Vue components
│   ├── views/              # Page-level components
│   │   └── tools/          # Tool-specific views
│   ├── composables/        # Vue composables
│   ├── stores/             # Pinia stores
│   ├── router/             # Vue Router configuration
│   ├── assets/             # Static assets and styles
│   └── config/             # Application configuration
├── public/                 # Public static files
├── dist/                   # Production build output
└── tests/                  # Test files
```

## 🎯 Key Components

### DiffView Component
Advanced text comparison with:
- Real-time diff computation
- Multiple view modes (split/unified)
- Syntax highlighting
- Virtual scrolling for large files
- Export capabilities

### Composables
- `useDiff()` - Debounced diff computation with statistics
- `useShareState()` - URL and localStorage state management
- `useSEO()` - Dynamic SEO optimization

## 🔒 Privacy & Security

- **Client-Side Only**: All processing happens in your browser
- **No Data Upload**: Your files and data never leave your device
- **No Tracking**: No analytics or user tracking implemented
- **Secure**: Built with security best practices

## 🚀 Performance

- **Optimized Bundle**: Tree-shaking and code splitting
- **Virtual Scrolling**: Handles large files efficiently
- **Debounced Operations**: Smooth UI with automatic debouncing
- **Lazy Loading**: Components loaded on demand
- **Compressed State**: Efficient URL sharing with LZ-string compression

## 🌐 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📱 Responsive Design

Fully responsive design optimized for:
- Desktop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- [highlight.js](https://highlightjs.org/) - Syntax highlighting
- [jsdiff](https://github.com/kpdecker/jsdiff) - JavaScript diff implementation
- [diff2html](https://diff2html.rtfpessoa.xyz/) - Diff to HTML converter

## 📧 Support

For support and questions, please open an issue in the GitHub repository.

---

Built with ❤️ by the DevYantra team