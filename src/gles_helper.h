/*
 * GLES helper functions definitions
 */

/*
 * This program is distributer under the 2-clause BSD license.
 * See at the end of this file for details.
 */

#ifndef GLES_HELPER_H
#define GLES_HELPER_H

#define XGLES_STRICT 1

#if defined(XGLES_STRICT)

#include <GLES2/gl2.h>

void
__xgles_check_error(const char *file, int line, const char *func);

void
__xgles_glAttachShader(const char *file, int line, GLuint program, GLuint shader);

void
__xgles_glBindBuffer(const char *file, int line, GLenum target, GLuint buffer);

void
__xgles_glBindFramebuffer(const char *file, int line, GLenum target, GLuint framebuffer);

void
__xgles_glBindTexture(const char *file, int line, GLenum target, GLuint texture);

void
__xgles_glBlendColor(const char *file, int line, GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha);

void
__xgles_glBlendEquation(const char *file, int line, GLenum mode);

void
__xgles_glBlendEquationSeparate(const char *file, int line, GLenum modeRGB, GLenum modeAlpha);

void
__xgles_glBlendFunc(const char *file, int line, GLenum sfactor, GLenum dfactor);

void
__xgles_glBlendFuncSeparate(const char *file, int line, GLenum sfactorRGB, GLenum dfactorRGB, GLenum sfactorAlpha, GLenum dfactorAlpha);

void
__xgles_glBufferData(const char *file, int line, GLenum target, GLsizeiptr size, const void *data, GLenum usage);

GLenum
__xgles_glCheckFramebufferStatus(const char *file, int line, GLenum target);

void
__xgles_glClear(const char *file, int line, GLbitfield mask);

void
__xgles_glClearColor(const char *file, int line, GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha);

void
__xgles_glCompileShader(const char *file, int line, GLuint shader);

GLuint
__xgles_glCreateProgram(const char *file, int line);

GLuint
__xgles_glCreateShader(const char *file, int line, GLenum type);

void
__xgles_glDeleteBuffers(const char *file, int line, GLsizei n, const GLuint *buffers);

void
__xgles_glDeleteFramebuffers(const char *file, int line, GLsizei n, const GLuint *framebuffers);

void
__xgles_glDeleteProgram(const char *file, int line, GLuint program);

void
__xgles_glDeleteShader(const char *file, int line, GLuint shader);

void
__xgles_glDeleteTextures(const char *file, int line, GLsizei n, const GLuint *textures);

void
__xgles_glDetachShader(const char *file, int line, GLuint program, GLuint shader);

void
__xgles_glDepthFunc(const char *file, int line, GLenum func);

void
__xgles_glDepthMask(const char *file, int line, GLboolean flag);

void
__xgles_glDepthRangef(const char *file, int line, GLfloat n, GLfloat f);

void
__xgles_glDisable(const char *file, int line, GLenum cap);

void
__xgles_glDisableVertexAttribArray(const char *file, int line, GLuint index);

void
__xgles_glDrawArrays(const char *file, int line, GLenum mode, GLint first, GLsizei count);

void
__xgles_glEnable(const char *file, int line, GLenum cap);

void
__xgles_glEnableVertexAttribArray(const char *file, int line, GLuint index);

void
__xgles_glFinish(const char *file, int line);

void
__xgles_glFramebufferTexture2D(const char *file, int line, GLenum target, GLenum attachment, GLenum textarget, GLuint texture, GLint level);

void
__xgles_glGenFramebuffers(const char *file, int line, GLsizei n, GLuint *framebuffers);

void
__xgles_glGenBuffers(const char *file, int line, GLsizei n, GLuint *buffers);

void
__xgles_glGenTextures(const char *file, int line, GLsizei n, GLuint *textures);

GLint
__xgles_glGetAttribLocation(const char *file, int line, GLuint program, const GLchar *name);

void
__xgles_glGetIntegerv(const char *file, int line, GLenum pname, GLint *data);

void
__xgles_glGetProgramiv(const char *file, int line, GLuint program, GLenum pname, GLint *params);

void
__xgles_glGetProgramInfoLog(const char *file, int line, GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog);

void
__xgles_glGetShaderiv(const char *file, int line, GLuint shader, GLenum pname, GLint *params);

void
__xgles_glGetShaderInfoLog(const char *file, int line, GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog);

