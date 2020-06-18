#! /usr/bin/env bash

if [[ -x "src/glslsandbox-player" ]] ; then
    : "${GLSLSANDBOX_PLAYER:=src/glslsandbox-player}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

${GLSLSANDBOX_PLAYER} -l |
    awk '1 == /^[0-9]+/ {print $3;}' |
    shuf |
    while read -r shader_name ; do
        echo "Running shader ${shader_name}"
        timeout \
            --foreground \
            --kill-after=1 30 \
            "${GLSLSANDBOX_PLAYER}" -W 640 -H 360 -t 3 -w 0 -q -S "${shader_name}"
        RET=$?

        if [[ $RET -eq 124 ]] ; then
            echo "Execution of shader ${shader_name} timed out"
        elif [[ $RET -ne 0 ]] ; then
            echo "Execution of shader ${shader_name} failed"
        fi
done
