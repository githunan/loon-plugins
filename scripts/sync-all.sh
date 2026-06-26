#!/usr/bin/env bash
set -euo pipefail

REPO="githunan/loon-plugins"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/main"

mkdir -p \
  plugins/wps-office/app/wps \
  plugins/tilingsales/upstream plugins/tilingsales/js \
  plugins/migu/upstream plugins/migu/js

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
  --tag "瓜子影视净化" \
  --script "TilingSales_getNav.js=${RAW_BASE}/plugins/tilingsales/js/TilingSales_getNav.js"

curl -fsSL -o plugins/migu/upstream/migu_vip_share.snippet https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/migu_vip_share.snippet
curl -fsSL -o plugins/migu/js/migu_vip.js https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/migu_vip.js
node scripts/convert-qx-to-loon.js \
  --source plugins/migu/upstream/migu_vip_share.snippet \
  --output plugins/migu/migu_vip_share.plugin \
  --repo "$REPO" \
  --base "$RAW_BASE" \
  --tag "咪咕视频解锁会员" \
  --script "migu_vip.js=${RAW_BASE}/plugins/migu/js/migu_vip.js"