void
__xgles_glGetShaderPrecisionFormat(const char *file, int line, GLenum shadertype, GLenum precisiontype, GLint *range, GLint *precision);

void
__xgles_glGetShaderSource(const char *file, int line, GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *source);

const GLubyte *
__xgles_glGetString(const char *file, int line, GLenum name);

void
__xgles_glGetTexParameteriv(const char *file, int line, GLenum target, GLenum pname, GLint *params);

GLint
__xgles_glGetUniformLocation(const char *file, int line, GLuint program, const GLchar *name);

void
__xgles_glLinkProgram(const char *file, int line, GLuint program);

void
__xgles_glReadPixels(const char *file, int line, GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, void *pixels);

void
__xgles_glReleaseShaderCompiler(const char *file, int line);

#if defined(ENABLE_RPI) || defined(ENABLE_TISGX) || defined(ENABLE_MALI)
#define GL_SHADER_SOURCE_CONST
#else
#define GL_SHADER_SOURCE_CONST const
#endif

void
__xgles_glShaderSource(const char *file, int line, GLuint shader, GLsizei count, const GLchar * GL_SHADER_SOURCE_CONST *string, const GLint *length);

void
__xgles_glTexImage2D(const char *file, int line, GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, const void *pixels);

void
__xgles_glTexParameteri(const char *file, int line, GLenum target, GLenum pname, GLint param);

void
__xgles_glUniform1f(const char *file, int line, GLint location, GLfloat v0);

void
__xgles_glUniform1i(const char *file, int line, GLint location, GLint v0);

void
__xgles_glUniform2f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1);

void
__xgles_glUniform3f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1, GLfloat v2);

void
__xgles_glUniform4f(const char *file, int line, GLint location, GLfloat v0, GLfloat v1, GLfloat v2, GLfloat v3);

void
__xgles_glUniformMatrix4fv(const char *file, int line, GLint location, GLsizei count, GLboolean transpose, const GLfloat *value);

void
__xgles_glUseProgram(const char *file, int line, GLuint program);

void
__xgles_glValidateProgram(const char *file, int line, GLuint program);

void
__xgles_glVertexAttribPointer(const char *file, int line, GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer);

void
__xgles_glViewport(const char *file, int line, GLint x, GLint y, GLsizei width, GLsizei height);


#define XglAttachShader(program, shader) \
  __xgles_glAttachShader(__FILE__, __LINE__, program, shader)

#define XglBindFramebuffer(target, framebuffer) \
  __xgles_glBindFramebuffer(__FILE__, __LINE__, target, framebuffer)

#define XglBindBuffer(target, buffer) \
  __xgles_glBindBuffer(__FILE__, __LINE__, target, buffer)

#define XglBindTexture(target, texture) \
  __xgles_glBindTexture(__FILE__, __LINE__, target, texture)

#define XglBlendColor(red, green, blue, alpha) \
  __xgles_glBlendColor(__FILE__, __LINE__, red, green, blue, alpha)

#define XglBlendEquation(mode) \
  __xgles_glBlendEquation(__FILE__, __LINE__, mode)

#define XglBlendEquationSeparate(modeRGB, modeAlpha) \
  __xgles_glBlendEquationSeparate(__FILE__, __LINE__, modeRGB, modeAlpha)

#define XglBlendFunc(sfactor, dfactor) \
  __xgles_glBlendFunc(__FILE__, __LINE__, sfactor, dfactor)

#define XglBlendFuncSeparate(sfactorRGB, dfactoAlpha, sfactorAlpha, dfactorAlpha) \
  __xgles_glBlendFuncSeparate(__FILE__, __LINE__, sfactorRGB, dfactoAlpha, sfactorAlpha, dfactorAlpha)

#define XglBufferData(target, size, data, usage) \
  __xgles_glBufferData(__FILE__, __LINE__, target, size, data, usage)

#define XglCheckFramebufferStatus(target) \
  __xgles_glCheckFramebufferStatus(__FILE__, __LINE__, target)

#define XglClear(mask) \
  __xgles_glClear(__FILE__, __LINE__, mask)

#define XglClearColor(red, green, blue, alpha) \
  __xgles_glClearColor(__FILE__, __LINE__, red, green, blue, alpha)

