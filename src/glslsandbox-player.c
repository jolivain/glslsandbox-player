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
#include <GLES2/gl2.h>
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <getopt.h>
#include <string.h>
#include <sys/utsname.h>

#include <time.h>
#include <errno.h>
#include <math.h>

#include "glslsandbox-shaders.h"
#include "native_gfx.h"
#include "egl_helper.h"
#include "gles_helper.h"

#include "glslsandbox-player.h"

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

static void
player_cleanup(context_t *ctx)
{
  glFinish();
  assert( gles_no_error() );

  glUseProgram(0);
  assert( gles_no_error() );

  glDetachShader(ctx->gl_prog, ctx->vertex_shader);
  assert( gles_no_error() );

  glDetachShader(ctx->gl_prog, ctx->fragment_shader);
  assert( gles_no_error() );

  glDeleteShader(ctx->vertex_shader);
  assert( gles_no_error() );

  glDeleteShader(ctx->fragment_shader);
  assert( gles_no_error() );

  glDeleteProgram(ctx->gl_prog);
  assert( gles_no_error() );
}

static void
cleanup_ctx(context_t *ctx)
{
  if (ctx->user_shader)
    free(ctx->user_shader);

  clean_egl(ctx->egl);
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
    return (NULL);
  }

  fsize = (size_t)ftell(fp);
  rewind(fp);

  file_content = malloc(fsize + 1);
  if (file_content == NULL) {
    fprintf(stderr, "ERROR: malloc(): error %i: %s\n", errno, strerror(errno));
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

static GLuint
load_shader(GLenum type, const char *shaderSrc)
{
  GLuint shader;
  GLint compiled;

  shader = glCreateShader(type);
  assert( gles_no_error() );

  if (shader == 0)
    return (0);

  glShaderSource(shader, 1, &shaderSrc, NULL);
  assert( gles_no_error() );

  glCompileShader(shader);
  assert( gles_no_error() );

  glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);
  assert( gles_no_error() );

  if ( ! compiled ) {
    GLint infoLen = 0;

    glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);
    assert( gles_no_error() );

    if (infoLen > 1) {
      char* infoLog = malloc(infoLen);

      glGetShaderInfoLog(shader, infoLen, NULL, infoLog);
      assert( gles_no_error() );

      fprintf(stderr, "Error compiling shader:\n%s\n", infoLog);

      free(infoLog);
    }

    glDeleteShader ( shader );
    assert( gles_no_error() );

    return (0);
  }

  return (shader);
}


static void
load_program(context_t *ctx,
             const char *v_shader_src, const char *f_shader_src)
{
  GLuint vsh;
  GLuint fsh;
  GLuint prog;
  GLint  linked;

  vsh = load_shader(GL_VERTEX_SHADER, v_shader_src);
  if (vsh == 0)
    return ;

  fsh = load_shader(GL_FRAGMENT_SHADER, f_shader_src);
  if (fsh == 0) {
    glDeleteShader(vsh);
    assert( gles_no_error() );
    return ;
  }

  prog = glCreateProgram();
  if (prog == 0) {
    glDeleteShader(vsh);
    assert( gles_no_error() );
    glDeleteShader(fsh);
    assert( gles_no_error() );
    return ;
  }

  glAttachShader(prog, vsh);
  assert( gles_no_error() );

  glAttachShader(prog, fsh);
  assert( gles_no_error() );

  glLinkProgram(prog);
  assert( gles_no_error() );

  glGetProgramiv(prog, GL_LINK_STATUS, &linked);
  assert( gles_no_error() );

  if ( linked != GL_TRUE ) {
    GLint info_len = 0;

    glGetProgramiv(prog, GL_INFO_LOG_LENGTH, &info_len);
    assert( gles_no_error() );

    if (info_len > 1) {
      char* info_log = malloc(info_len);
      if (info_log == NULL) {
        fprintf(stderr, "ERROR: malloc(): errno %i: %s\n",
                errno, strerror(errno));
        exit(EXIT_FAILURE);
      }

      glGetProgramInfoLog(prog, info_len, NULL, info_log);
      assert( gles_no_error() );

      fprintf(stderr, "Error linking program:\n%s\n", info_log);

      free(info_log);
    }

    glDeleteShader(vsh);
    assert( gles_no_error() );
    glDeleteShader(fsh);
    assert( gles_no_error() );
    glDeleteProgram(prog);
    assert( gles_no_error() );
  }

  ctx->vertex_shader = vsh;
  ctx->fragment_shader = fsh;
  ctx->gl_prog = prog;
}

