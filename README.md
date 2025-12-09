# jgd-fe-cli

A custom React project generator CLI that creates React + TypeScript projects with interactive prompts, multiple templates, optional Tailwind CSS, and component library support.

## Installation

Install and run using npx:

```bash
npx github.com/<username>/<repo> init my-app
```

Or initialize in the current directory:

```bash
npx github.com/<username>/<repo> init .
```

## Usage

Run the init command:

```bash
jgd-fe init <project-name>
```

The CLI will ask you interactive questions:

1. **Template Type**: Choose from:
   - Dashboard
   - website
   - Nothing (Empty Starter)

2. **Tailwind CSS**: Yes or No

3. **Component Library**: Choose from:
   - Material UI
   - shadcn/ui
   - Ant Design
   - None

After answering the questions, the CLI will:
- Copy the selected template
- Set up Tailwind CSS (if selected)
- Configure the chosen component library
- Install all dependencies automatically
- Print instructions for starting the dev server

## Project Structure

```
/jgd-fe-cli
 ├─ bin/
 │   └─ cli.js
 ├─ src/
 │   ├─ index.js
 │   ├─ prompts.js
 │   └─ generator/
 │        ├─ index.js
 │        ├─ base/
 │        │   ├─ package.json
 │        │   ├─ vite.config.ts
 │        │   ├─ tsconfig.json
 │        │   ├─ index.html
 │        │   └─ src/
 │        │        ├─ main.tsx
 │        │        └─ App.tsx
 │        └─ templates/
 │             ├─ dashboard/
 │             │   ├─ Dashboard.tsx
 │             │   ├─ pages/
 │             │   ├─ components/
 │             │   └─ layout/
 │             ├─ landing/
 │             │   ├─ Landing.tsx
 │             │   ├─ pages/
 │             │   └─ components/
 │             └─ empty/
 │                  └─ App.tsx
 ├─ package.json
 └─ README.md
```

## Templates

### Dashboard Template

A full-featured dashboard with:
- Sidebar navigation
- Multiple pages (Home, Analytics, Settings)
- Responsive layout
- Ready for data visualization

### website Template

A modern website with:
- Hero section
- Features section
- Footer
- About and Contact pages
- Navigation

### Empty Template

A minimal starter with:
- Basic React setup
- Clean slate for your project

## Component Libraries

### Material UI

Automatically installs:
- `@mui/material`
- `@emotion/react`
- `@emotion/styled`

### shadcn/ui

Automatically installs and configures:
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- Creates `components.json` config
- Sets up path aliases (`@/components`, `@/lib/utils`)
- Generates a default Button component
- Configures Tailwind with shadcn theme variables

### Ant Design

Automatically installs:
- `antd`

## Tailwind CSS

When Tailwind is selected, the CLI:
- Creates `tailwind.config.js`
- Creates `postcss.config.js`
- Creates `src/styles/tailwind.css`
- Adds Tailwind directives
- Imports the CSS in `main.tsx`

## Package Manager Detection

The CLI automatically detects your package manager:
- npm (default)
- pnpm (if `pnpm-lock.yaml` exists)
- yarn (if `yarn.lock` exists)

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

## Adding New Templates

To add a new template:

1. Create a new folder under `src/generator/templates/`
2. Add your template files:
   - Main component file (e.g., `MyTemplate.tsx`)
   - Pages, components, layouts as needed
3. Update `src/prompts.js` to include your template in the choices

## License

MIT
