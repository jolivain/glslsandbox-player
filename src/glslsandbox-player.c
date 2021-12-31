/*
 * GLSL Sandbox shader player
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <EGL/egl.h>
#include <EGL/eglext.h>
#include <GLES2/gl2.h>
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <getopt.h>
#include <string.h>
#ifdef HAVE_UNAME
#include <sys/utsname.h>
#endif
#include <limits.h>
#include <unistd.h>
#include <time.h>
#include <errno.h>
#include <math.h>

#ifdef HAVE_LIBPNG
#include <png.h>
#include "pngio.h"
#endif

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

#ifdef __ANDROID__
#include "android-defs.h"
#endif

#include "glslsandbox-shaders.h"
#include "native_gfx.h"
#include "egl_helper.h"
#include "gles_helper.h"

#include "glslsandbox-player.h"

static const char *
cpp_predefs_g = "#define GLSLSANDBOX_PLAYER 1\n";

static const char *
vertex_shader_g =
  "precision mediump float;  \n"
  "attribute vec4 a_pos;     \n"
  "attribute vec2 a_surfacePosition;\n"
  "varying vec2 surfacePosition;\n"
  "                          \n"
  "void main( void ) {       \n"
  "  surfacePosition = a_surfacePosition;\n"
  "  gl_Position = a_pos;    \n"
  "}                         \n"
;

static const char *
fbo_frag_shader_g =
  "precision mediump float;  \n"
  "uniform sampler2D u_tex;  \n"
  "varying vec2 surfacePosition;\n"
  "                          \n"
  "void main( void ) {       \n"
  "  gl_FragColor = texture2D(u_tex, surfacePosition);\n"
  "}                         \n"
;

static const GLenum gl_texture_g[] = {
  GL_TEXTURE0, GL_TEXTURE1, GL_TEXTURE2, GL_TEXTURE3,
  GL_TEXTURE4, GL_TEXTURE5, GL_TEXTURE6, GL_TEXTURE7
};

static void
player_cleanup(context_t *ctx)
{
  if (ctx->use_fbo) {
    XglBindFramebuffer(GL_FRAMEBUFFER, 0);
    XglDeleteFramebuffers(2, &ctx->fbo_id[0]);
    XglBindTexture(GL_TEXTURE_2D, 0);
    XglDeleteTextures(2, &ctx->fbo_texid[0]);
  }

  XglUseProgram(0);
  XglDetachShader(ctx->gl_prog, ctx->vertex_shader);
  XglDetachShader(ctx->gl_prog, ctx->fragment_shader);
  XglDeleteShader(ctx->vertex_shader);
  XglDeleteShader(ctx->fragment_shader);
  XglDeleteProgram(ctx->gl_prog);
}

static void
cleanup_ctx(context_t *ctx)
{
  if (ctx->user_shader)
    free(ctx->user_shader);

  egl_clean(ctx->egl);
}

static char *
load_file(const char *path)
{
  FILE *fp;
  int ret;
  size_t sret;
  size_t fsize;
  char *file_content;

  fp = fopen(path, "r");
  if (fp == NULL) {
    fprintf(stderr, "ERROR: fopen(path=%s): error %i: %s\n", path, errno, strerror(errno));
    return (NULL);
  }

  ret = fseek(fp, 0, SEEK_END);
  if (ret != 0) {
    fprintf(stderr, "ERROR: fseek(): error %i: %s\n", errno, strerror(errno));
    fclose(fp);
    return (NULL);
  }

  fsize = (size_t)ftell(fp);
  rewind(fp);

  file_content = malloc(fsize + 1);
  if (file_content == NULL) {
    fprintf(stderr, "ERROR: malloc(): error %i: %s\n", errno, strerror(errno));
    fclose(fp);
    return (NULL);
  }

  sret = fread(file_content, 1, fsize, fp);
  if (sret != fsize) {
    if (ferror(fp))
      fprintf(stderr, "ERROR: fread(): error %i: %s\n", errno, strerror(errno));
    else
      fprintf(stderr, "ERROR: fread(): partial read: expected %u bytes, read %u\n",
              (unsigned int)fsize, (unsigned int)sret);
    free(file_content);
    fclose(fp);
    return (NULL);
  }

  file_content[fsize] = '\0';

  return (file_content);
}

static int
is_using_builtin_shader(const context_t *ctx)
{
  return (ctx->user_shader == NULL);
}

static void
get_line_counts(const char *str, int *lines, int *statements)
{
  int line_count;
  int statement_count;
  int has_statement;

  line_count = 0;
  statement_count = 0;
  has_statement = 0;

  for ( ; *str != '\0'; ++str) {
    if (*str == ';') {
      has_statement = 1;
    }
    else if (*str == '\n') {
      ++line_count;
      if (has_statement != 0) {
        ++statement_count;
        has_statement = 0;
      }
    }
  }

  if (lines != NULL)
    *lines = line_count;
  if (statements != NULL)
    *statements = statement_count;
}

static const char *
get_shader_code(const context_t *ctx)
{
  if ( ! is_using_builtin_shader(ctx) )
    return (ctx->user_shader);

  assert( (ctx->run_shader >= 0)
          && ((unsigned int)ctx->run_shader < glslsandbox_shaders_count_g) );

  return (glslsandbox_shaders_g[ctx->run_shader].frag);
}

static void
convert_rgba_to_rgb_inplace(GLubyte *pixels, GLint pixel_count)
{
  GLint p;

  for (p = 1; p < pixel_count; ++p) {
    memcpy(&pixels[p * 3],
           &pixels[p * 4],
           3 * sizeof (GLubyte));
  }
}

static void
vflip_rgb_pixels_inplace(GLubyte *pixels, GLint width, GLint height)
{
  GLint x, y, flip_y;
  GLint height_2;
  GLubyte tmp_pixel[3];

  height_2 = height / 2;

  for (y = 0; y < height_2; ++y) {
    flip_y = height - y - 1;
    for (x = 0; x < width; ++x) {
      memcpy(tmp_pixel, &pixels[ (y * width + x) * 3], sizeof (tmp_pixel));
      memcpy(&pixels[ (y * width + x) * 3], &pixels[ (flip_y * width + x) * 3], sizeof (tmp_pixel));
      memcpy(&pixels[ (flip_y * width + x) * 3], tmp_pixel, sizeof (tmp_pixel));
    }
  }
}

static void
fwrite_framebuffer(FILE *fp)
{
  GLint viewport[4];
  GLint x, y, w, h;
  GLint pixel_count;
  GLubyte *pixels;
  GLsizei pixels_rgba_sz;
  GLsizei pixels_rgb_sz;
  size_t ret;

  XglGetIntegerv(GL_VIEWPORT, viewport);

  x = viewport[0];
  y = viewport[1];
  w = viewport[2];
  h = viewport[3];

  pixel_count = w * h;

  pixels_rgba_sz = pixel_count * 4 * sizeof (GLubyte);

  pixels = malloc(pixels_rgba_sz);
  if (pixels == NULL) {
    fprintf(stderr, "fwrite_framebuffer(): malloc(): ERROR %i: %s\n", errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  /*
   * We use GL_RGBA/GL_UNSIGNED_BYTE here because it's always
   * supported, by specification.  Sicne we are not in a critical
   * computation path (due to other IO), we prefer portability here.
   */
  XglReadPixels(x, y, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);

  convert_rgba_to_rgb_inplace(pixels, pixel_count);
  vflip_rgb_pixels_inplace(pixels, w, h);

  pixels_rgb_sz = w * h * 3 * sizeof (GLubyte);

  fprintf(fp, "P6\n%d %d\n255\n", w, h);

  ret = fwrite(pixels, pixels_rgb_sz, 1, fp);
  if (ret != 1) {
    fprintf(stderr, "fwrite_framebuffer(): fwrite(): could not write data.\n");
    exit(EXIT_FAILURE);
  }

  free(pixels);
}

