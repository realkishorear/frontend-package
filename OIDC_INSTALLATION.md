# OIDC Installation Guide

## 📍 Where to Install `oidc-react`

### ✅ **You DON'T need to install anything in the framework tool itself**

The framework tool (this repository) does **NOT** need `oidc-react` installed. The tool only generates projects - it doesn't run the authentication code.

### ✅ **Installation happens automatically in generated projects**

When you generate a project using the dashboard template, `oidc-react` is **automatically included** in the generated project's `package.json`:

#### For React Projects:
- ✅ Already included in `src/generator/base/package.json`
- ✅ Automatically copied to your generated project
- ✅ Installed when you run `npm install` in your generated project

#### For Next.js Projects:
- ✅ Automatically added to `package.json` when dashboard template is selected
- ✅ Installed when you run `npm install` in your generated project

## 🚀 Quick Start

### Step 1: Generate Your Project

```bash
npx github:realkishorear/frontend-package init my-app
# or
jgd-fe init my-app
```

Select:
- **Template**: Dashboard
- **Framework**: React or Next.js

### Step 2: Navigate to Your Project

```bash
cd my-app
```

### Step 3: Install Dependencies

```bash
npm install
```

This will automatically install `oidc-react` along with all other dependencies.

### Step 4: Verify Installation

Check that `oidc-react` is in your `package.json`:

```json
{
  "dependencies": {
    "oidc-react": "^1.3.0",
    ...
  }
}
```

## 📝 Manual Installation (if needed)

If for some reason `oidc-react` is missing, you can install it manually:

```bash
npm install oidc-react
```

## ⚙️ Configuration

After installation, configure your OIDC provider:

1. **React Projects**: Edit `config/oidc.config.ts`
2. **Next.js Projects**: Edit `config/oidc.config.ts`

Set your environment variables (see README files in the templates).

## 🔍 Troubleshooting

### Issue: `oidc-react` not found

**Solution**: Make sure you're in your generated project directory (not the framework tool directory) and run:
```bash
npm install
```

### Issue: Import errors

**Solution**: 
1. Verify `oidc-react` is in `package.json`
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again

### Issue: TypeScript errors

**Solution**: The types are included with `oidc-react`. If you see type errors:
1. Make sure TypeScript is installed: `npm install -D typescript`
2. Restart your IDE/editor

## 📚 Summary

- ❌ **Don't install** in the framework tool directory
- ✅ **Auto-installed** in generated React/Next.js projects
- ✅ **Just run** `npm install` in your generated project
- ✅ **Configure** your OIDC provider settings

That's it! The framework handles everything automatically. 🎉

