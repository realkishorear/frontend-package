
# 🚀 **Cursor Prompt: Build a Custom React Project Generator CLI**

I want you to build a **custom project generator CLI** exactly like `create-react-app` or `npx create-t3-app`, but this tool will live inside a GitHub repo and will be executed like:

```
npx github.com/<username>/<repo> init my-app
```

or

```
npx github.com/<username>/<repo> init .
```

## 🎯 **Goal**

Create a fully working CLI that:

1. Asks the user interactive questions.
2. Generates a React + TypeScript project.
3. Adds Tailwind optionally.
4. Adds a chosen component library.
5. Supports multiple templates.
6. Copies template folders into the target directory.

---

# 🏗️ **CLI Requirements**

### **1. CLI Command**

Tool should run as:

```
npx github.com/<username>/<repo> init <project-name>
```

If `<project-name>` is `.`, initialize in current folder.

---

# 🧰 **Step 1 — Project Structure**

Create this CLI repo structure:

```
/bin/
  cli.js
/src/
  index.js
  prompts.js
  generator/
    base/
    templates/
      dashboard/
      landing/
      empty/
package.json
README.md
```

---

# 🗣️ **Step 2 — Interactive Questions**

Use **inquirer**.

Ask:

### **Template Type**

```
- Dashboard
- Landing Page
- Nothing (Empty Starter)
```

### **Tailwind**

```
- Yes
- No
```

### **Component Library**

```
- Material UI
- shadcn/ui
- Ant Design
- None
```

---

# 🛠️ **Step 3 — Generation Logic**

Inside `generator/index.js`:

1. Take user selection.
2. Copy the template folder:

   * `templates/dashboard`
   * `templates/landing`
   * `templates/empty`
3. Install dependencies automatically:

   * React, ReactDOM, Vite, TS
   * Tailwind optional
   * Selected Component Library
4. Initialize project structure:

   ```
   src/
     components/
     pages/
     styles/
     App.tsx
     main.tsx
   ```
5. Configure:

   * `tsconfig.json`
   * `vite.config.ts`
   * `tailwind.config.js` (if chosen)
   * `postcss.config.js`

---

# 📂 **Step 4 — Template Contents**

Inside:

```
/src/generator/templates/dashboard/
  pages/
  components/
  layout/
  Dashboard.tsx

/src/generator/templates/landing/
  pages/
  components/
  Landing.tsx

/src/generator/templates/empty/
  App.tsx
```

Each template should have basic UI according to the selection.

---

# 💅 **Step 5 — Component Libraries Setup**

### Material UI

```
npm i @mui/material @emotion/react @emotion/styled
```

### shadcn/ui

* auto-install and run init
* generate a default button

### Ant Design

```
npm i antd
```

If user chooses “None”, skip.

---

# 🧵 **Step 6 — Tailwind Setup**

If Tailwind is selected:

* Generate:

  * `tailwind.config.js`
  * `postcss.config.js`
  * `src/styles/tailwind.css`
* Inject into main entry.

---

# ⚙️ **Step 7 — Auto Dependency Installation**

After copying files:

* Detect package manager: `npm`, `pnpm`, or `yarn`
* Run:

```
npm install
```

or equivalent.

---

# 🚢 **Step 8 — Publish-Ready**

Ensure:

* `cli.js` has:

```
#!/usr/bin/env node
```

* `package.json` includes:

```
"bin": {
  "jgd-fe": "./bin/cli.js"
}
```

* But user can run with:

```
npx github.com/<username>/<repo> init my-app
```

---

# 📄 **Deliverables**

**GENERATE ALL FILES IN FULL**, including:

* `cli.js`
* `index.js`
* `prompts.js`
* `generator/index.js`
* Template folders
* Tailwind config
* Component library configs
* Perfect package.json
* README explaining usage

---

# 🎯 **Final Output Format**

Generate the **entire project** file-by-file, with complete code and folder structure.

---
