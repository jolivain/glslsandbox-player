#! /bin/sh

set -e
set -u

OUTPUT="${1:-catalog}"

WORK_DIR="$(dirname "$0")"

DEFAULT_BIN=$(readlink -f "${WORK_DIR}/../src/glslsandbox-player" || :)
if [ -x "${DEFAULT_BIN}" ] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
    : "${OUTPUT_DIR:=${WORK_DIR}/${OUTPUT}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
    : "${OUTPUT_DIR:=/var/tmp/gsp/${OUTPUT}}"
fi

# If "timeout" knows --foreground option, use it:
TIMEOUT_FG=""
timeout --foreground 1 true && TIMEOUT_FG="--foreground"

mkdir -p "${OUTPUT_DIR}"
cd "${OUTPUT_DIR}"

${GLSLSANDBOX_PLAYER} -l |
    awk '1 == /^[0-9]+/ {print $3;}' |
    while read -r shader_name ; do
        echo "Rendering ${shader_name}"
        # shellcheck disable=SC2015
        timeout \
            ${TIMEOUT_FG} \
            -s KILL 60 \
            "${GLSLSANDBOX_PLAYER}" -q -w0 -m -u -O10 -W640 -H360 -f 1 -D -S "${shader_name}" &&
        convert "${shader_name}-00000.ppm" -quality 75% "${shader_name}.jpg" &&
        rm -f "${shader_name}-00000.ppm" || :
done

echo "Catalog directory is: ${PWD}"
echo "Done."
