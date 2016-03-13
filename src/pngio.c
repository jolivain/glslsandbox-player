#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

#include <zlib.h>
#include <png.h>

#if 0
static void
image_to_png_rgba_rows(const image_t *image, const png_bytep *row_pointers)
{
  int x;
  int y;

  for (y = 0; y < image->height; ++y) {
    png_byte* row = row_pointers[y];
    for (x = 0; x < image->width; ++x) {
      png_byte* ptr = &(row[x*4]);
      pixel_t col;

      col = image_get_pixel(image, x, y);

      ptr[0] = col.rgba.r;
      ptr[1] = col.rgba.g;
      ptr[2] = col.rgba.b;
      ptr[3] = col.rgba.a;
    }
  }
}
#endif

#if 0
static void
png_rgba_to_image(const png_bytep *row_pointers, const image_t *image)
{
  int x;
  int y;

  for (y = 0; y < image->height; ++y) {
    png_byte* row = row_pointers[y];
    for (x = 0; x < image->width; ++x) {
      png_byte* ptr = &(row[x*4]);
      pixel_t col;

      col.value = 0;

      col.rgba.r = ptr[0];
      col.rgba.g = ptr[1];
      col.rgba.b = ptr[2];
      col.rgba.a = ptr[3];

      image_set_pixel(image, x, y, col);
    }
  }
}
#endif

#if 0
static void
png_rgb_to_image(const png_bytep *row_pointers, const image_t *image)
{
  int x;
  int y;

  for (y = 0; y < image->height; ++y) {
    png_byte* row = row_pointers[y];
    for (x = 0; x < image->width; ++x) {
      png_byte* ptr = &(row[x*3]);
      pixel_t col;

      col.value = 0;

      col.rgba.r = ptr[0];
      col.rgba.g = ptr[1];
      col.rgba.b = ptr[2];
      col.rgba.a = 0xFF;

      image_set_pixel(image, x, y, col);
    }
  }
}

static void
png_gray_to_image(const png_bytep *row_pointers, const image_t *image)
{
  int x;
  int y;

  for (y = 0; y < image->height; ++y) {
    png_byte* row = row_pointers[y];
    for (x = 0; x < image->width; ++x) {
      png_byte* ptr = &(row[x]);
      pixel_t col;

      col.value = 0;

      col.rgba.r = ptr[0];
      col.rgba.g = ptr[0];
      col.rgba.b = ptr[0];
      col.rgba.a = 0xFF;

      image_set_pixel(image, x, y, col);
    }
  }
}

static void
png_gray_alpha_to_image(const png_bytep *row_pointers, const image_t *image)
{
  int x;
  int y;

  for (y = 0; y < image->height; ++y) {
    png_byte* row = row_pointers[y];
    for (x = 0; x < image->width; ++x) {
      png_byte* ptr = &(row[x*2]);
      pixel_t col;

      col.value = 0;

      col.rgba.r = ptr[0];
      col.rgba.g = ptr[0];
      col.rgba.b = ptr[0];
      col.rgba.a = ptr[1];

      image_set_pixel(image, x, y, col);
    }
  }
}
#endif

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
  int header_sz;
  FILE *fp;
  size_t ret;
  int y;
  int width;
  int height;
  int channels;

  fp = fopen(fname, "rb");
  if (fp == NULL) {
    fprintf(stderr, "ERROR: fopen('%s'): %s\n", fname, strerror(errno));
    exit(EXIT_FAILURE);
  }

  ret = fread(header, 1, 8, fp);
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

  if (png_sig_cmp(header, 0, header_sz)) {
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
    exit(EXIT_FAILURE);
  }

  if ( setjmp( png_jmpbuf(png_ptr) ) ) {
    fprintf(stderr, "ERROR: while initializing PNG reader\n");
    exit(EXIT_FAILURE);
  }

  png_init_io(png_ptr, fp);
  png_set_sig_bytes(png_ptr, header_sz);

  png_read_info(png_ptr, info_ptr);

  width = png_get_image_width(png_ptr, info_ptr);
  height = png_get_image_height(png_ptr, info_ptr);

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

  /// XXX Allocate contiguous
  row_pointers = malloc( sizeof (png_bytep) * height);
  rowbytes = png_get_rowbytes(png_ptr, info_ptr);
  image_data = malloc( height * rowbytes );
  for (y = 0; y < height; ++y) {
    row_pointers[y] = &(image_data[y * rowbytes]);
  }

  png_read_image(png_ptr, row_pointers);

