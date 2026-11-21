#!/usr/bin/env bash
# Build Windows 10/11 x64 bundle from static export & Electron
set -euo pipefail
cd "$(dirname "$0")/.."

ELECTRON_VERSION="${ELECTRON_VERSION:-38.2.0}"
VERSION="$(node -p "require('./package.json').version")"
OUT=dist_win
STAGE="$OUT/stage"

rm -rf "$OUT" && mkdir -p "$STAGE/app"

# App payload: desktop shell + preload + web export
cp desktop/main.js "$STAGE/app/"
if [ -f desktop/preload.js ]; then
  cp desktop/preload.js "$STAGE/app/"
fi
if [ -d desktop/clock ]; then
  cp -R desktop/clock "$STAGE/app/"
fi
node -e "const p=require('./desktop/package.json');p.version='$VERSION';require('fs').writeFileSync('$STAGE/app/package.json',JSON.stringify(p,null,2))"
cp -R out "$STAGE/app/web"

ZIP_CACHE="$HOME/Library/Caches/electron/electron-v${ELECTRON_VERSION}-win32-x64.zip"
if [ ! -f "$ZIP_CACHE" ]; then
  mkdir -p "$HOME/Library/Caches/electron"
  echo "Downloading Electron v${ELECTRON_VERSION} for win32-x64..."
  curl -L -o "$ZIP_CACHE" "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-win32-x64.zip"
fi

PKG_DIR="$STAGE/TAIOTime-win32-x64"
rm -rf "$PKG_DIR" && mkdir -p "$PKG_DIR"
echo "Extracting Electron Windows binary..."
unzip -q "$ZIP_CACHE" -d "$PKG_DIR"

if [ -f "$PKG_DIR/electron.exe" ]; then
  mv "$PKG_DIR/electron.exe" "$PKG_DIR/TAIO Time.exe"
fi

# Bundle payload into app
mkdir -p "$PKG_DIR/resources/app"
cp -R "$STAGE/app/"* "$PKG_DIR/resources/app/"

# Package into zip on Desktop
WIN_ZIP="$OUT/TAIOTime-${VERSION}-win32-x64.zip"
(cd "$STAGE" && zip -rq "../../$WIN_ZIP" "TAIOTime-win32-x64")

if [ -d "$HOME/Desktop" ]; then
  cp "$WIN_ZIP" "$HOME/Desktop/TAIOTime-${VERSION}-windows-x64.zip"
  echo "Copied Windows bundle to $HOME/Desktop/TAIOTime-${VERSION}-windows-x64.zip"
fi

rm -rf "$STAGE"
echo "Windows build complete!"
