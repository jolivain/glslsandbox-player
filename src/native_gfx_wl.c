/*
 * Wayland EGL Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See:
 * https://wayland.freedesktop.org/docs/html/
 * https://jan.newmarch.name/Wayland/EGL/
 * https://gitlab.freedesktop.org/wayland/weston/-/blob/main/clients/simple-egl.c
 *
 * See also:
 * https://wayland-book.com/
 * https://wayland.app/protocols/
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

/* In case -Wextra is passed to GCC, it will also enable
 * -Wmissing-field-initializers. Wayland headers may declare
 * structures with more members than the one initialized in this code,
 * if protocol has greater version. We disable this specific warning
 * for this file. Same comment for "-Wunused-parameter", as many
 * callbacks needs to be declared empty, with many unused
 * parameters. Pragma is protected for gcc >= 4.2 since it's the first
 * version supporting this diagnostic pragma. */
#if (__GNUC__) > 4 || (__GNUC__ == 4 && (__GNUC_MINOR__ >= 2))
# pragma GCC diagnostic ignored "-Wunused-parameter"
# pragma GCC diagnostic ignored "-Wmissing-field-initializers"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>

#include <EGL/egl.h>

/* For KEY codes */
#include <linux/input.h>

#include <wayland-client.h>
#include <wayland-egl.h>

#ifdef ENABLE_WL_XDG
#include "xdg-shell-client-protocol.h"
#endif /* ENABLE_WL_XDG */

#ifdef ENABLE_WL_IVI
# include <sys/types.h>
# include <unistd.h>
# include "ivi-application-client-protocol.h"
# define IVI_SURFACE_ID 10000
#endif /* ENABLE_WL_IVI */

#include "native_gfx.h"

static const int default_wayland_window_width = 256;
static const int default_wayland_window_height = 256;

struct native_gfx_s
{
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;
  struct wl_display *display;
  struct wl_registry *registry;
  struct wl_compositor *compositor;
  struct wl_surface *surface;
  struct wl_egl_window *egl_window;
  struct wl_seat *seat;
  struct wl_keyboard *keyboard;
  /* struct wl_region *region; */
  struct wl_shell *shell;
  struct wl_shell_surface *shell_surface;
  int terminate;
#ifdef ENABLE_WL_XDG
  struct xdg_wm_base *xdg_wm_base;
  struct xdg_surface *xdg_surface;
  struct xdg_toplevel *xdg_toplevel;
  int wait_for_configure;
  int fullscreen;
#endif /* ENABLE_WL_XDG */
#ifdef ENABLE_WL_IVI
  struct ivi_application *ivi_app;
  struct ivi_surface *ivi_surface;
#endif /* ENABLE_WL_IVI */
};

#ifdef ENABLE_WL_XDG
static void
xdg_wm_base_ping(void *data, struct xdg_wm_base *shell, uint32_t serial)
{
  GFX_UNUSED(data);
  xdg_wm_base_pong(shell, serial);
}

static const struct xdg_wm_base_listener wm_base_listener = {
  xdg_wm_base_ping,
};
#endif /* ENABLE_WL_XDG */

static void
keyboard_handle_keymap(void *data, struct wl_keyboard *keyboard,
                       uint32_t format, int fd, uint32_t size)
{
  /* Don’t leak the keymap fd */
  close(fd);
}

static void
keyboard_handle_enter(void *data, struct wl_keyboard *keyboard,
                      uint32_t serial, struct wl_surface *surface,
                      struct wl_array *keys)
{
}

static void
keyboard_handle_leave(void *data, struct wl_keyboard *keyboard,
                      uint32_t serial, struct wl_surface *surface)
{
}

static void
keyboard_handle_modifiers(void *data, struct wl_keyboard *keyboard,
                          uint32_t serial, uint32_t mods_depressed,
                          uint32_t mods_latched, uint32_t mods_locked,
                          uint32_t group)
{
}

