# JSON-Driven Questions System

The questions/prompts system has been updated to be **fully JSON-driven**. All questions, choices, and validation logic are now defined in `commands.config.json`.

## What Changed

### Before
- Questions were hardcoded in `prompts.ts`
- Adding new frameworks/options required code changes
- Validation logic was scattered

### After
- All questions defined in JSON
- Questions automatically adapt based on selections
- Validation uses the same JSON config as commands
- Easy to extend - just update JSON

## JSON Structure

The `commands.config.json` now includes:

1. **`questions`** section - Defines question text and types
2. **Enhanced framework structure** - Supports bundlers for React/Angular
3. **Labels and values** - All options have display labels
4. **Requirements** - Each option can specify what it requires

### Example Structure

```json
{
  "questions": {
    "framework": {
      "message": "Which framework you want to use to build the project:",
      "type": "list"
    },
    "bundler": {
      "message": "Which bundler user want to use:",
      "type": "list",
      "conditional": {
        "showIf": {
          "framework": ["react", "angular"]
        }
      }
    }
  },
  "frameworks": {
    "react": {
      "label": "⚛️  React",
      "value": "react",
      "requiresBundler": true,
      "bundlers": {
        "vite": {
          "label": "⚡ Vite",
          "value": "react-vite",
          "command": "npm create vite@latest my-app -- --template react"
        }
      }
    }
  }
}
```

## How It Works

1. **Framework Selection** - User picks React, Angular, or Next.js
2. **Bundler Selection** - If framework requires it (React/Angular)
3. **CSS Selection** - Filtered based on framework requirements
4. **Component Selection** - Filtered based on CSS and framework
5. **State Selection** - Only shown for React/Next.js
6. **Auth Selection** - Always shown
7. **Template Selection** - Always shown

## Dynamic Filtering

Questions automatically filter options based on:
- **Requirements** - Options only show if requirements are met
- **Framework compatibility** - ShadCN only with React/Next.js + Tailwind
- **Conditional display** - Redux only shown for React/Next.js

## Adding New Options

To add a new framework:

```json
{
  "frameworks": {
    "vue": {
      "label": "🖖 Vue",
      "value": "vue",
      "requiresBundler": true,
      "bundlers": {
        "vite": {
          "label": "⚡ Vite",
          "value": "vue-vite",
          "command": "npm create vite@latest my-app -- --template vue"
        }
      }
    }
  }
}
```

The questions will automatically include Vue as an option!

## Integration

The `prompts.ts` file now:
1. Loads config from JSON
2. Builds questions dynamically
3. Filters choices based on requirements
4. Returns normalized answers

The `commandBuilder.js` handles:
1. Framework + bundler combinations
2. Requirement validation
3. Command generation

## Benefits

✅ **No code changes** needed to add frameworks/options  
✅ **Consistent validation** between questions and commands  
✅ **Single source of truth** - all config in JSON  
✅ **Easy to maintain** - update JSON, everything updates  
✅ **Type-safe** - TypeScript types still work  
