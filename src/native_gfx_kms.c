/*
 * Kernel Mode Setting (KMS) Native Windowing code
 * KMS is achieved using libdrm and libgbm
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

/*
 * For DRM, see:
 * http://dri.sourceforge.net
 * man 7 drm
 * man 7 drm-kms
 * https://cgit.freedesktop.org/mesa/drm
 *
 * For GBM, see:
 * https://cgit.freedesktop.org/mesa/mesa/tree/src/gbm
 *
 * For a good example:
 * https://cgit.freedesktop.org/mesa/kmscube/
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <unistd.h>
#include <signal.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <sys/sysmacros.h>
#include <linux/kd.h>
#include <linux/vt.h>
#include <linux/major.h>

#include <xf86drm.h>
#include <xf86drmMode.h>
#include <gbm.h>

#include <EGL/egl.h>
#if defined(HAVE_EGL_EGLEXT_H)
# include <EGL/eglext.h>
#endif

#include "native_gfx.h"

#define ARRAY_SIZE(arr) (sizeof (arr) / sizeof ((arr)[0]))

struct native_gfx_s
{
  int disp_width;
  int disp_height;
  int win_width;
  int win_height;

  /* GBM */
  struct gbm_device *gbm_dev;
  struct gbm_surface *gbm_surf;
  struct gbm_bo *gbm_bo;

  /* DRM */
  int drm_fd;
  drmModeConnector *drm_conn;
  drmModeModeInfo *drm_mode;
  uint32_t drm_crtc_id;
  uint32_t drm_connector_id;
};

struct drm_fb {
  native_gfx_t *gfx;
  struct gbm_bo *bo;
  uint32_t fb_id;
};

static struct termios save_tio;

static void
restore_vt(void)
{
  struct vt_mode mode = { .mode = VT_AUTO };
  ioctl(STDIN_FILENO, VT_SETMODE, &mode);

  tcsetattr(STDIN_FILENO, TCSANOW, &save_tio);
  ioctl(STDIN_FILENO, KDSETMODE, KD_TEXT);
}

static void
handle_signal(int sig)
{
  restore_vt();
  raise(sig);
}

static int
init_vt(void)
{
  struct termios tio = { 0 };
  struct stat buf = { 0 };
  int ret;

  /* If we're not on a VT, we're probably logged in as root over
   * ssh. Skip all this then. */
  ret = fstat(STDIN_FILENO, &buf);
  if (ret == -1 || major(buf.st_rdev) != TTY_MAJOR)
    return (0);

  /* First, save term io setting so we can restore properly. */
  tcgetattr(STDIN_FILENO, &save_tio);

  /* We don't drop drm master, so block VT switching while we're
   * running. Otherwise, switching to X on another VT will crash X when it
   * fails to get drm master. */
  struct vt_mode mode = {
    .mode = VT_PROCESS,
    .relsig = 0,
    .acqsig = 0
  };

  ret = ioctl(STDIN_FILENO, VT_SETMODE, &mode);
  if (ret == -1) {
    fprintf(stderr, "failed to take control of vt handling\n");
    return (-1);
  }

  /* Set KD_GRAPHICS to disable fbcon while we render. */
  ret = ioctl(STDIN_FILENO, KDSETMODE, KD_GRAPHICS);
  if (ret == -1) {
    fprintf(stderr, "failed to switch console to graphics mode\n");
    return -1;
  }

  atexit(restore_vt);

  /* Set console input to raw mode. */
  tio = save_tio;
  tio.c_lflag &= ~(ICANON | ECHO);
  tcsetattr(STDIN_FILENO, TCSANOW, &tio);

  /* Restore console on SIGINT and friends. */
  struct sigaction act = {
    .sa_handler = handle_signal,
    .sa_flags = SA_RESETHAND
  };

  sigaction(SIGINT, &act, NULL);
  sigaction(SIGSEGV, &act, NULL);
  sigaction(SIGABRT, &act, NULL);

  return (0);
}

/*
 * See:
 * https://cgit.freedesktop.org/mesa/drm/tree/tests/util/kms.c
 */
