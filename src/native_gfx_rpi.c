/*
 * Raspberry Pi Framebuffer Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See:
 * https://github.com/raspberrypi/userland
 * https://jan.newmarch.name/LinuxSound/Diversions/RaspberryPiOpenGL/
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

#include "native_gfx.h"

#include "bcm_host.h"

struct native_gfx_s
{
  NativeDisplayType disp;
  NativeWindowType win;
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;

  DISPMANX_DISPLAY_HANDLE_T dispman_display;
  DISPMANX_UPDATE_HANDLE_T  dispman_update;
  DISPMANX_ELEMENT_HANDLE_T dispman_element;
  EGL_DISPMANX_WINDOW_T     dispman_window;
};

char *
native_gfx_get_name(void)
{
  return ("Raspberry Pi DispManX");
}

native_gfx_t *
native_gfx_open_display(void)
{
  int32_t ret;
  uint32_t disp_w, disp_h;
  native_gfx_t *gfx;

  bcm_host_init();

  gfx = malloc(sizeof (*gfx));
  if (gfx == NULL) {
    fprintf(stderr,
            "native_gfx_open_display(): Can't allocate memory: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(gfx, 0, sizeof (*gfx));

  gfx->disp = EGL_DEFAULT_DISPLAY;

  ret = graphics_get_display_size(0, &disp_w, &disp_h);
  if (ret < 0) {
    fprintf(stderr,
            "native_gfx_open_display(): Can't get display size.\n");
    exit(EXIT_FAILURE);
  }

  gfx->disp_width = (int)disp_w;
  gfx->disp_height = (int)disp_h;

  return (gfx);
}

NativeDisplayType
native_gfx_get_egl_native_display(const native_gfx_t *gfx)
{
  return (gfx->disp);
}

NativeWindowType
native_gfx_get_egl_native_window(const native_gfx_t *gfx)
{
  return (gfx->win);
}

static int32_t
get_dispman_layer(void)
{
  int32_t layer;
  char *layer_str;

  layer = 0;

  layer_str = getenv("GSP_RPI_LAYER");
  if (layer_str != NULL) {
    layer = atoi(layer_str);
    if (layer < 0 || layer >= 128) {
      fprintf(stderr, "Warning: GSP_RPI_LAYER must be "
              "non-negative and less than 128. Setting to 0.\n");
      layer = 0;
    }
  }

  return (layer);
}

static VC_DISPMANX_ALPHA_T *
get_dispman_layer_opacity(VC_DISPMANX_ALPHA_T *alpha)
{
  int32_t opacity;
  char *opacity_str;
  VC_DISPMANX_ALPHA_T *alpha_ptr;

  opacity = 255;
  alpha_ptr = NULL;

  opacity_str = getenv("GSP_RPI_LAYER_OPACITY");
  if (opacity_str != NULL) {
    opacity = atoi(opacity_str);
    if (opacity < 0 || opacity >= 256) {
      fprintf(stderr, "Warning: GSP_RPI_LAYER_OPACITY must be "
              "non-negative and less than 256. Setting to 255.\n");
      opacity = 255;
    }
    alpha->opacity = opacity;
    alpha_ptr = alpha;
  }

  return (alpha_ptr);
}

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  VC_RECT_T dst_rect;
  VC_RECT_T src_rect;
  int32_t layer;
  VC_DISPMANX_ALPHA_T *alpha_ptr;
  VC_DISPMANX_ALPHA_T alpha = {
    DISPMANX_FLAGS_ALPHA_FROM_SOURCE | DISPMANX_FLAGS_ALPHA_FIXED_ALL_PIXELS,
    255, /* opacity 0->255 */
    DISPMANX_NO_HANDLE /* mask */
  };

  if (width == 0)
    width = gfx->disp_width;

  if (height == 0)
    height = gfx->disp_height;

  layer = get_dispman_layer();
  alpha_ptr = get_dispman_layer_opacity(&alpha);

  dst_rect.x = xpos;
  dst_rect.y = ypos;
  dst_rect.width = width;
  dst_rect.height = height;

  src_rect.x = 0;
  src_rect.y = 0;
  src_rect.width = width << 16;
  src_rect.height = height << 16;

  gfx->dispman_display = vc_dispmanx_display_open(DISPMANX_ID_MAIN_LCD);
  gfx->dispman_update = vc_dispmanx_update_start(0 /*priority*/);
  gfx->dispman_element =
    vc_dispmanx_element_add(gfx->dispman_update, gfx->dispman_display,
                            layer, &dst_rect, DISPMANX_NO_HANDLE /*src*/,
                            &src_rect, DISPMANX_PROTECTION_NONE,
                            alpha_ptr, NULL /*clamp*/, DISPMANX_NO_ROTATE /*transform*/);

  gfx->dispman_window.element = gfx->dispman_element;
  gfx->dispman_window.width = width;
  gfx->dispman_window.height = height;

  vc_dispmanx_update_submit_sync(gfx->dispman_update);

  gfx->win = &(gfx->dispman_window);
  gfx->win_width = width;
  gfx->win_height = height;
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  gfx->win = NULL;
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
  gfx->disp = NULL;
  free(gfx);
}

void
native_gfx_swap_buffers(native_gfx_t *gfx)
{
  GFX_UNUSED(gfx);
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
* Copyright (c) 2015-2019, Julien Olivain <juju@cotds.org>
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
