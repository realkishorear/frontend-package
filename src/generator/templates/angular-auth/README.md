# Angular Auth Template

This template provides a complete authentication system for Angular applications with OpenID/OAuth-style UI.

## Components

- **LoginComponent** (`components/login/`) - Login page with email/password and OAuth options
- **RegisterComponent** (`components/register/`) - Registration page with validation
- **AuthService** (`services/auth.service.ts`) - Authentication service with backend integration placeholders
- **AuthGuard** (`guards/auth.guard.ts`) - Route guard for protecting authenticated routes

## Features

- Email/password authentication
- OAuth provider buttons (Google, GitHub, Twitter) - UI ready, backend integration needed
- Form validation
- Token management placeholders
- Protected routes
- Session management

## Backend Integration

All backend integration points are marked with `TODO` comments. You need to:

1. **Update API URL** in `auth.service.ts`:
   ```typescript
   private apiUrl = '/api/auth' // Replace with your backend API URL
   ```

2. **Implement login endpoint**:
   - Replace the placeholder in `login()` method
   - Expected response: `{ user: User, token: string }`

3. **Implement register endpoint**:
   - Replace the placeholder in `register()` method
   - Expected response: `{ user: User, token: string }`

4. **Implement logout endpoint**:
   - Replace the placeholder in `logout()` method

5. **Implement token validation**:
   - Replace the placeholder in `initializeAuth()` method
   - Validate stored tokens on app initialization

6. **Implement token refresh**:
   - Replace the placeholder in `refreshToken()` method

7. **Implement OAuth redirects**:
   - Update `onOAuthLogin()` and `onOAuthRegister()` methods
   - Redirect to your OAuth backend endpoints

## Usage

1. Import the components in your module:
   ```typescript
   import { LoginComponent } from './components/login/login.component'
   import { RegisterComponent } from './components/register/register.component'
   ```

2. Add routes:
   ```typescript
   const routes: Routes = [
     { path: 'login', component: LoginComponent },
     { path: 'register', component: RegisterComponent },
     { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
   ]
   ```

3. Provide HttpClient in your app module:
   ```typescript
   import { HttpClientModule } from '@angular/common/http'
   
   @NgModule({
     imports: [HttpClientModule, ...]
   })
   ```

4. Use AuthService in your components:
   ```typescript
   constructor(private authService: AuthService) {}
   
   // Check authentication
   this.authService.isAuthenticated()
   
   // Get current user
   this.authService.currentUser$.subscribe(user => { ... })
   ```

## Styling

This template uses Tailwind CSS. Make sure Tailwind is configured in your Angular project.

