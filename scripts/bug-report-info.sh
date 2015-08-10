#! /bin/sh

echo
echo "uname:"
uname -a

echo
echo "lsb_release:"
lsb_release -a

echo
echo "getconf:"
getconf -a

echo
echo "/proc/cpuinfo:"
cat /proc/cpuinfo

echo
echo "lspci:"
lspci

echo
echo "glxinfo:"
glxinfo
