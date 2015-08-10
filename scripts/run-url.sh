#! /usr/bin/env bash

if [[ -x "src/glslsandbox-player" ]] ; then
    : "${GLSLSANDBOX_PLAYER:=src/glslsandbox-player}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

BASEDIR="$(dirname "$0")"

set -e
set -u

if [[ $# -lt 1 ]] ; then
    echo "Usage: $0 [glslsandbox-player-options] <glslsandbox-url>"
    exit 1
fi

URL="${!#}"
ARGS="${@:1:($# - 1)}"

SHADER_FILE="$(mktemp /tmp/glslsandbox-player-shader.XXXXXX)"

function cleanup {
    rm -f "${SHADER_FILE}"
}

trap cleanup EXIT

"${BASEDIR}"/dl-shader "${URL}" > "${SHADER_FILE}"

${GLSLSANDBOX_PLAYER} -F "${SHADER_FILE}" $ARGS
