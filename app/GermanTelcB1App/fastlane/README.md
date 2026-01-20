# Fastlane Credentials Setup

This directory contains Fastlane configuration for automated releases to Google Play Store and Apple App Store.

## 📁 Required Files

### `playstore-service-account.json` ⚠️ REQUIRED

This is your Google Play Store service account credentials file.

**To set up:**

1. **Create Service Account** (if not already done):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project (or create one)
   - Navigate to **IAM & Admin** → **Service Accounts**
   - Click **+ CREATE SERVICE ACCOUNT**
   - Name: `fastlane-playstore` (or any name)
   - Grant role: **Service Account User**
   - Click **Done**

2. **Download JSON Key**:
   - Click on the service account you just created
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Choose **JSON** format
   - Click **Create** (file downloads automatically)

3. **Grant Play Console Access**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Click **Settings** (gear icon) → **Developer account** → **API access**
   - Find your service account in the list
   - Click **Grant access**
   - Select permissions:
     - ✅ Release to production
     - ✅ Release to testing tracks
     - ✅ Manage store presence
   - Click **Invite user** / **Apply**

4. **Place the file here**:
   ```bash
   # Move your downloaded file to:
   mv ~/Downloads/your-project-*.json /Users/mham/projects/german-telc-b1/app/GermanTelcB1App/fastlane/playstore-service-account.json
   ```

5. **Verify the setup**:
   ```bash
   cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
   fastlane run validate_play_store_json_key json_key:fastlane/playstore-service-account.json
   ```

## 🍎 Apple App Store Setup

### App-Specific Password

For iOS releases, you need an app-specific password:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with: `muhammad.aref.ali.hamada@gmail.com`
3. **Security** → **App-Specific Passwords**
4. Generate a new password
5. Save it securely

**Option 1 - Environment Variable (Recommended):**
```bash
# Add to ~/.zshrc
export FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

**Option 2 - macOS Keychain:**
Fastlane will prompt for the password and save it to Keychain automatically on first run.

## 🔒 Security Notes

⚠️ **NEVER commit the service account JSON file to git!**

- The file is already in `.gitignore`
- Keep backups in a secure location (password manager, encrypted drive)
- If compromised, revoke and create a new key immediately

## ✅ Testing Credentials

Before running a full release:

```bash
# Test Play Store credentials
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
fastlane run validate_play_store_json_key json_key:fastlane/playstore-service-account.json

# Test full setup
./verify-setup.sh
```

## 📞 Troubleshooting

### "JSON key file not found"
- Ensure file is named exactly: `playstore-service-account.json`
- Check file is in: `/Users/mham/projects/german-telc-b1/app/GermanTelcB1App/fastlane/`

### "Invalid credentials" or "Unauthorized"
- Verify service account has proper permissions in Play Console
- Check JSON file is not corrupted
- Ensure service account is linked to your Play Console account

### "Apple ID password required"
- Set `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` environment variable
- Or run interactively and let Fastlane save to Keychain

## 📚 References

- [Fastlane Play Store Setup](https://docs.fastlane.tools/actions/upload_to_play_store/)
- [Fastlane App Store Setup](https://docs.fastlane.tools/actions/deliver/)
- [Google Play Console API Access](https://play.google.com/console)
- [Apple App-Specific Passwords](https://appleid.apple.com)