#define XglCompileShader(shader) \
  __xgles_glCompileShader(__FILE__, __LINE__, shader)

#define XglCreateProgram() \
  __xgles_glCreateProgram(__FILE__, __LINE__)

#define XglCreateShader(type) \
  __xgles_glCreateShader(__FILE__, __LINE__, type)

#define XglDeleteBuffers(n, buffers) \
  __xgles_glDeleteBuffers(__FILE__, __LINE__, n, buffers)

#define XglDeleteFramebuffers(n, framebuffers) \
  __xgles_glDeleteFramebuffers(__FILE__, __LINE__, n, framebuffers)

#define XglDeleteProgram(program) \
  __xgles_glDeleteProgram(__FILE__, __LINE__, program)

#define XglDeleteShader(shader) \
  __xgles_glDeleteShader(__FILE__, __LINE__, shader)

#define XglDeleteTextures(n, textures) \
  __xgles_glDeleteTextures(__FILE__, __LINE__, n, textures)

#define XglDetachShader(program, shader) \
  __xgles_glDetachShader(__FILE__, __LINE__, program, shader)

#define XglDepthFunc(func) \
  __xgles_glDepthFunc(__FILE__, __LINE__, func)

#define XglDepthMask(flag) \
  __xgles_glDepthMask(__FILE__, __LINE__, flag)

#define XglDepthRangef(n, f) \
  __xgles_glDepthRangef(__FILE__, __LINE__, n, f)

#define XglDisable(cap) \
  __xgles_glDisable(__FILE__, __LINE__, cap)

#define XglDisableVertexAttribArray(index) \
  __xgles_glDisableVertexAttribArray(__FILE__, __LINE__, index)

#define XglDrawArrays(mode, first, count) \
  __xgles_glDrawArrays(__FILE__, __LINE__, mode, first, count)

#define XglEnable(cap) \
  __xgles_glEnable(__FILE__, __LINE__, cap)

#define XglEnableVertexAttribArray(index) \
  __xgles_glEnableVertexAttribArray(__FILE__, __LINE__, index)

#define XglFinish() \
  __xgles_glFinish(__FILE__, __LINE__)

#define XglFramebufferTexture2D(target, attachment, textarget, texture, level) \
  __xgles_glFramebufferTexture2D(__FILE__, __LINE__, target, attachment, textarget, texture, level)

#define XglGenBuffers(n, buffers) \
  __xgles_glGenBuffers(__FILE__, __LINE__, n, buffers)

#define XglGenFramebuffers(n, framebuffers) \
  __xgles_glGenFramebuffers(__FILE__, __LINE__, n, framebuffers)

#define XglGenTextures(n, textures) \
  __xgles_glGenTextures(__FILE__, __LINE__, n, textures)

#define XglGetAttribLocation(program, name) \
  __xgles_glGetAttribLocation(__FILE__, __LINE__, program, name)

#define XglGetIntegerv(pname, data) \
  __xgles_glGetIntegerv(__FILE__, __LINE__, pname, data)

#define XglGetProgramiv(program, pname, params) \
  __xgles_glGetProgramiv(__FILE__, __LINE__, program, pname, params)

#define XglGetProgramInfoLog(program, bufSize, length, infoLog) \
  __xgles_glGetProgramInfoLog(__FILE__, __LINE__, program, bufSize, length, infoLog)

#define XglGetShaderiv(shader, pname, params) \
  __xgles_glGetShaderiv(__FILE__, __LINE__, shader, pname, params)

#define XglGetShaderInfoLog(shader, bufSize, length, infoLog) \
  __xgles_glGetShaderInfoLog(__FILE__, __LINE__, shader, bufSize, length, infoLog)

#define XglGetShaderPrecisionFormat(shadertype, precisiontype, range, precision) \
  __xgles_glGetShaderPrecisionFormat(__FILE__, __LINE__, shadertype, precisiontype, range, precision)

#define XglGetShaderSource(shader, bufSize, length, source) \
  __xgles_glGetShaderSource(__FILE__, __LINE__, shader, bufSize, length, source)

#define XglGetString(name) \
  __xgles_glGetString(__FILE__, __LINE__, name)

#define XglGetTexParameteriv(target, pname, params) \
  __xgles_glGetTexParameteriv(__FILE__, __LINE__, target, pname, params)