static void
setup(context_t *ctx)
{
  EGLBoolean ret;

  load_program(ctx,
               vertex_shader_g, get_shader_code(ctx));
  if (ctx->gl_prog == 0) {
    fprintf(stderr, "ERROR: while loading shaders and program.\n");
    exit(EXIT_FAILURE);
  }

  glUseProgram(ctx->gl_prog);
  assert( gles_no_error() );
  ctx->a_pos = glGetAttribLocation(ctx->gl_prog, "a_pos");
  assert( gles_no_error() );

  glEnableVertexAttribArray(ctx->a_pos);
  assert( gles_no_error() );

  ctx->a_surfacePosition = glGetAttribLocation(ctx->gl_prog, "a_surfacePosition");
  assert( gles_no_error() );

  if (ctx->a_surfacePosition >= 0) {
    glEnableVertexAttribArray(ctx->a_surfacePosition);
    assert( gles_no_error() );
  }

  glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
  assert( gles_no_error() );

  ctx->u_time = glGetUniformLocation(ctx->gl_prog, "time");
  assert( gles_no_error() );

  ctx->u_resolution = glGetUniformLocation(ctx->gl_prog, "resolution");
  assert( gles_no_error() );

  if (ctx->u_resolution >= 0) {
    glUniform2f(ctx->u_resolution, (float)ctx->width, (float)ctx->height);
    assert( gles_no_error() );
  }

  ctx->u_surfaceSize = glGetUniformLocation(ctx->gl_prog, "surfaceSize");
  assert( gles_no_error() );

  if (ctx->u_surfaceSize >= 0) {
    glUniform2f(ctx->u_surfaceSize, (float)ctx->width / (float)ctx->height, 1.0f);
    assert( gles_no_error() );
  }

  ctx->u_mouse = glGetUniformLocation(ctx->gl_prog, "mouse");
  assert( gles_no_error() );

  if (ctx->u_mouse >= 0) {
    glUniform2f(ctx->u_mouse, 0.5f, 0.5f);
    assert( gles_no_error() );
  }

  glViewport(0, 0, ctx->width, ctx->height);
  assert( gles_no_error() );

  glClear(GL_COLOR_BUFFER_BIT);
  assert( gles_no_error() );

  ret = eglSwapBuffers(ctx->egl->dpy, ctx->egl->surf);
  assert( ret == EGL_TRUE );
  assert( egl_no_error() );
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
draw(context_t *ctx)
{
  EGLBoolean ret;
  GLfloat surfPos[8] = {
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0
  };
  static const GLfloat plane[] = {
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0
  };

  if (ctx->u_time >= 0) {
    glUniform1f(ctx->u_time, ctx->time * ctx->time_factor);
    assert( gles_no_error() );
  }

  if (ctx->u_mouse >= 0 && ctx->enable_mouse_emu) {
    float m;

    m = M_PI * ctx->time * ctx->mouse_emu_speed;
    glUniform2f(ctx->u_mouse,
                0.5f + sinf(0.125f * m) * 0.4f,
                0.5f + sinf(0.250f * m) * 0.4f);
    assert( gles_no_error() );
  }

  glClear(GL_COLOR_BUFFER_BIT);
  assert( gles_no_error() );

  glVertexAttribPointer(ctx->a_pos, 2, GL_FLOAT, GL_FALSE,
                        0, plane);
  assert( gles_no_error() );

  if (ctx->a_surfacePosition >= 0) {
    if (ctx->enable_surfpos_anim) {
      float sp;

      sp = M_PI * ctx->time * ctx->surfpos_anim_speed;
      compute_surface_position(surfPos,
                               sinf(0.125f * sp),
                               sinf(0.250f * sp),
                               1.0f + sinf(0.05f * sp) * 0.75f);
    }
    glVertexAttribPointer(ctx->a_surfacePosition, 2, GL_FLOAT, GL_FALSE,
                          0, surfPos);
    assert( gles_no_error() );
  }

  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
  assert( gles_no_error() );

  ret = eglSwapBuffers(ctx->egl->dpy, ctx->egl->surf);
  assert( ret == EGL_TRUE );
  assert( egl_no_error() );
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
get_shader_id_by_name(const char *name)
{
  const glslsandbox_shaders_t *s;
  int i;

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

  fprintf(fp, "# Builtin shader list:\n");
  fprintf(fp, "#\n");
  fprintf(fp, "# 1st column: internal id\n");
  fprintf(fp, "# 2nd column: glslsandbox.com id\n");
  fprintf(fp, "# 3rd column: nickname\n");
  fprintf(fp, "# 4th column: line of glsl code\n");
  fprintf(fp, "# 5th column: line of glsl statement code (line including a ';')\n");

  s = glslsandbox_shaders_g;
  for (i = 0; s[i].nick != NULL; ++i) {\
      int ln;
      int st;
      get_line_counts(s[i].frag, &ln, &st);
      fprintf(fp, "%i\t%6i.%-3i\t%-24s\t%i\t%i\n", i, s[i].id, s[i].rev, s[i].nick,
              ln, st);
  }
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
  fprintf(stderr, "  -m: disable mouse movement emulation\n");
  fprintf(stderr, "  -M <f>: set mouse movement speed factor\n");
  fprintf(stderr, "  -s <f>: set time speed factor\n");
  fprintf(stderr, "  -u: disable surfacePosition varying animation\n");
  fprintf(stderr, "  -U <f>: set surfacePosittion animation speed factor\n");
  fprintf(stderr, "  -W <n>: set window width to n\n");
  fprintf(stderr, "  -H <n>: set window height to n\n");
  fprintf(stderr, "  -r <n>: report frame rate every n frames\n");
  fprintf(stderr, "  -w <n>: set the number of warmup frames\n");
  fprintf(stderr, "  -v: increase verbosity level\n");
  fprintf(stderr, "  -q: run quietly\n");
  fprintf(stderr, "\n");
}

static void
parse_cmdline(context_t *ctx, int argc, char *argv[])
{
  int i;
  int opt;
  char *endptr;

  while ((opt = getopt(argc, argv, "f:F:hH:i:I:lLmM:pqr:s:S:t:uU:vw:W:")) != -1) {

    switch (opt) {

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

    case 'p':
      ctx->print_shader = 1;
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

    case 'u':
      ctx->enable_surfpos_anim = 0;
      break ;

    case 'U':
      ctx->surfpos_anim_speed = atof(optarg);
      break ;

    case 'v':
      ctx->verbose++;
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

  /* animation time is computed from first_frame_time.
   * in case there is no warmup frame, we need to init
   * first_frame_time here. */
  if (ctx->warmup_frames == 0)
    memcpy(&ctx->first_frame_time, &ctx->render_start_time,
           sizeof (ctx->first_frame_time));

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
  ctx->time = get_float_reltime(&ctx->first_frame_time);
}

static void
init_ctx(context_t *ctx)
{
  memset(ctx, 0, sizeof (*ctx));

  ctx->verbose = 1;
  ctx->time_factor = 1.0f;
  ctx->enable_mouse_emu = 1;
  ctx->mouse_emu_speed = 1.0f;
  ctx->enable_surfpos_anim = 1;
  ctx->surfpos_anim_speed = 1.0f;
  ctx->report_fps_count = 100;
  ctx->warmup_frames = 3;

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

#if defined (ENABLE_X11)
  fprintf(fp, "Native window system        : X11\n");
#elif defined (ENABLE_VIVFB)
  fprintf(fp, "Native window system        : Vivante FB\n");
#else
# warning "Native window system is not defined in info function"
#endif

  fprintf(fp, "\n");
}

static void
fprintf_sysinfo(FILE *fp)
{
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
}

static void
fprintf_gles_info(FILE *fp, int verbose)
{
  const char *vendor;
  const char *version;
  const char *slver;
  const char *exts;

  vendor = (const char *)glGetString(GL_VENDOR);
  assert( gles_no_error() );
  if (vendor == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_VENDOR) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  version = (const char *)glGetString(GL_VERSION);
  assert( gles_no_error() );
  if (version == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_VERSION) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  slver = (const char *)glGetString(GL_SHADING_LANGUAGE_VERSION);
  assert( gles_no_error() );
  if (slver == NULL) {
    fprintf(stderr, "ERROR: glGetString(GL_SHADING_LANGUAGE_VERSION) returned NULL\n");
    exit(EXIT_FAILURE);
  }

  fprintf(fp, "OpenGL ES driver information:\n");
  fprintf(fp, "GL_VENDOR                   : %s\n", vendor);
  fprintf(fp, "GL_VERSION                  : %s\n", version);
  fprintf(fp, "GL_SHADING_LANGUAGE_VERSION : %s\n", slver);

  if (verbose > 1) {
    exts = (const char *)glGetString(GL_EXTENSIONS);
    assert( gles_no_error() );
    if (exts == NULL) {
      fprintf(stderr, "ERROR: glGetString(GL_EXTENSIONS) returned NULL\n");
      exit(EXIT_FAILURE);
    }
    fprintf(fp, "GL_EXTENSIONS               : %s\n", exts);
  }

  fprintf(fp, "\n");
}

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

  fprintf(fp, "from_frame:%-7u to_frame:%-7u time:%-7.3f frame_rate:%-9.3f abstime=%.3f\n",
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

static void
player_render_loop(context_t *ctx)
{
  for (;;) {

    if ((ctx->frames > 0) && (ctx->frame >= ctx->frames))
      break ;

    if ((ctx->run_time > 1e-3f) && (ctx->time >= ctx->run_time))
      break ;

    draw(ctx);

    update_time(ctx);

    if (ctx->verbose > 0)
      report_fps(stderr, ctx);

    ctx->frame++;
  }

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

  ctx->egl = init_egl(ctx->width, ctx->height);
  ctx->width = ctx->egl->width;
  ctx->height = ctx->egl->height;

  if (ctx->verbose > 1) {
    fprintf_sysinfo(stderr);
    fprintf_info(stderr);
  }

  if ((ctx->verbose > 0)) {
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
