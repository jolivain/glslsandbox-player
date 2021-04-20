#! /bin/sh

set -eu

if [ $# -ne 1 ] ; then
    echo "usage: $0 <shader-name>"
    exit 1
fi

SHADER_NAME="$1"
if [ -z "${SHADER_NAME}" ] ; then
    echo "Error: empty shader name. Please set a shader name"
    exit 1
fi

adb \
    shell \
    run-as sh.juju.glslsandbox_player \
    sed -i \""s/-S *[a-zA-Z0-9_]*/-S ${SHADER_NAME}/\"" \
    shared_prefs/config.xml
