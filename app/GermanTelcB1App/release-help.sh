#!/bin/bash

# Quick Reference Guide for Release Automation
# Print this help message

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════╗
║          Telc Apps - Release Automation Quick Reference          ║
╚══════════════════════════════════════════════════════════════════╝

📦 INITIAL SETUP (One-time)
───────────────────────────────────────────────────────────────────
  bundle install                    # Install Ruby dependencies

🚀 COMMON COMMANDS
───────────────────────────────────────────────────────────────────
  ./release-all.sh 0                # Release all apps (message #0)
  ./release-all.sh 1 --apps german-b1,english-b2
                                    # Release specific apps
  ./release-all.sh 0 --android-only # Android only
  ./release-all.sh 0 --ios-only     # iOS only
  ./release-all.sh 0 --rollout 0.1  # Staged rollout (10%)
  ./release-all.sh 0 --skip-build   # Use existing builds

🔧 INDIVIDUAL PLATFORM SCRIPTS
───────────────────────────────────────────────────────────────────
  Android:
    ./fastlane-android-release.sh <app-id> <aab-path> <msg-index>
    Example:
      ./fastlane-android-release.sh german-b1 \
        dist/android/german-b1/app-release.aab 0

  iOS:
    ./fastlane-ios-release.sh <app-id> <version> <build> <msg-index>
    Example:
      ./fastlane-ios-release.sh german-b1 1.4.0 42 0

📱 AVAILABLE APPS
───────────────────────────────────────────────────────────────────
  • german-a1
  • german-b1
  • german-b2
  • english-b1
  • english-b2

📝 UPDATE MESSAGES
───────────────────────────────────────────────────────────────────
  Located in: ../update-messages.json
  10 messages available (indices 0-9)
  Languages: en, de, es, fr, it, pt, ru, ar, tr

🔄 RECOMMENDED WORKFLOW
───────────────────────────────────────────────────────────────────
  1. ./bump-version.sh              # Bump version numbers
  2. ./check-dev-flags.sh           # Verify no dev flags
  3. git commit -am "Bump version"  # Commit changes
  4. ./release-all.sh 0             # Run release
  5. Monitor store consoles         # Check status

📊 LOGS
───────────────────────────────────────────────────────────────────
  Location: release-logs/release_YYYYMMDD_HHMMSS.log
  View latest: ls -lt release-logs/ | head -2

🐛 TROUBLESHOOTING
───────────────────────────────────────────────────────────────────
  Build fails:
    • Check release-logs/ for errors
    • Run ./check-dev-flags.sh
    • Verify app configuration

  Upload fails:
    • Verify Play Store API credentials
    • Check App Store Connect password
    • Ensure apps exist in store consoles

  Fastlane errors:
    • Run: bundle install
    • Check: fastlane/Fastfile

📚 DOCUMENTATION
───────────────────────────────────────────────────────────────────
  Full docs: RELEASE-AUTOMATION.md
  Requirements: automatic-release-script-requirments.md

🔗 USEFUL LINKS
───────────────────────────────────────────────────────────────────
  Play Console: https://play.google.com/console
  App Store:    https://appstoreconnect.apple.com
  Fastlane:     https://docs.fastlane.tools

═══════════════════════════════════════════════════════════════════
EOF
