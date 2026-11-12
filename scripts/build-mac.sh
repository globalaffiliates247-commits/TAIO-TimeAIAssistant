#!/usr/bin/env bash
# Build macOS .dmg files (Apple Silicon by default) from the static web export.
set -euo pipefail
cd "$(dirname "$0")/.."

ELECTRON_VERSION="${ELECTRON_VERSION:-38.2.0}"
VERSION="$(node -p "require('./package.json').version")"
OUT=dist_dmg
STAGE="$OUT/stage"

npm run build
rm -rf "$OUT" && mkdir -p "$STAGE/app"

# App payload: desktop shell + preload + web export
cp desktop/main.js "$STAGE/app/"
if [ -f desktop/preload.js ]; then
  cp desktop/preload.js "$STAGE/app/"
fi
node -e "const p=require('./desktop/package.json');p.version='$VERSION';require('fs').writeFileSync('$STAGE/app/package.json',JSON.stringify(p,null,2))"
cp -R out "$STAGE/app/web"

# Icon (.icns)
SRC_PNG="ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
if command -v iconutil >/dev/null 2>&1 && [ -f "$SRC_PNG" ]; then
  echo "Generating .icns using sips & iconutil..."
  ICONSET="$STAGE/icon.iconset"
  mkdir -p "$ICONSET"
  sips -z 16 16     "$SRC_PNG" --out "$ICONSET/icon_16x16.png" >/dev/null
  sips -z 32 32     "$SRC_PNG" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
  sips -z 32 32     "$SRC_PNG" --out "$ICONSET/icon_32x32.png" >/dev/null
  sips -z 64 64     "$SRC_PNG" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
  sips -z 128 128   "$SRC_PNG" --out "$ICONSET/icon_128x128.png" >/dev/null
  sips -z 256 256   "$SRC_PNG" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
  sips -z 256 256   "$SRC_PNG" --out "$ICONSET/icon_256x256.png" >/dev/null
  sips -z 512 512   "$SRC_PNG" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
  sips -z 512 512   "$SRC_PNG" --out "$ICONSET/icon_512x512.png" >/dev/null
  sips -z 1024 1024 "$SRC_PNG" --out "$ICONSET/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$ICONSET" -o "$STAGE/icon.icns"
fi

for ARCH in ${ARCHS:-arm64}; do
  echo "Packaging Electron app for $ARCH..."
  ZIP_CACHE=$(find "$HOME/Library/Caches/electron" -name "electron-v${ELECTRON_VERSION}-darwin-${ARCH}.zip" 2>/dev/null | head -n 1 || true)
  if [ -z "$ZIP_CACHE" ] || [ ! -f "$ZIP_CACHE" ]; then
    mkdir -p "$HOME/Library/Caches/electron"
    ZIP_CACHE="$HOME/Library/Caches/electron/electron-v${ELECTRON_VERSION}-darwin-${ARCH}.zip"
    echo "Downloading Electron v${ELECTRON_VERSION} for darwin-${ARCH}..."
    curl -L -o "$ZIP_CACHE" "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-darwin-${ARCH}.zip"
  fi

  PKG_DIR="$STAGE/pkg/TAIO Time-darwin-$ARCH"
  rm -rf "$PKG_DIR" && mkdir -p "$PKG_DIR"
  echo "Extracting Electron binary..."
  unzip -q "$ZIP_CACHE" -d "$PKG_DIR"
  APP="$PKG_DIR/TAIO Time.app"
  mv "$PKG_DIR/Electron.app" "$APP"
  mv "$APP/Contents/MacOS/Electron" "$APP/Contents/MacOS/TAIO Time"

  # Bundle payload into app
  mkdir -p "$APP/Contents/Resources/app"
  cp -R "$STAGE/app/"* "$APP/Contents/Resources/app/"

  # Bundle icon
  if [ -f "$STAGE/icon.icns" ]; then
    cp "$STAGE/icon.icns" "$APP/Contents/Resources/electron.icns"
  fi

  # Plist branding
  PLIST="$APP/Contents/Info.plist"
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName TAIO Time" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string 'TAIO Time'" "$PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleName TAIO Time" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleName string 'TAIO Time'" "$PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier club.taio.timeapp" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string club.taio.timeapp" "$PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $VERSION" "$PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $VERSION" "$PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleExecutable TAIO Time" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleExecutable string 'TAIO Time'" "$PLIST"

  echo "Signing app bundle..."
  codesign --force --deep -s - "$APP"

  # DMG creation
  VOL="$STAGE/vol-$ARCH" && rm -rf "$VOL" && mkdir -p "$VOL"
  cp -R "$APP" "$VOL/"
  ln -s /Applications "$VOL/Applications"

  DMG_OUT="$OUT/TAIO-Time-$VERSION-$ARCH.dmg"
  echo "Creating DMG image..."
  rm -f "$DMG_OUT"
  hdiutil create -volname "TAIO Time" -srcfolder "$VOL" -ov -format UDZO "$DMG_OUT"

  if [ -d "$HOME/Desktop" ]; then
    cp "$DMG_OUT" "$HOME/Desktop/TAIOTime.dmg"
    echo "Copied DMG to $HOME/Desktop/TAIOTime.dmg"
  fi
done

rm -rf "$STAGE"
ls -lh "$OUT"