static void
dump_framebuffer_to_ppm_file(const char *file)
{
  FILE *fp;
  int ret;

  fp = fopen(file, "w");
  if (fp == NULL) {
    fprintf(stderr, "dump_framebuffer_to_ppm_file(): fopen(): ERROR %i: %s.\n", errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  fwrite_framebuffer(fp);

  ret = fclose(fp);
  if (ret != 0) {
    fprintf(stderr, "dump_framebuffer_to_ppm_file(): fclose(): ERROR %i: %s.\n", errno, strerror(errno));
    exit(EXIT_FAILURE);
  }
}

static void
dump_framebuffer_to_ppm(const context_t *ctx)
{
  char fname[PATH_MAX];

  if (is_using_builtin_shader(ctx))
    snprintf(fname, sizeof (fname), "%s-%05i.ppm", glslsandbox_shaders_g[ctx->run_shader].nick, ctx->frame);
  else
    snprintf(fname, sizeof (fname), "output-%05i.ppm", ctx->frame);

  dump_framebuffer_to_ppm_file(fname);
}

static GLuint
load_shader(GLenum type,
            GLsizei count,
            const GLchar * GL_SHADER_SOURCE_CONST *shaderSrc,
            int verbose)
{
  GLuint shader;
  GLint compiled = GL_FALSE;

  shader = XglCreateShader(type);
  if (shader == 0)
    return (0);

  XglShaderSource(shader, count, shaderSrc, NULL);
  XglCompileShader(shader);
  XglGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);

  if ((compiled != GL_TRUE) || (verbose > 0)) {
    GLint info_len = 0;

    XglGetShaderiv(shader, GL_INFO_LOG_LENGTH, &info_len);

    if (info_len > 1) {
      char* info_log = malloc(info_len);

      XglGetShaderInfoLog(shader, info_len, NULL, info_log);
      fprintf(stderr, "Info log from shader compilation:\n%s\n", info_log);
      free(info_log);
    }
  }

  if (compiled != GL_TRUE) {
    XglDeleteShader(shader);
    return (0);
  }

  return (shader);
}

static void
load_program(GLint v_shader_count,
             const GLchar * GL_SHADER_SOURCE_CONST *v_shader_src,
             GLint f_shader_count,
             const GLchar * GL_SHADER_SOURCE_CONST *f_shader_src,
             GLuint *vshader, GLuint *fshader, GLuint *program,
             int verbose)
{
  GLuint vsh;
  GLuint fsh;
  GLuint prog;
  GLint  linked = GL_FALSE;

  vsh = load_shader(GL_VERTEX_SHADER, v_shader_count, v_shader_src, verbose);
  if (vsh == 0) {
    *program = 0;
    return ;
  }

  fsh = load_shader(GL_FRAGMENT_SHADER, f_shader_count, f_shader_src, verbose);
  if (fsh == 0) {
    XglDeleteShader(vsh);
    *program = 0;
    return ;
  }

  prog = XglCreateProgram();
  if (prog == 0) {
    XglDeleteShader(vsh);
    XglDeleteShader(fsh);
    *program = 0;
    return ;
  }

  XglAttachShader(prog, vsh);
  XglAttachShader(prog, fsh);
  XglLinkProgram(prog);

  XglGetProgramiv(prog, GL_LINK_STATUS, &linked);

  if ((linked != GL_TRUE) || (verbose > 0)) {
    GLint info_len = 0;

    XglGetProgramiv(prog, GL_INFO_LOG_LENGTH, &info_len);
    if (info_len > 0) {
      char* info_log = malloc(info_len);
      if (info_log == NULL) {
        fprintf(stderr, "ERROR: malloc(): errno %i: %s\n",
                errno, strerror(errno));
        exit(EXIT_FAILURE);
      }

      XglGetProgramInfoLog(prog, info_len, NULL, info_log);
      fprintf(stderr, "Info log from program linking:\n%s\n", info_log);
      free(info_log);
    }
  }

  if (linked != GL_TRUE) {
    XglDeleteShader(vsh);
    XglDeleteShader(fsh);
    XglDeleteProgram(prog);
    *program = 0;
    return ;
  }

  *vshader = vsh;
  *fshader = fsh;
  *program = prog;
}

static void
setup_fbo_tex(context_t *ctx, int i)
{
  GLint filter;

  XglBindTexture(GL_TEXTURE_2D, ctx->fbo_texid[i]);
  XglTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA,
                ctx->fbo_width, ctx->fbo_height,
                0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);

  if (ctx->fbo_nearest)
    filter = GL_NEAREST;
  else
    filter = GL_LINEAR;

  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, filter);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, filter);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
}

static void
setup_fbo_fb(context_t *ctx, int i)
{
  GLenum s;

  XglBindFramebuffer(GL_FRAMEBUFFER, ctx->fbo_id[i]);
  XglFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                          GL_TEXTURE_2D, ctx->fbo_texid[i], 0);
  s = XglCheckFramebufferStatus(GL_FRAMEBUFFER);
  if (s != GL_FRAMEBUFFER_COMPLETE) {
    fprintf(stderr, "ERROR! glCheckFramebufferStatus() is not COMPLETE\n");
    exit(EXIT_FAILURE);
  }
}

static void
setup_fbo(context_t *ctx)
{
  const int v_src_len = 3;
  const GLchar *v_src[v_src_len];
  const int f_src_len = 3;
  const GLchar *f_src[f_src_len];

  v_src[0] = ctx->force_precision;
  v_src[1] = cpp_predefs_g;
  v_src[2] = vertex_shader_g;

  f_src[0] = ctx->force_precision;
  f_src[1] = cpp_predefs_g;
  f_src[2] = fbo_frag_shader_g;

  load_program(v_src_len, v_src, f_src_len, f_src,
               &ctx->fbo_vsh, &ctx->fbo_fsh, &ctx->fbo_prog,
               ctx->verbose);
  if (ctx->fbo_prog == 0) {
    fprintf(stderr, "ERROR: while loading FBO shaders and program.\n");
    exit(EXIT_FAILURE);
  }

  XglUseProgram(ctx->fbo_prog);

  ctx->fbo_a_pos = XglGetAttribLocation(ctx->fbo_prog, "a_pos");
  ctx->fbo_a_surfpos = XglGetAttribLocation(ctx->fbo_prog, "a_surfacePosition");
  ctx->fbo_u_tex = XglGetUniformLocation(ctx->fbo_prog, "u_tex");

  XglGenTextures(2, &ctx->fbo_texid[0]);

  setup_fbo_tex(ctx, 0);
  setup_fbo_tex(ctx, 1);

  XglGenFramebuffers(2, &ctx->fbo_id[0]);

  setup_fbo_fb(ctx, 0);
  setup_fbo_fb(ctx, 1);

  XglUseProgram(ctx->gl_prog);
}

static void
validate_shader_program(const context_t * ctx)
{
  GLint valid = GL_FALSE;
  GLint info_len = 0;

  XglValidateProgram(ctx->gl_prog);
  XglGetProgramiv(ctx->gl_prog, GL_INFO_LOG_LENGTH, &info_len);

  if (ctx->verbose > 0) {
    if (info_len > 1) {
      char *info_log = malloc(info_len);
      if (info_log == NULL) {
        fprintf(stderr, "ERROR: malloc(): errno %i: %s\n",
                errno, strerror(errno));
        exit(EXIT_FAILURE);
      }

      XglGetProgramInfoLog(ctx->gl_prog, info_len, NULL, info_log);

      fprintf(stderr, "INFO: glValidateProgram(): program info log: validate status:\n%s\n", info_log);

      free(info_log);
    }
  }

  XglGetProgramiv(ctx->gl_prog, GL_VALIDATE_STATUS, &valid);

  if (valid != GL_TRUE) {
    fprintf(stderr, "ERROR: glValidateProgram(): GL_VALIDATE_STATUS != GL_TRUE: "
            "could not validate shader program\n");
    exit(EXIT_FAILURE);
  }
}

static void
load_png_texture(context_t *ctx, int tex)
{
#ifdef HAVE_LIBPNG
  unsigned char *img;
  int width, height, channels;
  GLenum fmt;

  if (ctx->texture[tex].file == NULL) {
    fprintf(stderr,
            "WARNING: shader is using uniform \"texture%i\" but no texture\n"
            "WARNING: was defined on command line with -%i <file.png> option.\n", tex, tex);
    return ;
  }

  read_png_file(ctx->texture[tex].file, &img, &width, &height, &channels);

  if (channels == 1) {
    fmt = GL_LUMINANCE;
  }
  else if (channels == 2) {
    fmt = GL_LUMINANCE_ALPHA;
  }
  else if (channels == 3) {
    fmt = GL_RGB;
  }
  else if (channels == 4) {
    fmt = GL_RGBA;
  }
  else {
    fprintf(stderr, "WARNING: unexpected number of channel %i\n", channels);
    return ;
  }

  XglGenTextures(1, &ctx->texture[tex].id);

  XglBindTexture(GL_TEXTURE_2D, ctx->texture[tex].id);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  XglTexImage2D(GL_TEXTURE_2D,
                0, fmt, width, height, 0, fmt,
                GL_UNSIGNED_BYTE, img);

  free(img);
#else
  /* UNUSED agruments */
  (void)ctx;
  (void)tex;
  fprintf(stderr,
          "WARNING: libpng support is not was not enabled at compilation.\n");
  fprintf(stderr,
          "WARNING: texture file ignored and NOT loaded.\n");
#endif /* HAVE_LIBPNG */
}

