# Authentication Templates

This directory contains complete authentication templates for React (Dashboard), Angular, and Next.js applications. All templates follow OpenID/OAuth-style patterns and include placeholder backend integration points.

## 📁 Template Structure

### 1. React Dashboard Auth (`dashboard/`)
- **Location**: `src/generator/templates/dashboard/`
- **Components**: Login, Register, AuthService, ProtectedRoute
- **Documentation**: See `README-AUTH.md` in the dashboard folder

### 2. Angular Auth (`angular-auth/`)
- **Location**: `src/generator/templates/angular-auth/`
- **Components**: LoginComponent, RegisterComponent, AuthService, AuthGuard
- **Documentation**: See `README.md` in the angular-auth folder

### 3. Next.js Auth (`nextjs-auth/`)
- **Location**: `src/generator/templates/nextjs-auth/`
- **Components**: Login page, Register page, AuthContext, Middleware, ProtectedRoute
- **Documentation**: See `README.md` in the nextjs-auth folder

## ✨ Features

All templates include:

- ✅ **Email/Password Authentication** - Complete login and registration forms
- ✅ **OAuth Provider Buttons** - UI for Google, GitHub, Twitter (backend integration needed)
- ✅ **Form Validation** - Client-side validation with error messages
- ✅ **Token Management** - Placeholder implementations for JWT tokens
- ✅ **Protected Routes** - Route guards/middleware for authenticated pages
- ✅ **Session Management** - User state management with context/services
- ✅ **Modern UI** - Beautiful, responsive design with Tailwind CSS
- ✅ **Backend Integration Points** - All marked with `TODO` comments

## 🔧 Backend Integration

All templates are **frontend-only** and require backend implementation. Look for `TODO` comments in the code to find integration points:

1. **API Endpoints**:
   - `POST /api/auth/login` - Email/password login
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/logout` - User logout
   - `POST /api/auth/refresh` - Token refresh
   - `GET /api/auth/validate` - Token validation

2. **OAuth Endpoints**:
   - `GET /api/auth/google` - Google OAuth redirect
   - `GET /api/auth/github` - GitHub OAuth redirect
   - `GET /api/auth/twitter` - Twitter OAuth redirect

3. **Expected Response Format**:
   ```json
   {
     "user": {
       "id": "string",
       "name": "string",
       "email": "string",
       "avatar": "string (optional)"
     },
     "token": "jwt-token",
     "refreshToken": "refresh-token (optional)"
   }
   ```

## 📝 Usage Instructions

### React Dashboard
1. The auth components are already integrated into the dashboard template
2. Use `App.tsx` as your main entry point (wraps everything with AuthProvider)
3. All dashboard routes are protected by default
4. See `dashboard/README-AUTH.md` for detailed instructions

### Angular
1. Copy components, services, and guards to your Angular project
2. Import and configure in your module
3. Add routes with AuthGuard protection
4. See `angular-auth/README.md` for detailed instructions

### Next.js
1. Copy pages, contexts, and middleware to your Next.js app directory
2. Wrap your app with AuthProvider in `layout.tsx`
3. Middleware automatically protects routes
4. See `nextjs-auth/README.md` for detailed instructions

## 🎨 Styling

All templates use **Tailwind CSS**. Ensure Tailwind is configured in your project:

```bash
# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🔐 Security Notes

- **Token Storage**: Templates use `localStorage` by default. For production:
  - Consider `sessionStorage` for session-based tokens
  - Use HTTP-only cookies for better security (requires backend support)
  - Implement CSRF protection

- **Token Validation**: Always validate tokens on the backend
- **Password Requirements**: Enforce strong passwords (8+ characters minimum)
- **HTTPS**: Always use HTTPS in production
- **OAuth**: Implement proper OAuth 2.0 flow with state parameter for CSRF protection

## 🚀 Quick Start

1. Choose your framework template
2. Copy the auth files to your project
3. Replace all `TODO` comments with actual backend API calls
4. Configure your backend API URLs
5. Test authentication flow
6. Customize UI/styling as needed

## 📚 Additional Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Note**: These templates provide the frontend structure only. You must implement the backend authentication logic, including user database, password hashing, token generation, and OAuth provider integration.

