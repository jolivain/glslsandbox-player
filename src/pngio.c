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

#include <stdlib.h>
#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include <errno.h>

/* libpng 1.2 (shipped in Ubuntu 16.04 LTS for example) checks that
 * <setjmp.h> is not included before <png.h>.  This check is disabled
 * here. See:
 * https://sourceforge.net/p/libpng/code/ci/libpng-1.2.55-signed/tree/pngconf.h#l362
 * This check was removed in:
 * https://sourceforge.net/p/libpng/code/ci/6c2e919c7eb736d230581a4c925fa67bd901fcf8 */
#define PNG_SKIP_SETJMP_CHECK 1
#include <png.h>

#include "pngio.h"

/* Default libpng limit is 1000000x1000000 pixels.
 * This is a bit high for the usage in this case.
 * We declare smaller limits. */
#define PNG_MAX_WIDTH 65536u
#define PNG_MAX_HEIGHT PNG_MAX_WIDTH

void
read_png_file(const char *fname, unsigned char **img_data, int *img_width, int *img_height, int *img_channels)
{
  png_uint_32 rowbytes;
  png_byte *image_data;
  png_bytep *row_pointers;
  png_structp png_ptr;
  png_infop info_ptr;
  png_byte header[8];
  png_byte color_type;
  png_byte bit_depth;
  size_t header_sz;
  FILE *fp;
  size_t ret;
  png_uint_32 y;
  png_uint_32 width;
  png_uint_32 height;
  png_byte channels;
  int is_png;

  fp = fopen(fname, "rb");
  if (fp == NULL) {
    fprintf(stderr, "ERROR: fopen('%s'): %s\n", fname, strerror(errno));
    exit(EXIT_FAILURE);
  }

  ret = fread(header, 1, sizeof (header), fp);
  if (ret == 0) {
    if (ferror(fp)) {
      fprintf(stderr, "ERROR: fread('%s'): %s\n", fname, strerror(errno));
    }
    if (feof(fp)) {
      fprintf(stderr, "ERROR: fread('%s'): unexpected eod-of-file\n", fname);
    }
    fclose(fp);
    exit(EXIT_FAILURE);
  }
  header_sz = ret;

  is_png = png_sig_cmp(header, 0, header_sz);
  if (is_png) {
    fprintf(stderr, "ERROR: file '%s' is not a PNG file.\n", fname);
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING,
                                   NULL, NULL, NULL);
  if (png_ptr == NULL) {
    fprintf(stderr, "ERROR: png_create_read_struct() failed\n");
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  info_ptr = png_create_info_struct(png_ptr);
  if (info_ptr == NULL) {
    fprintf(stderr, "ERROR: png_create_info_struct()\n");
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  if ( setjmp( png_jmpbuf(png_ptr) ) ) {
    fprintf(stderr, "ERROR: while initializing PNG reader\n");
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  png_init_io(png_ptr, fp);
  png_set_sig_bytes(png_ptr, header_sz);

  png_read_info(png_ptr, info_ptr);

  png_set_user_limits(png_ptr, PNG_MAX_WIDTH, PNG_MAX_HEIGHT);

  width = png_get_image_width(png_ptr, info_ptr);

  if (width > PNG_MAX_WIDTH) {
    fprintf(stderr, "ERROR: PNG maximum width (%u) exceed limit (%u).",
            width, PNG_MAX_WIDTH);
    exit(EXIT_FAILURE);
  }
  
  height = png_get_image_height(png_ptr, info_ptr);

  if (height > PNG_MAX_HEIGHT) {
    fprintf(stderr, "ERROR: PNG maximum height (%u) exceed limit (%u).",
            width, PNG_MAX_HEIGHT);
    exit(EXIT_FAILURE);
  }

  color_type = png_get_color_type(png_ptr, info_ptr);
  if (   color_type != PNG_COLOR_TYPE_RGB
      && color_type != PNG_COLOR_TYPE_RGB_ALPHA
      && color_type != PNG_COLOR_TYPE_GRAY
      && color_type != PNG_COLOR_TYPE_GRAY_ALPHA) {
    fprintf(stderr, "ERROR: Code only support 8bits RGB, RGBA, GRAY and GRAY_ALPHA PNG files. "
            "(color type is %i)\n", color_type);
    exit(EXIT_FAILURE);
  }

  bit_depth = png_get_bit_depth(png_ptr, info_ptr);
  if (bit_depth != 8) {
    fprintf(stderr, "ERROR: Code only support 8bits RGB, RGBA, GRAY and GRAY_ALPHA PNG files. "
            "(bit depth is %i)\n", bit_depth);
    exit(EXIT_FAILURE);
  }

  channels = png_get_channels(png_ptr, info_ptr);
  if (channels < 1 || channels > 4) {
    fprintf(stderr, "ERROR: Channel number can only be between 1 and 4. "
            "(channels is %i)\n", channels);
    exit(EXIT_FAILURE);
  }

  png_read_update_info(png_ptr, info_ptr);
  if (setjmp(png_jmpbuf(png_ptr))) {
    fprintf(stderr, "ERROR: while reading PNG file '%s'\n", fname);
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  row_pointers = malloc(sizeof (png_bytep) * height);
  if (row_pointers == NULL) {
    fprintf(stderr, "ERROR: PNG: malloc(): Can't allocate memory\n");
    fclose(fp);
    exit(EXIT_FAILURE);
  }
  
  rowbytes = png_get_rowbytes(png_ptr, info_ptr);
  image_data = malloc(height * rowbytes);
  if (image_data == NULL) {
    fprintf(stderr, "ERROR: PNG: malloc(): Can't allocate memory\n");
    fclose(fp);
    exit(EXIT_FAILURE);
  }

  for (y = 0; y < height; ++y) {
    row_pointers[y] = &(image_data[y * rowbytes]);
  }

  png_read_image(png_ptr, row_pointers);

  free(row_pointers);

  png_destroy_read_struct(&png_ptr, &info_ptr, NULL);

  fclose(fp);

  *img_width    = width;
  *img_height   = height;
  *img_channels = channels;
  *img_data     = image_data;
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
