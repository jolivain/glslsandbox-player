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

#if defined(HAVE_EGL_EGLEXT_H) && defined(ENABLE_KMS)
# include <EGL/eglext.h>
#endif

#ifdef ENABLE_SDL2
# include "SDL.h"
# include "SDL_opengles2.h"
#endif /* ENABLE_SDL2 */

#ifdef __ANDROID__
#include "android-defs.h"
#endif

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
__xegl_eglGetCurrentDisplay(const char *file, int line)
{
  EGLDisplay ret;

  ret = eglGetCurrentDisplay();
  __xegl_check_error(file, line, "eglGetCurrentDisplay");

  return (ret);
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

#if defined(ENABLE_KMS) && defined(EGL_VERSION_1_5) && defined(HAVE_EGLGETPLATFORMDISPLAY)
EGLDisplay
__xegl_eglGetPlatformDisplay(const char *file, int line,
                             EGLenum platform,
                             void *native_display,
                             const EGLAttrib *attrib_list)
{
  EGLDisplay ret;

  ret = eglGetPlatformDisplay(platform, native_display, attrib_list);
  __xegl_check_error(file, line, "eglGetPlatformDisplayEXT");

  if (ret == EGL_NO_DISPLAY) {
    fprintf(stderr,
            "%s:%i: eglGetPlatformDisplayEXT(): returned EGL_NO_DISPLAY\n",
            file, line);
    __xegl_on_error();
  }

  return (ret);
}
#endif

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

const char *
__xgles_eglQueryString(const char *file, int line,
                       EGLDisplay dpy, EGLint name)
{
  const char *ret;

  ret = eglQueryString(dpy, name);
  __xegl_check_error(file, line, "eglQueryString");

  return (ret);
}

EGLBoolean
__xgles_eglQuerySurface(const char *file, int line,
                        EGLDisplay dpy, EGLSurface surface, EGLint attribute, EGLint *value)
{
  EGLBoolean ret;

  ret = eglQuerySurface(dpy, surface, attribute, value);
  __xegl_check_error(file, line, "eglQuerySurface");

  if (ret != EGL_TRUE) {
    fprintf(stderr, "%s:%i: eglQuerySurface(): returned EGL_FALSE\n",
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

  EGLint num_configs = 0;

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
#if defined(ENABLE_KMS) && defined(EGL_VERSION_1_5) && defined(EGL_KHR_platform_gbm) && defined(HAVE_EGLGETPLATFORMDISPLAY)
  egl->dpy = XeglGetPlatformDisplay(EGL_PLATFORM_GBM_KHR, egl_native_disp, NULL);
#else
  egl->dpy = XeglGetDisplay(egl_native_disp);
#endif
  XeglInitialize(egl->dpy, &egl->major, &egl->minor);

  XeglChooseConfig(egl->dpy, conf_attribList, &egl->cfg, 1, &num_configs);
  if (num_configs != 1) {
    fprintf(stderr, "ERROR: Can't find an EGL config.\n");
    exit(EXIT_FAILURE);
  }

  native_gfx_create_window(egl->native_gfx, width, height, xpos, ypos);

  egl_native_win = native_gfx_get_egl_native_window(egl->native_gfx);
  egl->surf = XeglCreateWindowSurface(egl->dpy, egl->cfg, egl_native_win, win_attribList);

  XeglQuerySurface(egl->dpy, egl->surf, EGL_WIDTH, &egl->width);
  XeglQuerySurface(egl->dpy, egl->surf, EGL_HEIGHT, &egl->height);

  egl->ctx = XeglCreateContext(egl->dpy, egl->cfg, EGL_NO_CONTEXT, ctx_attribList);

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

static const char *
streglattrib(EGLint attrib)
{
  const char *str;

  str = NULL;

  switch (attrib) {

#define STR_EGL_ATTRIB_CASE(x) \
  case (x):                   \
  str = #x;                   \
  break

    /* EGL config attributes */
    STR_EGL_ATTRIB_CASE(EGL_ALPHA_MASK_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_ALPHA_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_BIND_TO_TEXTURE_RGB);
    STR_EGL_ATTRIB_CASE(EGL_BIND_TO_TEXTURE_RGBA);
    STR_EGL_ATTRIB_CASE(EGL_BLUE_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_BUFFER_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_COLOR_BUFFER_TYPE);
    STR_EGL_ATTRIB_CASE(EGL_CONFIG_CAVEAT);
    STR_EGL_ATTRIB_CASE(EGL_CONFIG_ID);
    STR_EGL_ATTRIB_CASE(EGL_CONFORMANT);
    STR_EGL_ATTRIB_CASE(EGL_DEPTH_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_GREEN_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_LEVEL);
    STR_EGL_ATTRIB_CASE(EGL_LUMINANCE_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_MATCH_NATIVE_PIXMAP);
    STR_EGL_ATTRIB_CASE(EGL_MAX_PBUFFER_HEIGHT);
    STR_EGL_ATTRIB_CASE(EGL_MAX_PBUFFER_PIXELS);
    STR_EGL_ATTRIB_CASE(EGL_MAX_PBUFFER_WIDTH);
    STR_EGL_ATTRIB_CASE(EGL_MAX_SWAP_INTERVAL);
    STR_EGL_ATTRIB_CASE(EGL_MIN_SWAP_INTERVAL);
    STR_EGL_ATTRIB_CASE(EGL_NATIVE_RENDERABLE);
    STR_EGL_ATTRIB_CASE(EGL_NATIVE_VISUAL_ID);
    STR_EGL_ATTRIB_CASE(EGL_NATIVE_VISUAL_TYPE);
    STR_EGL_ATTRIB_CASE(EGL_RED_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_RENDERABLE_TYPE);
    STR_EGL_ATTRIB_CASE(EGL_SAMPLES);
    STR_EGL_ATTRIB_CASE(EGL_SAMPLE_BUFFERS);
    STR_EGL_ATTRIB_CASE(EGL_STENCIL_SIZE);
    STR_EGL_ATTRIB_CASE(EGL_SURFACE_TYPE);
    STR_EGL_ATTRIB_CASE(EGL_TRANSPARENT_BLUE_VALUE);
    STR_EGL_ATTRIB_CASE(EGL_TRANSPARENT_GREEN_VALUE);
    STR_EGL_ATTRIB_CASE(EGL_TRANSPARENT_RED_VALUE);
    STR_EGL_ATTRIB_CASE(EGL_TRANSPARENT_TYPE);

    /* EGL context attributes */
    STR_EGL_ATTRIB_CASE(EGL_CONTEXT_CLIENT_VERSION);

    /* EGL window attributes */
    STR_EGL_ATTRIB_CASE(EGL_RENDER_BUFFER);
    STR_EGL_ATTRIB_CASE(EGL_VG_ALPHA_FORMAT);
    STR_EGL_ATTRIB_CASE(EGL_VG_COLORSPACE);

#undef STR_EGL_ATTRIB_CASE

  default:
    break ;
  }

  return (str);
}

static EGLint egl_cfg_attrs_g[] = {
    EGL_ALPHA_MASK_SIZE,
    EGL_ALPHA_SIZE,
    EGL_BIND_TO_TEXTURE_RGB,
    EGL_BIND_TO_TEXTURE_RGBA,
    EGL_BLUE_SIZE,
    EGL_BUFFER_SIZE,
    EGL_COLOR_BUFFER_TYPE,
    EGL_CONFIG_CAVEAT,
    EGL_CONFIG_ID,
    EGL_CONFORMANT,
    EGL_DEPTH_SIZE,
    EGL_GREEN_SIZE,
    EGL_LEVEL,
    EGL_LUMINANCE_SIZE,
    EGL_MAX_PBUFFER_HEIGHT,
    EGL_MAX_PBUFFER_PIXELS,
    EGL_MAX_PBUFFER_WIDTH,
    EGL_MAX_SWAP_INTERVAL,
    EGL_MIN_SWAP_INTERVAL,
    EGL_NATIVE_RENDERABLE,
    EGL_NATIVE_VISUAL_ID,
    EGL_NATIVE_VISUAL_TYPE,
    EGL_RED_SIZE,
    EGL_RENDERABLE_TYPE,
    EGL_SAMPLES,
    EGL_SAMPLE_BUFFERS,
    EGL_STENCIL_SIZE,
    EGL_SURFACE_TYPE,
    EGL_TRANSPARENT_BLUE_VALUE,
    EGL_TRANSPARENT_GREEN_VALUE,
    EGL_TRANSPARENT_RED_VALUE,
    EGL_TRANSPARENT_TYPE,
    EGL_NONE
};

void
egl_fprintf_config_attribs(FILE *fp,
                           const char *line_prefix,
                           EGLDisplay dpy, EGLConfig cfg)
{
  const char *attrib_name;
  const EGLint *attrib;
  EGLint attrib_val;
  EGLBoolean ret;

  if (NULL == line_prefix) {
    line_prefix = "";
  }

  for (attrib = egl_cfg_attrs_g; EGL_NONE != attrib[0]; ++attrib) {
    attrib_name = streglattrib(attrib[0]);
    if (NULL == attrib_name) {
      attrib_name = "UNKNOWN";
    }

    ret = eglGetConfigAttrib(dpy, cfg, attrib[0], &attrib_val);
    if (EGL_FALSE == ret) {
      fprintf(fp, "%sERROR in eglGetConfigAttrib() for attr %08x (%s)\n",
              line_prefix, attrib[0], attrib_name);
    }

    fprintf(fp, "%s%-28s (0x%04x) = 0x%08x (%i) \n",
            line_prefix, attrib_name, attrib[0], attrib_val, attrib_val);
  }
}


/*
* Copyright (c) 2015-2021, Julien Olivain <ju.o@free.fr>
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
