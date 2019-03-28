/*
 * Mali Framebuffer Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See native window example:
 * https://github.com/linux-sunxi/sunxi-mali/blob/master/test/test.c#L42
 *
 * struct mali_native_window is defined at:
 * https://github.com/linux-sunxi/sunxi-mali/blob/master/include/EGL/eglplatform_fb.h#L88
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

static const int default_mali_window_width = 640;
static const int default_mali_window_height = 480;

#ifdef OLD_MALI
typedef struct mali_native_window mali_native_window_t;
#else
typedef struct fbdev_window mali_native_window_t;
#endif

struct native_gfx_s
{
  NativeDisplayType disp;
  NativeWindowType win;
  int disp_width;
  int disp_height;
  mali_native_window_t window_data;
};

char *
native_gfx_get_name(void)
{
  return ("Mali FB");
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

  gfx->disp = EGL_DEFAULT_DISPLAY;

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

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  if (width == 0)
    width = default_mali_window_width;

  if (height == 0)
    height = default_mali_window_height;

  if (width > UINT16_MAX)
    width = UINT16_MAX;

  if (height > UINT16_MAX)
    height = UINT16_MAX;

  gfx->window_data.width = (unsigned short)width;
  gfx->window_data.height = (unsigned short)height;

  gfx->win = &gfx->window_data;

  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);
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
  return (gfx->window_data.width);
}

int
native_gfx_get_window_height(const native_gfx_t *gfx)
{
  return (gfx->window_data.height);
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