static void
setup_textures(context_t *ctx)
{
  char u_name[32];
  int i;

  for (i = 0; i < MAX_TEXTURES; ++i) {

    snprintf(u_name, sizeof (u_name), "texture%i", i);

    ctx->texture[i].u_tex = XglGetUniformLocation(ctx->gl_prog, u_name);

    if (ctx->texture[i].u_tex >= 0) {
      XglActiveTexture(gl_texture_g[i]);
      load_png_texture(ctx, i);
      XglUniform1i(ctx->texture[i].u_tex, i);
    }
  }
}

static void
setup(context_t *ctx)
{
  const int v_src_len = 3;
  const GLchar *v_src[v_src_len];
  const int f_src_len = 3;
  const GLchar *f_src[f_src_len];

  if (ctx->disable_dither) {
    if ((ctx->verbose > 0))
      fprintf(stderr, "Disabling dithering.\n");
    XglDisable(GL_DITHER);
  }

  v_src[0] = ctx->force_precision;
  v_src[1] = cpp_predefs_g;
  v_src[2] = vertex_shader_g;

  f_src[0] = ctx->force_precision;
  f_src[1] = cpp_predefs_g;
  f_src[2] = get_shader_code(ctx);

  load_program(v_src_len, v_src, f_src_len, f_src,
               &ctx->vertex_shader, &ctx->fragment_shader, &ctx->gl_prog,
               ctx->verbose);
  if (ctx->gl_prog == 0) {
    fprintf(stderr, "ERROR: while loading shaders and program.\n");
    exit(EXIT_FAILURE);
  }

  XglUseProgram(ctx->gl_prog);
  ctx->a_pos = XglGetAttribLocation(ctx->gl_prog, "a_pos");

  XglEnableVertexAttribArray(ctx->a_pos);

  ctx->a_surfacePosition = XglGetAttribLocation(ctx->gl_prog, "a_surfacePosition");

  if (ctx->a_surfacePosition >= 0) {
    XglEnableVertexAttribArray(ctx->a_surfacePosition);
  }

  XglClearColor(0.0f, 0.0f, 0.0f, 0.0f);

  ctx->u_time = XglGetUniformLocation(ctx->gl_prog, "time");
  ctx->u_resolution = XglGetUniformLocation(ctx->gl_prog, "resolution");

  if (ctx->u_resolution >= 0) {
    XglUniform2f(ctx->u_resolution,
                 (GLfloat)ctx->shader_width, (GLfloat)ctx->shader_height);
  }

  ctx->u_surfaceSize = XglGetUniformLocation(ctx->gl_prog, "surfaceSize");

  if (ctx->u_surfaceSize >= 0) {
    XglUniform2f(ctx->u_surfaceSize,
                 (GLfloat)ctx->shader_width / (GLfloat)ctx->shader_height, 1.0f);
  }

  ctx->u_mouse = XglGetUniformLocation(ctx->gl_prog, "mouse");

  if (ctx->u_mouse >= 0) {
    XglUniform2f(ctx->u_mouse, 0.5f, 0.5f);
  }

  ctx->u_frame = XglGetUniformLocation(ctx->gl_prog, "frame");

  if (ctx->u_frame >= 0) {
    XglUniform1i(ctx->u_frame, 0);
  }

  ctx->u_backbuf = XglGetUniformLocation(ctx->gl_prog, "backbuffer");

  if (ctx->u_backbuf >= 0) {
    XglUniform1i(ctx->u_backbuf, 0);

    if (!ctx->use_fbo) {
      fprintf(stderr,
              "\nWARNING: shader includes 'backbuffer' "
              "but FBO is inactive\n");
      fprintf(stderr, "Rendering will probably be incorrect.\n");
      fprintf(stderr, "Try adding -B or -X/-Y command line options.\n\n");
    }
  }

  setup_textures(ctx);

  if ((ctx->u_backbuf >= 0) && (ctx->texture[0].u_tex >= 0)) {
    fprintf(stderr,
            "WARNING: \"texture0\" sampler2D should not be used "
            "at the same time with backbuffer.\n\n");
  }

  XglViewport(0, 0, ctx->shader_width, ctx->shader_height);

  validate_shader_program(ctx);

  if (ctx->use_fbo)
    setup_fbo(ctx);

  XglClear(GL_COLOR_BUFFER_BIT);

  egl_swap_buffers(ctx->egl);
}


static void
compute_surface_position(GLfloat surfPos[8],
                         GLfloat center_x, GLfloat center_y,
                         GLfloat fov)
{
  surfPos[0] = center_x - 1.0f * fov;
  surfPos[1] = center_y + 1.0f * fov;

  surfPos[2] = center_x + 1.0f * fov;
  surfPos[3] = center_y + 1.0f * fov;

  surfPos[4] = center_x - 1.0f * fov;
  surfPos[5] = center_y - 1.0f * fov;

  surfPos[6] = center_x + 1.0f * fov;
  surfPos[7] = center_y - 1.0f * fov;
}

static void
draw_frame(context_t *ctx)
{
  int i;
  static const GLfloat plane[] = {
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0
  };

  if (ctx->u_time >= 0) {
    XglUniform1f(ctx->u_time, ctx->time_offset + ctx->time * ctx->time_factor);
  }

  if (ctx->u_frame >= 0) {
    XglUniform1i(ctx->u_frame, ctx->frame);
  }

  if (ctx->u_mouse >= 0 && ctx->enable_mouse_emu) {
    float m;

    m = M_PI * (ctx->time_offset + ctx->time * ctx->mouse_emu_speed);
    XglUniform2f(ctx->u_mouse,
                 0.5f + sinf(0.125f * m) * 0.4f,
                 0.5f + sinf(0.250f * m) * 0.4f);
  }

  if (ctx->clear_frame)
    XglClear(GL_COLOR_BUFFER_BIT);

  XglVertexAttribPointer(ctx->a_pos, 2, GL_FLOAT, GL_FALSE, 0, plane);

  if (ctx->a_surfacePosition >= 0) {
    if (ctx->enable_surfpos_anim) {
      float sp;

      sp = M_PI * (ctx->time_offset + ctx->time * ctx->surfpos_anim_speed);
      compute_surface_position(ctx->surface_position,
                               sinf(0.125f * sp),
                               sinf(0.250f * sp),
                               1.0f + sinf(0.05f * sp) * 0.75f);
    }
    XglVertexAttribPointer(ctx->a_surfacePosition, 2, GL_FLOAT, GL_FALSE,
                           0, ctx->surface_position);
  }

  if (ctx->u_backbuf >= 0) {
    XglUniform1i(ctx->u_backbuf, 0);
    XglBindTexture(GL_TEXTURE_2D, ctx->fbo_texid[(ctx->frame+1) & 1]);
    XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
  }

  for (i = 0; i < MAX_TEXTURES; ++i) {
    if (ctx->texture[i].u_tex >= 0) {
      XglActiveTexture(gl_texture_g[i]);
      XglBindTexture(GL_TEXTURE_2D, ctx->texture[i].id);
      XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
      XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    }
  }

  XglDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

static void
prepare_fbo(context_t *ctx)
{
  XglBindFramebuffer(GL_FRAMEBUFFER, ctx->fbo_id[ctx->frame & 1]);
  XglViewport(0, 0, ctx->fbo_width, ctx->fbo_height);
  XglClearColor(0.0f, 0.0f, 0.0f, 0.0f);
  XglClear(GL_COLOR_BUFFER_BIT);
}

static void
draw_fbo(context_t *ctx)
{
  GLint filter;
  static const GLfloat plane[] = {
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0
  };
  static const GLfloat tcoords[] = {
     0.0,  1.0,
     1.0,  1.0,
     0.0,  0.0,
     1.0,  0.0
  };

  if (ctx->fbo_nearest)
    filter = GL_NEAREST;
  else
    filter = GL_LINEAR;

  XglUseProgram(ctx->fbo_prog);
  XglBindFramebuffer(GL_FRAMEBUFFER, 0);
  XglViewport(0, 0, ctx->width, ctx->height);
  XglClear(GL_COLOR_BUFFER_BIT);
  XglUniform1i(ctx->fbo_u_tex, 0);
  XglBindTexture(GL_TEXTURE_2D, ctx->fbo_texid[ctx->frame & 1]);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, filter);
  XglTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, filter);
  XglEnableVertexAttribArray(ctx->fbo_a_pos);
  XglVertexAttribPointer(ctx->fbo_a_pos, 2, GL_FLOAT, GL_FALSE, 0, plane);
  XglEnableVertexAttribArray(ctx->fbo_a_surfpos);
  XglVertexAttribPointer(ctx->fbo_a_surfpos, 2, GL_FLOAT, GL_FALSE,
                         0, tcoords);
  XglDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  XglUseProgram(ctx->gl_prog);
}

