precision mediump float;

uniform float time;
uniform vec2 resolution;

const int maxIter = 32;
const vec2 center = vec2(-1.,0.);
const vec3 outCol1 = vec3(0.2, 0.2, 0.4);
const vec3 outCol2 = vec3(0.8, 0.8, 1.0);

void main(void) {
  float scale = 1. / (1.5 + sin(time * 2.));
  vec2 pos = (2. * gl_FragCoord.xy / resolution) - 1.;
  vec2 z = pos * scale + center;
  vec2 c = z;
  float r2 = 0.0;
  float iterf = 0.;

  for (int it = 0; it < maxIter; ++it) {
    float tmpr = z.x;
    z.x = (tmpr * tmpr) - (z.y * z.y) + c.x;
    z.y = 2.0 * tmpr * z.y + c.y;
    r2 = z.x * z.x + z.y * z.y;
    if (r2 > 4.0)
      break;
    iterf += 1.;
  }

  vec3 color;
  if (r2 < 4.0)
    color = vec3(0.0);
  else
    color = mix(outCol1, outCol2, fract(iterf * 0.032));

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
