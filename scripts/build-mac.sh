#!/usr/bin/env bash
# Build macOS .dmg files (Apple Silicon by default) from the static web export.
# Runs on Linux or macOS. Needs: node/npm, rcodesign (ad-hoc signing),
# mkfs.hfsplus (hfsprogs) and libdmg-hfsplus `hfsplus` + `dmg` on PATH.
# Usage: scripts/build-mac.sh            -> dist_dmg/TAIO-Time-<ver>-arm64.dmg
set -euo pipefail
cd "$(dirname "$0")/.."

ELECTRON_VERSION="${ELECTRON_VERSION:-38.2.0}"
VERSION="$(node -p "require('./package.json').version")"
OUT=dist_dmg
STAGE="$OUT/stage"

npm run build
rm -rf "$OUT" && mkdir -p "$STAGE/app"

# App payload: desktop shell + web export (version synced from package.json)
cp desktop/main.js "$STAGE/app/"
node -e "const p=require('./desktop/package.json');p.version='$VERSION';require('fs').writeFileSync('$STAGE/app/package.json',JSON.stringify(p,null,2))"
cp -R out "$STAGE/app/web"

# Icon (.icns) from public/icon.svg
node scripts/make-icns.js public/icon.svg "$STAGE/icon.icns"

# Founder Mac is Apple Silicon: arm64 only by default (ARCHS="arm64 x64" to add Intel).
for ARCH in ${ARCHS:-arm64}; do
  npx --yes @electron/packager@18.3.6 "$STAGE/app" "TAIO Time" \
    --platform=darwin --arch="$ARCH" --electron-version="$ELECTRON_VERSION" \
    --app-bundle-id=club.taio.timeapp --app-version="$VERSION" \
    --icon="$STAGE/icon.icns" --out="$STAGE/pkg" --overwrite --asar=false
  APP_DIR="$STAGE/pkg/TAIO Time-darwin-$ARCH"
  APP="$APP_DIR/TAIO Time.app"

  # Ad-hoc signature: required for Apple Silicon to launch the bundle at all.
  rcodesign sign "$APP" >/dev/null

  # DMG: HFS+ image with the app + /Applications shortcut, then compress.
  VOL="$STAGE/vol-$ARCH" && rm -rf "$VOL" && mkdir -p "$VOL"
  cp -R "$APP" "$VOL/"
  SIZE_MB=$(( $(du -sm "$VOL" | cut -f1) + 40 ))
  IMG="$STAGE/$ARCH.hfs"
  dd if=/dev/zero of="$IMG" bs=1M count="$SIZE_MB" status=none
  mkfs.hfsplus -v "TAIO Time" "$IMG" >/dev/null
  hfsplus "$IMG" addall "$VOL" --symlinks clone_link >/dev/null
  hfsplus "$IMG" symlink /Applications /Applications
  dmg build "$IMG" "$OUT/TAIO-Time-$VERSION-$ARCH.dmg" >/dev/null
done

rm -rf "$STAGE"
ls -lh "$OUT"
