# Next.js Auth Template

This template provides a complete authentication system for Next.js 13+ applications (App Router) with OpenID/OAuth-style UI.

## Structure

- **Pages** (`app/login/`, `app/register/`) - Authentication pages
- **AuthContext** (`contexts/AuthContext.tsx`) - Authentication context with backend integration placeholders
- **Middleware** (`middleware.ts`) - Route protection middleware
- **ProtectedRoute** (`components/ProtectedRoute.tsx`) - Client-side route protection component

## Features

- Email/password authentication
- OAuth provider buttons (Google, GitHub, Twitter) - UI ready, backend integration needed
- Form validation
- Token management placeholders
- Protected routes (both middleware and client-side)
- Session management
- Next.js 13+ App Router compatible

## Backend Integration

All backend integration points are marked with `TODO` comments. You need to:

1. **Update API URLs** in `AuthContext.tsx`:
   - Replace placeholder fetch calls with your actual backend endpoints
   - Expected response format: `{ user: User, token: string, refreshToken?: string }`

2. **Implement login endpoint**:
   - Replace the placeholder in `login()` method
   - POST to `/api/auth/login` with `{ email, password }`

3. **Implement register endpoint**:
   - Replace the placeholder in `register()` method
   - POST to `/api/auth/register` with `{ name, email, password }`

4. **Implement logout endpoint**:
   - Replace the placeholder in `logout()` method
   - POST to `/api/auth/logout`

5. **Implement token validation**:
   - Replace the placeholder in `initializeAuth()` method
   - Validate stored tokens on app initialization

6. **Implement token refresh**:
   - Replace the placeholder in `refreshToken()` method
   - POST to `/api/auth/refresh` with `{ refreshToken }`

7. **Update middleware** (`middleware.ts`):
   - Replace token check logic with your actual authentication verification
   - Adjust cookie/header names based on your token storage strategy

8. **Implement OAuth redirects**:
   - Update `handleOAuthLogin()` and `handleOAuthRegister()` methods
   - Redirect to your OAuth backend endpoints

## Usage

1. **Wrap your app with AuthProvider** in `app/layout.tsx`:
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

2. **Protect routes with middleware**:
   - The `middleware.ts` file automatically protects routes
   - Adjust the `matcher` config to include/exclude specific routes

3. **Use ProtectedRoute component** for client-side protection:
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

4. **Use AuthContext in components**:
   ```tsx
   'use client'
   import { useAuth } from '../contexts/AuthContext'
   
   export default function MyComponent() {
     const { user, isAuthenticated, logout } = useAuth()
     
     return (
       <div>
         {isAuthenticated && <p>Welcome, {user?.name}</p>}
         <button onClick={logout}>Logout</button>
       </div>
     )
   }
   ```

## Styling

This template uses Tailwind CSS. Make sure Tailwind is configured in your Next.js project.

## Environment Variables

Create a `.env.local` file for your API URLs:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Then use it in your AuthContext:
```tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
```

