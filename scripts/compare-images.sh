#! /bin/bash

set -u

if [[ $# -ne 3 ]] ; then
    echo "Usage: $0 <png-dir1> <png-dir2> <compare-output>"
    exit 1
fi

IMG_DIR1="$1"
IMG_DIR2="$2"
OUT_DIR="$3"

mkdir -p "${OUT_DIR}"

for image1 in ${IMG_DIR1}/*.png ; do
    img="$(basename "${image1}")"
    image2="${IMG_DIR2}/${img}"
    if [ -f "${image2}" ] ; then
           echo "Processing $img"
	   compare -fuzz '10%' "${image1}" "${image2}" "${OUT_DIR}/${img}"
    fi
done
