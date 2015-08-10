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

AC_ARG_WITH([x11],
        AS_HELP_STRING([--with-x11], [Compile with X11 support @<:@default=enabled@:>@]),
        [], [with_x11=yes])

AS_IF([test "x$with_x11" != "xno"], [
        PKG_CHECK_MODULES([x11], [x11 >= 1.4])
        AC_DEFINE([ENABLE_X11], [1], [Enable X11.])
], [
        AC_MSG_NOTICE([X11 support disabled])
])
AM_CONDITIONAL([ENABLE_X11], [test x$with_x11 = xyes])

AC_ARG_WITH([vivfb],
        AS_HELP_STRING([--with-vivfb], [Compile with (i.MX6 / Vivante) fb support @<:@default=disabled@:>@]),
        [], [with_vivfb=no])

AS_IF([test "x$with_vivfb" != "xno"], [
        AC_DEFINE([ENABLE_VIVFB], [1], [Enable (i.MX6 / Vivante) fb.])
        AC_DEFINE([EGL_API_FB], [1], [Enable Vivante EGL FB])
        AC_DEFINE([LINUX], [1], [Vivante EGL FB needs LINUX to be defined])
], [
        AC_MSG_NOTICE([Fb support disabled])
])
AM_CONDITIONAL([ENABLE_VIVFB], [test x$with_vivfb = xyes])

AC_OUTPUT

AC_MSG_RESULT([
    debug: ${enable_debug}
    x11:   ${with_x11}
    vivfb: ${with_vivfb}
])
