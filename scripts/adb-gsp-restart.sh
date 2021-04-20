#! /bin/sh

set -eu

WORK_DIR="$(dirname "$0")"

"${WORK_DIR}"/adb-gsp-stop.sh
"${WORK_DIR}"/adb-gsp-start.sh
