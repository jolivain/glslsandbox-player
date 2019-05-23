precision mediump float;

varying vec2 surfacePosition;

void main(void) {
  vec2 uv = fract(surfacePosition);
  gl_FragColor = vec4( uv.x, uv.y, 0., 1.);
}
