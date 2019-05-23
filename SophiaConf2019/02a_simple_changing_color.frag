precision mediump float;

uniform float time;

void main(void) {
  float red = mod(time,1.);
  gl_FragColor = vec4(red, 0., 0., 1.);
}
