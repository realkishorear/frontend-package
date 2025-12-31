# jgd-fe-cli

A production-ready React + TypeScript project generator CLI that creates fully configured projects with multiple templates, bundlers, CSS frameworks, and optional features.

[![CI](https://github.com/yourusername/jgd-fe-cli/workflows/CI/badge.svg)](https://github.com/yourusername/jgd-fe-cli/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Features

- 🚀 **Multiple Templates**: Dashboard, Landing Page, or Empty starter
- ⚡ **Bundler Support**: Vite (fast) or Webpack (mature)
- 🎨 **CSS Frameworks**: Tailwind CSS, Sass, or plain CSS
- 📦 **Component Libraries**: Material UI, Ant Design, shadcn/ui, or none
- 🛣️ **Routing**: React Router v6 (manual) or v7+ (file-based)
- 🔧 **Optional Features**: Redux, React Query, Logger, Framer Motion
- 📦 **Smart Package Manager Detection**: Automatically detects npm, yarn, or pnpm
- ✅ **TypeScript**: Full TypeScript support out of the box
- 🧪 **Testing Ready**: Jest configuration included
- 🎯 **Production Ready**: ESLint, Prettier, and best practices

## Installation

### Global Installation

```bash
npm install -g jgd-fe-cli
```

### Using npx (Recommended)

#### From npm registry:
```bash
npx jgd-fe-cli init my-app
```

#### From GitHub repository:
```bash
# Using github: shorthand (for public repos)
npx github:realkishorear/frontend-package init web-1

# Or using git+https
npx git+https://github.com/realkishorear/frontend-package.git init web-1

# Or using git+ssh (for private repos)
npx git+ssh://git@github.com/realkishorear/frontend-package.git init web-1
```

Or initialize in the current directory:

```bash
npx github:realkishorear/frontend-package init .
```

## Quick Start

```bash
# Create a new project
npx jgd-fe-cli init my-awesome-app

# Follow the interactive prompts:
# 1. Choose template (Dashboard, Landing, or Empty)
# 2. Select bundler (Vite or Webpack)
# 3. Pick CSS framework (Tailwind, Sass, or CSS)
# 4. Choose component library (MUI, Ant Design, shadcn/ui, or None)
# 5. Add optional features (Redux, React Query, Logger, Animations)
# 6. Select routing approach (React Router v6 or v7+)

# Navigate to your project
cd my-awesome-app

# Start development server
npm run dev
```

## Interactive Prompts

The CLI will guide you through the following options:

### 1. Template Type
- **📊 Dashboard**: Full-featured dashboard with sidebar, pages, and components
- **🌐 Landing**: Modern landing page with hero, features, and footer
- **📝 Empty**: Minimal starter with clean slate

### 2. Bundler
- **⚡ Vite**: Fast, modern build tool (Recommended)
- **📦 Webpack**: Mature, flexible bundler

### 3. CSS Framework
- **📦 Tailwind CSS**: Utility-first CSS framework (Recommended)
- **📦 Sass**: CSS preprocessor with variables and nesting
- **📦 CSS**: Plain CSS

### 4. Component Library
- **📦 Material UI**: Google's Material Design components
- **📦 Ant Design**: Enterprise-class UI design language
- **📦 shadcn/ui**: Re-usable components built with Radix UI and Tailwind CSS (requires Tailwind)
- **📦 None**: No component library

### 5. Optional Features
- **Redux**: State management with Redux Toolkit
- **React Query**: Powerful data fetching with TanStack Query
- **Logger**: Structured logging with loglevel
- **Animations**: Smooth animations with Framer Motion

### 6. Routing
- **React Router v6**: Manual route configuration
- **React Router v7+**: File-based routing (requires Vite)

## Project Structure

Generated projects follow this structure:

```
my-app/
├── public/
│   └── config.json
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── store/          # Redux store (if enabled)
│   ├── routes/         # React Router v7+ routes (if enabled)
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts      # or webpack.config.js
└── tailwind.config.js  # if Tailwind selected
```

## Templates

### Dashboard Template

A production-ready dashboard with:
- Sidebar navigation
- Multiple pages (Home, Analytics, Settings)
- Responsive layout
- Component examples
- Ready for data visualization

### Landing Template

A modern landing page with:
- Hero section
- Features showcase
- Footer
- About and Contact pages
- Navigation

### Empty Template

A minimal starter with:
- Basic React + TypeScript setup
- Clean project structure
- Ready for your custom implementation

## Component Libraries

### Material UI

Automatically installs and configures:
- `@mui/material`
- `@emotion/react`
- `@emotion/styled`

### Ant Design

Automatically installs:
- `antd`

### shadcn/ui

**Note**: Requires manual initialization after project creation:

```bash
npx shadcn-ui@latest init
```

The CLI will remind you to run this command after project generation.

## Package Manager Detection

The CLI automatically detects your preferred package manager:

1. Checks for lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
2. Falls back to checking global availability
3. Defaults to npm if none found

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd jgd-fe-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally for local testing
npm link

# Test the CLI
jgd-fe-cli init test-app
```

### Available Scripts

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format

# Type checking
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Adding New Templates

1. Create a new folder under `src/generator/templates/`
2. Add your template files:
   - Main component file (e.g., `MyTemplate.tsx`)
   - Pages, components, layouts as needed
3. Update `src/prompts.ts` to include your template in the choices
4. Update `src/generator/index.js` to handle your template

## Configuration

### Environment Variables

- `DEBUG=true`: Enable verbose logging
- `NODE_ENV`: Set to `production` for production builds

### CLI Options

```bash
jgd-fe-cli init [project-name] [options]

Options:
  -v, --verbose    Enable verbose logging
  -h, --help       Show help
  -V, --version    Show version number
```

## Troubleshooting

### Installation Issues

If you encounter issues during dependency installation:

1. Check your Node.js version: `node --version` (should be >= 18.0.0)
2. Clear npm cache: `npm cache clean --force`
3. Try using a different package manager
4. Check your internet connection

### Build Issues

If the generated project doesn't build:

1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript errors: `npm run typecheck`
3. Verify bundler configuration matches your setup
4. Check for conflicting dependencies

### Template Issues

If a template doesn't work as expected:

1. Verify the template files are complete
2. Check for missing dependencies
3. Review the generated configuration files
4. Open an issue on GitHub

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📖 [Documentation](https://github.com/yourusername/jgd-fe-cli#readme)
- 🐛 [Issue Tracker](https://github.com/yourusername/jgd-fe-cli/issues)
- 💬 [Discussions](https://github.com/yourusername/jgd-fe-cli/discussions)

## Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at any scale
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

---

Made with ❤️ by the JGD team
