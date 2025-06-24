# TestFlight Deployment Checklist

## Prerequisites
- [ ] Apple Developer Account with active membership
- [ ] App Store Connect access
- [ ] EAS CLI installed (✅ Already installed)
- [ ] Expo account (✅ Already configured)

## App Configuration
- [ ] Update app version in `app.json` if needed (currently 1.0.0)
- [ ] Ensure bundle identifier is correct: `com.indexwallets.mobile`
- [ ] Verify all required iOS permissions in `app.json`

## Apple Developer Setup
1. [ ] Create App ID in Apple Developer Portal
   - Bundle ID: `com.indexwallets.mobile`
   - Enable required capabilities (if any)

2. [ ] Create App in App Store Connect
   - Get the App Store Connect App ID (ascAppId)
   - Update `eas.json` with your Apple ID and ascAppId

## Build & Submit Process

### Step 1: Update EAS Configuration
Replace the placeholders in `eas.json`:
```json
"submit": {
  "preview": {
    "ios": {
      "appleId": "YOUR_APPLE_ID@example.com",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
    }
  }
}
```

### Step 2: Build for TestFlight
```bash
# Build for preview/TestFlight
eas build --platform ios --profile preview

# Or build for production
eas build --platform ios --profile production
```

### Step 3: Submit to TestFlight
```bash
# Submit the build to TestFlight
eas submit --platform ios --profile preview

# Or if you built with production profile
eas submit --platform ios --profile production
```

## API Configuration
- Preview builds will use: `https://api-staging.indexwallets.com`
- Production builds will use: `https://api.indexwallets.com`

## Testing Requirements
- [ ] Test all authentication flows (create wallet, import wallet)
- [ ] Test transaction signing
- [ ] Test QR code scanning
- [ ] Test biometric authentication
- [ ] Test all payment flows
- [ ] Test vendor-specific features

## Common Issues & Solutions

### Issue: Missing Distribution Certificate
Solution: EAS will handle this automatically if you don't have one

### Issue: Invalid Bundle Identifier
Solution: Ensure the bundle ID in app.json matches what's in Apple Developer Portal

### Issue: Missing App Store Connect API Key
Solution: You can create one in App Store Connect > Users and Access > Keys

## Final Steps
1. After submission, wait for processing (usually 10-30 minutes)
2. Once processed, the build will appear in TestFlight
3. Add internal testers via App Store Connect
4. For external testing, submit for TestFlight review

## Important Notes
- TestFlight builds expire after 90 days
- You can have up to 100 internal testers
- External testing requires Apple review (usually 24-48 hours)
- Make sure to test the Stripe integration in test mode