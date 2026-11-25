#!/usr/bin/env bash
# Build macOS .dmg files (Apple Silicon by default) from the static web export.
set -euo pipefail
cd "$(dirname "$0")/.."

ELECTRON_VERSION="${ELECTRON_VERSION:-38.2.0}"
VERSION="$(node -p "require('./package.json').version")"
OUT=dist_dmg
STAGE="$OUT/stage"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npm run build
fi
rm -rf "$OUT" && mkdir -p "$STAGE/app"

# App payload: desktop shell + preload + web export
cp desktop/main.js "$STAGE/app/"
if [ -f desktop/preload.js ]; then
  cp desktop/preload.js "$STAGE/app/"
fi
if [ -d desktop/windows ]; then
  cp -R desktop/windows "$STAGE/app/"
fi
if [ -d desktop/native ]; then
  mkdir -p "$STAGE/app/native/frontApp"
  cp -R desktop/native/frontApp/frontApp "$STAGE/app/native/frontApp/" 2>/dev/null || true
fi
node -e "const p=require('./desktop/package.json');p.version='$VERSION';require('fs').writeFileSync('$STAGE/app/package.json',JSON.stringify(p,null,2))"
cp -R out "$STAGE/app/web"

# Icon (.icns)
SRC_PNG="src/assets/icon/png/appicon-1024.png"
if [ -f "$SRC_PNG" ]; then
  echo "Generating .icns using multi-resolution assets & python3..."
  ICONSET="$STAGE/icon.iconset"
  mkdir -p "$ICONSET"
  cp "src/assets/icon/png/icon-16.png"      "$ICONSET/icon_16x16.png"
  cp "src/assets/icon/png/icon-32.png"      "$ICONSET/icon_16x16@2x.png"
  cp "src/assets/icon/png/icon-32.png"      "$ICONSET/icon_32x32.png"
  cp "src/assets/icon/png/appicon-64.png"   "$ICONSET/icon_32x32@2x.png"
  cp "src/assets/icon/png/appicon-128.png"  "$ICONSET/icon_128x128.png"
  cp "src/assets/icon/png/appicon-256.png"  "$ICONSET/icon_128x128@2x.png"
  cp "src/assets/icon/png/appicon-256.png"  "$ICONSET/icon_256x256.png"
  cp "src/assets/icon/png/appicon-512.png"  "$ICONSET/icon_256x256@2x.png"
  cp "src/assets/icon/png/appicon-512.png"  "$ICONSET/icon_512x512.png"
  cp "src/assets/icon/png/appicon-1024.png" "$ICONSET/icon_512x512@2x.png"

  python3 -c "
import struct, os
mapping = {
    'icon_16x16.png': b'icp4',
    'icon_16x16@2x.png': b'ic11',
    'icon_32x32.png': b'icp5',
    'icon_32x32@2x.png': b'ic12',
    'icon_128x128.png': b'ic07',
    'icon_128x128@2x.png': b'ic13',
    'icon_256x256.png': b'ic08',
    'icon_256x256@2x.png': b'ic14',
    'icon_512x512.png': b'ic09',
    'icon_512x512@2x.png': b'ic10',
}
entries = []
total_size = 8
for fname, ostype in mapping.items():
    fpath = os.path.join('$ICONSET', fname)
    if os.path.exists(fpath):
        with open(fpath, 'rb') as f:
            data = f.read()
        entry_len = 8 + len(data)
        entries.append((ostype, entry_len, data))
        total_size += entry_len
with open('$STAGE/icon.icns', 'wb') as f:
    f.write(b'icns' + struct.pack('>I', total_size))
    for ostype, elen, data in entries:
        f.write(ostype + struct.pack('>I', elen) + data)
" || (command -v iconutil >/dev/null 2>&1 && iconutil -c icns "$ICONSET" -o "$STAGE/icon.icns")
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
    rm -f "$HOME/Desktop/TAIOTime.dmg" "$HOME/Desktop/TAIO-Time-"*.dmg "$HOME/Desktop/TAIOTime-"*.dmg
    cp "$DMG_OUT" "$HOME/Desktop/TAIOTime-${VERSION}.dmg"
    echo "Copied DMG to $HOME/Desktop/TAIOTime-${VERSION}.dmg"
  fi
done

rm -rf "$STAGE"
ls -lh "$OUT"
