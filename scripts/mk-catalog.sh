#! /bin/bash

set -e
set -u

OUTPUT="${1:-catalog}"

WORK_DIR="$(dirname "$0")"
OUTPUT_DIR="${WORK_DIR}/${OUTPUT}"

DEFAULT_BIN=$(readlink -e "${WORK_DIR}/../src/glslsandbox-player")
if [[ -x "${DEFAULT_BIN}" ]] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

# Limit Virtual Size to 1G to prevent system crash by memory exhaustion
ulimit -S -v $(( 1024 * 1024 ))

mkdir -p "${OUTPUT_DIR}"
cd "${OUTPUT_DIR}"

${GLSLSANDBOX_PLAYER} -l |
    awk '1 == /^[0-9]+/ {print $3;}' |
    while read shader_id ; do
        echo "Rendering ${shader_id}"
        timeout \
            --foreground \
            --kill-after=1 60 \
            "${GLSLSANDBOX_PLAYER}" -q -w0 -m -u -O10 -W640 -H360 -f 1 -D -S "${shader_id}" || :
done

echo "Compressing images..."
find . -type f -name "*.ppm" |
    sed 's/-00000.ppm$//' |
    xargs -I{} -P$(nproc) convert {}-00000.ppm {}.png

echo "Cleanup..."
find . -type f -name "*.ppm" | xargs rm

echo "Catalog directory is: ${PWD}"
echo "Done."
