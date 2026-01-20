🚀 Requirements for New Build + Release Automation Scripts

1️⃣ Goals
	•	Keep existing build scripts untouched.
	•	Build multiple apps sequentially for Android and iOS.
	•	After builds, trigger Fastlane scripts to handle Play Store / App Store release steps (upload, release creation, metadata, release notes, compliance questions).
	•	Support multiple apps from the same codebase.
	•	Allow localized release notes for Android and iOS.
	•	Fully scripted: no manual steps in Play Store or App Store Connect.

⸻

2️⃣ Android Automation Requirements

2.1 Build Step (Existing Script: build-android.sh)
	•	Input: list of apps (e.g., german-b1, english-b2, etc)
	•	For each app:
	•	Apply the app-specific configuration
	•	Build the release bundle (.aab) using Gradle / your existing build process
	•	Save .aab to a defined output folder, e.g., dist/android/appA/app-release.aab

Note: Sequential builds are required to avoid config conflicts.

2.2 Fastlane Upload Step
	•	Create a new Fastlane script (lane) for Android upload + release
	•	Input parameters:
	•	package_name (app identifier)
	•	aab_path (path to the built bundle)
	•	release_name (version string, e.g., v1.4.0)
	•	rollout (percentage for staged rollout)
	•	Optional: track (default: production)
	•	Automatic handling:
	•	Upload .aab to Play Store
	•	Set release name
	•	Add localized release notes from (update-messages.txt)
	•	We need to update update-messages.txt to be a JSON file with the current update mesages in English and translations to the top 8 other languages
	•	Output: success / error log

⸻

3️⃣ iOS Automation Requirements

3.1 Build / Upload Step (Existing Script: build-ios.sh)
	•	Input: list of apps
	•	For each app:
	•	Apply app-specific configuration
	•	Build the iOS app
	•	Upload to App Store Connect via existing upload process or Fastlane upload_to_testflight
	•	Save build number / version information for release step

Note: Sequential builds are required.

3.2 Fastlane Release Step
	•	Create a separate Fastlane script (lane) for App Store release
	•	Input parameters:
	•	bundle_id
	•	version
	•	build_number
	•	Automatic handling:
	•	Create a new version if it does not exist
	•	Select the uploaded build
	•	Add localized release notes: same as Android

⸻

4️⃣ Orchestration / Main Script
	•	A top-level shell script to run everything in order
	•	Steps:

	1.	Android builds: call existing shell build script for each app sequentially
	2.	Android Fastlane: call Android release lane per app
	3.	iOS builds: call existing shell build script for each app sequentially
	4.	iOS Fastlane: call iOS release lane per app

	•	Input parameters: the index of which update message to use
	•	Logging:
	•	Save output logs for each build + release
	•	Exit on first failure with clear error message

⸻

5️⃣ Safety Requirements
	•	Do not modify existing build scripts
	•	Use parameterized Fastlane lanes to avoid hardcoding app info
	•	Clean workspace before each build to prevent config bleed
	•	Validate that .aab or .ipa exists before calling Fastlane release

⸻

6️⃣ Deliverables (Scripts)
	1.	fastlane_android_release.sh (or equivalent lane)
	•	Upload .aab
	•	Create release on Play Store
	•	Add localized release notes
	•	Handle staged rollout
	2.	fastlane_ios_release.sh (or equivalent lane)
	•	Create version in App Store Connect
	•	Select uploaded build
	•	Add localized release notes
	•	Answer encryption / compliance questions
	3.	release_all.sh (top-level orchestrator)
	•	Call Android builds sequentially
	•	Trigger Android Fastlane release per app
	•	Call iOS builds sequentially
	•	Trigger iOS Fastlane release per app

