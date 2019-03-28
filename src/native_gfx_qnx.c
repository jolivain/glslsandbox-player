/*
 * QNX(Screen) Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See QNX 7.0 Screen Documentation:
 * http://www.qnx.com/developers/docs/7.0.0/com.qnx.doc.screen/topic/manual/cscreen_about.html
 *
 * QNX binary can be built with commands:
 *    source ~/qnx700/qnxsdp-env.sh
 *    make -C build/qnx/
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <EGL/egl.h>
#include <screen/screen.h>

#include "native_gfx.h"

struct native_gfx_s
{
  screen_context_t scrn_ctx;
  screen_display_t disp;
  screen_window_t win;
  int scr;
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;
};

char *
native_gfx_get_name(void)
{
  return ("QNX(Screen)");
}

native_gfx_t *
native_gfx_open_display(void)
{
  native_gfx_t *gfx;
  screen_display_t *scrn_disps;
  int disps_count;
  int disp_size[2];
  int ret;

  gfx = malloc(sizeof (*gfx));
  if (gfx == NULL) {
    fprintf(stderr,
            "native_gfx_open_display(): Can't allocate memory: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(gfx, 0, sizeof (*gfx));

  ret = screen_create_context(&(gfx->scrn_ctx), SCREEN_APPLICATION_CONTEXT);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_open_display(): screen_create_context(): "
            "Can't create context.\n");
    exit(EXIT_FAILURE);
  }

  ret = screen_get_context_property_iv(gfx->scrn_ctx,
                                       SCREEN_PROPERTY_DISPLAY_COUNT,
                                       &disps_count);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_open_display(): screen_get_context_property_iv(): "
            "Can't get SCREEN_PROPERTY_DISPLAY_COUNT.\n");
    exit(EXIT_FAILURE);
  }

  scrn_disps = calloc(disps_count, sizeof (*scrn_disps));
  if (scrn_disps == NULL) {
      fprintf(stderr,
              "native_gfx_open_display(): "
              "Can't allocate memory: error %i: %s\n",
              errno, strerror(errno));
      exit(EXIT_FAILURE);
  }

  ret = screen_get_context_property_pv(gfx->scrn_ctx,
                                       SCREEN_PROPERTY_DISPLAYS,
                                       (void **)scrn_disps);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_open_display(): screen_get_context_property_pv(): "
            "Can't get SCREEN_PROPERTY_DISPLAYS.\n");
    exit(EXIT_FAILURE);
  }

  gfx->disp = scrn_disps[0];

  free(scrn_disps);

  ret = screen_get_display_property_iv(gfx->disp,
                                       SCREEN_PROPERTY_SIZE, disp_size);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_open_display(): screen_get_display_property_iv(): "
            "Can't get SCREEN_PROPERTY_SIZE.\n");
    exit(EXIT_FAILURE);
  }

  gfx->disp_width = disp_size[0];
  gfx->disp_height = disp_size[1];
  gfx->scr = 0;
  gfx->disp = EGL_DEFAULT_DISPLAY;

  return (gfx);
}

NativeDisplayType
native_gfx_get_egl_native_display(const native_gfx_t *gfx)
{
  return (long)(gfx->disp);
}

NativeWindowType
native_gfx_get_egl_native_window(const native_gfx_t *gfx)
{
  return (gfx->win);
}

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  int size[2];
  int pos[2];
  int usage = SCREEN_USAGE_OPENGL_ES2;
  int ret;

  if (width == 0)
    width = gfx->disp_width;

  if (height == 0)
    height = gfx->disp_height;

  size[0] = width;
  size[1] = height;

  ret = screen_create_window(&(gfx->win), gfx->scrn_ctx);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_create_window(): screen_create_window(): "
            "Can't create window.\n");
    exit(EXIT_FAILURE);
  }

  ret = screen_set_window_property_iv(gfx->win, SCREEN_PROPERTY_SIZE, size);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_create_window(): screen_set_window_property_iv(): "
            "Can't set SCREEN_PROPERTY_SIZE.\n");
    exit(EXIT_FAILURE);
  }

  gfx->win_width = size[0];
  gfx->win_height = size[1];

  pos[0] = xpos;
  pos[1] = ypos;
  ret = screen_set_window_property_iv(gfx->win, SCREEN_PROPERTY_POSITION, pos);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_create_window(): screen_set_window_property_iv(): "
            "Can't set SCREEN_PROPERTY_POSITION.\n");
    exit(EXIT_FAILURE);
  }

  ret = screen_set_window_property_iv(gfx->win,
                                      SCREEN_PROPERTY_USAGE, &usage);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_create_window(): screen_set_window_property_iv(): "
            "Can't set SCREEN_PROPERTY_USAGE.\n");
    exit(EXIT_FAILURE);
  }

  ret = screen_create_window_buffers(gfx->win, 2);
  if (ret != 0) {
    fprintf(stderr,
            "native_gfx_create_window(): screen_create_window_buffers(): "
            "Can't create buffer.\n");
    exit(EXIT_FAILURE);
  }
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  screen_destroy_window_buffers(gfx->win);
  screen_destroy_window(gfx->win);
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
  screen_destroy_context(gfx->scrn_ctx);
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