static void
draw(context_t *ctx)
{
  if (ctx->use_fbo)
    prepare_fbo(ctx);

  draw_frame(ctx);

  if (ctx->use_fbo)
    draw_fbo(ctx);
}

static int
get_shader_id_by_glslsbid(const char *glslsbid)
{
  const glslsandbox_shaders_t *s;
  int i;
  int id, rev;
  int ret;

  id = 0;
  rev = 0;
  ret = sscanf(glslsbid, "%i.%i", &id, &rev);
  if (ret != 2) {
    fprintf(stderr, "ERROR: can't read glslsandbox.com id, "
            "format is [0-9]+.[0-9]+, got \"%s\"\n",
            glslsbid);
    exit(EXIT_FAILURE);
  }

  i = 0;
  s = glslsandbox_shaders_g;
  while (s[i].nick != NULL && ((id != s[i].id) || (rev != s[i].rev)) )
    ++i;

  if (s[i].nick == NULL)
    return (-1);

  return (i);
}

static int
get_random_shader_id(void)
{
  int i;
  unsigned int seed = 0;
  struct timespec ts = { 0, 0 };

  clock_gettime(CLOCK_REALTIME, &ts);

  seed  = (unsigned int)(ts.tv_sec);
  seed ^= (unsigned int)(ts.tv_nsec);
  seed ^= (unsigned int)getpid();
  srand(seed);

  i = (int)((double)rand() / ((double)RAND_MAX + 1) * glslsandbox_shaders_count_g);

  return (i);
}

static int
get_shader_id_by_name(const char *name)
{
  const glslsandbox_shaders_t *s;
  int i;

  if (!strcmp("__RANDOM__", name))
    return (get_random_shader_id());

  i = 0;
  s = glslsandbox_shaders_g;
  while (s[i].nick != NULL && strcmp(name, s[i].nick))
    ++i;

  if (s[i].nick == NULL)
    return (-1);

  return (i);
}

static void
list_shaders(FILE *fp)
{
  const glslsandbox_shaders_t *s;
  int i;
  int tot_ln;
  int tot_st;
  int tot_ch;

  fprintf(fp, "# Builtin shader list:\n");
  fprintf(fp, "#\n");
  fprintf(fp, "# 1st column: internal id\n");
  fprintf(fp, "# 2nd column: glslsandbox.com id\n");
  fprintf(fp, "# 3rd column: nickname\n");
  fprintf(fp, "# 4th column: lines of glsl code\n");
  fprintf(fp, "# 5th column: lines of glsl statement code (lines including a ';')\n");
  fprintf(fp, "# 6th column: number of characters\n");

  tot_ln = 0;
  tot_st = 0;
  tot_ch = 0;
  s = glslsandbox_shaders_g;
  for (i = 0; s[i].nick != NULL; ++i) {
      int ln;
      int st;
      int ch;
      get_line_counts(s[i].frag, &ln, &st);
      ch = strlen(s[i].frag);
      fprintf(fp, "%i\t%6i.%-3i\t%-24s\t%i\t%i\t%i\n", i, s[i].id, s[i].rev, s[i].nick,
              ln, st, ch);
      tot_ln += ln;
      tot_st += st;
      tot_ch += ch;
  }

  fprintf(fp, "# Total:\t\t\t\t\t\t%i\t%i\t%i\n", tot_ln, tot_st, tot_ch);
}


static void
list_shaders_urls(FILE *fp)
{
  const glslsandbox_shaders_t *s;
  int i;
  char id[12];

  fprintf(fp, "# Builtin shader URL list:\n");
  fprintf(fp, "#\n");

  s = glslsandbox_shaders_g;
  for (i = 0; s[i].nick != NULL; ++i) {
    snprintf(id, sizeof (id), "%i.%i", s[i].id, s[i].rev);
    fprintf(fp, "http://glslsandbox.com/e#%-14s\t%s\n", id, s[i].nick);
  }
}


static void
player_usage(void)
{
  fprintf(stderr, "\nUsage: glslsandbox-player [options]\n");
  fprintf(stderr, "  -h: show this help\n");
  fprintf(stderr, "  -l: list builtin shaders and exit\n");
  fprintf(stderr, "  -L: list builtin shaders URLs and exit\n");
  fprintf(stderr, "  -S <shader-name>: select the shader to be rendered by nickname\n");
  fprintf(stderr, "  -i <shader-id>: select the shader by internal id\n");
  fprintf(stderr, "  -I <shader-glslid>: select the shader by glslsandbox.com id\n");
  fprintf(stderr, "  -F <file>: run glslsandbox shader from file\n");
  fprintf(stderr, "  -p: print builtin shader code\n");
  fprintf(stderr, "  -f <n>: run n frames of shader(s)\n");
  fprintf(stderr, "  -t <n>: run n seconds of shader(s)\n");
  fprintf(stderr, "  -T <f>: time step at each frame instead of using real time\n");
  fprintf(stderr, "  -o <timespec>: set an absolute time origin\n");
  fprintf(stderr, "  -O <f>: time offset for the animation\n");
  fprintf(stderr, "  -m: disable mouse movement emulation\n");
  fprintf(stderr, "  -M <f>: set mouse movement speed factor\n");
  fprintf(stderr, "  -s <f>: set time speed factor\n");
  fprintf(stderr, "  -u: disable surfacePosition varying animation\n");
  fprintf(stderr, "  -U <f>: set surfacePosition animation speed factor\n");
  fprintf(stderr, "  -e <f:f:f:f>: set fixed surfacePosition values\n");
  fprintf(stderr, "  -W <n>: set window width to n\n");
  fprintf(stderr, "  -H <n>: set window height to n\n");
  fprintf(stderr, "  -x <n>: set window x position to n (if supported)\n");
  fprintf(stderr, "  -y <n>: set window y position to n (if supported)\n");
  fprintf(stderr, "  -B: Enable FBO usage (default to window size)\n");
  fprintf(stderr, "  -N: Set FBO filtering to NEAREST instead of LINEAR\n");
  fprintf(stderr, "  -R <n>: set FBO size to the window size divided by n\n");
  fprintf(stderr, "  -X <n>: set FBO height to n pixels\n");
  fprintf(stderr, "  -Y <n>: set FBO height to n pixels\n");
  fprintf(stderr, "  -r <n>: report frame rate every n frames\n");
  fprintf(stderr, "  -w <n>: set the number of warmup frames\n");
  fprintf(stderr, "  -V <n>: set EGL swap interval to n\n");
  fprintf(stderr, "  -P <n>: sleep n milliseconds between frames\n");
  fprintf(stderr, "  -Q <precision>: force shader precision to low, medium or high\n");
  fprintf(stderr, "  -d: dump each frame as PPM\n");
  fprintf(stderr, "  -D: dump only the last frame as PPM\n");
  fprintf(stderr, "  -E: disable dithering\n");
  fprintf(stderr, "  -C: don't clear frame before redrawing\n");
  fprintf(stderr, "  -0 <file.png>: Load \"file.png\" and bind it to TEXTURE0\n");
  fprintf(stderr, "  -1 to -7: same as -0 for TEXTUREn\n");
  fprintf(stderr, "  -v: increase verbosity level\n");
  fprintf(stderr, "  -q: run quietly\n");
  fprintf(stderr, "\n");
}

