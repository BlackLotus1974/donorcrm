# Page snapshot

```yaml
- heading "Sign Up" [level=2]
- text: Create a new account to get started Email
- textbox "Email": invalid-email
- text: Password
- textbox "Password": short
- text: Confirm Password
- textbox "Confirm Password"
- button "Sign Up"
- text: Already have an account?
- link "Sign In":
  - /url: /auth/login
- region "Notifications alt+T"
- alert
```