#define XglGetUniformLocation(program, name) \
  __xgles_glGetUniformLocation(__FILE__, __LINE__, program, name)

#define XglLinkProgram(program) \
  __xgles_glLinkProgram(__FILE__, __LINE__, program)

#define XglReadPixels(x, y, width, height, format, type, pixels) \
  __xgles_glReadPixels(__FILE__, __LINE__, x, y, width, height, format, type, pixels)

#define XglReleaseShaderCompiler() \
  __xgles_glReleaseShaderCompiler(__FILE__, __LINE__)

#define XglShaderSource(shader, count, string, length) \
  __xgles_glShaderSource(__FILE__, __LINE__, shader, count, string, length)

#define XglTexImage2D(target, level, internalformat, width, height, border, format, type, pixels) \
  __xgles_glTexImage2D(__FILE__, __LINE__, target, level, internalformat, width, height, border, format, type, pixels)

#define XglTexParameteri(target, pname, param) \
  __xgles_glTexParameteri(__FILE__, __LINE__, target, pname, param)

#define XglUniform1f(location, v0) \
  __xgles_glUniform1f(__FILE__, __LINE__, location, v0)

#define XglUniform1i(location, v0) \
  __xgles_glUniform1i(__FILE__, __LINE__, location, v0)

#define XglUniform2f(location, v0, v1) \
  __xgles_glUniform2f(__FILE__, __LINE__, location, v0, v1)

#define XglUniform3f(location, v0, v1, v2) \
  __xgles_glUniform3f(__FILE__, __LINE__, location, v0, v1, v2)

#define XglUniform4f(location, v0, v1, v2, v3) \
  __xgles_glUniform4f(__FILE__, __LINE__, location, v0, v1, v2, v3)

#define XglUniformMatrix4fv(location, count, transpose, value) \
  __xgles_glUniformMatrix4fv(__FILE__, __LINE__, location, count, transpose, value)

#define XglUseProgram(program) \
  __xgles_glUseProgram(__FILE__, __LINE__, program)

#define XglValidateProgram(program) \
  __xgles_glValidateProgram(__FILE__, __LINE__, program)

#define XglVertexAttribPointer(index, size, type, normalized, stride, pointer) \
  __xgles_glVertexAttribPointer(__FILE__, __LINE__, index, size, type, normalized, stride, pointer)

#define XglViewport(x, y, width, height) \
  __xgles_glViewport(__FILE__, __LINE__, x, y, width, height)

#else /* defined(XGLES_STRICT) */

#define XglAttachShader(program, shader) \
  glAttachShader(program, shader)

#define XglBlendColor(red, green, blue, alpha) \
  glBlendColor(red, green, blue, alpha)

#define XglBlendEquation(mode) \
  glBlendEquation(mode)

#define XglBlendEquationSeparate(modeRGB, modeAlpha) \
  glBlendEquationSeparate(modeRGB, modeAlpha)

#define XglBlendFunc(sfactor, dfactor) \
  glBlendFunc(sfactor, dfactor)

#define XglBlendFuncSeparate(sfactorRGB, dfactoAlpha, sfactorAlpha, dfactorAlpha) \
  glBlendFuncSeparate(sfactorRGB, dfactoAlpha, sfactorAlpha, dfactorAlpha)

#define XglBindBuffer(target, buffer) \
  glBindBuffer(target, buffer)

#define XglBindFramebuffer(target, framebuffer) \
  glBindFramebuffer(target, framebuffer)

#define XglBindTexture(target, texture) \
  glBindTexture(target, texture)

#define XglBufferData(target, size, data, usage) \
  glBufferData(target, size, data, usage)

#define XglCheckFramebufferStatus(target) \
  glCheckFramebufferStatus(target)

#define XglClear(mask) \
  glClear(mask)

#define XglClearColor(red, green, blue, alpha) \
  glClearColor(red, green, blue, alpha)

#define XglCompileShader(shader) \
  glCompileShader(shader)

#define XglCreateProgram() \
  glCreateProgram()

#define XglCreateShader(type) \
  glCreateShader(type)

#define XglDeleteBuffers(n, buffers) \
  glDeleteBuffers(n, buffers)

#define XglDeleteFramebuffers(n, framebuffers) \
  glDeleteFramebuffers(n, framebuffers)

#define XglDeleteProgram(program) \
  glDeleteProgram(program)

