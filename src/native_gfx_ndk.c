/*
 * Android NDK Native Windowing code
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * See Android example:
 * https://github.com/android/ndk-samples/blob/main/native-activity/app/src/main/cpp/main.cpp
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <jni.h>
#include <EGL/egl.h>
#include <android_native_app_glue.h>
#include <android/window.h> /* for AWINDOW_FLAG_KEEP_SCREEN_ON */

#include "android-defs.h"

#include "native_gfx.h"

struct native_gfx_s
{
  NativeDisplayType disp;
  NativeWindowType win;
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;

  int window_ready;

  struct android_app* app;
};

static struct android_app *app_g = NULL;

char *
native_gfx_get_name(void)
{
  return ("Android NDK");
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

  gfx->app = app_g;
  gfx->app->userData = gfx;

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
  return (gfx->app->window);
}

/* This function will block, consume and dispatch events in order to
 * wait for the window to be ready. */
static void
android_wait_for_window(native_gfx_t *gfx)
{
  while (1) {
    int ident;
    int events = 0;
    struct android_poll_source* source = NULL;

    while ((ident = ALooper_pollAll(-1, NULL, &events,
                                    (void**)&source)) >= 0) {
      if (source != NULL) {
        source->process(gfx->app, source);
      }

      if (gfx->window_ready != 0) {
        return ;
      }
    }
  }
}

void
native_gfx_create_window(native_gfx_t *gfx,
                         int width, int height, int xpos, int ypos)
{
  GFX_UNUSED(width);
  GFX_UNUSED(height);
  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);

  android_wait_for_window(gfx);

  ANativeActivity_setWindowFlags(gfx->app->activity,
                                 AWINDOW_FLAG_KEEP_SCREEN_ON, 0);
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
  int ident;
  int events = 0;
  struct android_poll_source* source = NULL;

  /* We dispatch events between two frames, when swapping buffers. */

  while ((ident = ALooper_pollAll(0, NULL, &events,
                                  (void**)&source)) >= 0) {
    if (source != NULL) {
      source->process(gfx->app, source);
    }
  }
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

int
native_gfx_request_exit(const native_gfx_t *gfx)
{
  GFX_UNUSED(gfx);

  /* Not implemented. */

  return (0);
}

static void
android_handle_cmd(struct android_app* app, int32_t cmd)
{
  native_gfx_t *gfx = (native_gfx_t *)app->userData;

  switch (cmd) {

  case APP_CMD_INIT_WINDOW:
    if (gfx->app->window != NULL) {
      gfx->window_ready = 1;
    }
    break ;

  default:
    break ;

  }
}

/* The entry point of a native android app is
 * ANativeActivity_onCreate() from android_native_app_glue.c, which
 * will call the user android_main(). We redirect android_main() to
 * the standard C main().
 * See:
 * https://android.googlesource.com/platform/ndk.git/+/refs/tags/ndk-r21e/sources/android/native_app_glue/android_native_app_glue.c#233
 */
extern int main(int argc, char *argv[]);

static char *
get_shared_prefs_args(ANativeActivity* activity)
{
  char *ret = NULL;
  JavaVM *vm;
  JNIEnv *env = NULL;

  vm = activity->vm;
  (*vm)->AttachCurrentThread(vm, &env, NULL);

  jclass spcls = (*env)->FindClass(env, "android/content/SharedPreferences");
  jclass contextcls = (*env)->FindClass(env, "android/content/Context");
  jobject mainClass = (*env)->NewGlobalRef(env, activity->clazz);
  jmethodID mid = (*env)->GetMethodID(env, contextcls, "getSharedPreferences",
                                   "(Ljava/lang/String;I)Landroid/content/SharedPreferences;");
  jmethodID midstr = (*env)->GetMethodID(env, spcls, "getString",
                                         "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;");
  jstring spname = (*env)->NewStringUTF(env, "config");
  jobject jobjectshared = (*env)->CallObjectMethod(env, mainClass, mid, spname, JNI_FALSE);
  jstring objectname = (*env)->NewStringUTF(env, "args");
  jobject jstring = (*env)->CallObjectMethod(env, jobjectshared, midstr, objectname, JNI_FALSE);

  if (jstring != NULL) {
    const char* value = (*env)->GetStringUTFChars(env, jstring, NULL);
    ret = strdup(value);
    (*env)->ReleaseStringUTFChars(env, jstring, value);
  }

  (*env)->DeleteLocalRef(env, spcls);
  (*env)->DeleteLocalRef(env, contextcls);

  (*vm)->DetachCurrentThread(vm);

  return (ret);
}

