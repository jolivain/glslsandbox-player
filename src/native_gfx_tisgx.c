/*
 * Texas Instruments PowerVR SGX Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See PowerVR SDK example:
 * https://github.com/powervr-graphics/Native_SDK/blob/5.1/examples/OpenGLES/01_HelloAPI/OpenGLESHelloAPI_NullWS.cpp
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <EGL/egl.h>

#include "native_gfx.h"

struct native_gfx_s
{
  NativeDisplayType disp;
  NativeWindowType win;
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;
};

char *
native_gfx_get_name(void)
{
  return ("TI SGX");
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

  /* From the PowerVR SDK example, for Null Window system, only the
   * default display (NULL) is passed to eglGetDisplay() as native
   * display. See:
   * https://github.com/powervr-graphics/Native_SDK/blob/5.1/examples/OpenGLES/01_HelloAPI/OpenGLESHelloAPI_NullWS.cpp#L78
   */

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
  /* From the PowerVR SDK example, for Null Window system, NULL is
   * passed to eglCreateWindowSurface() as native window. See:
   * https://github.com/powervr-graphics/Native_SDK/blob/5.1/examples/OpenGLES/01_HelloAPI/OpenGLESHelloAPI_NullWS.cpp#L170
   */
  GFX_UNUSED(gfx);
  GFX_UNUSED(width);
  GFX_UNUSED(height);
  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  GFX_UNUSED(gfx);
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
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
