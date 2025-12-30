# React Dashboard Auth Template

This template provides a complete authentication system for React Dashboard applications with OpenID/OAuth-style UI.

## Components

- **Login** (`pages/Login.tsx`) - Login page with email/password and OAuth options
- **Register** (`pages/Register.tsx`) - Registration page with validation
- **AuthService** (`services/authService.tsx`) - Authentication service with backend integration placeholders
- **ProtectedRoute** (`components/ProtectedRoute.tsx`) - Route wrapper for protecting authenticated routes
- **App** (`App.tsx`) - Main app component with AuthProvider and routing

## Features

- Email/password authentication
- OAuth provider buttons (Google, GitHub, Twitter) - UI ready, backend integration needed
- Form validation
- Token management placeholders
- Protected routes
- Session management
- Beautiful, modern UI with Tailwind CSS

## Backend Integration

All backend integration points are marked with `TODO` comments. You need to:

1. **Update API URLs** in `services/authService.tsx`:
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

7. **Implement OAuth redirects**:
   - Update `handleOAuthLogin()` and `handleOAuthRegister()` methods in Login/Register components
   - Redirect to your OAuth backend endpoints (e.g., `/api/auth/google`, `/api/auth/github`)

## Usage

1. **Update main.tsx** to use the App component:
   ```tsx
   import App from './App'
   
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <ConfigProvider>
         <BrowserRouter>
           <App />
         </BrowserRouter>
       </ConfigProvider>
     </React.StrictMode>,
   )
   ```

2. **Use AuthService in components**:
   ```tsx
   import { useAuth } from './services/authService'
   
   function MyComponent() {
     const { user, isAuthenticated, logout } = useAuth()
     
     return (
       <div>
         {isAuthenticated && <p>Welcome, {user?.name}</p>}
         <button onClick={logout}>Logout</button>
       </div>
     )
   }
   ```

3. **Protect routes**:
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

## Routes

- `/login` - Login page (public)
- `/register` - Registration page (public)
- `/` - Dashboard home (protected)
- `/analytics` - Analytics page (protected)
- `/settings` - Settings page (protected)
- All other dashboard routes are protected

## Styling

This template uses Tailwind CSS. Make sure Tailwind is configured in your project.

## Token Storage

Tokens are stored in `localStorage` by default. You can modify this in `authService.tsx` to use:
- `sessionStorage` for session-based tokens
- Cookies for server-side rendering compatibility
- Secure HTTP-only cookies (requires backend support)

