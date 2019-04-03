/*
 * GLES helper code
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
#include <GLES2/gl2.h>

#include "gles_helper.h"

#if defined(XGLES_STRICT)

static const char *
strglerror(GLenum error)
{
  const char *str;

  str = "Unknown GL error";

  switch (error) {

#define STR_GL_ERROR_CASE(x) \
  case (x):                  \
  str = #x;                  \
  break

    STR_GL_ERROR_CASE(GL_NO_ERROR);
    STR_GL_ERROR_CASE(GL_INVALID_ENUM);
    STR_GL_ERROR_CASE(GL_INVALID_VALUE);
    STR_GL_ERROR_CASE(GL_INVALID_OPERATION);
    STR_GL_ERROR_CASE(GL_INVALID_FRAMEBUFFER_OPERATION);
    STR_GL_ERROR_CASE(GL_OUT_OF_MEMORY);

#undef STR_GL_ERROR_CASE

  default:
    break ;
  }

  return (str);
}

static void
__xgles_on_error(void)
{
  exit(EXIT_FAILURE);
}

void
__xgles_check_error(const char *file, int line, const char *func)
{
  GLenum gl_error;

  gl_error = glGetError();
  if (gl_error != GL_NO_ERROR) {
    fprintf(stderr, "%s:%i: %s(): glGetError(): 0x%x (%i): %s\n",
            file, line, func,
            gl_error, gl_error,
            strglerror(gl_error));
    __xgles_on_error();
  }
}

void
__xgles_glAttachShader(const char *file, int line, GLuint program, GLuint shader)
{
  glAttachShader(program, shader);
  __xgles_check_error(file, line, "glAttachShader");
}

void
__xgles_glBufferData(const char *file, int line, GLenum target, GLsizeiptr size, const void *data, GLenum usage)
{
  glBufferData(target, size, data, usage);
  __xgles_check_error(file, line, "glBufferData");
}

void
__xgles_glBindBuffer(const char *file, int line, GLenum target, GLuint buffer)
{
  glBindBuffer(target, buffer);
  __xgles_check_error(file, line, "glBindBuffer");
}

void
__xgles_glBindFramebuffer(const char *file, int line, GLenum target, GLuint framebuffer)
{
  glBindFramebuffer(target, framebuffer);
  __xgles_check_error(file, line, "glBindFramebuffer");
}

void
__xgles_glBindTexture(const char *file, int line, GLenum target, GLuint texture)
{
  glBindTexture(target, texture);
  __xgles_check_error(file, line, "glBindTexture");
}

void
__xgles_glBlendColor(const char *file, int line, GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha)
{
  glBlendColor(red, green, blue, alpha);
  __xgles_check_error(file, line, "glBlendColor");
}

void
__xgles_glBlendEquation(const char *file, int line, GLenum mode)
{
  glBlendEquation(mode);
  __xgles_check_error(file, line, "glBlendEquation");
}

void
__xgles_glBlendEquationSeparate(const char *file, int line, GLenum modeRGB, GLenum modeAlpha)
{
  glBlendEquationSeparate(modeRGB, modeAlpha);
  __xgles_check_error(file, line, "glBlendEquationSeparate");
}

void
__xgles_glBlendFunc(const char *file, int line, GLenum sfactor, GLenum dfactor)
{
  glBlendFunc(sfactor, dfactor);
  __xgles_check_error(file, line, "glBlendFunc");
}

void
__xgles_glBlendFuncSeparate(const char *file, int line, GLenum sfactorRGB, GLenum dfactorRGB, GLenum sfactorAlpha, GLenum dfactorAlpha)
{
  glBlendFuncSeparate(sfactorRGB, dfactorRGB, sfactorAlpha, dfactorAlpha);
  __xgles_check_error(file, line, "glBlendFuncSeparate");
}

GLenum
__xgles_glCheckFramebufferStatus(const char *file, int line, GLenum target)
{
  GLenum ret;

  ret = glCheckFramebufferStatus(target);
  __xgles_check_error(file, line, "glCheckFramebufferStatus");

  return (ret);
}

void
__xgles_glClear(const char *file, int line, GLbitfield mask)
{
  glClear(mask);
  __xgles_check_error(file, line, "glClear");
}

void
__xgles_glClearColor(const char *file, int line, GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha)
{
  glClearColor(red, green, blue, alpha);
  __xgles_check_error(file, line, "glClearColor");
}

void
__xgles_glCompileShader(const char *file, int line, GLuint shader)
{
  glCompileShader(shader);
  __xgles_check_error(file, line, "glCompileShader");
}

GLuint
__xgles_glCreateProgram(const char *file, int line)
{
  GLuint ret;

  ret = glCreateProgram();
  __xgles_check_error(file, line, "glCreateProgram");

  if (ret == 0) {
    fprintf(stderr, "%s:%i: glCreateProgram(): ERROR: returned 0\n", file, line);
    __xgles_on_error();
  }

  return (ret);
}

GLuint
__xgles_glCreateShader(const char *file, int line, GLenum type)
{
  GLuint ret;

  ret = glCreateShader(type);
  __xgles_check_error(file, line, "glCreateShader");

  if (ret == 0) {
    fprintf(stderr, "%s:%i: glCreateShader(): ERROR: returned 0\n", file, line);
    __xgles_on_error();
  }

  return (ret);
}

void
__xgles_glDeleteBuffers(const char *file, int line, GLsizei n, const GLuint *buffers)
{
  glDeleteBuffers(n, buffers);
  __xgles_check_error(file, line, "glDeleteBuffers");
}

void
__xgles_glDeleteFramebuffers(const char *file, int line, GLsizei n, const GLuint *framebuffers)
{
  glDeleteFramebuffers(n, framebuffers);
  __xgles_check_error(file, line, "glDeleteFramebuffers");
}

void
__xgles_glDeleteProgram(const char *file, int line, GLuint program)
{
  glDeleteProgram(program);
  __xgles_check_error(file, line, "glDeleteProgram");
}

void
__xgles_glDeleteShader(const char *file, int line, GLuint shader)
{
  glDeleteShader(shader);
  __xgles_check_error(file, line, "glDeleteShader");
}

void
__xgles_glDeleteTextures(const char *file, int line, GLsizei n, const GLuint *textures)
{
  glDeleteTextures(n, textures);
  __xgles_check_error(file, line, "glDeleteTextures");
}

void
__xgles_glDepthFunc(const char *file, int line, GLenum func)
{
  glDepthFunc(func);
  __xgles_check_error(file, line, "glDepthFunc");
}

void
__xgles_glDepthMask(const char *file, int line, GLboolean flag)
{
  glDepthMask(flag);
  __xgles_check_error(file, line, "glDepthMask");
}

void
__xgles_glDepthRangef(const char *file, int line, GLfloat n, GLfloat f)
{
  glDepthRangef(n, f);
  __xgles_check_error(file, line, "glDepthRangef");
}

void
__xgles_glDetachShader(const char *file, int line, GLuint program, GLuint shader)
{
  glDetachShader(program, shader);
  __xgles_check_error(file, line, "glDetachShader");
}

void
__xgles_glDisable(const char *file, int line, GLenum cap)
{
  glDisable(cap);
  __xgles_check_error(file, line, "glDisable");
}

void
__xgles_glDisableVertexAttribArray(const char *file, int line, GLuint index)
{
  glDisableVertexAttribArray(index);
  __xgles_check_error(file, line, "glDisableVertexAttribArray");
}

void
__xgles_glDrawArrays(const char *file, int line, GLenum mode, GLint first, GLsizei count)
{
  glDrawArrays(mode, first, count);
  __xgles_check_error(file, line, "glDrawArrays");
}

void
__xgles_glEnable(const char *file, int line, GLenum cap)
{
  glEnable(cap);
  __xgles_check_error(file, line, "glEnable");
}

void
__xgles_glEnableVertexAttribArray(const char *file, int line, GLuint index)
{
  glEnableVertexAttribArray(index);
  __xgles_check_error(file, line, "glEnableVertexAttribArray");
}

void
__xgles_glFinish(const char *file, int line)
{
  glFinish();
  __xgles_check_error(file, line, "glFinish");
}

void
__xgles_glFramebufferTexture2D(const char *file, int line, GLenum target, GLenum attachment, GLenum textarget, GLuint texture, GLint level)
{
  glFramebufferTexture2D(target, attachment, textarget, texture, level);
  __xgles_check_error(file, line, "glFramebufferTexture2D");
}

void
__xgles_glGenBuffers(const char *file, int line, GLsizei n, GLuint *buffers)
{
  glGenBuffers(n, buffers);
  __xgles_check_error(file, line, "glGenBuffers");
}

void
__xgles_glGenFramebuffers(const char *file, int line, GLsizei n, GLuint *framebuffers)
{
  glGenFramebuffers(n, framebuffers);
  __xgles_check_error(file, line, "glGenFramebuffers");
}

void
__xgles_glGenTextures(const char *file, int line, GLsizei n, GLuint *textures)
{
  glGenTextures(n, textures);
  __xgles_check_error(file, line, "glGenTextures");
}

GLint
__xgles_glGetAttribLocation(const char *file, int line, GLuint program, const GLchar *name)
{
  GLint ret;

  ret = glGetAttribLocation(program, name);
  __xgles_check_error(file, line, "glGetAttribLocation");

  /* Do not fail in case the attribute is not found */

  return (ret);
}

