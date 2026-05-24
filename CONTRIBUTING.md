# Contributing to Betal-FE

Thank you for your interest in contributing to Betal-FE! This document provides guidelines for contributing to the project.

## 🌟 Ways to Contribute

- **Bug Reports** - Report issues you encounter
- **Feature Requests** - Suggest new features or improvements
- **Documentation** - Improve or expand documentation
- **Code** - Submit bug fixes or new features
- **Examples** - Add example applications
- **Tests** - Improve test coverage

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/betal-fe.git
   cd betal-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch** — see [Branch Strategy](#-branch-strategy) below

---

## 🌿 Branch Strategy

All development happens off `main`. Never commit directly to `main` — every change goes through a branch + pull request.

### Protected Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, published code. Every commit here should be a versioned release. |

### Branch Types and Naming

| Type | Pattern | Example | When to use |
|------|---------|---------|-------------|
| Feature | `feat/<scope>/<short-description>` | `feat/router/lazy-loading` | New user-facing functionality |
| Bug fix | `fix/<scope>/<short-description>` | `fix/patch/fragment-offset` | Fixing broken behaviour |
| Refactor | `refactor/<scope>/<short-description>` | `refactor/component/cleanup-lifecycle` | Internal code improvements without behaviour change |
| Docs | `docs/<description>` | `docs/add-lifecycle-guide` | Documentation-only changes |
| Test | `test/<scope>/<description>` | `test/router/guard-edge-cases` | Adding/fixing tests without code changes |
| Chore | `chore/<description>` | `chore/update-rollup-config` | Build, tooling, dependency changes |
| Release | `release/v<version>` | `release/v4.5.0` | Version bump + changelog prep before tagging |

**Rules:**
- Use lowercase and hyphens only — no spaces or underscores.
- Keep the description short (3–5 words).
- The `<scope>` segment matches the affected module: `router`, `component`, `patch`, `slots`, `scheduler`, `attrs`, `events`, `build`, etc.

### Typical Workflow

```
main
 └── feat/router/history-mode        ← you work here
      └── (pull request → main)
```

```bash
# Start from a fresh main
git checkout main
git pull origin main

# Create your branch
git checkout -b feat/slots/named-slots

# Work, commit, push
git push -u origin feat/slots/named-slots

# Open a PR targeting main
```

### When to Create a Release Branch

Create a `release/vX.Y.Z` branch when you're ready to ship:

```bash
git checkout main
git pull
git checkout -b release/v4.5.0
# Bump version in package.json, update CHANGELOG
git commit -m "🔖 bump version to 4.5.0"
# PR → main, then tag after merge:
git tag v4.5.0
git push origin v4.5.0
```

### Versioning Guidelines (Semantic Versioning)

| Change | Version bump | Example |
|--------|-------------|---------|
| Bug fix, docs, chore | Patch `x.y.Z` | 4.4.1 → 4.4.2 |
| New backwards-compatible feature | Minor `x.Y.0` | 4.4.1 → 4.5.0 |
| Breaking API change | Major `X.0.0` | 4.x → 5.0.0 |

---

## 💻 Development Workflow

### Project Structure

```
packages/runtime/src/
├── app.js                  # Application factory
├── component.js            # Component system
├── h.js                    # Virtual DOM creation (createElement)
├── mount-dom.js            # DOM mounting logic
├── patch-dom.js            # DOM diffing and patching
├── destroy-dom.js          # DOM cleanup
├── router.js               # Routing system
├── router-components.js    # Router view/link components
├── route-matchers.js       # Route matching logic
├── slots.js                # Slot system
├── scheduler.js            # Update scheduler
├── dispatcher.js           # Event dispatcher
├── events.js               # Event handling
├── attributes.js           # Attribute manipulation
├── nodes-equal.js          # VNode comparison
├── traverse-dom.js         # DOM traversal utilities
├── index.js                # Main exports
├── __tests__/              # Test files
└── utils/                  # Utility functions
    ├── arrays.js
    ├── assert.js
    ├── objects.js
    ├── props.js
    └── strings.js
```

### Running Tests

```bash
cd packages/runtime
npm test

# Watch mode
npm test -- --watch

# Specific test file
npm test -- my-test.test.js
```

### Running Examples

```bash
npm run serve:examples
# Opens http-server on http://localhost:8080
```

### Building

```bash
cd packages/runtime
npm run build
```

## 📝 Code Guidelines

### Code Style

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing code patterns

### Naming Conventions

- **Files**: `kebab-case.js` (e.g., `mount-dom.js`)
- **Functions**: `camelCase` (e.g., `mountDOM`, `createApp`)
- **Classes**: `PascalCase` (e.g., `HashRouter`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DOM_TYPES`)
- **Private fields**: `#camelCase` (e.g., `#vdom`, `#isMounted`)

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) with [gitmoji](https://gitmoji.dev/) emojis:

**Format:**
```
<emoji> <type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**
```bash
✨ feat(router): Add route guards with beforeEnter hook
🐛 fix(slots): Correct slot rendering order in fragments
📚 docs: Update component lifecycle documentation
♻️ refactor(patch): Simplify DOM diffing algorithm
✅ test(router): Add navigation tests with params
🎨 style: Format code with prettier
🔧 chore(build): Update rollup configuration
```

**Common Gitmoji:**

| Emoji | Code | Type | Usage |
|-------|------|------|-------|
| ✨ | `:sparkles:` | `feat` | New feature |
| 🐛 | `:bug:` | `fix` | Bug fix |
| 📚 | `:books:` | `docs` | Documentation |
| ♻️ | `:recycle:` | `refactor` | Code refactoring |
| ✅ | `:white_check_mark:` | `test` | Tests |
| 🎨 | `:art:` | `style` | Code style/formatting |
| ⚡ | `:zap:` | `perf` | Performance |
| 🔧 | `:wrench:` | `chore` | Config/tooling |
| 🔥 | `:fire:` | `remove` | Remove code/files |
| 🛑 | `:octagonal_sign:` | `break` | Breaking changes |

See full list at [gitmoji.dev](https://gitmoji.dev/)

### Documentation

- Add JSDoc comments to public APIs
- Include examples for new features
- Update README for user-facing changes
- Document breaking changes clearly

Example JSDoc:
```javascript
/**
 * Creates a virtual DOM element node.
 * 
 * @param {string|Component} tag - HTML tag name or component class
 * @param {Object} props - Element properties and attributes
 * @param {Array} children - Child nodes
 * @returns {VNode} Virtual DOM node
 */
export function h(tag, props = {}, children = []) {
  // ...
}
```

## 🧪 Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for meaningful test coverage
- Use descriptive test names

```javascript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should call onMounted after mounting', () => {
    // Test implementation
  });

  it('should call onPropsChange when props change', () => {
    // Test implementation
  });
});
```

## 🔄 Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes**
   - Write clear, focused commits
   - Add tests for new features
   - Update documentation

3. **Push to your fork**
   ```bash
   git push origin feature/my-awesome-feature
   ```

4. **Create Pull Request**
   - Go to GitHub and create a PR
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why

5. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How were these changes tested?

   ## Checklist
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] Code follows style guidelines
   ```

## 🐛 Reporting Bugs

When reporting bugs, please include:

- **Description** - Clear description of the bug
- **Steps to Reproduce** - How to reproduce the issue
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Environment** - OS, Node version, etc.
- **Code Sample** - Minimal code to reproduce (if applicable)

## 💡 Requesting Features

When requesting features, please include:

- **Use Case** - Why is this feature needed?
- **Proposed Solution** - How should it work?
- **Alternatives** - What alternatives have you considered?
- **Examples** - Code examples of the proposed API

## ❓ Questions?

- Review the README for API documentation
- Check existing issues and PRs
- Open a GitHub Discussion for questions

## 🎯 Good First Issues

Look for issues labeled `good-first-issue` - these are great starting points for new contributors!

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards other contributors

## 🙏 Thank You!

Every contribution matters, whether it's a typo fix or a major feature. Thank you for helping make Betal-FE better!
