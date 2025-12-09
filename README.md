# jgd-fe-cli

A frontend scaffolding CLI tool that creates React + Vite + TypeScript + TailwindCSS projects with a single command.

## Installation

Install and run using npx:

```bash
npx github:myusername/jgd-fe-cli init my-app
```

Or install globally:

```bash
npm install -g github:myusername/jgd-fe-cli
jgd-fe init my-app
```

## Usage

Create a new project:

```bash
jgd-fe init <project-name>
```

This will:
1. Create a new folder with your project name
2. Copy the React + Vite + TypeScript + TailwindCSS template
3. Install all dependencies
4. Print instructions for starting the dev server

Example:

```bash
jgd-fe init my-awesome-app
cd my-awesome-app
npm run dev
```

## Project Structure

```
/jgd-fe-cli
 ├─ package.json
 ├─ bin/
 │   └─ jgd-fe.js
 ├─ templates/
 │   └─ react-tailwind/
 │        ├─ package.json
 │        ├─ index.html
 │        ├─ tailwind.config.js
 │        ├─ postcss.config.js
 │        ├─ tsconfig.json
 │        ├─ vite.config.ts
 │        └─ src/
 │             ├─ main.tsx
 │             ├─ App.tsx
 │             ├─ pages/
 │             │     ├─ Home.tsx
 │             │     └─ About.tsx
 │             └─ index.css
 └─ README.md
```

## Template Features

The `react-tailwind` template includes:

- ✅ **Vite** - Fast build tool and dev server
- ✅ **React 18** - Latest React with hooks
- ✅ **TypeScript** - Type-safe development
- ✅ **TailwindCSS** - Utility-first CSS framework
- ✅ **React Router** - Client-side routing
- ✅ **Custom Colors** - Pre-configured primary (#1E40AF) and secondary (#14B8A6) colors
- ✅ **Example Pages** - Home and About pages with navigation

## Adding New Templates

To add a new template:

1. Create a new folder under `templates/` (e.g., `templates/vue-nuxt/`)
2. Add your template files in that folder
3. Update the CLI to support template selection (optional)

Example structure:

```
templates/
 ├─ react-tailwind/
 └─ vue-nuxt/
    └─ ... (your template files)
```

## Development

To develop this CLI locally:

```bash
# Install dependencies
npm install

# Link globally for testing
npm link

# Test the CLI
jgd-fe init test-app
```

## License

MIT
