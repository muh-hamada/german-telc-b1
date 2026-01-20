# Store Credentials Setup Checklist

This checklist helps you configure API credentials for Google Play Store and Apple App Store Connect.

## 📱 Google Play Store Setup

### Step 1: Create a Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Settings** → **API access**
3. Click **Create service account**
4. Follow the link to Google Cloud Console
5. Create a new service account with a descriptive name (e.g., "Fastlane Release Manager")
6. Create and download a JSON key file
7. Save the JSON file securely (e.g., `~/.playstore_credentials.json`)

### Step 2: Grant Permissions

1. Return to Play Console → **API access**
2. Find your newly created service account
3. Click **Grant access**
4. Under **App permissions**, select all apps you want to release
5. Under **Account permissions**, grant these roles:
   - ✅ **Release Manager** (can publish apps to production)
   - ✅ **Releases** (can create and manage releases)

### Step 3: Configure Fastlane

Choose one of these methods:

**Option A: Environment Variable**
```bash
export SUPPLY_JSON_KEY_DATA=$(cat ~/.playstore_credentials.json)
```

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
```bash
export SUPPLY_JSON_KEY_DATA=$(cat ~/.playstore_credentials.json)
```

**Option B: Configuration File**
```bash
# Move JSON file to fastlane directory
cp ~/.playstore_credentials.json fastlane/playstore-credentials.json

# Add to .gitignore
echo "fastlane/playstore-credentials.json" >> .gitignore
```

Then update `fastlane/Fastfile` to use the file path.

### Step 4: Verify

```bash
bundle exec fastlane run validate_play_store_json_key json_key:~/.playstore_credentials.json
```

---

## 🍎 Apple App Store Connect Setup

### Step 1: Generate App-Specific Password

1. Go to [Apple ID Account](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Navigate to **Security** section
4. Under **App-Specific Passwords**, click **Generate Password**
5. Enter a label (e.g., "Fastlane Release Automation")
6. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

### Step 2: Configure Fastlane

Choose one of these methods:

**Option A: Environment Variable (Recommended)**
```bash
export FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
```bash
export FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

**Option B: Keychain**
```bash
fastlane fastlane-credentials add --username muhammad.aref.ali.hamada@gmail.com
# Enter your app-specific password when prompted
```

**Option C: Session-Based**
When running releases, Fastlane will prompt for the password if not set.

### Step 3: Two-Factor Authentication

If you have 2FA enabled:
- Fastlane will prompt for the verification code on first run
- The session will be saved for subsequent runs
- Session expires after ~1 month

### Step 4: Team ID (Optional but Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Membership** section
3. Copy your **Team ID**
4. Update `fastlane/Appfile`:
```ruby
team_id("YOUR_TEAM_ID")
```

### Step 5: Verify

```bash
bundle exec fastlane run app_store_connect_api_key
```

---

## 🔒 Security Best Practices

### For Both Platforms

1. **Never commit credentials to git**
   ```bash
   # Ensure these are in .gitignore:
   fastlane/*credentials*.json
   fastlane/*.p8
   .env
   .env.*
   ```

2. **Use environment variables** for CI/CD
   ```bash
   # In GitHub Actions, GitLab CI, etc.
   SUPPLY_JSON_KEY_DATA: ${{ secrets.PLAY_STORE_JSON_KEY }}
   FASTLANE_PASSWORD: ${{ secrets.APP_STORE_PASSWORD }}
   ```

3. **Restrict service account permissions**
   - Only grant minimum required permissions
   - Use separate accounts for different purposes
   - Regularly rotate credentials

4. **Secure local storage**
   ```bash
   # Set proper file permissions
   chmod 600 ~/.playstore_credentials.json
   chmod 600 ~/.fastlane_credentials
   ```

---

## ✅ Verification Checklist

### Google Play Store
- [ ] Service account created in Google Cloud Console
- [ ] JSON key file downloaded and saved securely
- [ ] Service account granted "Release Manager" permissions in Play Console
- [ ] All apps added to service account permissions
- [ ] Credentials configured (environment variable or file)
- [ ] `.gitignore` updated to exclude credentials
- [ ] Verification command passed

### Apple App Store Connect
- [ ] App-specific password generated
- [ ] Password saved securely
- [ ] Environment variable set (or keychain configured)
- [ ] Apple ID confirmed in `fastlane/Appfile`
- [ ] Team ID added to `fastlane/Appfile` (optional)
- [ ] Two-factor authentication handled
- [ ] Verification command passed

### Final Verification
- [ ] Run `./verify-setup.sh` - should show no errors
- [ ] Test with one app first: `./release-all.sh 0 --apps german-b1 --skip-build`
- [ ] Monitor first release closely
- [ ] Document any issues or customizations

---

## 🆘 Troubleshooting

### Play Store Errors

**"Credentials are invalid"**
- Verify JSON key file is valid and complete
- Check service account has correct permissions
- Ensure service account is linked to your Play Console

**"App not found"**
- Verify package name matches exactly
- Ensure app exists in Play Console
- Check service account has access to specific app

**"Version code must be greater"**
- Ensure version code in `build.gradle` is incremented
- Check previous releases in Play Console

### App Store Connect Errors

**"Password is incorrect"**
- Regenerate app-specific password
- Ensure no extra spaces in password
- Try saving to keychain with `fastlane fastlane-credentials`

**"Could not find any applications"**
- Verify Apple ID is correct
- Check bundle ID matches app in App Store Connect
- Ensure your account has access to the app

**"Session expired"**
- Re-authenticate with 2FA code
- Delete old session: `rm -rf ~/.fastlane/spaceship/*/cookie`

---

## 📞 Support Resources

- [Fastlane Documentation](https://docs.fastlane.tools)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Fastlane Supply (Play Store)](https://docs.fastlane.tools/actions/supply/)
- [Fastlane Deliver (App Store)](https://docs.fastlane.tools/actions/deliver/)
