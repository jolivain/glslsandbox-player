#! /bin/sh

set -eu

CMD_LINE="$*"

adb \
    shell \
    run-as sh.juju.glslsandbox_player \
    sed -i \""s@\(<string name=\\\"args\\\">\)[^<]*\(</string>\)@\1${CMD_LINE}\2@"\" \
    shared_prefs/config.xml
