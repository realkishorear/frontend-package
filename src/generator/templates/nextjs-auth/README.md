# Next.js Auth Template with OIDC

This template provides a complete OIDC (OpenID Connect) authentication system for Next.js 13+ applications (App Router).

## Structure

- **Pages** (`app/login/`, `app/register/`) - OIDC authentication pages
- **AuthContext** (`contexts/AuthContext.tsx`) - OIDC authentication hook wrapper
- **OIDC Config** (`config/oidc.config.ts`) - OIDC provider configuration
- **Middleware** (`middleware.ts`) - Route protection middleware
- **ProtectedRoute** (`components/ProtectedRoute.tsx`) - Client-side route protection component

## Features

- ✅ OIDC (OpenID Connect) authentication
- ✅ Automatic token renewal
- ✅ User profile management
- ✅ Protected routes (both middleware and client-side)
- ✅ Session management
- ✅ Next.js 13+ App Router compatible
- ✅ TypeScript support

## Setup

### 1. Install Dependencies

The template includes `oidc-client-ts` in the base package.json. Make sure to install it:

```bash
npm install oidc-client-ts
```

### 2. Configure OIDC Provider

Edit `config/oidc.config.ts` with your OIDC provider settings:

```typescript
export const oidcConfig: UserManagerSettings = {
  authority: 'https://your-oidc-provider.com',
  client_id: 'your-client-id',
  redirect_uri: 'http://localhost:3000',
  // ... other settings
}
```

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_OIDC_AUTHORITY=https://your-oidc-provider.com
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI=http://localhost:3000/silent-renew.html
```

### 4. Create Silent Renew Page

Create `public/silent-renew.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Silent Renew</title>
</head>
<body>
  <script>
    // This page is used for silent token renewal in OIDC
  </script>
</body>
</html>
```

## Usage

### 1. App Layout

The `app/layout.tsx` is already configured with OIDC AuthProvider:

```tsx
import { AuthProvider } from '../contexts/AuthContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2. Use Auth in Components

```tsx
'use client'
import { useAuth } from '../contexts/AuthContext'

export default function MyComponent() {
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

Use the `ProtectedRoute` component:

```tsx
import ProtectedRoute from '../components/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  )
}
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

## Styling

This template uses Tailwind CSS. Make sure Tailwind is configured in your Next.js project.

## Troubleshooting

### Token Renewal Issues

If silent token renewal fails, check:
1. `silent-renew.html` exists in the `public` folder
2. The silent redirect URI is correctly configured in your OIDC provider
3. CORS settings allow the redirect

### Redirect Issues

Make sure all redirect URIs are:
1. Configured in your OIDC provider
2. Match exactly (including protocol, domain, and path)
3. Added to allowed redirect URIs in provider settings
