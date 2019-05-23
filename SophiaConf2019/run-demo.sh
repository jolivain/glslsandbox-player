#! /bin/sh

WORK_DIR="$(dirname "$0")"

DEFAULT_BIN="$(readlink -f "${WORK_DIR}/../src/glslsandbox-player" || :)"
if [ -x "${DEFAULT_BIN}" ] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
fi

GSP_ARGS="-W 640 -H 360 -t 5 -w 0 -q"

while true ; do
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 05_mandel.frag
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 06b_perlin.frag
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 07a_mix_images.frag -0 logo-nxp.png -1 logo-sc2019.png
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 07b_mix_images.frag -0 logo-nxp.png -1 logo-sc2019.png
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 09_image-spiral.frag -0 logo-nxp.png
    ${GLSLSANDBOX_PLAYER} ${GSP_ARGS} -F 10_raymarched-logo.frag
done