#if 0
  image = image_new(width, height);

  switch (color_type) {

  case PNG_COLOR_TYPE_RGB_ALPHA:
    png_rgba_to_image(row_pointers, image);
    break ;

  case PNG_COLOR_TYPE_RGB:
    png_rgb_to_image(row_pointers, image);
    break ;

  case PNG_COLOR_TYPE_GRAY:
    png_gray_to_image(row_pointers, image);
    break ;

  case PNG_COLOR_TYPE_GRAY_ALPHA:
    png_gray_alpha_to_image(row_pointers, image);
    break ;

  default:
    fprintf(stderr, "Unsupported color type %i\n", color_type);
    break ;
  }

  for (y = 0; y < height; y++)
    free(row_pointers[y]);
  free(row_pointers);
#endif
  free(row_pointers);

  png_destroy_read_struct(&png_ptr, &info_ptr, NULL);

  fclose(fp);

  *img_width    = width;
  *img_height   = height;
  *img_channels = channels;
  *img_data     = image_data;
}

#if 0
void
write_png_file(const image_t *image, const char* fname)
{
  png_bytep *row_pointers;
  png_structp png_ptr;
  png_infop info_ptr;
  FILE *fp;
  int y;

  fp = fopen(fname, "wb");
  if (fp == NULL) {
    fprintf(stderr, "ERROR: fopen('%s'): %s\n", fname, strerror(errno));
    exit(EXIT_FAILURE);
  }

  png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING,
				    NULL, NULL, NULL);
  if (png_ptr == NULL) {
    fprintf(stderr, "ERROR: png_create_write_struct() failed\n");
    exit(EXIT_FAILURE);
  }

  info_ptr = png_create_info_struct(png_ptr);
  if (info_ptr == NULL) {
    fprintf(stderr, "ERROR: png_create_info_struct()\n");
    exit(EXIT_FAILURE);
  }

  if ( setjmp( png_jmpbuf( png_ptr ) ) ) {
    fprintf(stderr, "ERROR: while initializing PNG writer\n");
    exit(EXIT_FAILURE);
  }

  png_init_io(png_ptr, fp);

  png_set_compression_level(png_ptr, Z_BEST_COMPRESSION);

  if ( setjmp( png_jmpbuf( png_ptr ) ) ) {
    fprintf(stderr, "ERROR: while writing header in '%s'\n", fname);
    exit(EXIT_FAILURE);
  }

  png_set_IHDR(png_ptr, info_ptr, image->width, image->height,
	       8, PNG_COLOR_TYPE_RGB_ALPHA, PNG_INTERLACE_NONE,
	       PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

  png_write_info(png_ptr, info_ptr);

  if ( setjmp( png_jmpbuf( png_ptr ) ) ) {
    fprintf(stderr, "ERROR: while writing data in '%s'\n", fname);
    exit(EXIT_FAILURE);
  }

  row_pointers = malloc( sizeof (png_bytep) * image->height);
  for (y = 0; y < image->height; ++y) {
    row_pointers[y] = malloc( png_get_rowbytes(png_ptr, info_ptr) );
  }

  image_to_png_rgba_rows(image, row_pointers);

  png_write_image(png_ptr, row_pointers);

  if ( setjmp( png_jmpbuf( png_ptr ) ) ) {
    fprintf(stderr,  "ERROR: while finishing writing '%s'\n", fname);
    exit(EXIT_FAILURE);
  }

  png_write_end(png_ptr, NULL);

  png_destroy_write_struct(&png_ptr, &info_ptr);

  for (y = 0; y < image->height; y++)
    free(row_pointers[y]);
  free(row_pointers);

  fclose(fp);
}
#endif
