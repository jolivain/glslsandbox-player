#! /bin/sh

if [ -x "$(command -v uname)" ] ; then
    echo
    echo "uname:"
    uname -a
fi

if [ -x "$(command -v lsb_release)" ] ; then
    echo
    echo "lsb_release:"
    lsb_release -a
fi

if [ -x "$(command -v getconf)" ] ; then
    echo
    echo "getconf:"
    getconf -a
fi

if [ -e "/proc/cpuinfo" ] ; then
    echo
    echo "/proc/cpuinfo:"
    cat /proc/cpuinfo
fi

if [ -x "$(command -v lspci)" ] ; then
    echo
    echo "lspci:"
    lspci
fi

if [ -x "$(command -v glxinfo)" ] ; then
    echo
    echo "glxinfo:"
    glxinfo
fi

if [ -x "$(command -v modetest)" ] ; then
    echo
    echo "DRM modetest:"
    modetest
fi

if [ -x "$(command -v weston-info)" ] ; then
    echo
    echo "weston-info"
    weston-info
fi
