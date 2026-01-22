# React Dashboard Auth Template with OIDC

This template provides a complete OIDC (OpenID Connect) authentication system for React Dashboard applications.

## Components

- **Login** (`pages/Login.tsx`) - OIDC login page
- **Register** (`pages/Register.tsx`) - OIDC registration page
- **AuthService** (`services/authService.tsx`) - OIDC authentication hook wrapper
- **OIDC Config** (`config/oidc.config.ts`) - OIDC provider configuration
- **ProtectedRoute** (`components/ProtectedRoute.tsx`) - Route wrapper for protecting authenticated routes
- **App** (`App.tsx`) - Main app component with OIDC AuthProvider

## Features

- ✅ OIDC (OpenID Connect) authentication
- ✅ Automatic token renewal
- ✅ User profile management
- ✅ Protected routes
- ✅ Session management
- ✅ Beautiful, modern UI with Tailwind CSS

## Setup

### 1. Install Dependencies

The template includes `oidc-client-ts` in the base package.json. Make sure to install it:

```bash
npm install oidc-client-ts
```

### 2. Configure OIDC Provider

Edit `config/oidc.config.ts` with your OIDC provider settings. The config uses `UserManagerSettings` from `oidc-client-ts`:

```typescript
export const oidcConfig: ExtendedOidcConfig = {
  authority: 'https://your-oidc-provider.com',
  client_id: 'your-client-id',
  redirect_uri: 'http://localhost:5173',
  // ... other settings
}
```

### 3. Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_OIDC_AUTHORITY=https://your-oidC-provider.com
REACT_APP_OIDC_CLIENT_ID=your-client-id
REACT_APP_OIDC_REDIRECT_URI=http://localhost:5173
REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
REACT_APP_OIDC_SILENT_REDIRECT_URI=http://localhost:5173/silent-renew.html
```

### 4. Silent Renew Page

The `silent-renew.html` file is already included in `public/silent-renew.html`. This is used for automatic token renewal.

## Usage

### 1. App Component

The `App.tsx` is already configured with OIDC AuthProvider:

```tsx
import { AuthProvider } from './services/authService'

function App() {
  return (
    <AuthProvider>
      {/* Your routes */}
    </AuthProvider>
  )
}
```

### 2. Use Auth in Components

```tsx
import { useAuth } from './services/authService'

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth()
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.name}</p>}
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### 3. Protect Routes

```tsx
import ProtectedRoute from './components/ProtectedRoute'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## OIDC Provider Setup

### Common OIDC Providers

1. **Auth0**
   - Authority: `https://YOUR_DOMAIN.auth0.com`
   - [Auth0 React Quickstart](https://auth0.com/docs/quickstart/spa/react)

2. **Keycloak**
   - Authority: `https://your-keycloak-server.com/realms/your-realm`
   - [Keycloak Documentation](https://www.keycloak.org/docs/latest/securing_apps/)

3. **Okta**
   - Authority: `https://YOUR_DOMAIN.okta.com/oauth2/default`
   - [Okta React Guide](https://developer.okta.com/docs/guides/sign-into-spa/react/before-you-begin/)

4. **Azure AD**
   - Authority: `https://login.microsoftonline.com/YOUR_TENANT_ID`
   - [Azure AD Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)

## Routes

- `/login` - OIDC login page (public)
- `/register` - OIDC registration page (public)
- `/` - Dashboard home (protected)
- `/analytics` - Analytics page (protected)
- `/settings` - Settings page (protected)
- All other dashboard routes are protected

## User Information

The OIDC user data is automatically mapped to our User type:

```typescript
interface User {
  id: string        // from userData.sub
  name: string      // from userData.name or preferred_username
  email: string     // from userData.email
  avatar?: string   // from userData.picture or avatar_url
}
```

## Troubleshooting

### Token Renewal Issues

If silent token renewal fails:
1. Ensure `public/silent-renew.html` exists
2. Check the silent redirect URI is correctly configured
3. Verify CORS settings in your OIDC provider

### Redirect Issues

Make sure all redirect URIs:
1. Are configured in your OIDC provider
2. Match exactly (including protocol, domain, and path)
3. Are added to allowed redirect URIs

### Build Issues

If you get import errors:
1. Make sure `oidc-client-ts` is installed: `npm install oidc-client-ts`
2. Check that TypeScript can resolve the module
3. Verify the package is in your `package.json` dependencies
