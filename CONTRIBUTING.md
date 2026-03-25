# Contributing to RPM

Thank you for your interest in contributing to RPM! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js 24.x
- pnpm package manager
- GitHub account with collaborator access

### Setup
```bash
# Clone repository
git clone https://github.com/galiprandi/rpm.git
cd rpm

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Development Workflow

### 1. Create Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Test
```bash
# Lint
pnpm lint

# Type check
pnpm run type-check

# Build
pnpm build
```

### 4. Commit
```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and PR
```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## Code Style

### TypeScript
- Use strict TypeScript
- Add proper types for all functions
- Use interfaces for object shapes

### React/Next.js
- Use functional components
- Prefer hooks over classes
- Follow Next.js App Router conventions

### TailwindCSS
- Use utility classes
- Avoid custom CSS when possible
- Maintain consistent spacing and colors

## Testing

### Unit Tests
```bash
# Run tests (when configured)
pnpm test
```

### Manual Testing
- Test in development mode
- Test build locally
- Test deployment on Vercel preview

## Documentation

### Update Documentation
- README.md for user-facing changes
- docs/ for technical documentation
- specs/ for system specifications

### JSDoc Comments
```typescript
/**
 * Function description
 * @param param - Parameter description
 * @returns Return value description
 */
```

## Pull Request Process

### PR Requirements
- Clear title and description
- Tests passing
- Documentation updated
- No merge conflicts

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Build verification
- [ ] Documentation verified

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## Deployment

### Automatic Deployment
- Push to `main` branch triggers production deploy
- Pull requests trigger preview deployments

### Manual Deployment
```bash
vercel --prod
```

## Getting Help

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Project Specifications](specs/)

### Contacts
- **Maintainer**: rpm.sysadim@gmail.com
- **GitHub Issues**: https://github.com/galiprandi/rpm/issues

## Code of Conduct

### Our Pledge
- Be inclusive and respectful
- Focus on what is best for the community
- Show empathy towards other community members

### Standards
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Gracefully accept constructive criticism

### Enforcement
Contact the maintainers for any conduct issues.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
