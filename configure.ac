AC_PREREQ([2.68])
AC_INIT([glslsandbox-player],[1.0],[ju.o@free.fr])
AM_INIT_AUTOMAKE([-Wall -Wno-portability subdir-objects foreign])
AC_CONFIG_TESTDIR([tests], [src])

AC_PROG_AWK
AM_PROG_AR
AC_PROG_CC
AC_PROG_INSTALL
AC_PROG_RANLIB
AC_PROG_MKDIR_P
AC_PROG_SED

AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([
  Makefile
  scripts/Makefile
  src/Makefile
  tests/Makefile
  tests/atlocal
])

AC_CHECK_HEADERS([stddef.h stdlib.h string.h])
AC_TYPE_SIZE_T
AC_CHECK_FUNCS([clock_gettime malloc memset strerror strtol uname])

AC_ARG_ENABLE([debug],
        AS_HELP_STRING([--enable-debug], [enable debug messages @<:@default=disabled@:>@]),
        [], [enable_debug=no])
AS_IF([test "x$enable_debug" = "xyes"], [
        AC_DEFINE(ENABLE_DEBUG, [1], [Debug messages.])
])

AC_PATH_PROG([GLSLANGVALIDATOR], [glslangValidator])
AC_ARG_ENABLE([shader-validation],
        AS_HELP_STRING([--enable-shader-validation], [enable shader validation @<:@default=disabled@:>@]),
        [
if test -z "$ac_cv_path_GLSLANGVALIDATOR" ; then
   AC_MSG_ERROR([glslangValidator is needed for shader validation])
fi
], [
if test -z "$ac_cv_path_GLSLANGVALIDATOR" ; then
    enable_shader_validation=no
else
    enable_shader_validation=yes
fi
])
AM_CONDITIONAL([ENABLE_SHADER_VALIDATION], [test "x$enable_shader_validation" = "xyes"])

AC_ARG_WITH([shader-list],
    AS_HELP_STRING([--with-shader-list=LIST], [Define the shader list file @<:@default=shader.list@:>@]),
    [], [with_shader_list=shader.list]
)
AC_SUBST([shader_list], [$with_shader_list])

AC_ARG_ENABLE([testing],
               AS_HELP_STRING([--enable-testing], [Enable testing programs]),
              [], [enable_testing=no])
AM_CONDITIONAL([ENABLE_TESTING], [test "x$enable_testing" == "xyes"])

AC_ARG_ENABLE([install-testsuite],
               AS_HELP_STRING([--enable-install-testsuite], [Install testsuite]),
              [], [enable_install_testsuite=no])
AM_CONDITIONAL([ENABLE_INSTALL_TESTSUITE], [test "x$enable_install_testsuite" == "xyes"])

AC_ARG_ENABLE([install-scripts],
               AS_HELP_STRING([--enable-install-scripts], [Install additional scripts]),
              [], [enable_install_scripts=no])
AM_CONDITIONAL([ENABLE_INSTALL_SCRIPTS], [test "x$enable_install_scripts" == "xyes"])

AC_ARG_ENABLE([strict-egl],
    AS_HELP_STRING([--disable-strict-egl], [disable eglGetError() checks at each EGL call @<:@default=enabled@:>@]),
    [], [enable_strict_egl=yes])
AS_IF([test "x$enable_strict_egl" = "xyes"], [
    AC_DEFINE(XEGL_STRICT, [1], [Enable strict XEGL wrapper.])
])

AC_ARG_ENABLE([strict-gles],
    AS_HELP_STRING([--disable-strict-gles], [disable glGetError() checks at each GLES call @<:@default=enabled@:>@]),
    [], [enable_strict_gles=yes])
AS_IF([test "x$enable_strict_gles" = "xyes"], [
    AC_DEFINE(XGLES_STRICT, [1], [Enable strict XGLES wrapper.])
])

PKG_CHECK_MODULES([egl], [egl >= 1])
PKG_CHECK_MODULES([glesv2], [glesv2 >= 1])

AC_CHECK_HEADERS([EGL/eglext.h], [], [],
[[#include <EGL/egl.h>
]])

AC_CHECK_FUNCS([eglGetPlatformDisplay])

AC_ARG_WITH([libpng],
    AS_HELP_STRING([--with-libpng], [Enable libpng support @<:@default=enabled@:>@]),
    [], [with_libpng=yes]
)