static const char *modules_g[] = {
  "i915", "amdgpu", "radeon", "nouveau", "vmwgfx", "omapdrm", "exynos",
  "tilcdc", "msm", "sti", "tegra", "imx-drm", "rockchip", "atmel-hlcdc",
  "fsl-dcu-drm", "vc4", "virtio_gpu", "mediatek", "meson", "pl111", "stm",
  "sun4i-drm", "armada-drm",
};


static drmModeConnector *
drm_find_connector_connected(const native_gfx_t *gfx,
                             const drmModeRes *moderes)
{
  drmModeConnector *connector = NULL;
  int i;

  for (i = 0; i < moderes->count_connectors; i++) {
    connector = drmModeGetConnector(gfx->drm_fd,
                                    moderes->connectors[i]);
    if (connector->connection == DRM_MODE_CONNECTED) {
      break ;
    }
    drmModeFreeConnector(connector);
    connector = NULL;
  }

  return (connector);
}

static drmModeConnector *
drm_find_connector_by_id(const native_gfx_t *gfx,
                         const drmModeRes *moderes,
                         uint32_t id)
{
  drmModeConnector *connector = NULL;
  int i;

  for (i = 0; i < moderes->count_connectors; ++i) {
    connector = drmModeGetConnector(gfx->drm_fd,
                                    moderes->connectors[i]);
    if (connector->connector_id == id) {
      break ;
    }
    drmModeFreeConnector(connector);
    connector = NULL;
  }

  return (connector);
}

static drmModeConnector *
drm_find_connector(const native_gfx_t *gfx,
                   const drmModeRes *moderes)
{
  const char *drm_conn_name;
  drmModeConnector *conn = NULL;

  drm_conn_name = getenv("GSP_DRM_CONN");
  if (drm_conn_name == NULL) {
    conn = drm_find_connector_connected(gfx, moderes);
  }
  else {
    char *endptr;
    unsigned long id;
    id = strtoul(drm_conn_name, &endptr, 10);
    if (endptr[0] == '\0') {
      conn = drm_find_connector_by_id(gfx, moderes, id);
    }
    else {
      fprintf(stderr,
              "ERROR: GSP_DRM_CONN environement variable should "
              "contain a valid integer connector ID\n");
    }
  }

  return (conn);
}

static drmModeModeInfo *
drm_find_mode_preferred(const native_gfx_t *gfx)
{
  int i;
  drmModeModeInfo *current_mode = NULL;

  for (i = 0; i < gfx->drm_conn->count_modes; i++) {
    current_mode = &gfx->drm_conn->modes[i];
    if (current_mode->type & DRM_MODE_TYPE_PREFERRED)
      break ;
    current_mode = NULL;
  }

  return (current_mode);
}

static drmModeModeInfo *
drm_find_mode_by_name(const native_gfx_t *gfx, const char *mode_name)
{
  int i;
  drmModeModeInfo *current_mode = NULL;

  for (i = 0; i < gfx->drm_conn->count_modes; i++) {
    current_mode = &gfx->drm_conn->modes[i];
    if (!strcmp(current_mode->name, mode_name))
      break ;
    current_mode = NULL;
  }

  return (current_mode);
}

static drmModeModeInfo *
drm_find_mode(const native_gfx_t *gfx)
{
  const char *drm_mode_name;
  drmModeModeInfo *mode = NULL;

  drm_mode_name = getenv("GSP_DRM_MODE");
  if (drm_mode_name == NULL) {
    mode = drm_find_mode_preferred(gfx);
  }
  else {
    mode = drm_find_mode_by_name(gfx, drm_mode_name);
  }

  return (mode);
}

/* Find the current crtc attached to the encoder of the selected connected */
static uint32_t
drm_find_crtc_current(const native_gfx_t *gfx,
                      const drmModeRes *moderes)
{
  drmModeEncoder *encoder = NULL;
  uint32_t crtc_id = 0;
  int i;

  /* find encoder: */
  for (i = 0; i < moderes->count_encoders; i++) {
    encoder = drmModeGetEncoder(gfx->drm_fd, moderes->encoders[i]);
    if (encoder->encoder_id == gfx->drm_conn->encoder_id)
      break ;
    drmModeFreeEncoder(encoder);
    encoder = NULL;
  }

  if (encoder != NULL) {
    crtc_id = encoder->crtc_id;
    drmModeFreeEncoder(encoder);
  }

  return (crtc_id);
}

