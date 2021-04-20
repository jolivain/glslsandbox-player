#! /bin/sh

set -eu

adb \
    shell \
    run-as sh.juju.glslsandbox_player \
    cat shared_prefs/config.xml |
    \
        grep -Eo '<string name="args">.*</string>' |
        sed "s@<string name=\"args\">\([^<]*\)</string>@\1@"
