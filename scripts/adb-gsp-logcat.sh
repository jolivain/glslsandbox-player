#! /bin/sh

set -eu

adb \
    logcat 'glslsandbox-player:D' '*:S'
