#!/usr/bin/env bash
# Official Xcode iOS archive & export script for TAIO Time
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version")"
XCODE_DEV="/Users/abc/Downloads/Xcode.app/Contents/Developer"

echo "1. Syncing Capacitor iOS..."
npx cap sync ios

# Fix Swift tools version if overwritten by Capacitor
sed -i '' 's/swift-tools-version: 5.9/swift-tools-version: 5.8/g' ios/App/CapApp-SPM/Package.swift

echo "2. Building Xcode Archive..."
rm -rf ios/build/TAIOTime.xcarchive
DEVELOPER_DIR="$XCODE_DEV" "$XCODE_DEV/usr/bin/xcodebuild" archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -destination "generic/platform=iOS" \
  -archivePath ios/build/TAIOTime.xcarchive \
  CODE_SIGN_IDENTITY="Apple Development"

echo "3. Exporting official signed IPA..."
rm -rf ios/build/exported
DEVELOPER_DIR="$XCODE_DEV" "$XCODE_DEV/usr/bin/xcodebuild" -exportArchive \
  -archivePath ios/build/TAIOTime.xcarchive \
  -exportPath ios/build/exported \
  -exportOptionsPlist ios/ExportOptions.plist

echo "4. Copying to Desktop (strictly 1 IPA with version)..."
rm -f "$HOME/Desktop/TAIOTime.ipa" "$HOME/Desktop/TAIOTime-"*.ipa "$HOME/Desktop/TAIO-Time-"*.ipa
cp -f ios/build/exported/App.ipa "$HOME/Desktop/TAIOTime-${VERSION}.ipa"
echo "Done: $HOME/Desktop/TAIOTime-${VERSION}.ipa"
