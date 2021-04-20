#! /bin/sh

set -eu

adb \
    shell \
    am start -n sh.juju.glslsandbox_player/android.app.NativeActivity