static void
keyboard_handle_key(void *data, struct wl_keyboard *keyboard,
                    uint32_t serial, uint32_t time, uint32_t key,
                    uint32_t state)
{
  native_gfx_t *gfx = (native_gfx_t *)data;

  if ((state == WL_KEYBOARD_KEY_STATE_PRESSED) &&
      ((key == KEY_ESC) || (key == KEY_Q))) {
    gfx->terminate = 1;
  }
}

static const struct wl_keyboard_listener keyboard_listener = {
  keyboard_handle_keymap,
  keyboard_handle_enter,
  keyboard_handle_leave,
  keyboard_handle_key,
  keyboard_handle_modifiers,
};

static void
seat_handle_capabilities(void *data, struct wl_seat *seat,
                         enum wl_seat_capability caps)
{
  native_gfx_t *gfx = (native_gfx_t *)data;

  if ((caps & WL_SEAT_CAPABILITY_KEYBOARD) && !gfx->keyboard) {
    gfx->keyboard = wl_seat_get_keyboard(seat);
    wl_keyboard_add_listener(gfx->keyboard, &keyboard_listener, gfx);
  }
  else if (!(caps & WL_SEAT_CAPABILITY_KEYBOARD) && gfx->keyboard) {
    wl_keyboard_destroy(gfx->keyboard);
    gfx->keyboard = NULL;
  }
}

static const struct wl_seat_listener seat_listener = {
  seat_handle_capabilities,
};

static void
global_registry_handler(void *data, struct wl_registry *registry, uint32_t id,
                        const char *interface, uint32_t version)
{
  native_gfx_t *ctx;

  GFX_UNUSED(version);

  ctx = (native_gfx_t *)data;

  if (strcmp(interface, "wl_compositor") == 0) {
    ctx->compositor = wl_registry_bind(registry,
                                       id,
                                       &wl_compositor_interface,
                                       1);
  } else if (strcmp(interface, "wl_shell") == 0) {
    ctx->shell = wl_registry_bind(registry, id,
                                  &wl_shell_interface, 1);
  }
  else if (strcmp(interface, "wl_seat") == 0) {
    ctx->seat = wl_registry_bind(registry, id,
                                 &wl_seat_interface, 1);
    wl_seat_add_listener(ctx->seat, &seat_listener, ctx);
  }
#ifdef ENABLE_WL_XDG
  else if (strcmp(interface, "xdg_wm_base") == 0) {
    ctx->xdg_wm_base = wl_registry_bind(registry, id,
                                        &xdg_wm_base_interface, 1);
    xdg_wm_base_add_listener(ctx->xdg_wm_base, &wm_base_listener, ctx);
  }
#endif /* ENABLE_WL_XDG */
#ifdef ENABLE_WL_IVI
  else if (strcmp(interface, "ivi_application") == 0) {
    ctx->ivi_app = wl_registry_bind(registry, id,
                                    &ivi_application_interface, 1);
  }
#endif /* ENABLE_WL_IVI */
}

static void
global_registry_remover(void *data, struct wl_registry *registry, uint32_t id)
{
  GFX_UNUSED(data);
  GFX_UNUSED(registry);
  GFX_UNUSED(id);
}

static const struct wl_registry_listener registry_listener = {
  global_registry_handler,
  global_registry_remover
};

static void
get_server_references(native_gfx_t *gfx)
{
  gfx->display = wl_display_connect(NULL);
  if (gfx->display == NULL) {
    fprintf(stderr, "ERROR: wl_display_connect(): Can't connect to Wayland display\n");
    exit(EXIT_FAILURE);
  }

  gfx->registry = wl_display_get_registry(gfx->display);
  wl_registry_add_listener(gfx->registry, &registry_listener, gfx);

  wl_display_dispatch(gfx->display);
  wl_display_roundtrip(gfx->display);

  if (gfx->compositor == NULL) {
    fprintf(stderr, "ERROR: Can't find wl_compositor\n");
    exit(EXIT_FAILURE);
  }

  if ((gfx->shell == NULL)
#ifdef ENABLE_WL_XDG
      && (gfx->xdg_wm_base == NULL)
#endif /* ENABLE_WL_XDG */
#ifdef ENABLE_WL_IVI
      && (gfx->ivi_app == NULL)
#endif /* ENABLE_WL_IVI */
     ) {
    fprintf(stderr,
            "ERROR: Can't find wl_shell"
#ifdef ENABLE_WL_XDG
            " or xdg_wm_base"
#endif /* ENABLE_WL_XDG */
#ifdef ENABLE_WL_IVI
            " or ivi_application shell"
#endif /* ENABLE_WL_IVI */
            "\n");
    exit(EXIT_FAILURE);
  }
}