void
__xgles_glGetIntegerv(const char *file, int line, GLenum pname, GLint *data)
{
  glGetIntegerv(pname, data);
  __xgles_check_error(file, line, "glGetIntegerv");
}

void
__xgles_glGetProgramiv(const char *file, int line, GLuint program, GLenum pname, GLint *params)
{
  glGetProgramiv(program, pname, params);
  __xgles_check_error(file, line, "glGetProgramiv");
}

void
__xgles_glGetProgramInfoLog(const char *file, int line, GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog)
{
  glGetProgramInfoLog(program, bufSize, length, infoLog);
  __xgles_check_error(file, line, "glGetProgramInfoLog");
}

void
__xgles_glGetShaderiv(const char *file, int line, GLuint shader, GLenum pname, GLint *params)
{
  glGetShaderiv(shader, pname, params);
  __xgles_check_error(file, line, "glGetShaderiv");
}

void
__xgles_glGetShaderInfoLog(const char *file, int line, GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog)
{
  glGetShaderInfoLog(shader, bufSize, length, infoLog);
  __xgles_check_error(file, line, "glGetShaderInfoLog");
}

void
__xgles_glGetShaderPrecisionFormat(const char *file, int line, GLenum shadertype, GLenum precisiontype, GLint *range, GLint *precision)
{
  glGetShaderPrecisionFormat(shadertype, precisiontype, range, precision);
  __xgles_check_error(file, line, "glGetShaderInfoLog");
}

