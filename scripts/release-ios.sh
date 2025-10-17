#!/bin/bash

# --- FULL IOS RELEASE SCRIPT ---
# This script bundles the app for production, then builds and installs
# the release version onto a connected physical device.

# Step 1: Create an optimized production JS bundle.
# The key difference is `--dev false`, which minifies the code and improves performance.
echo "📦 Bundling iOS JavaScript for PRODUCTION..."
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios

if [ $? -ne 0 ]; then
  echo "❌ Production bundling failed. Exiting."
  exit 1
fi
echo "✅ Production JS bundle created successfully."
echo ""

# Step 2: List available physical iOS devices.
echo "📱 Available iOS devices:"
xcrun xctrace list devices | grep -E "iPhone|iPad" | nl

echo ""
echo "👉 Select the number of the device you want to build to:"
read device_num

# Step 3: Extract the UDID of the selected device.
device_udid=$(xcrun xctrace list devices | grep -E "iPhone|iPad" | sed -n "${device_num}p" | sed 's/.*(//;s/)//')

if [ -z "$device_udid" ]; then
  echo "❌ Invalid device selection. Exiting."
  exit 1
fi
echo ""
echo "👍 Device selected: $device_udid"
echo ""

# Step 4: Build and install the app in Release configuration.
# The `--configuration Release` flag tells Xcode to build the app as it
# would for the App Store, using the embedded production bundle.
echo "🚀 Building and installing RELEASE app on your device..."
npx expo run:ios --device "$device_udid" --configuration Release

if [ $? -ne 0 ]; then
  echo "❌ Build and installation failed."
  exit 1
fi

echo ""
echo "✅ Full release build complete and installed on your device!"
echo "🎉 The app is now ready for final testing before submission."
