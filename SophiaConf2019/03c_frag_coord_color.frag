precision mediump float;

uniform vec2 resolution;

void main(void) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  gl_FragColor = vec4( uv.x, uv.y, 0., 1.);
}
