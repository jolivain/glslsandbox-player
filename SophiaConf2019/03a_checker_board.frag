precision mediump float;

const vec2 size = vec2(50.);
const vec2 s2 = size / vec2(2.);

void main(void) {
  vec2 a = mod(gl_FragCoord.xy, size) - s2;
  float c = sign( a.x * a.y );
  gl_FragColor = vec4( c, 0., 0., 1.);
}
