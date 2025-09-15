# Contributing to DevYantra UI

Thank you for your interest in contributing to DevYantra UI! We welcome contributions from the community and are pleased to have you join us.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn package manager
- Git

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/devyantra-ui.git
   cd devyantra-ui
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/original-username/devyantra-ui.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🧪 **Test coverage improvements**
- 🔧 **Developer experience improvements**

### Before You Start

1. **Check existing issues** to see if your bug report or feature request already exists
2. **Create an issue** for major changes to discuss the approach before implementation
3. **Look for "good first issue"** labels if you're new to the project

## Development Guidelines

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

Example: `feature/add-xml-formatter` or `fix/diff-performance-issue`

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions or modifications
- `chore` - Build process or auxiliary tool changes

**Examples:**
```bash
feat(diff): add monaco editor integration
fix(json): handle malformed json gracefully
docs: update contributing guidelines
test: add unit tests for hash generator
```

## Coding Standards

### TypeScript & Vue.js

- **TypeScript**: Use strict TypeScript with proper type definitions
- **Vue 3**: Use Composition API with `<script setup>` syntax
- **Reactivity**: Prefer `ref()` and `computed()` over reactive objects when possible

### Code Style

We use automated tools to maintain consistent code style:

```bash
# Format code
npm run format

# Lint and fix
npm run lint

# Type checking
npm run type-check
```

### Component Guidelines

1. **Single Responsibility**: Each component should have a single, well-defined purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Emits Declaration**: Declare all emitted events with proper types
4. **Composables**: Extract reusable logic into composables
5. **Error Handling**: Implement proper error boundaries and user feedback

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   └── tools/          # Tool-specific components
├── composables/        # Reusable composition functions
├── views/             # Page-level components
├── stores/           # Pinia stores
├── utils/           # Utility functions
└── types/          # TypeScript type definitions
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Guidelines

- Write unit tests for utility functions and composables
- Test components with user interaction scenarios
- Aim for >80% test coverage on new code
- Use descriptive test names that explain the scenario

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should handle user input correctly', () => {
    // Test implementation
  })

  it('should emit events when action occurs', () => {
    // Test implementation
  })
})
```

## Pull Request Process

### Before Submitting

1. **Sync your fork** with the upstream repository:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following the guidelines above

4. **Test your changes**:
   ```bash
   npm run test
   npm run type-check
   npm run lint
   npm run build
   ```

5. **Commit your changes** with conventional commit messages

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code completed
- [ ] Comments added for complex logic
- [ ] Tests added/updated for new functionality
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated if needed

### Pull Request Template

When creating a pull request, please include:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots to demonstrate UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Step-by-step reproduction** instructions
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, Node.js version)
5. **Screenshots/videos** if applicable
6. **Console errors** or relevant logs

### Feature Requests

For feature requests, please provide:

1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - How would you like it to work?
3. **Alternatives considered** - What other approaches did you consider?
4. **Use cases** - When would this feature be useful?

## Development Tips

### Debugging

- Use Vue DevTools browser extension
- Enable source maps in development
- Use `console.log` or debugger statements temporarily
- Check browser console for TypeScript errors

### Performance

- Use Vue DevTools Profiler to identify performance bottlenecks
- Implement virtual scrolling for large datasets
- Use `computed()` for expensive calculations
- Lazy load components when appropriate

### Accessibility

- Test with screen readers
- Ensure proper keyboard navigation
- Use semantic HTML elements
- Provide alt text for images
- Test color contrast ratios

## Questions?

If you have questions or need help, please:

1. Check existing [GitHub Issues](https://github.com/your-username/devyantra-ui/issues)
2. Create a new issue with the "question" label
3. Join our community discussions

Thank you for contributing to DevYantra UI! 🚀