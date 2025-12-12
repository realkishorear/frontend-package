Generate a full GitHub-ready project named **jgd-fe-cli**.

It must work with this command:

npx github:myusername/jgd-fe-cli init my-app

The project should be a frontend scaffolding CLI that:

1. Creates a new folder <project-name>
2. Copies a prebuilt template (React + Vite + TypeScript + TailwindCSS)
3. Installs dependencies inside the created project
4. Prints instructions for starting the dev server

---------------------------------------
📁 PROJECT STRUCTURE (must be exact)
---------------------------------------

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

---------------------------------------
🛠️ CLI REQUIREMENTS (bin/jgd-fe.js)
---------------------------------------

- Must use ES modules
- Must begin with: #!/usr/bin/env node
- Use commander.js for command parsing
- Use fs-extra to copy folders
- Use execa to run "npm install"
- Use chalk for colored console output
- Use fileURLToPath + import.meta.url to resolve template path
- Should run the command:

  jgd-fe init <project-name>

- Behavior:
  - Check if folder exists
  - Copy template folder
  - Run npm install inside it
  - Print final usage instructions

---------------------------------------
🎨 TEMPLATE REQUIREMENTS
---------------------------------------

Under templates/react-tailwind/ create a fully working:

✔ Vite + React + TypeScript project  
✔ TailwindCSS configured  
✔ Custom colors in tailwind.config.js:

extend: {
  colors: {
    primary: "#1E40AF",
    secondary: "#14B8A6"
  }
}

✔ Include React Router with routes:
- Home.tsx
- About.tsx

✔ index.css must include Tailwind base/components/utilities

---------------------------------------
📦 ROOT package.json
---------------------------------------

Use exactly:

{
  "name": "jgd-fe-cli",
  "version": "1.0.0",
  "bin": {
    "jgd-fe": "bin/jgd-fe.js"
  },
  "type": "module",
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.0.0",
    "execa": "^8.0.1",
    "fs-extra": "^11.1.1"
  }
}

---------------------------------------
📘 README.md REQUIREMENTS
---------------------------------------

Include:
- How to install using npx github
- How to run: jgd-fe init my-app
- Folder structure diagram
- How to add new templates

---------------------------------------
📌 FINAL OUTPUT
---------------------------------------

Generate:
- All folders
- All files
- All code
- Fully working CLI
- Fully working React template

Everything must be placed in the EXACT paths listed above.
