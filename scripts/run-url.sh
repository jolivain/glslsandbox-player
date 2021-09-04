#! /bin/sh

set -e
set -u

if [ $# -lt 1 ] ; then
    echo "Usage: $0 <glslsandbox-url> [glslsandbox-player-options]"
    exit 1
fi

BASEDIR="$(dirname "$0")"

DEFAULT_BIN=$(readlink -f "${BASEDIR}/../src/glslsandbox-player" || :)
if [ -x "${DEFAULT_BIN}" ] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

URL="$1"
shift

SHADER_FILE="$(mktemp /tmp/glslsandbox-player-shader.XXXXXX)"

cleanup() {
    rm -f "${SHADER_FILE}"
}

trap cleanup EXIT

"${BASEDIR}"/dl-shader "${URL}" > "${SHADER_FILE}"

${GLSLSANDBOX_PLAYER} -F "${SHADER_FILE}" "$@"