#define DEFAULT_ANDROID_CMDLINE "-q -w0 -Qhigh -R4 -STwoTweetsChallenge"
#define ARGS_MAX 64

/* This function initialize the shared preference store with default
 * value.  This default value is also returned. */
static char *
get_shared_prefs_default_args(ANativeActivity* activity)
{
  char *ret;
  JavaVM *vm;
  JNIEnv *env = NULL;

  vm = activity->vm;
  (*vm)->AttachCurrentThread(vm, &env, NULL );

  jclass spcls = (*env)->FindClass(env, "android/content/SharedPreferences");
  jclass speditorcls = (*env)->FindClass(env, "android/content/SharedPreferences$Editor");
  jclass contextcls = (*env)->FindClass(env, "android/content/Context");
  jobject mainClass = (*env)->NewGlobalRef(env, activity->clazz);
  jmethodID mid = (*env)->GetMethodID(env, contextcls, "getSharedPreferences",
                                   "(Ljava/lang/String;I)Landroid/content/SharedPreferences;");
  jmethodID midedit = (*env)->GetMethodID(env, spcls, "edit",
                                   "()Landroid/content/SharedPreferences$Editor;");
  jmethodID midputstr = (*env)->GetMethodID(env, speditorcls, "putString",
                                         "(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;");
  jmethodID midapply = (*env)->GetMethodID(env, speditorcls, "apply", "()V");
  jstring spname = (*env)->NewStringUTF(env, "config");
  jobject jobjectshared = (*env)->CallObjectMethod(env, mainClass, mid, spname, JNI_FALSE);
  jobject jobjectsharededit = (*env)->CallObjectMethod(env, jobjectshared, midedit);
  jstring objectname = (*env)->NewStringUTF(env, "args");
  jstring jvalue = (*env)->NewStringUTF(env, DEFAULT_ANDROID_CMDLINE);
  jobject job = (*env)->CallObjectMethod(env, jobjectsharededit, midputstr, objectname, jvalue);

  (*env)->CallVoidMethod(env, job, midapply);

  (*env)->DeleteLocalRef(env, spcls);
  (*env)->DeleteLocalRef(env, contextcls);
  
  (*vm)->DetachCurrentThread(vm);

  ret = strdup(DEFAULT_ANDROID_CMDLINE);

  return (ret);
}

/* This is the entry point of an Android native activity.  We get
 * command line argument from a shared preference store and
 * reconstruct argc/argv to call the original main() function. */
void
android_main(struct android_app* app)
{
  char *args_str;
  char *argv[ARGS_MAX] = { NULL, };
  int argc = 0;
  char *arg;
  char *args_rest;

  fprintf(stderr, "Android main starting...\n");

  app->onAppCmd = android_handle_cmd;

  args_str = get_shared_prefs_args(app->activity);
  if (args_str == NULL) {
    args_str = get_shared_prefs_default_args(app->activity);
  }

  fprintf(stderr, "using cmdline args: %s\n", args_str);

  argv[argc] = "glslsandbox-player";
  argc++;

  args_rest = args_str;

  for ( ; argc < ARGS_MAX; ++argc) {
    arg = strtok_r(args_rest, " ", &args_rest);
    if (arg == NULL)
      break ;
    argv[argc] = arg;
  }

  app_g = app;
  main(argc, argv);
}

/*
* Copyright (c) 2015-2022, Julien Olivain <ju.o@free.fr>
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