char *
native_gfx_get_name(void)
{
  return (
          "Wayland EGL"
#ifdef ENABLE_WL_IVI
          ", w/ ivi support"
#endif /* ENABLE_WL_IVI */
#ifdef ENABLE_WL_XDG
          ", w/ xdg-shell support"
#endif /* ENABLE_WL_XDG */
          );
}

native_gfx_t *
native_gfx_open_display(void)
{
  native_gfx_t *gfx;

  gfx = malloc(sizeof (*gfx));
  if (gfx == NULL) {
    fprintf(stderr,
            "native_gfx_open_display(): Can't allocate memory: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(gfx, 0, sizeof (*gfx));

  get_server_references(gfx);

  return (gfx);
}

NativeDisplayType
native_gfx_get_egl_native_display(const native_gfx_t *gfx)
{
  return ((NativeDisplayType)gfx->display);
}

NativeWindowType
native_gfx_get_egl_native_window(const native_gfx_t *gfx)
{
  return ((NativeWindowType)gfx->egl_window);
}

#ifdef ENABLE_WL_IVI
static void
create_ivi_surface(native_gfx_t *gfx)
{
  uint32_t id_ivisurf = IVI_SURFACE_ID + (uint32_t)getpid();
  gfx->ivi_surface =
    ivi_application_surface_create(gfx->ivi_app,
                                   id_ivisurf, gfx->surface);

  if (gfx->ivi_surface == NULL) {
    fprintf(stderr, "ERROR: Failed to create ivi_client_surface\n");
    exit(EXIT_FAILURE);
  }
}
#endif /* ENABLE_WL_IVI */

#ifdef ENABLE_WL_XDG
static void
handle_surface_configure(void *data, struct xdg_surface *surface,
                         uint32_t serial)
{
  native_gfx_t *gfx = (native_gfx_t *)data;

  xdg_surface_ack_configure(surface, serial);

  gfx->wait_for_configure = 0;
}

static const struct xdg_surface_listener xdg_surface_listener = {
  handle_surface_configure
};

static void
handle_toplevel_configure(void *data, struct xdg_toplevel *toplevel,
                          int32_t width, int32_t height,
                          struct wl_array *states)
{
  native_gfx_t *gfx = (native_gfx_t *)data;

  if (width > 0 && height > 0) {
    gfx->disp_width = width;
    gfx->disp_height = height;
  }
}

static void
handle_toplevel_close(void *data, struct xdg_toplevel *xdg_toplevel)
{
}

static const struct xdg_toplevel_listener xdg_toplevel_listener = {
  handle_toplevel_configure,
  handle_toplevel_close,
};

static void
wl_setup_window_fullscreen(native_gfx_t *gfx)
{
  const char *fullscreen;

  fullscreen = getenv("GSP_WL_FULLSCREEN");
  if (fullscreen != NULL) {
    if (strcmp(fullscreen, "1") == 0) {
      gfx->fullscreen = 1;
    }
    else {
      fprintf(stderr,
              "WARNING: Invalid value of GSP_WL_FULLSCREEN variable.\n"
              "WARNING: Ignoring. Valid value is \"1\".\n");
    }
  }
}
#endif /* ENABLE_WL_XDG */

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);

  gfx->surface = wl_compositor_create_surface(gfx->compositor);
  if (gfx->surface == NULL) {
    fprintf(stderr, "ERROR: wl_compositor_create_surface(): Can't create surface\n");
    exit(EXIT_FAILURE);
  }

#ifdef ENABLE_WL_XDG
  if (gfx->xdg_wm_base != NULL) {
    wl_setup_window_fullscreen(gfx);
    gfx->xdg_surface = xdg_wm_base_get_xdg_surface(gfx->xdg_wm_base,
                                                   gfx->surface);
    xdg_surface_add_listener(gfx->xdg_surface,
                             &xdg_surface_listener, gfx);

    gfx->xdg_toplevel = xdg_surface_get_toplevel(gfx->xdg_surface);
    xdg_toplevel_add_listener(gfx->xdg_toplevel,
                              &xdg_toplevel_listener, gfx);
    xdg_toplevel_set_title(gfx->xdg_toplevel, "glslsandbox-player");
    if (gfx->fullscreen)
      xdg_toplevel_set_fullscreen(gfx->xdg_toplevel, NULL);
    gfx->wait_for_configure = 1;
    wl_surface_commit(gfx->surface);
    wl_display_roundtrip(gfx->display);
  } else
#endif /* ENABLE_WL_XDG */
  if (gfx->shell != NULL) {
    gfx->shell_surface = wl_shell_get_shell_surface(gfx->shell, gfx->surface);
    wl_shell_surface_set_toplevel(gfx->shell_surface);
    wl_shell_surface_set_title(gfx->shell_surface, "glslsandbox-player");
  }
#if ENABLE_WL_IVI
  else if (gfx->ivi_app != NULL) {
    create_ivi_surface(gfx);
  }
#endif /* ENABLE_WL_IVI */

  if (width == 0)
    width = default_wayland_window_width;

  if (height == 0)
    height = default_wayland_window_height;

#ifdef ENABLE_WL_XDG
  if (gfx->fullscreen) {
    width = gfx->disp_width;
    height = gfx->disp_height;
  }
#endif /* ENABLE_WL_XDG */

  gfx->egl_window = wl_egl_window_create(gfx->surface, width, height);
  if (gfx->egl_window == EGL_NO_SURFACE) {
    fprintf(stderr, "ERROR: native_gfx_create_window(): wl_egl_window_create(): Can't create window\n");
    exit(EXIT_FAILURE);
  }

  gfx->win_width = width;
  gfx->win_height = height;
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  wl_egl_window_destroy(gfx->egl_window);
  gfx->egl_window = NULL;

  if (gfx->shell_surface != NULL) {
    wl_shell_surface_destroy(gfx->shell_surface);
    gfx->shell_surface = NULL;
  }

#ifdef ENABLE_WL_IVI
  if (gfx->ivi_surface != NULL) {
    ivi_surface_destroy(gfx->ivi_surface);
    gfx->ivi_surface = NULL;
  }
#endif /* ENABLE_WL_IVI */

  wl_surface_destroy(gfx->surface);
  gfx->surface = NULL;
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
  wl_registry_destroy(gfx->registry);
  gfx->registry = NULL;

  wl_display_flush(gfx->display);
  wl_display_disconnect(gfx->display);
  gfx->display = NULL;

  free(gfx);
}

void
native_gfx_swap_buffers(native_gfx_t *gfx)
{
  int ret;

  ret = wl_display_dispatch_pending(gfx->display);

  if (ret < 0) {
    fprintf(stderr,
            "ERROR: wl_display_dispatch_pending() returned %i\n", ret);
    exit(EXIT_FAILURE);
  }
}

int
native_gfx_get_window_width(const native_gfx_t *gfx)
{
  return (gfx->win_width);
}

int
native_gfx_get_window_height(const native_gfx_t *gfx)
{
  return (gfx->win_height);
}

int
native_gfx_request_exit(const native_gfx_t *gfx)
{
  return (gfx->terminate);
}

/*
* Copyright (c) 2015-2023, Julien Olivain <ju.o@free.fr>
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* * Redistributions of source code must retain the above copyright notice, this
*   list of conditions and the following disclaimer.
*
* * Redistributions in binary form must reproduce the above copyright notice,
*   this list of conditions and the following disclaimer in the documentation
*   and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* End-of-File */