AS_IF([test "x$with_libpng" = "xyes"], [
    PKG_CHECK_MODULES([libpng], [libpng], [
        have_libpng=yes
        AC_DEFINE(HAVE_LIBPNG, [1], [Have libpng.])
    ],[
        have_libpng=no
        AC_MSG_NOTICE([libpng not found. Disabling support.])
    ])
], [
    have_libpng=no
])
AM_CONDITIONAL([HAVE_LIBPNG], [test "x$have_libpng" = "xyes"])

AC_ARG_WITH([native-gfx],
        AS_HELP_STRING([--with-native-gfx=GFX],[Define the native gfx backend: x11(default),vivfb,rpi,wl,sdl2,kms,tisgx,mali,wgl,em]),
        [], [with_native_gfx=x11])

AS_IF([test "x$with_native_gfx" = "xx11"], [
	native_gfx=x11
        PKG_CHECK_MODULES([x11], [x11 >= 1.4])
        AC_DEFINE([ENABLE_X11], [1], [Enable X11.])
        AC_MSG_NOTICE([X11 support enabled])
], [
        AC_MSG_NOTICE([X11 support disabled])
])
AM_CONDITIONAL([ENABLE_X11], [test "x$with_native_gfx" = "xx11"])

AS_IF([test "x$with_native_gfx" = "xvivfb"], [
	native_gfx=vivfb
        AC_DEFINE([ENABLE_VIVFB], [1], [Enable (i.MX6 / Vivante) fb.])
        AC_DEFINE([EGL_API_FB], [1], [Enable Vivante EGL FB])
        AC_DEFINE([LINUX], [1], [Vivante EGL FB needs LINUX to be defined])
        AC_MSG_NOTICE([VivanteFB support enabled])
], [
        AC_MSG_NOTICE([VivanteFB support disabled])
])
AM_CONDITIONAL([ENABLE_VIVFB], [test "x$with_native_gfx" = "xvivfb"])

AS_IF([test "x$with_native_gfx" = "xrpi"], [
	native_gfx=rpi
        AC_DEFINE([ENABLE_RPI], [1], [Enable Raspberry Pi])
        AC_MSG_NOTICE([Raspberry Pi support enabled])
], [
        AC_MSG_NOTICE([Raspberry Pi support disabled])
])
AM_CONDITIONAL([ENABLE_RPI], [test "x$with_native_gfx" = "xrpi"])

AS_IF([test "x$with_native_gfx" = "xwl"], [
    native_gfx=wl
    PKG_CHECK_MODULES([wayland_client], [wayland-client >= 1], [
        have_wayland_client=yes
    ])
    PKG_CHECK_MODULES([wayland_egl], [wayland-egl >= 1], [
        have_wayland_egl=yes
    ])
    AC_DEFINE([ENABLE_WL], [1], [Enable Wayland EGL])
    AC_MSG_NOTICE([Wayland EGL support enabled])
], [
    AC_MSG_NOTICE([Wayland EGL support disabled])
])
AM_CONDITIONAL([ENABLE_WL], [test "x$with_native_gfx" = "xwl"])

AC_ARG_ENABLE([ivi],
    AS_HELP_STRING([--enable-ivi], [enable IVI support for Wayland]),
    [], [enable_ivi=no])
AS_IF([test "x$enable_ivi" = "xyes"], [
    AC_DEFINE(ENABLE_WL_IVI, [1], [Enable Wayland IVI.])
])
AM_CONDITIONAL([ENABLE_WL_IVI], [test "x$enable_ivi" = "xyes"])

AC_ARG_ENABLE([wlxdg],
    AS_HELP_STRING([--enable-wlxdg], [enable Wayland XDG shell protocol]),
    [], [enable_wlxdg=yes])
AS_IF([test "x$enable_wlxdg" = "xyes"], [
    AC_DEFINE(ENABLE_WL_XDG, [1], [Enable Wayland XDG shell.])
])
AM_CONDITIONAL([ENABLE_WL_XDG], [test "x$enable_wlxdg" = "xyes"])

