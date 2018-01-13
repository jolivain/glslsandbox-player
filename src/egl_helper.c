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

#ifdef ENABLE_SDL2
# include "SDL.h"
# include "SDL_opengles2.h"
#endif /* ENABLE_SDL2 */

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

#if defined(XEGL_STRICT)

static void
__xegl_on_error(void)
{
  exit(EXIT_FAILURE);
}

void
__xegl_check_error(const char *file, int line, const char *func)
{
  EGLint egl_error;

  egl_error = eglGetError();

  if (egl_error != EGL_SUCCESS) {
    fprintf(stderr, "%s:%i: %s(): eglGetError(): 0x%x (%i): %s\n",
            file, line, func,
            egl_error, egl_error,
            streglerror(egl_error));
    __xegl_on_error();
  }
}


EGLDisplay
__xegl_eglGetDisplay(const char *file, int line,
                     EGLNativeDisplayType display_id)
{
  EGLDisplay ret;

  ret = eglGetDisplay(display_id);
  __xegl_check_error(file, line, "eglGetDisplay");

  if (ret == EGL_NO_DISPLAY) {
    fprintf(stderr, "%s:%i: eglGetDisplay(): returned EGL_NO_DISPLAY\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglChooseConfig(const char *file, int line,
                       EGLDisplay dpy, const EGLint *attrib_list,
                       EGLConfig *configs, EGLint config_size, EGLint *num_config)
{
  EGLBoolean ret;

  ret = eglChooseConfig(dpy, attrib_list, configs, config_size, num_config);
  __xegl_check_error(file, line, "eglChooseConfig");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglChooseConfig(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLContext
__xegl_eglCreateContext(const char *file, int line,
			EGLDisplay dpy, EGLConfig config, EGLContext share_context,
			const EGLint *attrib_list)
{
  EGLContext ret;

  ret = eglCreateContext(dpy, config, share_context, attrib_list);
  __xegl_check_error(file, line, "eglCreateContext");

  if (ret == EGL_NO_CONTEXT) {
    fprintf(stderr, "%s:%i: eglCreateContext(): returned EGL_NO_CONTEXT\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLSurface
__xegl_eglCreateWindowSurface(const char *file, int line,
			      EGLDisplay dpy, EGLConfig config,
			      EGLNativeWindowType win, const EGLint *attrib_list)
{
  EGLSurface ret;

  ret = eglCreateWindowSurface(dpy, config, win, attrib_list);
  __xegl_check_error(file, line, "eglCreateWindowSurface");

  if (ret == EGL_NO_SURFACE) {
    fprintf(stderr, "%s:%i: eglCreateWindowSurface(): returned EGL_NO_SURFACE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglDestroyContext(const char *file, int line,
                         EGLDisplay dpy, EGLContext ctx)
{
  EGLBoolean ret;

  ret = eglDestroyContext(dpy, ctx);
  __xegl_check_error(file, line, "eglDestroyContext");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglDestroyContext(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglDestroySurface(const char *file, int line,
                         EGLDisplay dpy, EGLSurface surface)
{
  EGLBoolean ret;

  ret = eglDestroySurface(dpy, surface);
  __xegl_check_error(file, line, "eglDestroySurface");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglDestroySurface(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglInitialize(const char *file, int line,
                     EGLDisplay dpy, EGLint *major, EGLint *minor)
{
  EGLBoolean ret;

  ret = eglInitialize(dpy, major, minor);
  __xegl_check_error(file, line, "eglInitialize");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglInitialize(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglMakeCurrent(const char *file, int line,
		      EGLDisplay dpy, EGLSurface draw, EGLSurface read, EGLContext ctx)
{
  EGLBoolean ret;

  ret = eglMakeCurrent(dpy, draw, read, ctx);
  __xegl_check_error(file, line, "eglMakeCurrent");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglMakeCurrent(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglReleaseThread(const char *file, int line)
{
  EGLBoolean ret;

  ret = eglReleaseThread();

  /* Don't call __xegl_check_error() or eglGetError() here.
   *
   * Quoting EGL 1.5 Specification,
   * Section 3.12 Releasing Thread State:
   *
   * Applications may call other EGL routines from a thread following
   * eglReleaseThread, but any such call may reallocate the EGL state
   * previously released.  In particular, calling eglGetError
   * immediately following a successful call to eglReleaseThread
   * should not be done. Such a call will return EGL_SUCCESS - but
   * will also result in reallocating per-thread state.
   */

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglReleaseThread(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglSwapBuffers(const char *file, int line,
		      EGLDisplay dpy, EGLSurface surface)
{
  EGLBoolean ret;

  ret = eglSwapBuffers(dpy, surface);
  __xegl_check_error(file, line, "eglSwapBuffers");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglSwapBuffers(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglSwapInterval(const char *file, int line,
                       EGLDisplay dpy, EGLint interval)
{
  EGLBoolean ret;

  ret = eglSwapInterval(dpy, interval);
  __xegl_check_error(file, line, "eglSwapInterval");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglSwapInterval(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

EGLBoolean
__xegl_eglTerminate(const char *file, int line,
		    EGLDisplay dpy)
{
  EGLBoolean ret;

  ret = eglTerminate(dpy);
  __xegl_check_error(file, line, "eglTerminate");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglTerminate(): returned EGL_FALSE\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}

#endif /* defined(XEGL_STRICT) */

#ifdef ENABLE_SDL2

egl_t *
egl_init(int width, int height, int xpos, int ypos)
{
  egl_t *egl;

  egl = malloc(sizeof (*egl));
  if (egl == NULL) {
    fprintf(stderr, "ERROR: Can't allocate egl structure: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(egl, 0, sizeof (*egl));

  SDL_Init(SDL_INIT_VIDEO);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_ES);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);

  if (width == 0)
    width = 256;
  if (height == 0)
    height = 256;

  egl->sdlwin = SDL_CreateWindow("glslsandbox-player",
                                 xpos, ypos, width, height,
                                 SDL_WINDOW_OPENGL);
  if (egl->sdlwin == NULL) {
    fprintf(stderr, "SDL2: Could not create window: %s\n", SDL_GetError());
    exit(EXIT_FAILURE);
  }

  egl->sdlctx = SDL_GL_CreateContext(egl->sdlwin);
  if (egl->sdlctx == NULL) {
    fprintf(stderr, "SDL2: Could not create GLES context: %s\n", SDL_GetError());
    exit(EXIT_FAILURE);
  }

  egl->width = width;
  egl->height = height;

  return (egl);
}

void
egl_swap_buffers(egl_t *egl)
{
  SDL_GL_SwapWindow(egl->sdlwin);
}

void
egl_clean(egl_t *egl)
{
  SDL_GL_DeleteContext(egl->sdlctx);
  SDL_DestroyWindow(egl->sdlwin);
}

void
egl_swap_interval(egl_t *egl, int interval)
{
  (void)egl /* UNUSED */;
  SDL_GL_SetSwapInterval(interval);
}

char *
native_gfx_get_name(void)
{
  return ("SDL2");
}

#else /* ENABLE_SDL2 */

egl_t *
egl_init(int width, int height, int xpos, int ypos)
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
  egl_native_disp = native_gfx_get_egl_native_display(egl->native_gfx);
  egl->dpy = XeglGetDisplay(egl_native_disp);
  XeglInitialize(egl->dpy, &egl->major, &egl->minor);

  XeglChooseConfig(egl->dpy, conf_attribList, configs, NUM_CONFIGS, &num_configs);
  assert( num_configs == 1 );

  native_gfx_create_window(egl->native_gfx, width, height, xpos, ypos);
  egl->width = native_gfx_get_window_width(egl->native_gfx);
  egl->height = native_gfx_get_window_height(egl->native_gfx);

  egl_native_win = native_gfx_get_egl_native_window(egl->native_gfx);
  egl->surf = XeglCreateWindowSurface(egl->dpy, configs[0], egl_native_win, win_attribList);

  egl->ctx = XeglCreateContext(egl->dpy, configs[0], EGL_NO_CONTEXT, ctx_attribList);

  XeglMakeCurrent(egl->dpy, egl->surf, egl->surf, egl->ctx);

  return (egl);
}

void
egl_clean(egl_t *egl)
{
  if (egl->dpy != EGL_NO_DISPLAY) {

    XeglMakeCurrent(egl->dpy, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);

    if (egl->ctx != EGL_NO_CONTEXT) {
      XeglDestroyContext(egl->dpy, egl->ctx);
      egl->ctx = EGL_NO_CONTEXT;
    }

    if (egl->surf != EGL_NO_SURFACE) {
      XeglDestroySurface(egl->dpy, egl->surf);
      egl->surf = EGL_NO_SURFACE;
    }

    XeglTerminate(egl->dpy);
    egl->dpy = EGL_NO_DISPLAY;

    XeglReleaseThread();
  }

  native_gfx_destroy_window(egl->native_gfx);
  native_gfx_close_display(egl->native_gfx);

  free(egl);
}

void
egl_swap_buffers(egl_t *egl)
{
  XeglSwapBuffers(egl->dpy, egl->surf);
  native_gfx_swap_buffers(egl->native_gfx);
}

void
egl_swap_interval(egl_t *egl, int interval)
{
  XeglSwapInterval(egl->dpy, interval);
}

#endif /* ENABLE_SDL2 */

/*
* Copyright (c) 2015-2018, Julien Olivain <juju@cotds.org>
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
