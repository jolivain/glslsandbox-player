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
  int fullscreen;
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

static void
x11_set_wm_state_add(native_gfx_t *gfx,
                     const char *atom_name)
{
  Atom wm_state;
  Atom wm_state_prop;
  XEvent event;

  wm_state = XInternAtom(gfx->disp, "_NET_WM_STATE", False);
  wm_state_prop = XInternAtom(gfx->disp, atom_name, False);
  if ((wm_state != None) && (wm_state_prop != None)) {
    event.xclient.type = ClientMessage;
    event.xclient.serial = 0;
    event.xclient.send_event = True;
    event.xclient.display = gfx->disp;
    event.xclient.window = gfx->win;
    event.xclient.message_type = wm_state;
    event.xclient.format = 32;
    event.xclient.data.l[0] = 1; /* _NET_WM_STATE_ADD */
    event.xclient.data.l[1] = wm_state_prop;
    event.xclient.data.l[2] = 0;
    event.xclient.data.l[3] = 1;
    event.xclient.data.l[4] = 0;

    XSendEvent(gfx->disp, DefaultRootWindow(gfx->disp), False,
               SubstructureRedirectMask | SubstructureNotifyMask, &event);
  }
}

static void
x11_set_window_above(native_gfx_t *gfx)
{
  x11_set_wm_state_add(gfx, "_NET_WM_STATE_ABOVE");
}

static void
x11_set_window_below(native_gfx_t *gfx)
{
  x11_set_wm_state_add(gfx, "_NET_WM_STATE_BELOW");
}

static void
x11_setup_window_stacking_order(native_gfx_t *gfx)
{
  const char *stacking;

  stacking = getenv("GSP_X11_WIN_STACKING");
  if (stacking != NULL) {
    if (strcmp(stacking, "above") == 0) {
      x11_set_window_above(gfx);
    }
    else if (strcmp(stacking, "below") == 0) {
      x11_set_window_below(gfx);
    }
    else {
      fprintf(stderr,
              "WARNING: Invalid value of GSP_X11_WIN_STACKING variable.\n"
              "WARNING: Ignoring. Valid values are "
              "\"above\" or \"below\".\n");
    }
  }
}

static void
x11_set_window_fullscreen(native_gfx_t *gfx)
{
  x11_set_wm_state_add(gfx, "_NET_WM_STATE_FULLSCREEN");
  gfx->fullscreen = 1;
}

static void
x11_setup_window_fullscreen(native_gfx_t *gfx)
{
  const char *fullscreen;

  fullscreen = getenv("GSP_X11_FULLSCREEN");
  if (fullscreen != NULL) {
    if (strcmp(fullscreen, "1") == 0) {
      x11_set_window_fullscreen(gfx);
    }
    else {
      fprintf(stderr,
              "WARNING: Invalid value of GSP_X11_FULLSCREEN variable.\n"
              "WARNING: Ignoring. Valid value is \"1\".\n");
    }
  }
}

static void
x11_hide_cursor(native_gfx_t *gfx)
{
  Cursor invisible_cursor;
  Pixmap bitmap_nodata;
  XColor black;
  static char nodata[] = { 0, 0, 0, 0, 0, 0, 0, 0 };

  black.red = 0;
  black.green = 0;
  black.blue = 0;

  bitmap_nodata = XCreateBitmapFromData(gfx->disp, gfx->win, nodata, 8, 8);
  invisible_cursor = XCreatePixmapCursor(gfx->disp,
                                         bitmap_nodata, bitmap_nodata,
                                         &black, &black, 0, 0);
  XDefineCursor(gfx->disp, gfx->win, invisible_cursor);
  XFreeCursor(gfx->disp, invisible_cursor);
  XFreePixmap(gfx->disp, bitmap_nodata);
}

static void
x11_setup_cursor(native_gfx_t *gfx)
{
  const char *cursor;

  cursor = getenv("GSP_X11_CURSOR");
  if (cursor != NULL) {
    if (strcmp(cursor, "0") == 0) {
      x11_hide_cursor(gfx);
    }
  }
  else {
    /* if environment variable is undefined, and fullscreen was
       requested, automatically hide the cursor. */
    if (gfx->fullscreen != 0) {
      x11_hide_cursor(gfx);
    }
  }
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
  x11_setup_window_stacking_order(gfx);
  x11_setup_window_fullscreen(gfx);
  x11_setup_cursor(gfx);

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
