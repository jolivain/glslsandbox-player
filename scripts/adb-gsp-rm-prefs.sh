#! /bin/sh

set -eu

adb \
    shell \
    run-as sh.juju.glslsandbox_player \
    rm -f shared_prefs/config.xml