static int
parse_surfpos(context_t *ctx, const char *args)
{
  float left, bottom, width, height;
  float right, top;
  int ret;

  ret = sscanf(args, "%f:%f:%f:%f", &left, &bottom, &width, &height);
  if (ret != 4)
    return (-1);

  right = left + width;
  top = bottom + height;

  ctx->surface_position[0] = left;
  ctx->surface_position[1] = top;

  ctx->surface_position[2] = right;
  ctx->surface_position[3] = top;

  ctx->surface_position[4] = left;
  ctx->surface_position[5] = bottom;

  ctx->surface_position[6] = right;
  ctx->surface_position[7] = bottom;

  return (0);
}

static int
parse_timespec(const char *timespec_str, struct timespec *ts)
{
  struct timespec t = { 0, 0 };
  char *endptr = NULL;
  const char *nsec;
  size_t nsec_len;
  unsigned int i;

  t.tv_sec = strtol(timespec_str, &endptr, 10);
  if (endptr[0] == '\0') {
    ts->tv_sec = t.tv_sec;
    ts->tv_nsec = t.tv_nsec;
    return (0);
  }

  if (endptr[0] != '.')
    return (-1);

  nsec = endptr + 1;
  t.tv_nsec = strtol(nsec, &endptr, 10);
  if (endptr[0] != '\0')
    return (-2);

  nsec_len = strlen(nsec);
  if (nsec_len > 9)
    return (-3);

  nsec_len = 9 - nsec_len;
  for (i = 0; i < nsec_len; ++i)
    t.tv_nsec *= 10;

  ts->tv_sec = t.tv_sec;
  ts->tv_nsec = t.tv_nsec;
  
  return (0);
}

static void
set_timespec_origin(context_t *ctx, const char *timespec)
{
  int ret;

  ret = parse_timespec(timespec, &ctx->shader_origin_time);
  if (ret != 0) {
    fprintf(stderr,
            "ERROR: option -o takes a timespec argument.\n"
            "ERROR: format is: INTEGER or INTEGER.INTEGER\n");
    exit(EXIT_FAILURE);
  }
}

static const char *
force_precision_high_g =
  "#define lowp highp\n"
  "#define mediump highp\n";

static const char *
force_precision_medium_g =
  "#define lowp mediump\n"
  "#define highp mediump\n";

static const char *
force_precision_low_g =
  "#define mediump lowp\n"
  "#define highp lowp\n";

static void
force_shader_precision(context_t *ctx, const char *precision)
{
  if (!strcmp("high", precision)) {
    ctx->force_precision = force_precision_high_g;
  }
  else if (!strcmp("medium", precision)) {
    ctx->force_precision = force_precision_medium_g;
  }
  else if (!strcmp("low", precision)) {
    ctx->force_precision = force_precision_low_g;
  }
  else {
    fprintf(stderr,
            "ERROR: option -Q takes a precision argument (high, medium, low).\n");
    exit(EXIT_FAILURE);
  }
}

