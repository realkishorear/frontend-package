# JSON-Driven Command Builder

A config-based system for generating project initialization commands based on user selections.

## Overview

This system uses a JSON configuration file (`commands.config.json`) to define all frameworks, CSS libraries, component libraries, and optional features. A JavaScript function (`commandBuilder.js`) reads this JSON and user answers to produce an ordered array of commands.

## Files

- **`commands.config.json`** - Contains all framework, CSS, component, state, and auth definitions
- **`commandBuilder.js`** - Main logic that validates and generates commands
- **`commandBuilder.test.js`** - Test cases demonstrating usage

## JSON Structure

The JSON file contains five main sections:

### 1. Frameworks
Defines available frameworks and their initialization commands.

```json
{
  "frameworks": {
    "react-vite": {
      "command": "npm create vite@latest my-app -- --template react",
      "requires": [],
      "conflicts": []
    }
  }
}
```

### 2. CSS
Defines CSS framework options.

```json
{
  "css": {
    "tailwind": {
      "commands": [
        "npm install -D tailwindcss postcss autoprefixer",
        "npx tailwindcss init -p"
      ],
      "requires": [],
      "conflicts": []
    }
  }
}
```

### 3. Components
Defines component library options with requirements.

```json
{
  "components": {
    "shadcn": {
      "commands": ["npx shadcn@latest init"],
      "requires": [
        { "css": ["tailwind"] },
        { "framework": ["react-vite", "react-webpack", "nextjs"] }
      ],
      "conflicts": []
    }
  }
}
```

### 4. State
Defines state management options.

```json
{
  "state": {
    "redux": {
      "commands": ["npm install @reduxjs/toolkit react-redux"],
      "requires": [
        { "framework": ["react-vite", "react-webpack", "nextjs"] }
      ],
      "conflicts": []
    }
  }
}
```

### 5. Auth
Defines authentication options.

```json
{
  "auth": {
    "oidc": {
      "commands": [
        "npm install @react-oauth/google @azure/msal-react @azure/msal-browser react-facebook-login"
      ],
      "requires": [],
      "conflicts": []
    }
  }
}
```

## Usage

### Basic Example

```javascript
import { buildCommands } from './commandBuilder.js';

const answers = {
  framework: 'react-vite',
  css: 'tailwind',
  components: 'shadcn',
  state: 'redux',
  auth: 'oidc'
};

const commands = buildCommands(null, answers);
// Returns: [
//   "npm create vite@latest my-app -- --template react",
//   "npm install -D tailwindcss postcss autoprefixer",
//   "npx tailwindcss init -p",
//   "npx shadcn@latest init",
//   "npm install @reduxjs/toolkit react-redux",
//   "npm install @react-oauth/google @azure/msal-react @azure/msal-browser react-facebook-login"
// ]
```

### Validation

```javascript
import { validateAnswers } from './commandBuilder.js';

const validation = validateAnswers(null, answers);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## Requirements System

### Requires
Each feature can specify requirements that must be met:

- **Framework requirement**: `{ "framework": ["react-vite", "nextjs"] }`
- **CSS requirement**: `{ "css": ["tailwind"] }`
- **Component requirement**: `{ "components": ["mui"] }`
- **State requirement**: `{ "state": ["redux"] }`
- **Auth requirement**: `{ "auth": ["oidc"] }`

All requirements in the `requires` array must be satisfied (AND logic).

### Conflicts
Features can specify conflicts that prevent them from being used:

```json
{
  "conflicts": [
    { "framework": ["angular-vite", "angular-webpack"] }
  ]
}
```

If any conflict is present, the feature is skipped.

## Constraints

The system enforces the following constraints:

1. **ShadCN** only works with:
   - Tailwind CSS
   - React or Next.js frameworks

2. **Redux** only works with:
   - React or Next.js frameworks

3. **Angular** must never receive React-only dependencies (enforced via requirements)

## Command Generation Order

Commands are generated in this order:

1. Framework command (always first)
2. CSS commands
3. Component library commands
4. State management commands
5. Auth commands

Invalid features are automatically skipped without throwing errors.

## Extending the System

### Adding a New Framework

```json
{
  "frameworks": {
    "vue-vite": {
      "command": "npm create vite@latest my-app -- --template vue",
      "requires": [],
      "conflicts": []
    }
  }
}
```

### Adding a New Component Library

```json
{
  "components": {
    "chakra": {
      "commands": ["npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion"],
      "requires": [
        { "framework": ["react-vite", "react-webpack", "nextjs"] }
      ],
      "conflicts": []
    }
  }
}
```

### Adding Requirements

To make a feature only available for specific frameworks:

```json
{
  "requires": [
    { "framework": ["react-vite", "react-webpack"] }
  ]
}
```

To require a specific CSS framework:

```json
{
  "requires": [
    { "css": ["tailwind"] }
  ]
}
```

## Error Handling

- Invalid framework: Throws error (framework is required)
- Invalid feature selections: Skipped silently (validation will flag them)
- Missing answers: Throws error for required fields

## Testing

Run the test file to see examples:

```bash
node commandBuilder.test.js
```

## Code Quality

- ✅ No magic strings (all defined in JSON)
- ✅ No duplicated logic
- ✅ Easy to extend
- ✅ Clean, readable code
- ✅ Production-ready
- ✅ Comprehensive validation
