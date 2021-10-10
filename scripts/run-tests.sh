#! /bin/sh

set -e
set -u

COMMAND="${1:-run}"
OUTPUT="${2:-output}"

WORK_DIR="$(dirname "$0")"
TEST_DIR="${WORK_DIR}/tests"

DEFAULT_BIN=$(readlink -e "${WORK_DIR}/../src/glslsandbox-player" || :)
if [ -x "${DEFAULT_BIN}" ] ; then
    : "${GLSLSANDBOX_PLAYER:=${DEFAULT_BIN}}"
    : "${OUTPUT_DIR:=${TEST_DIR}/${OUTPUT}}"
else
    : "${GLSLSANDBOX_PLAYER:=glslsandbox-player}"
    : "${OUTPUT_DIR:=/var/tmp/gsp/tests/${OUTPUT}}"
fi

run_cleanup() {
    cd "${OUTPUT_DIR}/"
    rm -fv ./*.done ./*.passed ./*.failed ./*.log ./*.ppm ./*.png
}

run_tests() {
    RET=0

    make \
        -C "${TEST_DIR}/" \
        GLSLSANDBOX_PLAYER="${GLSLSANDBOX_PLAYER}" \
        O="${OUTPUT}"
    make \
        -C "${TEST_DIR}/" \
        -j"$(nproc)" \
        GLSLSANDBOX_PLAYER="${GLSLSANDBOX_PLAYER}" \
        O="${OUTPUT}" \
        pngs

    FAILED_COUNT="$(find "${OUTPUT_DIR}/" -type f -name '*.failed' | wc -l)"

    if [ "$FAILED_COUNT" -gt 0 ] ; then
        echo
        echo "---------------"
        echo "Failed shaders:"
        echo "---------------"
        ( cd "${OUTPUT_DIR}/" && ls -1 ./*.failed )
        echo
        RET=1
    fi

    return ${RET}
}

usage() {
    echo
    echo "Usage: $0 <command> <output-name>"
    echo
    echo "command: clean|run"
    echo "output-name: directory to put results"
    echo
}

case "${COMMAND}" in
    "clean")
	run_cleanup
	;;
    "run")
	run_tests
	;;
    "help")
        usage
        ;;
    *)
	echo "ERROR: unknown command: ${COMMAND}" >&2
        usage
	exit 1
esac