void
__xgles_glGetShaderSource(const char *file, int line, GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *source)
{
  glGetShaderSource(shader, bufSize, length, source);
  __xgles_check_error(file, line, "glGetShaderSource");
}

const GLubyte *
__xgles_glGetString(const char *file, int line, GLenum name)
{
  const GLubyte *ret;

  ret = glGetString(name);
  __xgles_check_error(file, line, "glGetString");

  return (ret);
}

void
__xgles_glGetTexParameteriv(const char *file, int line, GLenum target, GLenum pname, GLint *params)
{
  glGetTexParameteriv(target, pname, params);
  __xgles_check_error(file, line, "glGetTexParameteriv");
}

GLint
__xgles_glGetUniformLocation(const char *file, int line, GLuint program, const GLchar *name)
{
  GLint ret;

  ret = glGetUniformLocation(program, name);
  __xgles_check_error(file, line, "glGetUniformLocation");

  /* Do not fail in case the attribute is not found */

  return (ret);
}

void
__xgles_glLinkProgram(const char *file, int line, GLuint program)
{
  glLinkProgram(program);
  __xgles_check_error(file, line, "glLinkProgram");
}

void
__xgles_glReadPixels(const char *file, int line, GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, void *pixels)
{
  glReadPixels(x, y, width, height, format, type, pixels);
  __xgles_check_error(file, line, "glReadPixels");
}

void
__xgles_glReleaseShaderCompiler(const char *file, int line)
{
  glReleaseShaderCompiler();
  __xgles_check_error(file, line, "glReleaseShaderCompiler");
}

void
__xgles_glShaderSource(const char *file, int line, GLuint shader, GLsizei count, const GLchar * GL_SHADER_SOURCE_CONST *string, const GLint *length)
{
  glShaderSource(shader, count, string, length);
  __xgles_check_error(file, line, "glShaderSource");
}

void
__xgles_glTexImage2D(const char *file, int line, GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, const void *pixels)
{
  glTexImage2D(target, level, internalformat, width, height, border, format, type, pixels);
  __xgles_check_error(file, line, "glTexImage2D");
}

void
__xgles_glTexParameteri(const char *file, int line, GLenum target, GLenum pname, GLint param)
{
  glTexParameteri(target, pname, param);
  __xgles_check_error(file, line, "glTexParameteri");
}

void
__xgles_glUniform1f(const char *file, int line, GLint location, GLfloat v0)
{
  glUniform1f(location, v0);
  __xgles_check_error(file, line, "glUniform1f");
}

void
__xgles_glUniform1i(const char *file, int line, GLint location, GLint v0)
{
  glUniform1i(location, v0);
  __xgles_check_error(file, line, "glUniform1i");
}

void
__xgles_glUniform2f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1)
{
  glUniform2f(location, v0, v1);
  __xgles_check_error(file, line, "glUniform2f");
}

void
__xgles_glUniform3f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1, GLfloat v2)
{
  glUniform3f(location, v0, v1, v2);
  __xgles_check_error(file, line, "glUniform3f");
}

void
__xgles_glUniform4f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1, GLfloat v2, GLfloat v3)
{
  glUniform4f(location, v0, v1, v2, v3);
  __xgles_check_error(file, line, "glUniform4f");
}

void
__xgles_glUniformMatrix4fv(const char *file, int line, GLint location, GLsizei count, GLboolean transpose, const GLfloat *value)
{
  glUniformMatrix4fv(location, count, transpose, value);
  __xgles_check_error(file, line, "glUniformMatrix4fv");
}

void
__xgles_glUseProgram(const char *file, int line, GLuint program)
{
  glUseProgram(program);
  __xgles_check_error(file, line, "glUseProgram");
}

void
__xgles_glValidateProgram(const char *file, int line, GLuint program)
{
  glValidateProgram(program);
  __xgles_check_error(file, line, "glValidateProgram");
}

void
__xgles_glVertexAttribPointer(const char *file, int line, GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer)
{
  glVertexAttribPointer(index, size, type, normalized, stride, pointer);
  __xgles_check_error(file, line, "glVertexAttribPointer");
}

void
__xgles_glViewport(const char *file, int line, GLint x, GLint y, GLsizei width, GLsizei height)
{
  glViewport(x, y, width, height);
  __xgles_check_error(file, line, "glViewport");
}

#endif /* defined(XGLES_STRICT) */

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