static void
parse_cmdline(context_t *ctx, int argc, char *argv[])
{
  int i;
  int opt;
  char *endptr;

  /* available short option: AabcGgJjKkn89 */
  while ((opt = getopt(argc, argv, "BCdDe:Ef:F:hH:i:I:lLmM:No:O:pP:Q:qr:R:s:S:t:T:uU:vV:w:W:x:X:y:Y:0:1:2:3:4:5:6:7:")) != -1) {

    switch (opt) {

    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
      ctx->texture[(opt - '0')].file = optarg;
      break ;

    case 'B':
      ctx->use_fbo = 1;
      break ;

    case 'C':
      ctx->clear_frame = 0;
      break ;

    case 'd':
      ctx->dump_frame = DUMP_FRAME_ALL;
      break ;

    case 'D':
      ctx->dump_frame = DUMP_FRAME_LAST;
      break ;

    case 'e':
      ctx->enable_surfpos_anim = 0;
      i = parse_surfpos(ctx, optarg);
      if (i != 0) {
        fprintf(stderr,
                "ERROR: -e option format is four floats values separated by column"
                "left:bottom:width:height (got '%s')\n", optarg);
        exit(EXIT_FAILURE);
      }
      break ;

    case 'E':
      ctx->disable_dither = 1;
      break ;

    case 'f':
      i = atoi(optarg);
      if (i <= 0) {
        fprintf(stderr,
                "ERROR: -f option takes a positive integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      ctx->frames = (unsigned int)i;
      break ;

    case 'F':
      if (ctx->user_shader != NULL) {
        fprintf(stderr, "ERROR: -F option can be passed only once.\n");
        exit(EXIT_FAILURE);
      }
      ctx->user_shader = load_file(optarg);
      if (ctx->user_shader == NULL) {
        fprintf(stderr, "ERROR while loading file %s\n", optarg);
        exit(EXIT_FAILURE);
      }
      break ;

    case 'h':
      player_usage();
      exit(EXIT_SUCCESS);
      break ;

    case 'H':
      ctx->height = atoi(optarg);
      break ;

    case 'i':
      errno = 0;
      ctx->run_shader = strtol(optarg, &endptr, 10);
      if ((endptr == optarg) || (errno != 0) || (ctx->run_shader < 0)
          || ((unsigned int)ctx->run_shader >= glslsandbox_shaders_count_g)) {
        fprintf(stderr,
                "ERROR: builtin shader id selected with -i "
                "must satisfies 0 <= id < %u (given value was %s)\n",
                glslsandbox_shaders_count_g, optarg);
        exit(EXIT_FAILURE);
      }
      if (*endptr != '\0')
        fprintf(stderr,
                "WARNING: -i argument has garbage '%s' after integer value\n",
                endptr);
      break ;

    case 'I':
      ctx->run_shader = get_shader_id_by_glslsbid(optarg);
      if (ctx->run_shader < 0) {
        fprintf(stderr, "ERROR: \"%s\" not found in builtin shaders.\n", optarg);
        exit(EXIT_FAILURE);
      }
      break ;

    case 'l':
      list_shaders(stdout);
      exit(EXIT_SUCCESS);
      break ;

    case 'L':
      list_shaders_urls(stdout);
      exit(EXIT_SUCCESS);
      break ;

    case 'm':
      ctx->enable_mouse_emu = 0;
      break ;

    case 'M':
      ctx->mouse_emu_speed = atof(optarg);
      break ;

    case 'N':
      ctx->fbo_nearest = 1;
      break ;

    case 'o':
      set_timespec_origin(ctx, optarg);
      ctx->use_fixed_time_origin = 1;
      break ;

    case 'O':
      ctx->time_offset = atof(optarg);
      break ;

    case 'p':
      ctx->print_shader = 1;
      break ;

    case 'P':
      i = atoi(optarg);
      if (i <= 0) {
        fprintf(stderr,
                "ERROR: -i option takes a positive integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      ctx->frame_sleep = i * 1000;
      break ;

    case 'Q':
      force_shader_precision(ctx, optarg);
      break ;

    case 'q':
      ctx->verbose = 0;
      break ;

    case 'r':
      i = atoi(optarg);
      if (i <= 0) {
        fprintf(stderr,
                "ERROR: -r option takes a positive integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      ctx->report_fps_count = i;
      break ;

    case 'R':
      i = atoi(optarg);
      if (i <= 0) {
        fprintf(stderr,
                "ERROR: -R option takes a positive integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      if ((ctx->fbo_width > 0) || (ctx->fbo_height > 0)) {
        fprintf(stderr,
                "ERROR: -R option should not be used with -X/-Y\n");
        exit(EXIT_FAILURE);
      }
      ctx->use_fbo = 1;
      ctx->fbo_size_div = i;
      break ;

    case 's':
      ctx->time_factor = atof(optarg);
      break ;

    case 'S':
      ctx->run_shader = get_shader_id_by_name(optarg);
      if (ctx->run_shader < 0) {
        fprintf(stderr, "ERROR: \"%s\" not found in builtin shaders.\n", optarg);
        exit(EXIT_FAILURE);
      }
      break ;

    case 't':
      ctx->run_time = atof(optarg);
      break ;

    case 'T':
      ctx->use_time_step = 1;
      ctx->time_step = atof(optarg);
      break ;

    case 'u':
      ctx->enable_surfpos_anim = 0;
      break ;

    case 'U':
      ctx->surfpos_anim_speed = atof(optarg);
      break ;

    case 'v':
      ctx->verbose++;
      break ;

    case 'V':
      i = atoi(optarg);
      if (i < 0) {
        fprintf(stderr,
                "ERROR: -V option takes a non-negative integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      ctx->swap_interval = i;
      break ;

    case 'w':
      i = atoi(optarg);
      if (i < 0) {
        fprintf(stderr,
                "ERROR: -w option takes a non-negative integer argument "
                "(got %i)\n", i);
        exit(EXIT_FAILURE);
      }
      ctx->warmup_frames = (unsigned int)i;
      break ;

    case 'W':
      ctx->width = atoi(optarg);
      break ;

    case 'x':
      ctx->winxpos = atoi(optarg);
      break ;

    case 'X':
      if (ctx->fbo_size_div > 0) {
        fprintf(stderr,
                "ERROR: -X/-Y options should not be used with -R\n");
        exit(EXIT_FAILURE);
      }
      ctx->use_fbo = 1;
      ctx->fbo_width = atoi(optarg);
      break ;

    case 'y':
      ctx->winypos = atoi(optarg);
      break ;

    case 'Y':
      if (ctx->fbo_size_div > 0) {
        fprintf(stderr,
                "ERROR: -X/-Y options should not be used with -R\n");
        exit(EXIT_FAILURE);
      }
      ctx->use_fbo = 1;
      ctx->fbo_height = atoi(optarg);
      break ;

    default:
      player_usage();
      exit(EXIT_FAILURE);
    }
  }
}

static void
xclock_gettime(clockid_t clk_id, struct timespec *tp)
{
  int ret;

  ret = clock_gettime(clk_id, tp);
  if (ret != 0) {
    fprintf(stderr, "ERROR: clock_gettime(): error %i: %s\n", errno, strerror(errno));
    exit(EXIT_FAILURE);
  }
}

static float
get_float_reltime(const struct timespec *ref)
{
  struct timespec ts;
  struct timespec diff;
  float t;

  xclock_gettime(CLOCK_REALTIME, &ts);

  Timespec_Sub(&diff, &ts, ref);

  t = Timespec_Float(&diff);

  return (t);
}

static float
get_rendering_time(const context_t *ctx)
{
  float t;

  t = get_float_reltime(&ctx->warmup_end_time);

  return (t);
}

static void
init_render_start_time(context_t *ctx)
{
  xclock_gettime(CLOCK_REALTIME, &ctx->render_start_time);
  memcpy(&ctx->last_fps_count_time, &ctx->render_start_time,
         sizeof (ctx->last_fps_count_time));

  /* Shader animation time is computed from first_frame_time or
   * shader_origin_time if set.  In case there is no warmup frame, we
   * need to init first_frame_time here. */
  if (ctx->warmup_frames == 0) {
    memcpy(&ctx->first_frame_time, &ctx->render_start_time,
           sizeof (ctx->first_frame_time));
    /* If no fixed time origin was given, also copy to
       shader_origin_time. */
    if (ctx->use_fixed_time_origin == 0) {
      memcpy(&ctx->shader_origin_time,
             &ctx->first_frame_time,
             sizeof (ctx->shader_origin_time));
    }
  }

  if (ctx->verbose > 0) {
    struct timespec diff;

    Timespec_Sub(&diff, &ctx->render_start_time, &ctx->player_start_time);

    fprintf(stderr, "Setup time %u.%03u sec (context init, shader compilation)\n",
            (unsigned int)diff.tv_sec, (unsigned int)diff.tv_nsec / 1000000);
  }
}

static void
init_first_frame_time(context_t *ctx)
{
  xclock_gettime(CLOCK_REALTIME, &ctx->first_frame_time);

  /* If a fixed shader time origin was not given in command line with
   * -o argument, initialize the time origin to first_frame_time. */
  if (ctx->use_fixed_time_origin == 0) {
    memcpy(&ctx->shader_origin_time,
           &ctx->first_frame_time,
           sizeof (ctx->shader_origin_time));
  }

  if (ctx->verbose > 0) {
    struct timespec diff;
    float ft;
    float fps;

    Timespec_Sub(&diff, &ctx->first_frame_time, &ctx->render_start_time);
    ft = Timespec_Float(&diff);
    fps = 1.0f / ft;
    ft *= 1000.0f;

    fprintf(stderr, "First frame time %.3f ms (%.3f fps)\n", ft, fps);
  }
}

static void
update_time(context_t *ctx)
{
  if (ctx->use_time_step)
    ctx->time = (float)(ctx->frame + 1) * ctx->time_step;
  else
    ctx->time = get_float_reltime(&ctx->shader_origin_time);
}

static void
init_ctx(context_t *ctx)
{
  memset(ctx, 0, sizeof (*ctx));

  ctx->swap_interval = -1;
  ctx->verbose = 1;
  ctx->time_factor = 1.0f;
  ctx->enable_mouse_emu = 1;
  ctx->mouse_emu_speed = 1.0f;
  ctx->enable_surfpos_anim = 1;
  ctx->surfpos_anim_speed = 1.0f;
  ctx->report_fps_count = 100;
  ctx->warmup_frames = 3;
  ctx->force_precision = "";
  ctx->clear_frame = 1;

  ctx->surface_position[0] = -1.0f;
  ctx->surface_position[1] =  1.0f;

  ctx->surface_position[2] =  1.0f;
  ctx->surface_position[3] =  1.0f;

  ctx->surface_position[4] = -1.0f;
  ctx->surface_position[5] = -1.0f;

  ctx->surface_position[6] =  1.0f;
  ctx->surface_position[7] = -1.0f;

  xclock_gettime(CLOCK_REALTIME, &ctx->player_start_time);
}

static void
fprintf_info(FILE *fp)
{
  fprintf(fp, "Program information         :\n");

#if defined (__clang_major__) && defined (__clang_minor__) && defined (__clang_patchlevel__)
  fprintf(fp, "Clang version               : %i.%i.%i\n",
          __clang_major__, __clang_minor__, __clang_patchlevel__);
#endif

#if defined (__EMSCRIPTEN_major__) && defined (__EMSCRIPTEN_minor__) && defined (__EMSCRIPTEN_tiny__)
  fprintf(fp, "Emscripten version          : %i.%i.%i\n",
          __EMSCRIPTEN_major__, __EMSCRIPTEN_minor__, __EMSCRIPTEN_tiny__);
#endif

#if defined(__GNUC__) && defined(__GNUC_MINOR__) && defined(__GNUC_PATCHLEVEL__)
  fprintf(fp, "GCC version                 : %i.%i.%i\n",
          __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
#endif

#if defined (__GNU_LIBRARY__)
  fprintf(fp, "GNU C Library               : %i\n", __GNU_LIBRARY__);
#endif

#if defined (__GLIBC__) && defined(__GLIBC_MINOR__)
  fprintf(fp, "glibc version               : %i.%i\n",
          __GLIBC__, __GLIBC_MINOR__);
#endif

#if defined (__VERSION__)
  fprintf(fp, "compiler __VERSION__ macro  : %s\n", __VERSION__);
#endif

#if defined (__ghs__) && defined (__GHS_VERSION_NUMBER)
  fprintf(fp, "Greenhills compiler version : %d\n", __GHS_VERSION_NUMBER);
#endif

#if defined (__ANDROID_API__)
  fprintf(fp, "Android API                 : %i\n", __ANDROID_API__);
#endif

  fprintf(fp, "Native window system        : %s\n",
          native_gfx_get_name());

#ifdef HAVE_LIBPNG
  fprintf(fp, "libpng support version      : %s\n", PNG_LIBPNG_VER_STRING);
#endif

#if defined (EGL_EGLEXT_VERSION)
  fprintf(fp, "eglext.h EGL_EGLEXT_VERSION : %i\n", EGL_EGLEXT_VERSION);
#endif

  fprintf(fp, "\n");
}

static void
fprintf_sysinfo(FILE *fp)
{
#ifdef HAVE_UNAME
  struct utsname un;
  int ret;

  ret = uname(&un);
  if (ret != 0) {
    fprintf(stderr, "fprintf_sysinfo(): uname(): error %i: %s.\n",
            errno, strerror(errno));
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "System information          :\n");
  fprintf(fp, "System name                 : %s\n", un.sysname);
  fprintf(fp, "System release              : %s\n", un.release);
  fprintf(fp, "System version              : %s\n", un.version);
  fprintf(fp, "System machine              : %s\n", un.machine);
  fprintf(fp, "\n");
#else
  fprintf(fp, "System information          : uname() unavailable\n");
#endif
}

static void
fprintf_gles_precision(FILE *fp, GLenum shader_type, GLenum precision_type)
{
  GLint range[2] = { 0, 0 };
  GLint precision = 0;

  XglGetShaderPrecisionFormat(shader_type, precision_type, range, &precision);
  fprintf(fp, "| %3i:%-3i %3i ",
          range[0], range[1], precision);
}


static void
fprintf_gles_precisions(FILE *fp)
{
  fprintf(fp, "\nShader precision returned by glGetShaderPrecisionFormat():\n");
  fprintf(fp, "Cell format is: \"range[0]:range[1] precision\"\n");

  fprintf(fp,
          "+-----+---------------------------+---------------------------+\n");
  fprintf(fp,
          "|Preci|          Vertex           |          Fragment         |\n");
  fprintf(fp,
          "|sion |    Float    |   Integer   |    Float    |   Integer   |\n");
  fprintf(fp,
          "+-----+-------------+-------------+-------------+-------------+\n");

  fprintf(fp, "| Low ");
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_LOW_FLOAT);
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_LOW_INT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_LOW_FLOAT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_LOW_INT);
  fprintf(fp, "|\n");

  fprintf(fp, "| Med ");
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_MEDIUM_FLOAT);
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_MEDIUM_INT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_MEDIUM_FLOAT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_MEDIUM_INT);
  fprintf(fp, "|\n");

  fprintf(fp, "| Hig ");
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_HIGH_FLOAT);
  fprintf_gles_precision(fp, GL_VERTEX_SHADER, GL_HIGH_INT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_HIGH_FLOAT);
  fprintf_gles_precision(fp, GL_FRAGMENT_SHADER, GL_HIGH_INT);
  fprintf(fp, "|\n");

  fprintf(fp,
          "+-----+-------------+-------------+-------------+-------------+\n");
}

static void
fprintf_gl_extensions(FILE *fp,
		      const char *prefix,
		      const char *exts,
		      const char *suffix)
{
  static const char rej[] = " ";
  const char *cur_ext;
  size_t cur_ext_len;

  assert(exts != NULL);

  cur_ext = exts;
  while (*cur_ext != '\0') {
    cur_ext_len = strcspn(cur_ext, rej);
    if (prefix != NULL)
      fprintf(fp, "%s", prefix);
    fprintf(fp, "%.*s", (int)cur_ext_len, cur_ext);
    if (suffix != NULL)
      fprintf(fp, "%s", suffix);
    cur_ext += cur_ext_len + 1;
  }
}

static void
fprintf_gles_info(FILE *fp, int verbose)
{
  const char *vendor;
  const char *version;
  const char *renderer;
  const char *slver;
  const char *exts;

  vendor = (const char *)XglGetString(GL_VENDOR);
  if (vendor == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_VENDOR) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  renderer = (const char *)XglGetString(GL_RENDERER);
  if (renderer == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_RENDERER) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  version = (const char *)XglGetString(GL_VERSION);
  if (version == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_VERSION) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  slver = (const char *)XglGetString(GL_SHADING_LANGUAGE_VERSION);
  if (slver == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_SHADING_LANGUAGE_VERSION) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "OpenGL ES driver information:\n");
  fprintf(fp, "GL_VENDOR                   : %s\n", vendor);
  fprintf(fp, "GL_RENDERER                 : %s\n", renderer);
  fprintf(fp, "GL_VERSION                  : %s\n", version);
  fprintf(fp, "GL_SHADING_LANGUAGE_VERSION : %s\n", slver);

  if (verbose > 1) {
    exts = (const char *)XglGetString(GL_EXTENSIONS);
    if (exts == NULL) {
      fprintf(stderr, "ERROR: glGetString(GL_EXTENSIONS) returned NULL\n");
      exit(EXIT_FAILURE);
    }
    fprintf(fp, "GL_EXTENSIONS               :\n");
    fprintf_gl_extensions(stderr, "    ", exts, "\n");
  }

  if (verbose > 2)
    fprintf_gles_precisions(fp);

  fprintf(fp, "\n");
}

#ifndef ENABLE_SDL2
static void
fprintf_egl_info(FILE *fp, int verbose)
{
  const char *client_apis;
  const char *vendor;
  const char *version;
  const char *exts;
  EGLDisplay dpy;

  dpy = XeglGetCurrentDisplay();
  if (dpy == EGL_NO_DISPLAY) {
    fprintf(stderr, "ERROR: eglGetCurrentDisplay() returned EGL_NO_DISPLAY\n");
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "EGL driver information      :\n");

  vendor = XeglQueryString(dpy,  EGL_VENDOR);
  if (vendor == NULL) {
    fprintf(stderr, "ERROR: eglQueryString(EGL_VENDOR) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "EGL_VENDOR                  : %s\n", vendor);

  version = XeglQueryString(dpy,  EGL_VERSION);
  if (version == NULL) {
    fprintf(stderr, "ERROR: eglQueryString(EGL_VERSION) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "EGL_VERSION                 : %s\n", version);

  if (verbose > 1) {
    client_apis = XeglQueryString(dpy, EGL_CLIENT_APIS);
    if (client_apis == NULL) {
      fprintf(stderr, "ERROR: eglQueryString(EGL_CLIENT_APIS) returned NULL\n");
      exit(EXIT_FAILURE);
    }

    fprintf(fp, "EGL_CLIENT_APIS             : %s\n", client_apis);

    /* EGL 1.5 has distinct notion of "Client" and "Display"
     * extensions. "Client" extensions are global to the
     * implementation (usually native platforms). "Display" are
     * specific to the initialized display.
     * See: https://www.khronos.org/registry/EGL/specs/eglspec.1.5.pdf
     * Section 3.3: EGL Queries, eglQueryString()
     */
    if (strcmp("1.5", version) == 0) {
      exts = XeglQueryString(EGL_NO_DISPLAY, EGL_EXTENSIONS);
      if (exts == NULL) {
        fprintf(stderr, "ERROR: eglQueryString(EGL_EXTENSIONS); returned NULL\n");
        exit(EXIT_FAILURE);
      }

      fprintf(fp, "EGL_EXTENSIONS (client)     :\n");
      fprintf_gl_extensions(stderr, "    ", exts, "\n");
    }

    exts = XeglQueryString(dpy, EGL_EXTENSIONS);
    if (exts == NULL) {
      fprintf(stderr, "ERROR: eglQueryString(EGL_EXTENSIONS); returned NULL\n");
      exit(EXIT_FAILURE);
    }

    fprintf(fp, "EGL_EXTENSIONS (display)    :\n");
    fprintf_gl_extensions(stderr, "    ", exts, "\n");
  }
}
#endif /* ENABLE_SDL2 */

static void
report_fps(FILE *fp, context_t *ctx)
{
  float fps;
  float ft;
  struct timespec t;
  struct timespec diff;

  if (((ctx->frame + 1) % ctx->report_fps_count) != 0)
    return ;

  xclock_gettime(CLOCK_REALTIME, &t);

  Timespec_Sub(&diff, &t, &ctx->last_fps_count_time);

  memcpy(&ctx->last_fps_count_time, &t,
         sizeof (ctx->last_fps_count_time));

  ft = Timespec_Float(&diff);

  fps = (float)ctx->report_fps_count / ft;

  fprintf(fp, "from_frame:%-7u to_frame:%-7u time:%-7.3f frame_rate:%-9.3f shadertime=%.3f\n",
          ctx->frame - ctx->report_fps_count + 1, ctx->frame,
          ft, fps, ctx->time);
}

static void
player_render_loop_warmup(context_t *ctx)
{
  for (;;) {

    if (ctx->frame == 1)
      init_first_frame_time(ctx);

    if (ctx->frame >= ctx->warmup_frames)
      break ;

    draw(ctx);

    egl_swap_buffers(ctx->egl);

    if (ctx->frame_sleep > 0)
      usleep(ctx->frame_sleep);

    if (ctx->frame > 0)
      update_time(ctx);

    if (ctx->verbose > 0)
      report_fps(stderr, ctx);

    ctx->frame++;
  }

  xclock_gettime(CLOCK_REALTIME, &ctx->warmup_end_time);
  memcpy(&ctx->last_fps_count_time,
         &ctx->warmup_end_time,
         sizeof (ctx->last_fps_count_time));

  ctx->frame = 0;

  if (ctx->run_time > 1e-3f)
    ctx->run_time += ctx->time;

  if ((ctx->warmup_frames > 1) && (ctx->verbose > 0)) {
    float rt;

    rt = get_float_reltime(&ctx->render_start_time);
    fprintf(stderr, "finished %i warmup frames in %.3f s "
            "(avg rate %.3f fps).\n",
            ctx->warmup_frames, rt,
            (float)ctx->warmup_frames / rt);

    rt = get_float_reltime(&ctx->first_frame_time);
    fprintf(stderr, "Excluding first warmup frame: %i warmup frames "
            "in %.3f s (avg rate %.3f fps).\n",
            (ctx->warmup_frames - 1), rt,
            (float)(ctx->warmup_frames - 1) / rt);
  }
}

static int
is_last_frame(const context_t *ctx)
{
  if ((ctx->frames > 0) && ((ctx->frame + 1) >= ctx->frames))
    return (1) ;

  if ((ctx->run_time > 1e-3f) && (ctx->time >= ctx->run_time))
    return (1);

  return (0);
}

static void
player_render_loop_begin(context_t *ctx)
{
  if (ctx->verbose > 0) {
    fprintf(stderr, "Using origin of time: %lu.%09lu\n",
            ctx->shader_origin_time.tv_sec, ctx->shader_origin_time.tv_nsec);
  }
}

static int
player_receive_exit(const context_t *ctx)
{
  native_gfx_t *gfx;
  int recv_exit;

  gfx = egl_get_native_gfx(ctx->egl);
  recv_exit = native_gfx_request_exit(gfx);

  return (recv_exit);
}

static int
player_render_loop_iter(context_t *ctx)
{
    int last_frame;

    last_frame = is_last_frame(ctx);

    draw(ctx);

    if ((ctx->dump_frame == DUMP_FRAME_ALL)
        || ((ctx->dump_frame == DUMP_FRAME_LAST) && last_frame))
      dump_framebuffer_to_ppm(ctx);

    egl_swap_buffers(ctx->egl);

    if (ctx->frame_sleep > 0)
      usleep(ctx->frame_sleep);

    update_time(ctx);

    if (ctx->verbose > 0)
      report_fps(stderr, ctx);

    ctx->frame++;

    if (last_frame)
      return 0;

    if (player_receive_exit(ctx))
      return 0;

    return 1;
}

static void
player_render_loop_end(context_t *ctx)
{
  XglFinish();

  if (ctx->verbose > 0) {
    float render_time;
    int f;

    render_time = get_rendering_time(ctx);
    f = ctx->frame;
    fprintf(stderr,
            "glslsanbox-player: exiting after %i frame%s "
            "in %.3f s (avg rate %.3f fps).\n",
            f,
            (f > 1) ? "s" : "",
            render_time,
            (float)f / render_time);
  }
}

#ifdef __EMSCRIPTEN__
static void em_render_frame(void *arg)
{
  context_t *ctx = (context_t *)arg;
  int run;

  run = player_render_loop_iter(ctx);

  if (run == 0) {
    emscripten_cancel_main_loop();
    player_render_loop_end(ctx);
    player_cleanup(ctx);
    cleanup_ctx(ctx);

    /* We use emscripten_force_exit() instead of exit() because we are
     * in an Emscripten emulated infinite main loop. Emulation is done
     * with an asynchronous operation, which will prevent the
     * Emscripten runtime to quit with a normal exit(). */
    emscripten_force_exit(EXIT_SUCCESS);
  }
}

static void
player_render_loop(context_t *ctx)
{
  static const int fps = 0;
  static const int simulate_infinite_loop = EM_TRUE;

  player_render_loop_begin(ctx);
  emscripten_set_main_loop_arg(em_render_frame, (void *)ctx,
                               fps, simulate_infinite_loop);
  /* emscripten_set_main_loop_arg() never returns, because
   * simulate_infinite_loop is EM_TRUE. See Emscripten function
   * documentation. */
}

#else /* __EMSCRIPTEN__ */

static void
player_render_loop(context_t *ctx)
{
  int run;

  player_render_loop_begin(ctx);

  run = 1;
  while (run != 0) {
    run = player_render_loop_iter(ctx);
  }

  player_render_loop_end(ctx);
}
#endif /* __EMSCRIPTEN__ */

int
main(int argc, char *argv[])
{
  context_t _ctx;
  context_t *ctx;

  ctx = &_ctx;
  init_ctx(ctx);

  parse_cmdline(ctx, argc, argv);

  if (ctx->verbose > 0)
    fprintf(stderr, "\nStarting glslsanbox-player\n\n");

  if (ctx->print_shader) {
    fprintf(stderr, "------------[ begin of shader code ]------------\n");
    fprintf(stderr, "%s\n", get_shader_code(ctx));
    fprintf(stderr, "-------------[ end of shader code ]-------------\n\n");
  }

  ctx->egl = egl_init(ctx->width, ctx->height, ctx->winxpos, ctx->winypos);
  ctx->width = ctx->egl->width;
  ctx->height = ctx->egl->height;

  if (ctx->swap_interval >= 0) {
    egl_swap_interval(ctx->egl, ctx->swap_interval);
  }

  if (ctx->use_fbo) {
    if (ctx->fbo_size_div > 0) {
      ctx->fbo_width = ctx->width / ctx->fbo_size_div;
      ctx->fbo_height = ctx->height / ctx->fbo_size_div;
    }
    if (ctx->fbo_width == 0)
      ctx->fbo_width = ctx->width;
    if (ctx->fbo_height == 0)
      ctx->fbo_height = ctx->height;
    ctx->shader_width = ctx->fbo_width;
    ctx->shader_height = ctx->fbo_height;
  }
  else {
    ctx->shader_width = ctx->width;
    ctx->shader_height = ctx->height;
  }

  if (ctx->verbose > 1) {
    fprintf_sysinfo(stderr);
    fprintf_info(stderr);
  }

  if ((ctx->verbose > 0)) {
#ifdef ENABLE_SDL2
    fprintf(stderr, "SDL2                        :\n");
    fprintf(stderr, "Video system                : %s\n\n",
            SDL_GetCurrentVideoDriver());
#else
    fprintf_egl_info(stderr, ctx->verbose);
    if (ctx->verbose > 2) {
      fprintf(stderr, "EGL Config Attributes       :\n");
      egl_fprintf_config_attribs(stderr, "    ",
                                 ctx->egl->dpy, ctx->egl->cfg);
    }
    fprintf(stderr, "\n");
#endif /* ENABLE_SDL2 */

    fprintf_gles_info(stderr, ctx->verbose);

    if (is_using_builtin_shader(ctx)) {
      fprintf(stderr, "Running shader \"%s\" (GLSL Sandbox ID: %i.%i, builtin ID: %i)\n",
              glslsandbox_shaders_g[ctx->run_shader].nick,
              glslsandbox_shaders_g[ctx->run_shader].id,
              glslsandbox_shaders_g[ctx->run_shader].rev,
              ctx->run_shader);
      fprintf(stderr, "Available online at: http://glslsandbox.com/e#%i.%i\n",
              glslsandbox_shaders_g[ctx->run_shader].id,
              glslsandbox_shaders_g[ctx->run_shader].rev);
      fprintf(stderr, "PLEASE make sure to check original license and "
              "give credit to the original author(s).\n");
    }

    fprintf(stderr, "Frame rate will be reported every %i frames\n",
            ctx->report_fps_count);

    fprintf(stderr, "Rendering on a %ix%i window\n", ctx->width, ctx->height);

    if (ctx->use_fbo)
      fprintf(stderr, "Using a %ix%i FBO\n", ctx->fbo_width, ctx->fbo_height);
  }

  setup(ctx);

  init_render_start_time(ctx);

  player_render_loop_warmup(ctx);
  player_render_loop(ctx);

  player_cleanup(ctx);

  cleanup_ctx(ctx);

  return (0);
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
