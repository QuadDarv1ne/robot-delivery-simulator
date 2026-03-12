# Contributing to Robot Delivery Simulator

First off, thank you for considering contributing to Robot Delivery Simulator! It's people like you that make this project great.

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@robotsimulator.dev.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or bun
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/robot-delivery-simulator.git
   cd robot-delivery-simulator
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original/robot-delivery-simulator.git
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples
- Describe the behavior you observed and expected
- Include screenshots if helpful
- Specify your environment (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- List any alternatives you've considered
- Include mockups or examples if applicable

### Your First Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - good for newcomers
- `help wanted` - extra attention needed
- `documentation` - documentation improvements

## Development Setup

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Create demo user
npm run seed

# Start development servers
npm run dev
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
│   └── ui/        # shadcn/ui components
├── lib/           # Utilities and configurations
└── types/         # TypeScript type definitions
```

## Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Use type aliases for unions/primitives

### React

- Use functional components with hooks
- Follow the Rules of Hooks
- Keep components small and focused
- Use meaningful component and prop names

### Code Style

- We use ESLint and Prettier
- Run `npm run lint` before committing
- Format code with `npm run format`
- Maximum line length: 100 characters

### Component Guidelines

```tsx
// Good: Well-structured component
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ 
  variant = 'primary', 
  children, 
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### API Routes

- Use proper HTTP methods
- Return consistent response formats
- Handle errors gracefully
- Validate input with Zod schemas

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(map): add 3D terrain visualization
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
refactor(api): restructure user endpoints
```

## Pull Request Process

### Before Submitting

1. Update your branch with the latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Run all tests:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

3. Update documentation if needed

### Submitting

1. Push to your fork:
   ```bash
   git push origin your-feature-branch
   ```

2. Open a Pull Request against `main`

3. Fill out the PR template completely

4. Link any related issues

### Review Process

- PRs require at least one approval
- All CI checks must pass
- Address review feedback promptly
- Keep the PR up to date with main

### After Merge

- Delete your feature branch
- Update your local main branch
- Celebrate! 🎉

## Getting Help

- 💬 Discord: [Join our community](https://discord.gg/robotsimulator)
- 📧 Email: support@robotsimulator.dev
- 📖 Docs: [docs.robotsimulator.dev](https://docs.robotsimulator.dev)

---

Thank you for contributing! 🙏
