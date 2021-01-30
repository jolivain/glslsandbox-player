#! /bin/sh

WORK_DIR="$(dirname "$0")"

DEFAULT_BIN=$(readlink -f "${WORK_DIR}/../src/glslsandbox-player" || :)
if [ -x "${DEFAULT_BIN}" ] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

# If "timeout" knows --foreground option, use it:
TIMEOUT_FG=""
timeout --foreground 1 true && TIMEOUT_FG="--foreground"

"${WORK_DIR}"/ls-shaders -n |
    while read -r shader_name ; do
        echo
        echo "---------------------------------------------------"
        echo "Running shader ${shader_name}"
        timeout \
            ${TIMEOUT_FG} \
            -s KILL 60 \
            "${GLSLSANDBOX_PLAYER}" -W 640 -H 360 -t 3 -w 1 -S "${shader_name}"
        RET=$?

        if [ $RET -eq 124 ] ; then
            echo "Execution of shader ${shader_name} timed out"
        elif [ $RET -ne 0 ] ; then
            echo "Execution of shader ${shader_name} failed"
        fi
done
