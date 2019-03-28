/*
 * Native Windowing abstraction function definitions
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

#ifndef NATIVE_GFX_H
#define NATIVE_GFX_H

#include <EGL/egl.h>

#define GFX_UNUSED(x)  ((void)(x))

/* We just declare here the typedef
 * the struct itself will be declared
 * in the specific native gfx implementation. */
typedef struct native_gfx_s native_gfx_t;

/*
 * Return the name of the native backend as a string.
 */
char *
native_gfx_get_name(void);

/*
 * Open a connection to the native display, allocate a native_gfx_t
 * object, initialize its members, and return it.
 */
native_gfx_t *
native_gfx_open_display(void);

/*
 * Create a native window, using native_gfx_t gfx object returned by
 * native_gfx_open_display(). Parameters "width" and "height" are the
 * requested window size. If they are set to zero, the function should
 * create a window covering the full display surface.
 */
void
native_gfx_create_window(native_gfx_t *gfx,
                         int width, int height, int xpos, int ypos);

/*
 * Destroy a native window created with native_gfx_create_window().
 */
void
native_gfx_destroy_window(native_gfx_t *gfx);

/*
 * Close the connectin to the display. The function should reclaim all
 * resources allocated in native_gfx_open_display().
 */
void
native_gfx_close_display(native_gfx_t *gfx);

/*
 * Returns a valid EGL NativeDisplayType object.
 */
NativeDisplayType
native_gfx_get_egl_native_display(const native_gfx_t *gfx);

/*
 * Returns a valid EGL NativeWindowType object.
 */
NativeWindowType
native_gfx_get_egl_native_window(const native_gfx_t *gfx);

/*
 * Function called after EGL swap buffer.
 * Some backends (for example kms) needs some native help to swap
 * buffers.
 */
void
native_gfx_swap_buffers(native_gfx_t *gfx);

/*
 * Returns the actual window width.
 */
int
native_gfx_get_window_width(const native_gfx_t *gfx);

/*
 * Returns the actual window height.
 */
int
native_gfx_get_window_height(const native_gfx_t *gfx);

#endif /* NATIVE_GFX_H */

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
