#! /usr/bin/env bash

if [[ -x "src/glslsandbox-player" ]] ; then
    : "${GLSLSANDBOX_PLAYER:=src/glslsandbox-player}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

# Limit Virtual Size to 1G to prevent system crash by memory exhaustion
ulimit -S -v $(( 1024 * 1024 ))

${GLSLSANDBOX_PLAYER} -l |
    awk '1 == /^[0-9]+/ {print $1;}' |
    shuf |
    while read shader_id ; do
        echo "Running shader ${shader_id}"
        timeout \
            --foreground \
            --kill-after=1 15 \
            "${GLSLSANDBOX_PLAYER}" -W 640 -H 480 -t 3 -q -i "${shader_id}"
        RET=$?

        if [[ $RET -eq 124 ]] ; then
            echo "Execution of shader ${shader_id} timed out"
        elif [[ $RET -ne 0 ]] ; then
            echo "Execution of shader ${shader_id} failed"
        fi
done
