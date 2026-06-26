#!/usr/bin/env bash
set -euo pipefail

REPO="githunan/loon-plugins"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/main"

mkdir -p plugins/wps-office/app/wps plugins/tilingsales/upstream plugins/tilingsales/js

curl -fsSL -o plugins/wps-office/app/wps/wps.cookie.js https://raw.githubusercontent.com/MaYIHEI/paperclip/refs/heads/main/app/wps/wps.cookie.js
curl -fsSL -o plugins/wps-office/app/wps/wps.js https://raw.githubusercontent.com/MaYIHEI/paperclip/refs/heads/main/app/wps/wps.js
curl -fsSL -o plugins/wps-office/app/wps/wps.png https://raw.githubusercontent.com/MaYIHEI/pin/refs/heads/main/app/wps.png

curl -fsSL -o plugins/tilingsales/upstream/TilingSales_ad_remove.snippet https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/TilingSales_ad_remove.snippet
curl -fsSL -o plugins/tilingsales/js/TilingSales_getNav.js https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/TilingSales_getNav.js
node scripts/convert-qx-to-loon.js \
  --source plugins/tilingsales/upstream/TilingSales_ad_remove.snippet \
  --output plugins/tilingsales/TilingSales_ad_remove.plugin \
  --repo "$REPO" \
  --base "$RAW_BASE" \
  --script "TilingSales_getNav.js=${RAW_BASE}/plugins/tilingsales/js/TilingSales_getNav.js"
