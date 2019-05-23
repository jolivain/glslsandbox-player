precision mediump float;

uniform float time;

void main(void) {
  vec2 size = vec2( (sin(time) + 1.5) * 50.);
  vec2 s2 = size / vec2(2.);
  vec2 a = mod(gl_FragCoord.xy, size) - s2;
  float c = sign( a.x * a.y );
  gl_FragColor = vec4( c, 0., 0., 1.);
}
