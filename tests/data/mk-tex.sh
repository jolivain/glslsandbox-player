#! /bin/sh

set -x
set -e
set -u

convert -size 8x64 xc:none -stroke red     -draw "line  0,0  0,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:0.png
convert -size 8x64 xc:none -stroke magenta -draw "line  1,0  1,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:1.png
convert -size 8x64 xc:none -stroke blue    -draw "line  2,0  2,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:2.png
convert -size 8x64 xc:none -stroke cyan    -draw "line  3,0  3,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:3.png
convert -size 8x64 xc:none -stroke lime    -draw "line  4,0  4,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:4.png
convert -size 8x64 xc:none -stroke yellow  -draw "line  5,0  5,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:5.png
convert -size 8x64 xc:none -stroke white   -draw "line  6,0  6,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:6.png
convert -size 8x64 xc:none -stroke black   -draw "line  7,0  7,64"  \( +clone +clone +clone +clone +clone +clone +clone \) +append PNG32:7.png

convert \
        0.png \
        1.png -composite \
        2.png -composite \
        3.png -composite \
        4.png -composite \
        5.png -composite \
        6.png -composite \
        7.png -composite \
        PNG32:8.png
