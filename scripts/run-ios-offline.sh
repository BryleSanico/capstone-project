#!/bin/bash

# Step 1: Create offline JS bundle
echo "📦 Bundling iOS JavaScript for offline use..."
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios

if [ $? -ne 0 ]; then
  echo "❌ Bundling failed. Exiting."
  exit 1
fi

# Step 2: List iOS devices
echo ""
echo "📱 Available iOS devices:"
xcrun xctrace list devices | grep -E "iPhone|iPad" | nl

echo ""
echo "Select device number:"
read device_num

# Step 3: Extract UDID
device_udid=$(xcrun xctrace list devices | grep -E "iPhone|iPad" | sed -n "${device_num}p" | sed 's/.*(//;s/)//')

if [ -z "$device_udid" ]; then
  echo "❌ Invalid selection. Exiting."
  exit 1
fi

echo ""
echo "🚀 Building and running on device UDID: $device_udid"

# Step 4: Build for Release (to embed main.jsbundle)
cd ios || exit
scheme=$(xcodebuild -list -json | jq -r '.project.schemes[0]')
workspace=$(ls *.xcworkspace | head -1)

if [ -z "$workspace" ]; then
  echo "❌ No .xcworkspace found. Make sure your iOS project is initialized."
  exit 1
fi

xcodebuild \
  -workspace "$workspace" \
  -scheme "$scheme" \
  -configuration Release \
  -derivedDataPath build \
  -destination "id=$device_udid"

cd ..

# Step 5: Install app to physical device
echo ""
echo "📲 Installing app on device..."
npx expo run:ios --device "$device_udid" --configuration Release

echo ""
echo "✅ Offline iOS build complete!"
