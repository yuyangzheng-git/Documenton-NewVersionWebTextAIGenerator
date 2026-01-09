# Contributing to Document AI Generator

Thank you for your interest in contributing to Document AI Generator! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Be patient with newcomers
- Welcome all contributions

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When creating a bug report:
1. Use a clear and descriptive title
2. Provide steps to reproduce
3. Include expected behavior
4. Include actual behavior
5. Specify your environment (OS, Node.js version, browser)
6. Provide screenshots if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! When suggesting an enhancement:
1. Use a clear and descriptive title
2. Provide a detailed description of the enhancement
3. Explain why this enhancement would be useful
4. Provide examples or mockups if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "feat: Add amazing feature"
   ```

   Commit message format:
   - `feat:` A new feature
   - `fix:` A bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Include screenshots if applicable

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
   cd Documenton-NewVersionWebTextAIGenerator/ai-document-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run tests** (if available)
   ```bash
   npm test
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Coding Standards

### TypeScript
- Use TypeScript for all new files
- Avoid `any` types when possible
- Use interfaces for object shapes
- Use proper type annotations

### React
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Use proper prop types

### Code Style
- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions short and focused

## Project Structure

```
ai-document-generator/
├── app/              # Next.js App Router
├── components/       # React components
├── lib/             # Utility functions
├── store/           # State management
└── types/           # TypeScript types
```

## Getting Help

- Read the [README.md](./README.md)
- Check existing [Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)
- Start a [Discussion](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
