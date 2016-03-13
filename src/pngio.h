#ifndef _PNGIO_H_
#define _PNGIO_H_

#include <png.h>

void
read_png_file(const char *fname, unsigned char **img_data, int *img_width, int *img_height, int *img_channels);

#if 0
void
write_png_file(const image_t *image, const char* fname);
#endif

#endif /* _PNGIO_H_ */
