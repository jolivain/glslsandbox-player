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
#include <assert.h>

#include <xf86drm.h>
#include <xf86drmMode.h>
#include <gbm.h>

#include <EGL/egl.h>
#if defined(HAVE_EGL_EGLEXT_H)
# include <EGL/eglext.h>
#endif

#include "native_gfx.h"

#define GFX_KMS_UNUSED(x)  ((void)(x))
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
  drmModeRes *drm_moderes;
  drmModeConnector *drm_conn;
  drmModeModeInfo *drm_mode;
  drmModeEncoder *drm_enc;
  uint32_t drm_crtc_id;
  uint32_t drm_connector_id;
};

struct drm_fb {
  native_gfx_t *gfx;
  struct gbm_bo *bo;
  uint32_t fb_id;
};

/*
 * See:
 * https://cgit.freedesktop.org/mesa/drm/tree/tests/util/kms.c
 */
static const char *modules_g[] = {
  "i915", "amdgpu", "radeon", "nouveau", "vmwgfx", "omapdrm", "exynos",
  "tilcdc", "msm", "sti", "tegra", "imx-drm", "rockchip", "atmel-hlcdc",
  "fsl-dcu-drm", "vc4", "virtio_gpu", "mediatek", "meson", "pl111",
};

static int
init_drm(native_gfx_t *gfx)
{
  drmModeRes *moderes;
  drmModeConnector *connector = NULL;
  drmModeEncoder *encoder = NULL;
  int i, area;
  const char *drm_driver_name;
  const char **drv_array;
  size_t drv_count;

  drm_driver_name = getenv("GLSLSANDBOX_PLAYER_DRM_DRIVER");
  if (drm_driver_name != NULL) {
    drv_array = &drm_driver_name;
    drv_count = 1;
  }
  else {
    drv_array = modules_g;
    drv_count = ARRAY_SIZE(modules_g);
  }

  for (i = 0; ((unsigned int)i) < drv_count; i++) {
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

  gfx->drm_moderes = moderes;

  /* find a connected connector: */
  for (i = 0; i < moderes->count_connectors; i++) {
    connector = drmModeGetConnector(gfx->drm_fd, moderes->connectors[i]);
    if (connector->connection == DRM_MODE_CONNECTED) {
      /* it's connected, let's use this! */
      break ;
    }
    drmModeFreeConnector(connector);
    connector = NULL;
  }

  if (connector == NULL) {
    /* we could be fancy and listen for hotplug events and wait for
     * a connector..
     */
    fprintf(stderr, "ERROR: no connected connector!\n");
    return (-1);
  }

  gfx->drm_conn = connector;

  /* find highest resolution mode: */
  for (i = 0, area = 0; i < connector->count_modes; i++) {
    drmModeModeInfo *current_mode = &connector->modes[i];
    int current_area = current_mode->hdisplay * current_mode->vdisplay;
    if (current_area > area) {
      gfx->drm_mode = current_mode;
      area = current_area;
    }
  }

  if (gfx->drm_mode == 0) {
    fprintf(stderr, "ERROR: could not find mode!\n");
    return (-1);
  }

  /* find encoder: */
  for (i = 0; i < moderes->count_encoders; i++) {
    encoder = drmModeGetEncoder(gfx->drm_fd, moderes->encoders[i]);
    if (encoder->encoder_id == connector->encoder_id)
      break ;
    drmModeFreeEncoder(encoder);
    encoder = NULL;
  }

  if (encoder == NULL) {
    fprintf(stderr, "ERROR: could not find encoder!\n");
    return (-1);
  }

  gfx->drm_enc = encoder;
  gfx->drm_crtc_id = encoder->crtc_id;
  gfx->drm_connector_id = connector->connector_id;

  return (0);
}

static void
clean_drm(native_gfx_t *gfx)
{
  drmModeFreeEncoder(gfx->drm_enc);
  drmModeFreeConnector(gfx->drm_conn);
  drmModeFreeResources(gfx->drm_moderes);
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

  GFX_KMS_UNUSED(bo);
  
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
  GFX_KMS_UNUSED(xpos);
  GFX_KMS_UNUSED(ypos);

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

  GFX_KMS_UNUSED(fd);
  GFX_KMS_UNUSED(frame);
  GFX_KMS_UNUSED(sec);
  GFX_KMS_UNUSED(usec);
  
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
