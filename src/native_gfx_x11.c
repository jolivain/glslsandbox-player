/*
 * X11 Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <EGL/egl.h>
#include <X11/Xlib.h>
#include <X11/XKBlib.h>

#include "native_gfx.h"

struct native_gfx_s
{
  Display *disp;
  Window win;
  int scr;
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;
  Atom wmDeleteMessage;
};

char *
native_gfx_get_name(void)
{
  return ("X11");
}

native_gfx_t *
native_gfx_open_display(void)
{
  native_gfx_t *gfx;

  gfx = malloc(sizeof (*gfx));
  if (gfx == NULL) {
    fprintf(stderr, "native_gfx_open_display(): Can't allocate memory: error %i: %s\n", errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(gfx, 0, sizeof (*gfx));

  gfx->disp = XOpenDisplay(NULL);
  if (gfx->disp == NULL) {
    fprintf(stderr, "native_gfx_open_display(): XOpenDisplay(): Can't open display\n");
    exit(EXIT_FAILURE);
  }

  gfx->scr = DefaultScreen(gfx->disp);
  gfx->disp_width = DisplayWidth(gfx->disp, gfx->scr);
  gfx->disp_height = DisplayHeight(gfx->disp, gfx->scr);

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

static void
x11_setup_delete_message(native_gfx_t *gfx)
{
  gfx->wmDeleteMessage = XInternAtom(gfx->disp, "WM_DELETE_WINDOW", False);
  XSetWMProtocols(gfx->disp, gfx->win, &gfx->wmDeleteMessage, 1);
}

static const char *
x11_window_name_string(void)
{
  const char *win_name;

  win_name = getenv("GSP_X11_WIN_NAME");
  if (win_name == NULL) {
    win_name = "glslsandbox-player";
  }

  return (win_name);
}

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  XEvent e;
  Status status;
  int ret;
  XWindowAttributes a;
  Window parent_win;
  unsigned long black;
  unsigned long border;
  unsigned long background;
  const unsigned long border_width = 0;

  if (width == 0)
    width = gfx->disp_width;

  if (height == 0)
    height = gfx->disp_height;

  parent_win = RootWindow(gfx->disp, gfx->scr);
  black = BlackPixel(gfx->disp, gfx->scr);
  border = black;
  background = black;

  gfx->win = XCreateSimpleWindow(gfx->disp,
                                 parent_win,
                                 xpos, ypos,
                                 width, height,
                                 border_width,
                                 border,
                                 background);
  if (gfx->win == None) {
    fprintf(stderr,
            "native_gfx_create_window(): XCreateSimpleWindow(): "
            "Can't create window.\n");
    exit(EXIT_FAILURE);
  }

  status = XSelectInput(gfx->disp, gfx->win, ExposureMask|KeyPressMask);
  if (status == False) {
    fprintf(stderr,
            "native_gfx_create_window(): XSelectInput(): failed\n");
    exit(EXIT_FAILURE);
  }

  status = XMapWindow(gfx->disp, gfx->win);
  if (status == False) {
    fprintf(stderr,
            "native_gfx_create_window(): XMapWindow(): failed\n");
    exit(EXIT_FAILURE);
  }

  ret = XStoreName(gfx->disp, gfx->win, x11_window_name_string());
  if (ret == 0) {
    fprintf(stderr,
            "native_gfx_create_window(): XStoreName(): failed\n");
    exit(EXIT_FAILURE);
  }

  XNextEvent(gfx->disp, &e); /* Dummy call to make window appear (fails). */

  x11_setup_delete_message(gfx);

  /* The window manager may have resized us; query our actual dimensions. */
  status = XGetWindowAttributes(gfx->disp, gfx->win, &a);
  if (status == False) {
    fprintf(stderr,
            "native_gfx_create_window(): XGetWindowAttributes(): failed\n");
    exit(EXIT_FAILURE);
  }

  gfx->win_width = a.width;
  gfx->win_height = a.height;
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  XDestroyWindow(gfx->disp, gfx->win);
  gfx->win = None;
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
  XCloseDisplay(gfx->disp);
  gfx->disp = NULL;
  free(gfx);
}

static void
x11_check_events(native_gfx_t *gfx)
{
  while (XPending(gfx->disp) > 0) {
    XEvent xev;

    memset(&xev, 0, sizeof (xev));
    XNextEvent(gfx->disp, &xev);

    if (xev.type == KeyPress) {
      KeySym keysym;
      const char *keystr;

      keysym = XkbKeycodeToKeysym(gfx->disp, xev.xkey.keycode, 0, 0);
      if (keysym == NoSymbol) {
        fprintf(stderr, "WARNING: XkbKeycodeToKeysym() returned NoSymbol.");
        continue ;
      }

      keystr = XKeysymToString(keysym);
      if (keystr == NULL)
        continue ;

      if (strcmp("Escape", keystr) == 0
          || strcmp("q", keystr) == 0
          || strcmp("Q", keystr) == 0) {
        exit(EXIT_SUCCESS);
      }
    }
    else if (xev.type == ClientMessage) {
      if ((Atom)(xev.xclient.data.l[0]) == gfx->wmDeleteMessage) {
        exit(EXIT_SUCCESS);
      }
    }
  }
}

void
native_gfx_swap_buffers(native_gfx_t *gfx)
{
  /* Read and dispatch events in the swap buffers callback.
   * There is no specific hook to do various maintenance tasks. */
  x11_check_events(gfx);
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
* Copyright (c) 2015-2020, Julien Olivain <juju@cotds.org>
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
