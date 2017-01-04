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
 * https://cgit.freedesktop.org/wayland/weston/tree/clients/simple-egl.c
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <assert.h>

#include <EGL/egl.h>

#include <wayland-client.h>
#include <wayland-egl.h>

#ifdef ENABLE_IVI
# include <sys/types.h>
# include <unistd.h>
# include "ivi-application-client-protocol.h"
# define IVI_SURFACE_ID 10000
#endif /* ENABLE_IVI */

#include "native_gfx.h"

#define GFX_WL_UNUSED(x)  ((void)(x))

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
  /* struct wl_region *region; */
  struct wl_shell *shell;
  struct wl_shell_surface *shell_surface;
#ifdef ENABLE_IVI
  struct ivi_application *ivi_app;
  struct ivi_surface *ivi_surface;
#endif
};

static void
global_registry_handler(void *data, struct wl_registry *registry, uint32_t id,
                        const char *interface, uint32_t version)
{
  native_gfx_t *ctx;

  GFX_WL_UNUSED(version);

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
#ifdef ENABLE_IVI
  else if (strcmp(interface, "ivi_application") == 0) {
    ctx->ivi_app = wl_registry_bind(registry, id,
                                    &ivi_application_interface, 1);
  }
#endif /* ENABLE_IVI */
}

static void
global_registry_remover(void *data, struct wl_registry *registry, uint32_t id)
{
  GFX_WL_UNUSED(data);
  GFX_WL_UNUSED(registry);
  GFX_WL_UNUSED(id);
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
#ifdef ENABLE_IVI
      && (gfx->ivi_app == NULL)
#endif /* ENABLE_IVI */
     ) {
    fprintf(stderr,
            "ERROR: Can't find wl_shell"
#ifdef ENABLE_IVI
            " or ivi_application shell"
#endif /* ENABLE_IVI */
            "\n");
    exit(EXIT_FAILURE);
  }
}

char *
native_gfx_get_name(void)
{
  return ("Wayland EGL");
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

#ifdef ENABLE_IVI
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
#endif /* ENABLE_IVI */

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  GFX_WL_UNUSED(xpos);
  GFX_WL_UNUSED(ypos);

  gfx->surface = wl_compositor_create_surface(gfx->compositor);
  if (gfx->surface == NULL) {
    fprintf(stderr, "ERROR: wl_compositor_create_surface(): Can't create surface\n");
    exit(EXIT_FAILURE);
  }

  if (gfx->shell != NULL) {
    gfx->shell_surface = wl_shell_get_shell_surface(gfx->shell, gfx->surface);
    wl_shell_surface_set_toplevel(gfx->shell_surface);
    wl_shell_surface_set_title(gfx->shell_surface, "glslsandbox-player");
  }
#if ENABLE_IVI
  else if (gfx->ivi_app != NULL) {
    create_ivi_surface(gfx);
  }
#endif /* ENABLE_IVI */

  if (width == 0)
    width = default_wayland_window_width;

  if (height == 0)
    height = default_wayland_window_height;

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

#ifdef ENABLE_IVI
  if (gfx->ivi_surface != NULL) {
    ivi_surface_destroy(gfx->ivi_surface);
    gfx->ivi_surface = NULL;
  }
#endif

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
  GFX_WL_UNUSED(gfx);
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

/*
* Copyright (c) 2015-2016, Julien Olivain <juju@cotds.org>
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
