glslsandbox_player_CFLAGS = \
	-W -Wall -Wextra -Wshadow -Wpointer-arith -Wmissing-prototypes -Wcast-align \
	${egl_CFLAGS} ${glesv2_CFLAGS}

glslsandbox_player_LDADD = ${egl_LIBS} ${glesv2_LIBS} -lm

GEN_SHADER_IDS = $(top_srcdir)/scripts/gen-shader-ids
DL_SHADER = $(top_srcdir)/scripts/dl-shader
FRAG2INC = $(top_srcdir)/scripts/frag2inc
INC2C = $(top_srcdir)/scripts/inc2c
SHADER_LIST_CHECK = $(top_srcdir)/scripts/chk-shader-list
SHADER_LIST = $(top_srcdir)/$(shader_list)
SHADER_IDS = $(shell $(GEN_SHADER_IDS) $(SHADER_LIST) )
SHADER_FILES = $(addsuffix .frag,$(SHADER_IDS))
SHADER_CFILES = $(addsuffix .inc,$(SHADER_IDS))

$(SHADER_LIST): shader-list-check

.PHONY: shader-list-check
shader-list-check:
	$(SHADER_LIST_CHECK) $(SHADER_LIST)

.SECONDARY: $(SHADER_FILES)

%.inc: %.frag $(srcdir)/glslsandbox-shaders.h
if ENABLE_SHADER_VALIDATION
	$(GLSLANGVALIDATOR) $<
endif
	$(FRAG2INC) $(SHADER_LIST) $< > $@.tmp
	mv -f $@.tmp $@

%.frag:
	$(DL_SHADER) $(@:.frag=) > $@.tmp
	mv -f $@.tmp $@

glslsandbox-shaders.c: $(SHADER_LIST) $(SHADER_CFILES)
	$(INC2C) $(SHADER_CFILES) > $(srcdir)/glslsandbox-shaders.c.tmp
	mv -f $(srcdir)/glslsandbox-shaders.c.tmp $(srcdir)/glslsandbox-shaders.c

bin_PROGRAMS = glslsandbox-player

BUILT_SOURCES = glslsandbox-shaders.c

nodist_glslsandbox_player_SOURCES = glslsandbox-shaders.c

glslsandbox_player_SOURCES = \
  glslsandbox-player.c glslsandbox-player.h \
  egl_helper.c egl_helper.h \
  gles_helper.c gles_helper.h \
  glslsandbox-shaders.h \
  native_gfx.h

if HAVE_LIBPNG
glslsandbox_player_SOURCES += pngio.c pngio.h
glslsandbox_player_CFLAGS += ${libpng_CFLAGS}
glslsandbox_player_LDADD += ${libpng_LIBS}
endif

if ENABLE_X11
glslsandbox_player_SOURCES += native_gfx_x11.c
glslsandbox_player_CFLAGS += ${x11_CFLAGS}
glslsandbox_player_LDADD += ${x11_LIBS}
endif

if ENABLE_VIVFB
glslsandbox_player_SOURCES += native_gfx_vivfb.c
endif

if ENABLE_RPI
glslsandbox_player_SOURCES += native_gfx_rpi.c
endif

if ENABLE_WL
.SECONDEXPANSION:
define protostability
$(if $(findstring unstable,$1),unstable,stable)
endef
define protoname
$(shell echo $1 | $(SED) 's/\([a-z\-]\+\)-[a-z]\+-v[0-9]\+/\1/')
endef

%-client-protocol.h : $(WAYLAND_PROTOCOLS_DATADIR)/$$(call protostability,$$*)/$$(call protoname,$$*)/$$*.xml
	$(wayland_scanner) client-header < $< > $@
%-protocol.c : $(WAYLAND_PROTOCOLS_DATADIR)/$$(call protostability,$$*)/$$(call protoname,$$*)/$$*.xml
	$(wayland_scanner) private-code < $< > $@

glslsandbox_player_SOURCES += native_gfx_wl.c
glslsandbox_player_CFLAGS += ${wayland_client_CFLAGS} ${wayland_egl_CFLAGS}
glslsandbox_player_LDADD += ${wayland_client_LIBS} ${wayland_egl_LIBS}
if ENABLE_WL_XDG
BUILT_SOURCES += xdg-shell-protocol.c xdg-shell-client-protocol.h
nodist_glslsandbox_player_SOURCES += xdg-shell-protocol.c xdg-shell-client-protocol.h
endif
if ENABLE_WL_IVI
glslsandbox_player_SOURCES += ivi-application-protocol.c
endif
endif

if ENABLE_KMS
glslsandbox_player_SOURCES += native_gfx_kms.c
glslsandbox_player_CFLAGS += ${drm_CFLAGS} ${gbm_CFLAGS}
glslsandbox_player_LDADD += ${drm_LIBS} ${gbm_LIBS}
endif

if ENABLE_WGL
glslsandbox_player_SOURCES += native_gfx_wgl.c
endif

if ENABLE_NULLWS
glslsandbox_player_SOURCES += native_gfx_nullws.c
endif

if ENABLE_MALI
glslsandbox_player_SOURCES += native_gfx_mali.c
endif

if ENABLE_EM
glslsandbox_player_SOURCES += native_gfx_em.c
endif

if ENABLE_OSX
glslsandbox_player_SOURCES += native_gfx_osx.m
glslsandbox_player_OBJCFLAGS = ${egl_CFLAGS} ${glesv2_CFLAGS}
glslsandbox_player_LDFLAGS = -framework Cocoa
# Automake has a specific way to chose the linker. See:
# http://www.gnu.org/software/automake/manual/html_node/How-the-Linker-is-Chosen.html
# It seems that in case an Objective-C file is conditionally included,
# the Objective-C linker is still selected, even when this file is not
# included in the compiled sources. Also, the AC_PROG_OBJC autoconf
# macro cannot be used conditionally. This introduces issues when
# cross-compiling, for example: the toolchain may not include the
# Objective-C compiler. Autoconf may default to the host "gcc",
# introducing link failures. The workaround here is to explicitly
# change the linker command depending on the condition.
glslsandbox_player_LINK = $(OBJCLD) $(glslsandbox_player_OBJCFLAGS) \
        $(OBJCFLAGS) $(glslsandbox_player_LDFLAGS) $(LDFLAGS) -o $@
else
glslsandbox_player_LINK = $(CCLD) $(glslsandbox_player_CFLAGS) \
        $(CFLAGS) $(AM_LDFLAGS) $(LDFLAGS) -o $@
endif

if ENABLE_SDL2
glslsandbox_player_CFLAGS += ${sdl2_CFLAGS}
glslsandbox_player_LDADD += ${sdl2_LIBS}
endif
