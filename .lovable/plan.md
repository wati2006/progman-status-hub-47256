

## Analysis

The application currently has a login and registration flow on the `/auth` page, but there is no "Forgot Password" / password reset functionality implemented.

## Plan

### 1. Add "Forgot Password" link to the sign-in form (`src/pages/Auth.tsx`)
- Add a "Elfelejtett jelszó?" (Forgot password?) link below the password field
- Clicking it shows a simple email input form that calls `supabase.auth.resetPasswordForEmail()` with `redirectTo` pointing to `/reset-password`

### 2. Create a new `/reset-password` page (`src/pages/ResetPassword.tsx`)
- A public route where users land after clicking the reset link in their email
- Detects the `type=recovery` session from the URL hash
- Shows a form to enter and confirm a new password
- Calls `supabase.auth.updateUser({ password })` to save the new password
- Redirects to `/` on success

### 3. Register the route (`src/App.tsx`)
- Add `<Route path="/reset-password" element={<ResetPassword />} />` to the router

### Technical Notes
- The reset email will be sent by the built-in authentication email system (no extra setup needed)
- The redirect URL must match the app's origin so the token is correctly processed

