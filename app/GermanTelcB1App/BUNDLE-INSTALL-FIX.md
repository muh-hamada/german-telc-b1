# Bundle Install Fix for macOS

## Problem

The system Ruby (2.6.0) on macOS has broken headers that prevent native gem compilation. This affects the `json` gem which is required by CocoaPods and Fastlane.

## Solution: Use Homebrew Ruby

### Step 1: Install Homebrew Ruby

```bash
brew install ruby
```

### Step 2: Add Homebrew Ruby to PATH

Add to your `~/.zshrc`:

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LDFLAGS="-L/opt/homebrew/opt/ruby/lib"
export CPPFLAGS="-I/opt/homebrew/opt/ruby/include"
```

Reload your shell:

```bash
source ~/.zshrc
```

### Step 3: Verify Ruby Version

```bash
which ruby
# Should show: /opt/homebrew/opt/ruby/bin/ruby

ruby -v
# Should show Ruby 3.x
```

### Step 4: Install Bundler

```bash
gem install bundler
```

### Step 5: Install Gems

```bash
cd /Users/mham/projects/german-telc-b1/app/GermanTelcB1App
bundle install
```

## Alternative: Skip Fastlane for Now

If you don't need the release automation immediately, you can:

1. Comment out fastlane in the Gemfile
2. Run `bundle install` without it
3. Use the existing build scripts (`build-android.sh`, `build-ios.sh`)
4. Install fastlane later when needed using Homebrew Ruby

### Quick Alternative

```bash
# Comment out fastlane in Gemfile temporarily
sed -i.bak "s/gem 'fastlane'/# gem 'fastlane'/" Gemfile

# Install other gems
bundle install

# Restore Gemfile when ready to use fastlane
mv Gemfile.bak Gemfile
```

## Verification

After installing Homebrew Ruby and bundler:

```bash
./verify-setup.sh
```

This should now pass all checks.
