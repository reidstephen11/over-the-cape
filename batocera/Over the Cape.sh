#!/bin/bash
export DISPLAY="${DISPLAY:-:0.0}"
mkdir -p /userdata/saves/ports/OverTheCape
export LD_LIBRARY_PATH=/userdata/system/over-the-cape
exec /userdata/system/over-the-cape/over-the-cape --no-sandbox > /userdata/system/logs/over-the-cape.log 2>&1