# Wayland xdg-shell protocol became stable in wayland-protocols v1.12
AS_IF([test "x$with_native_gfx" = "xwl" -a "x$enable_wlxdg" = "xyes"], [
    PKG_CHECK_MODULES([wayland_protocols], [wayland-protocols >= 1.12],
                      [ac_wayland_protocols_pkgdatadir=`$PKG_CONFIG --variable=pkgdatadir wayland-protocols`])
    AC_SUBST(WAYLAND_PROTOCOLS_DATADIR, $ac_wayland_protocols_pkgdatadir)

    AC_PATH_PROG([wayland_scanner], [wayland-scanner])
    if test "x$wayland_scanner" = "x"; then
        PKG_CHECK_MODULES([wayland_scanner], [wayland-scanner])
        wayland_scanner=`$PKG_CONFIG --variable=wayland_scanner wayland-scanner`
    fi
])

AS_IF([test "x$with_native_gfx" = "xkms"], [
    native_gfx=kms
    AC_DEFINE([ENABLE_KMS], [1], [Enable KMS/GBM/DRM])
    AC_MSG_NOTICE([KMS/GBM/DRM support enabled])
    PKG_CHECK_MODULES([drm], [libdrm])
    PKG_CHECK_MODULES([gbm], [gbm])
], [
    AC_MSG_NOTICE([KMS/GBM/DRM support disabled])
])
AM_CONDITIONAL([ENABLE_KMS], [test "x$with_native_gfx" = "xkms"])

AS_IF([test "x$with_native_gfx" = "xsdl2"], [
    native_gfx=sdl2
    PKG_CHECK_MODULES([sdl2], [sdl2 >= 2], [
        have_sdl2=yes
    ])
    AC_DEFINE([ENABLE_SDL2], [1], [Enable SDL2])
    AC_MSG_NOTICE([SDL2 EGL support enabled])
], [
    AC_MSG_NOTICE([SDL2 EGL support disabled])
])
AM_CONDITIONAL([ENABLE_SDL2], [test "x$with_native_gfx" = "xsdl2"])

AS_IF([test "x$with_native_gfx" = "xwgl"], [
    native_gfx=wgl
    AC_DEFINE([ENABLE_WGL], [1], [Enable Native Windows WGL])
    AC_MSG_NOTICE([Windows WGL support enabled])
], [
    AC_MSG_NOTICE([Windows WGL support disabled])
])
AM_CONDITIONAL([ENABLE_WGL], [test "x$with_native_gfx" = "xwgl"])

AS_IF([test "x$with_native_gfx" = "xtisgx"], [
    native_gfx=tisgx
    AC_DEFINE([ENABLE_TISGX], [1], [Enable Native TI SGX])
    AC_MSG_NOTICE([TI SGX support enabled])
], [
    AC_MSG_NOTICE([TI SGX support disabled])
])
AM_CONDITIONAL([ENABLE_TISGX], [test "x$with_native_gfx" = "xtisgx"])

AS_IF([test "x$with_native_gfx" = "xmali"], [
    native_gfx=mali
    AC_DEFINE([ENABLE_MALI], [1], [Enable Native Mali])
    AC_MSG_NOTICE([Arm Mali support enabled])
], [
    AC_MSG_NOTICE([Arm Mali support disabled])
])
AM_CONDITIONAL([ENABLE_MALI], [test "x$with_native_gfx" = "xmali"])

AS_IF([test "x$with_native_gfx" = "xem"], [
    native_gfx=em
    AC_DEFINE([ENABLE_EM], [1], [Enable Native Emscripten/Wasm])
    AC_MSG_NOTICE([Emscripten/Wasm support enabled])
], [
    AC_MSG_NOTICE([Emscripten/Wasm support disabled])
])
AM_CONDITIONAL([ENABLE_EM], [test "x$with_native_gfx" = "xem"])

AS_IF([test "x$native_gfx" = "x"], [
    AC_MSG_ERROR([unknown native gfx selected: $with_native_gfx])
], [])

AC_OUTPUT

AC_MSG_RESULT([
---------------------
Configuration summary
---------------------
                debug : ${enable_debug}
           strict EGL : ${enable_strict_egl}
         strict GLES2 : ${enable_strict_gles}
           native-gfx : ${with_native_gfx}
       libpng support : ${have_libpng}
          shader list : ${with_shader_list}
              testing : ${enable_testing}
    install testsuite : ${enable_install_testsuite}
      install scripts : ${enable_install_scripts}
    shader validation : ${enable_shader_validation}
])
