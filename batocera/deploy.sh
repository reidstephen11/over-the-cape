#!/bin/bash
# Builds the game and installs it on the Batocera PC. Run from the repo root.
# Run again after any game update; saves are kept.
set -euo pipefail
HOST="${1:-batocera-nuc.local}"
ELECTRON=v45.2.0
export SSHPASS=linux
SSH=(sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR)
DEST=/userdata/system/over-the-cape

npx vite build
# Electron needs a printing library Batocera doesn't ship; take it from Debian 12.
CUPS=$(mktemp -d)
curl -fsSL -o "$CUPS/cups.deb" https://deb.debian.org/debian/pool/main/c/cups/libcups2_2.4.2-3+deb12u9_amd64.deb
(cd "$CUPS" && bsdtar -xf cups.deb && bsdtar -xf data.tar.xz)
"${SSH[@]}" "root@$HOST" "
  if [ ! -x $DEST/over-the-cape ]; then
    curl -fsSL -o /tmp/electron.zip https://github.com/electron/electron/releases/download/$ELECTRON/electron-$ELECTRON-linux-x64.zip
    mkdir -p $DEST && unzip -q -o /tmp/electron.zip -d $DEST && rm /tmp/electron.zip
    mv $DEST/electron $DEST/over-the-cape
  fi
  mkdir -p $DEST/resources/app/game"
rsync -aL -e "${SSH[*]}" "$CUPS/usr/lib/x86_64-linux-gnu/libcups.so.2" "root@$HOST:$DEST/"
rsync -a --delete -e "${SSH[*]}" --exclude game batocera/app/ "root@$HOST:$DEST/resources/app/"
rsync -a --delete -e "${SSH[*]}" dist/ "root@$HOST:$DEST/resources/app/game/"
rsync -a -e "${SSH[*]}" "batocera/Over the Cape.sh" "root@$HOST:/userdata/roms/ports/"
"${SSH[@]}" "root@$HOST" "
  chmod +x '/userdata/roms/ports/Over the Cape.sh'
  # 30 W while playing; the default 15 W starves the graphics chip (12 fps vs 45 fps).
  grep -q 'Over the Cape.sh\"\].tdp' /userdata/system/batocera.conf ||
    echo 'ports[\"Over the Cape.sh\"].tdp=85' >> /userdata/system/batocera.conf"
