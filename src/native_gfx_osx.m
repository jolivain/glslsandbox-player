/*
 * Apple OS X Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See examples:
 * https://chromium.googlesource.com/angle/angle/+/refs/heads/master/util/osx/OSXWindow.mm
 * http://hg.libsdl.org/SDL/file/e52d96ea04fc/src/video/cocoa/SDL_cocoawindow.m
 */

/* Since OSX 10.12, a number of AppKit interfaces have been renamed
 * for consistency, and the previous symbols tagged as deprecated. In
 * order to keep this code short and still compile on a wider range of
 * OSX version, we just ignore the warning. Pragma is protected for
 * gcc >= 4.2 since it's the first version supporting this diagnostic
 * pragma.*/
#if (__GNUC__) > 4 || (__GNUC__ == 4 && (__GNUC_MINOR__ >= 2))
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
#endif

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <EGL/egl.h>

#import <Cocoa/Cocoa.h>

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
  return ("OS X");
}

static bool
InitializeAppKit(void)
{
  if (NSApp != nil) {
    return true;
  }

  [NSApplication sharedApplication];
  [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
  [NSApp finishLaunching];

  return true;
}

bool initializeImpl(native_gfx_t *ctx, int width, int height)
{
  if (!InitializeAppKit()) {
      return false;
  }

  if (width == 0)
      width = 320;
  if (height == 0)
      height = 240;

  NSUInteger style =
      NSTitledWindowMask | NSClosableWindowMask |
      NSResizableWindowMask | NSMiniaturizableWindowMask;
  NSRect rect = NSMakeRect(0, 0, width, height);

  NSWindow *mWindow = [[NSWindow alloc] initWithContentRect:rect
                                                  styleMask:style
                                                    backing:NSBackingStoreBuffered
                                                      defer:NO];
  if (mWindow == nil) {
      return false;
  }

  [mWindow autorelease];

  NSView *mView = [[NSView alloc] initWithFrame:rect];
  if (mView == nil) {
      return false;
  }

  [mView setWantsLayer:YES];
  mView.layer.contentsScale = 1;

  [mWindow setContentView:mView];
  [mWindow setTitle:[NSString stringWithUTF8String:"glslsandbox-player"]];
  [mWindow center];
  [mWindow orderFrontRegardless];

  [NSApp activateIgnoringOtherApps:YES];

  ctx->win = mView.layer;

  return true;
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
  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);

  bool ret = initializeImpl(gfx, width, height);
  if (!ret) {
    fprintf(stderr,
            "native_gfx_create_window(): "
            "could not create native window\n");
    exit(EXIT_FAILURE);
  }
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
osx_message_loop(void)
{
  @autoreleasepool
  {
    while (true) {
      NSEvent *event = [NSApp nextEventMatchingMask:NSAnyEventMask
                                          untilDate:[NSDate distantPast]
                                             inMode:NSDefaultRunLoopMode
                                            dequeue:YES];
      if (event == nil) {
        break ;
      }

      if ([event type] == NSAppKitDefined) {
        continue ;
      }

      [NSApp sendEvent:event];
    }
  }
}

void
native_gfx_swap_buffers(native_gfx_t *gfx)
{
  GFX_UNUSED(gfx);
  osx_message_loop();
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