#define XglDeleteShader(shader) \
  glDeleteShader(shader)

#define XglDeleteTextures(n, textures) \
  glDeleteTextures(n, textures)

#define XglDetachShader(program, shader) \
  glDetachShader(program, shader)

#define XglDepthFunc(func) \
  glDepthFunc(func)

#define XglDepthMask(flag) \
  glDepthMask(flag)

#define XglDepthRangef(n, f) \
  glDepthRangef(n, f)

#define XglDisable(cap) \
  glDisable(cap)

#define XglDisableVertexAttribArray(index) \
  glDisableVertexAttribArray(index)

#define XglDrawArrays(mode, first, count) \
  glDrawArrays(mode, first, count)

#define XglEnable(cap) \
  glEnable(cap)

#define XglEnableVertexAttribArray(index) \
  glEnableVertexAttribArray(index)

#define XglFinish() \
  glFinish()

#define XglFramebufferTexture2D(target, attachment, textarget, texture, level) \
  glFramebufferTexture2D(target, attachment, textarget, texture, level)

#define XglGenBuffers(n, buffers) \
  glGenBuffers(n, buffers)

#define XglGenFramebuffers(n, framebuffers) \
  glGenFramebuffers(n, framebuffers)

#define XglGenTextures(n, textures) \
  glGenTextures(n, textures)

#define XglGetAttribLocation(program, name) \
  glGetAttribLocation(program, name)

#define XglGetIntegerv(pname, data) \
  glGetIntegerv(pname, data)

#define XglGetProgramiv(program, pname, params) \
  glGetProgramiv(program, pname, params)

#define XglGetProgramInfoLog(program, bufSize, length, infoLog) \
  glGetProgramInfoLog(program, bufSize, length, infoLog)

#define XglGetShaderiv(shader, pname, params) \
  glGetShaderiv(shader, pname, params)

#define XglGetShaderInfoLog(shader, bufSize, length, infoLog) \
  glGetShaderInfoLog(shader, bufSize, length, infoLog)

#define XglGetShaderPrecisionFormat(shadertype, precisiontype, range, precision) \
  glGetShaderPrecisionFormat(shadertype, precisiontype, range, precision)

#define XglGetShaderSource(shader, bufSize, length, source) \
  glGetShaderSource(shader, bufSize, length, source)

#define XglGetString(name) \
  glGetString(name)

#define XglGetTexParameteriv(target, pname, params) \
  glGetTexParameteriv(target, pname, params)

#define XglGetUniformLocation(program, name) \
  glGetUniformLocation(program, name)

#define XglLinkProgram(program) \
  glLinkProgram(program)

#define XglReadPixels(x, y, width, height, format, type, pixels) \
  glReadPixels(x, y, width, height, format, type, pixels)

#define XglReleaseShaderCompiler() \
  glReleaseShaderCompiler()

#define XglShaderSource(shader, count, string, length) \
  glShaderSource(shader, count, string, length)

#define XglTexImage2D(target, level, internalformat, width, height, border, format, type, pixels) \
  glTexImage2D(target, level, internalformat, width, height, border, format, type, pixels)

#define XglTexParameteri(target, pname, param) \
  glTexParameteri(target, pname, param)

#define XglUniform1f(location, v0) \
  glUniform1f(location, v0)

#define XglUniform1i(location, v0) \
  glUniform1i(location, v0)

#define XglUniform2f(location, v0, v1) \
  glUniform2f(location, v0, v1)

#define XglUniform3f(location, v0, v1, v2) \
  glUniform3f(location, v0, v1, v2)

#define XglUniform4f(location, v0, v1, v2, v3) \
  glUniform4f(location, v0, v1, v2, v3)

#define XglUniformMatrix4fv(location, count, transpose, value) \
  glUniformMatrix4fv(location, count, transpose, value)

#define XglUseProgram(program) \
  glUseProgram(program)

#define XglValidateProgram(program) \
  glValidateProgram(program)

#define XglVertexAttribPointer(index, size, type, normalized, stride, pointer) \
  glVertexAttribPointer(index, size, type, normalized, stride, pointer)

#define XglViewport(x, y, width, height) \
  glViewport(x, y, width, height)

#endif /* defined(XGLES_STRICT) */

#endif /* GLES_HELPER_H */

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
