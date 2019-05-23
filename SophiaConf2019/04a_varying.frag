precision mediump float;

varying vec2 surfacePosition;

void main(void) {
  gl_FragColor = vec4( surfacePosition.x, surfacePosition.y, 0., 1.);
}
