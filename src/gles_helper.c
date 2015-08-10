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
#include <GLES2/gl2.h>

#include "gles_helper.h"

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

int
_gles_no_error(const char *file, int line)
{
  GLenum gl_error;

  gl_error = glGetError();
  if (gl_error != GL_NO_ERROR) {
    fprintf(stderr, "%s:%i: glGetError(): 0x%x (%i): %s\n",
            file, line,
            gl_error, gl_error,
            strglerror(gl_error));
    return (0); /* FALSE */
  }

  return (1); /* TRUE */
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