static uint32_t
drm_find_crtc_for_encoder(const drmModeRes *resources,
                          const drmModeEncoder *encoder)
{
  int i;

  for (i = 0; i < resources->count_crtcs; i++) {
    uint32_t crtc_mask = 1 << i;
    uint32_t crtc_id = resources->crtcs[i];
    if (encoder->possible_crtcs & crtc_mask) {
      return (crtc_id);
    }
  }

  return (0);
}

static uint32_t
drm_find_crtc_for_connector(int drm_fd,
                            const drmModeRes *resources,
                            const drmModeConnector *connector)
{
  int i;

  for (i = 0; i < connector->count_encoders; i++) {
    const uint32_t encoder_id = connector->encoders[i];
    drmModeEncoder *encoder = drmModeGetEncoder(drm_fd, encoder_id);

    if (encoder) {
      const uint32_t crtc_id = drm_find_crtc_for_encoder(resources, encoder);

      drmModeFreeEncoder(encoder);
      if (crtc_id != 0) {
        return crtc_id;
      }
    }
  }

  return (0);
}

static uint32_t
drm_find_crtc_possible(const native_gfx_t *gfx,
                       const drmModeRes *moderes)
{
  uint32_t crtc_id;

  crtc_id = drm_find_crtc_for_connector(gfx->drm_fd,
                                        moderes,
                                        gfx->drm_conn);

  return (crtc_id);
}

static uint32_t
drm_find_crtc_default(const native_gfx_t *gfx,
                      const drmModeRes *moderes)
{
  uint32_t crtc_id;

  crtc_id = drm_find_crtc_current(gfx, moderes);

  if (crtc_id == 0) {
    crtc_id = drm_find_crtc_possible(gfx, moderes);
  }

  return (crtc_id);
}

static uint32_t
drm_find_crtc_id(const native_gfx_t *gfx,
                 const drmModeRes *moderes)
{
  const char *drm_crtc_id_str;
  uint32_t drm_crtc_id = 0;

  drm_crtc_id_str = getenv("GSP_DRM_CRTC");
  if (drm_crtc_id_str == NULL) {
    drm_crtc_id = drm_find_crtc_default(gfx, moderes);
  }
  else {
    char *endptr;
    drm_crtc_id = strtoul(drm_crtc_id_str, &endptr, 10);
    if (endptr[0] != '\0') {
      fprintf(stderr,
              "ERROR: GSP_DRM_CRTC environment variable should "
              "contain a valid integer CRTC ID\n");
    }
  }

  return (drm_crtc_id);
}

static int
init_drm(native_gfx_t *gfx)
{
  drmModeRes *moderes;
  int i;
  const char *drm_driver_name;
  const char **drv_array;
  size_t drv_count;

  drm_driver_name = getenv("GSP_DRM_DRIVER");
  if (drm_driver_name != NULL) {
    drv_array = &drm_driver_name;
    drv_count = 1;
  }
  else {
    drv_array = modules_g;
    drv_count = ARRAY_SIZE(modules_g);
  }

  for (i = 0; ((size_t)i) < drv_count; i++) {
    fprintf(stderr, "drm: trying to load module %s...", drv_array[i]);
    gfx->drm_fd = drmOpen(drv_array[i], NULL);
    if (gfx->drm_fd < 0) {
      fprintf(stderr, "failed.\n");
    } else {
      fprintf(stderr, "success.\n");
      break ;
    }
  }

  if (gfx->drm_fd < 0) {
    fprintf(stderr, "ERROR: could not open drm device\n");
    return (-1);
  }

  moderes = drmModeGetResources(gfx->drm_fd);
  if (moderes == NULL) {
    fprintf(stderr, "drmModeGetResources() failed: %i %s\n",
            errno, strerror(errno));
    return (-1);
  }

  gfx->drm_conn = drm_find_connector(gfx, moderes);
  if (gfx->drm_conn == NULL) {
    fprintf(stderr, "ERROR: no connected connector!\n");
    return (-1);
  }

  gfx->drm_connector_id = gfx->drm_conn->connector_id;

  gfx->drm_mode = drm_find_mode(gfx);
  if (gfx->drm_mode == NULL) {
    fprintf(stderr, "ERROR: could not find mode!\n");
    return (-1);
  }

  gfx->drm_crtc_id = drm_find_crtc_id(gfx, moderes);
  if (gfx->drm_crtc_id == 0) {
    fprintf(stderr, "ERROR: could not find a CRTC id!\n");
    return (-1);
  }

  drmModeFreeResources(moderes);

  init_vt();

  return (0);
}

