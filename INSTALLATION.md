# Installation Guide

## For End Users

### Using npx (Recommended)

```bash
npx git@github.com:realkishorear/frontend-package.git init my-app
```

The CLI will automatically:
1. Install dependencies (including TypeScript)
2. Build the project during postinstall
3. Run the init command

If the build fails during postinstall, the CLI will attempt to build on first run.

### Global Installation

```bash
npm install -g git+https://github.com/realkishorear/frontend-package.git
jgd-fe init my-app
```

## For Developers

### Local Development

```bash
# Clone the repository
git clone git@github.com:realkishorear/frontend-package.git
cd frontend-package

# Install dependencies
npm install

# Build the project
npm run build

# Link globally for testing
npm link

# Test the CLI
jgd-fe init test-app
```

## Troubleshooting

### Build Not Found Error

If you see "Production build not found", the CLI will automatically attempt to build. If that fails:

1. Ensure you have Node.js >= 18.0.0
2. Ensure TypeScript is available (it's included in dependencies)
3. Try running manually:
   ```bash
   npm install
   npm run build
   ```

### TypeScript Not Available

TypeScript is included as a dependency, so it should be available after `npm install`. If you're still having issues:

1. Check that `node_modules/typescript` exists
2. Try reinstalling: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be >= 18.0.0)

## Notes

- The `dist` folder is not committed to the repository
- The project builds automatically during `npm install` (postinstall script)
- If postinstall fails, the CLI will attempt to build on first run
- TypeScript is included as a dependency to ensure builds work in all environments

