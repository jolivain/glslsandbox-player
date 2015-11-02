AC_PREREQ([2.68])
AC_INIT([glslsandbox-player], [1.0], [juju@cotds.org])
AM_INIT_AUTOMAKE([-Wall -Wno-portability subdir-objects foreign])

AC_PROG_AWK
AM_PROG_AR
AC_PROG_CC
AC_PROG_INSTALL
AC_PROG_RANLIB
AC_PROG_MKDIR_P

AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([
  Makefile
  src/Makefile
])

AC_CHECK_HEADERS([stddef.h stdlib.h string.h])
AC_TYPE_SIZE_T
AC_FUNC_MALLOC
AC_CHECK_FUNCS([clock_gettime memset strerror strtol uname])

AC_ARG_ENABLE([debug],
        AS_HELP_STRING([--enable-debug], [enable debug messages @<:@default=disabled@:>@]),
        [], [enable_debug=no])
AS_IF([test "x$enable_debug" = "xyes"], [
        AC_DEFINE(ENABLE_DEBUG, [1], [Debug messages.])
])

PKG_CHECK_MODULES([egl], [egl >= 1])
PKG_CHECK_MODULES([glesv2], [glesv2 >= 1])

AC_ARG_WITH([native-gfx],
        AS_HELP_STRING([--with-native-gfx=GFX], [Define the native gfx backend: x11(default),vivfb]),
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

AS_IF([test "x$native_gfx" = "x"], [
    AC_ERROR([unknown native gfx selected: $with_native_gfx])
], [])

AC_OUTPUT

AC_MSG_RESULT([
    debug: ${enable_debug}
    native-gfx:   ${with_native_gfx}
])
