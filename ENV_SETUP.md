# Environment Configuration

This app uses environment variables to manage API endpoints and other configuration securely.

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   - For local development, update `EXPO_PUBLIC_LOCAL_API_URL`
   - For iOS development with ngrok, set `EXPO_PUBLIC_IOS_LOCAL_API_URL`
   - For production deployment, update `EXPO_PUBLIC_PRODUCTION_API_URL`

## Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

### API URLs

- `EXPO_PUBLIC_PRODUCTION_API_URL` - Production API endpoint
- `EXPO_PUBLIC_LOCAL_API_URL` - Local development API endpoint (overrides platform-specific)
- `EXPO_PUBLIC_IOS_LOCAL_API_URL` - iOS-specific local API (useful for ngrok)
- `EXPO_PUBLIC_ANDROID_LOCAL_API_URL` - Android-specific local API
- `EXPO_PUBLIC_API_URL` - Override all API URL logic with a specific URL

### Stripe Configuration

- `EXPO_PUBLIC_STRIPE_USD_ID` - Stripe checkout URL for USD payments

## Security Notes

- Never commit `.env` files to version control
- Use different API URLs for development and production
- Keep sensitive keys (like Stripe secret keys) server-side only
- The `.env.example` file should contain only non-sensitive example values

## Usage in Code

Environment variables are accessed through `process.env`:

```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'fallback-url';
```

The `config.ts` file handles the logic for selecting the appropriate API URL based on the environment.