static void
clean_drm(native_gfx_t *gfx)
{
  drmModeFreeConnector(gfx->drm_conn);
  drmClose(gfx->drm_fd);
}

char *
native_gfx_get_name(void)
{
#if defined(EGL_VERSION_1_5) && defined(EGL_KHR_platform_gbm)
  return ("KMS/EGL_KHR_platform_gbm");
#else
  return ("KMS/GBM");
#endif
}

native_gfx_t *
native_gfx_open_display(void)
{
  native_gfx_t *gfx;
  int ret;

  gfx = malloc(sizeof (*gfx));
  if (gfx == NULL) {
    fprintf(stderr,
            "native_gfx_open_display(): Can't allocate memory: error %i: %s\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  memset(gfx, 0, sizeof (*gfx));

  ret = init_drm(gfx);
  if (ret != 0) {
    fprintf(stderr, "ERROR: native_gfx_open_display(): "
            "init_drm() returned non-zero\n");
    exit(EXIT_FAILURE);
  }

  gfx->gbm_dev = gbm_create_device(gfx->drm_fd);
  if (gfx->gbm_dev == NULL) {
    fprintf(stderr, "ERROR: native_gfx_open_display(): "
            "gbm_create_device() returned NULL\n");
    exit(EXIT_FAILURE);
  }
  
  return (gfx);
}

NativeDisplayType
native_gfx_get_egl_native_display(const native_gfx_t *gfx)
{
  return ((NativeDisplayType)gfx->gbm_dev);
}

NativeWindowType
native_gfx_get_egl_native_window(const native_gfx_t *gfx)
{
  return ((NativeWindowType)gfx->gbm_surf);
}

static void
drm_fb_destroy_callback(struct gbm_bo *bo, void *data)
{
  struct drm_fb *fb = data;

  GFX_UNUSED(bo);
  
  if (fb->fb_id)
    drmModeRmFB(fb->gfx->drm_fd, fb->fb_id);

  free(fb);
}

static struct drm_fb *
drm_fb_get_from_bo(native_gfx_t *gfx, struct gbm_bo *bo)
{
  struct drm_fb *fb;
  uint32_t width, height, stride, handle;
  int ret;

  fb = gbm_bo_get_user_data(bo);
  if (fb)
    return (fb);

  fb = calloc(1, sizeof (*fb));
  fb->bo = bo;
  fb->gfx = gfx;

  width  = gbm_bo_get_width(bo);
  height = gbm_bo_get_height(bo);
  stride = gbm_bo_get_stride(bo);
  handle = gbm_bo_get_handle(bo).u32;

  ret = drmModeAddFB(gfx->drm_fd, width, height, 24, 32, stride, handle, &fb->fb_id);
  if (ret) {
    fprintf(stderr, "ERROR: failed to create fb: %i %s\n",
            errno, strerror(errno));
    free(fb);
    return (NULL);
  }

  gbm_bo_set_user_data(bo, fb, drm_fb_destroy_callback);

  return (fb);
}

void
native_gfx_create_window(native_gfx_t *gfx, int width, int height, int xpos, int ypos)
{
  // XXX: Can we change position with KMS ?
  GFX_UNUSED(xpos);
  GFX_UNUSED(ypos);

  if (width == 0)
    width = gfx->drm_mode->hdisplay;

  if (height == 0)
    height = gfx->drm_mode->vdisplay;

  gfx->gbm_surf = gbm_surface_create(gfx->gbm_dev,
                                     gfx->drm_mode->hdisplay, gfx->drm_mode->vdisplay,
                                     GBM_FORMAT_XRGB8888,
                                     GBM_BO_USE_SCANOUT | GBM_BO_USE_RENDERING);
  if (gfx->gbm_surf == NULL) {
    fprintf(stderr,
            "ERROR: native_gfx_create_window(): "
            "failed to create gbm surface\n");
    exit(EXIT_FAILURE);
  }
  
  gfx->win_width = width;
  gfx->win_height = height;
}

static void
page_flip_handler(int fd, unsigned int frame,
                  unsigned int sec, unsigned int usec, void *data)
{
  int *waiting_for_flip = data;

  GFX_UNUSED(fd);
  GFX_UNUSED(frame);
  GFX_UNUSED(sec);
  GFX_UNUSED(usec);
  
  *waiting_for_flip = 0;
}

void
native_gfx_swap_buffers(native_gfx_t *gfx)
{
  static int s_first_time = 1;
  struct gbm_bo *next_bo;
  struct drm_fb *fb;
  int waiting_for_flip = 1;
  int ret;
  fd_set fds;
  drmEventContext drmevctx = {
    .version = DRM_EVENT_CONTEXT_VERSION,
    .page_flip_handler = page_flip_handler,
  };

  if (s_first_time) {
    gfx->gbm_bo = gbm_surface_lock_front_buffer(gfx->gbm_surf);
    fb = drm_fb_get_from_bo(gfx, gfx->gbm_bo);
    ret = drmModeSetCrtc(gfx->drm_fd, gfx->drm_crtc_id, fb->fb_id, 0, 0,
                         &gfx->drm_connector_id, 1, gfx->drm_mode);
    if (ret != 0) {
      fprintf(stderr,
              "ERROR: drmModeSetCrtc(): "
              "cannot set CRTC for connector %u (%d): %s\n",
              gfx->drm_connector_id, errno, strerror(errno));
      exit(EXIT_FAILURE);
    }
    s_first_time = 0;

    return ;
  }

  next_bo = gbm_surface_lock_front_buffer(gfx->gbm_surf);
  fb = drm_fb_get_from_bo(gfx, next_bo);
  ret = drmModePageFlip(gfx->drm_fd, gfx->drm_crtc_id, fb->fb_id,
                        DRM_MODE_PAGE_FLIP_EVENT, &waiting_for_flip);
  if (ret != 0) {
    fprintf(stderr,
            "ERROR: drmModePageFlip(): "
            "cannot flip CRTC for connector %u (%d): %s\n",
            gfx->drm_connector_id, errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  FD_ZERO(&fds);
  FD_SET(gfx->drm_fd, &fds);

  while (waiting_for_flip) {
    ret = select(gfx->drm_fd + 1, &fds, NULL, NULL, NULL);
    if (ret < 0) {
      fprintf(stderr, "ERROR: select(): errno %i: %s\n",
              errno, strerror(errno));
      return ;
    } else if (ret == 0) {
      fprintf(stderr, "ERROR: select() timed out\n");
      return ;
    }

    drmHandleEvent(gfx->drm_fd, &drmevctx);
  }

  gbm_surface_release_buffer(gfx->gbm_surf, gfx->gbm_bo);
  gfx->gbm_bo = next_bo;
}

void
native_gfx_destroy_window(native_gfx_t *gfx)
{
  gbm_surface_destroy(gfx->gbm_surf);
  gfx->gbm_surf = NULL;
}

void
native_gfx_close_display(native_gfx_t *gfx)
{
  gbm_device_destroy(gfx->gbm_dev);
  gfx->gbm_dev = NULL;

  clean_drm(gfx);

  memset(gfx, 0, sizeof (*gfx));
  free(gfx);
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
