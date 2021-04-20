#! /bin/sh

set -eu

adb \
    shell \
    am force-stop sh.juju.glslsandbox_player
