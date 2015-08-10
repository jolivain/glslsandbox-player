/*
 * EGL helper code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <EGL/egl.h>
#include <assert.h>

#include "native_gfx.h"
#include "egl_helper.h"

static const char *
streglerror(EGLint error)
{
  const char *str;

  str = "Unknown EGL error";

  switch (error) {

#define STR_EGL_ERROR_CASE(x) \
  case (x):                   \
  str = #x;                   \
  break

    STR_EGL_ERROR_CASE(EGL_SUCCESS);
    STR_EGL_ERROR_CASE(EGL_NOT_INITIALIZED);
    STR_EGL_ERROR_CASE(EGL_BAD_ACCESS);
    STR_EGL_ERROR_CASE(EGL_BAD_ALLOC);
    STR_EGL_ERROR_CASE(EGL_BAD_ATTRIBUTE);
    STR_EGL_ERROR_CASE(EGL_BAD_CONFIG);
    STR_EGL_ERROR_CASE(EGL_BAD_CONTEXT);
    STR_EGL_ERROR_CASE(EGL_BAD_CURRENT_SURFACE);
    STR_EGL_ERROR_CASE(EGL_BAD_DISPLAY);
    STR_EGL_ERROR_CASE(EGL_BAD_MATCH);
    STR_EGL_ERROR_CASE(EGL_BAD_NATIVE_PIXMAP);
    STR_EGL_ERROR_CASE(EGL_BAD_NATIVE_WINDOW);
    STR_EGL_ERROR_CASE(EGL_BAD_PARAMETER);
    STR_EGL_ERROR_CASE(EGL_BAD_SURFACE);
    STR_EGL_ERROR_CASE(EGL_CONTEXT_LOST);

#undef STR_EGL_ERROR_CASE

  default:
    break ;
  }

  return (str);
}

int
_egl_no_error(const char *file, int line)
{
  EGLint egl_error;

  egl_error = eglGetError();

  if (egl_error != EGL_SUCCESS) {
    fprintf(stderr, "%s:%i: eglGetError(): 0x%x (%i): %s\n",
            file, line,
            egl_error, egl_error,
            streglerror(egl_error));
    return (0); /* FALSE */
  }

  return (1); /* TRUE */
}

egl_t *
init_egl(int width, int height)
{
  egl_t *egl;

  static const EGLint conf_attribList[] = {
    EGL_RED_SIZE,        8,
    EGL_GREEN_SIZE,      8,
    EGL_BLUE_SIZE,       8,
#ifndef ENABLE_X11
    /* Alpha 8 on some X11/Mesa could end up with a white window,
     * I'm not sure why... */
    EGL_ALPHA_SIZE,      8,
#endif
    EGL_DEPTH_SIZE,      0,
    EGL_STENCIL_SIZE,    0,
    EGL_SURFACE_TYPE,    EGL_WINDOW_BIT,
    EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
    EGL_SAMPLES,         0,
    EGL_NONE
  };

#define NUM_CONFIGS 1
  EGLConfig configs[NUM_CONFIGS];
  EGLint num_configs;

  static const EGLint win_attribList[] = {
    EGL_RENDER_BUFFER, EGL_BACK_BUFFER,
    EGL_NONE
  };

  static const EGLint ctx_attribList[] = {
    EGL_CONTEXT_CLIENT_VERSION, 2,
    EGL_NONE
  };

  EGLBoolean ret;
  NativeDisplayType egl_native_disp;
  NativeWindowType egl_native_win;

  egl = malloc(sizeof (*egl));
  if (egl == NULL) {
    fprintf(stderr, "ERROR: Can't allocate egl structure: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(egl, 0, sizeof (*egl));

  egl->native_gfx = native_gfx_open_display();
  native_gfx_create_window(egl->native_gfx, width, height);
  egl->width = native_gfx_get_window_width(egl->native_gfx);
  egl->height = native_gfx_get_window_height(egl->native_gfx);

  egl_native_disp = native_gfx_get_egl_native_display(egl->native_gfx);
  egl->dpy = eglGetDisplay(egl_native_disp);
  assert( egl->dpy != EGL_NO_DISPLAY );
  assert( egl_no_error() );

  ret = eglInitialize(egl->dpy, &egl->major, &egl->minor);
  assert( ret == EGL_TRUE );
  assert( egl_no_error() );

  ret = eglChooseConfig(egl->dpy, conf_attribList, configs, NUM_CONFIGS, &num_configs);
  assert( num_configs == 1 );
  assert( ret == EGL_TRUE );
  assert( egl_no_error() );

  egl_native_win = native_gfx_get_egl_native_window(egl->native_gfx);
  egl->surf = eglCreateWindowSurface(egl->dpy, configs[0], egl_native_win, win_attribList);
  assert( egl->surf != EGL_NO_SURFACE );
  assert( egl_no_error() );

  egl->ctx = eglCreateContext(egl->dpy, configs[0], EGL_NO_CONTEXT, ctx_attribList);
  assert( egl->ctx != EGL_NO_CONTEXT );
  assert( egl_no_error() );

  ret = eglMakeCurrent(egl->dpy, egl->surf, egl->surf, egl->ctx);
  assert( ret == EGL_TRUE );
  assert( egl_no_error() );

  return (egl);
}

void
clean_egl(egl_t *egl)
{
  EGLBoolean ret;

  if (egl->dpy != EGL_NO_DISPLAY) {

    ret = eglMakeCurrent(egl->dpy, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    assert( ret == EGL_TRUE );
    assert( egl_no_error() );

    if (egl->ctx != EGL_NO_CONTEXT) {
      ret = eglDestroyContext(egl->dpy, egl->ctx);
      assert( ret == EGL_TRUE );
      assert( egl_no_error() );
      egl->ctx = EGL_NO_CONTEXT;
    }

    if (egl->surf != EGL_NO_SURFACE) {
      ret = eglDestroySurface(egl->dpy, egl->surf);
      assert( ret == EGL_TRUE );
      assert( egl_no_error() );
      egl->surf = EGL_NO_SURFACE;
    }

    ret = eglTerminate(egl->dpy);
    assert( ret == EGL_TRUE );
    assert( egl_no_error() );
    egl->dpy = EGL_NO_DISPLAY;

    ret = eglReleaseThread();
    assert( ret == EGL_TRUE );
    assert( egl_no_error() );
  }

  native_gfx_destroy_window(egl->native_gfx);
  native_gfx_close_display(egl->native_gfx);

  free(egl);
}

/*
* Copyright (c) 2015, Julien Olivain <juju@cotds.org>
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
