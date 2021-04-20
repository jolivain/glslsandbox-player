#! /bin/sh

set -eu

WORK_DIR="$(dirname "$0")"

"${WORK_DIR}"/adb-gsp-set-cmdline.sh "$@"
"${WORK_DIR}"/adb-gsp-restart.sh
