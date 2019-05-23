precision mediump float;

uniform float time;

vec3 hue(float hue) {
    vec3 a = hue * 6. + vec3(0., 4., 2.);
    vec3 b = mod(a, 6.) - 3.;
    vec3 c = abs(b) - 1.;
    vec3 d = clamp(c , 0., 1.);
    return d;
}

void main(void) {
  vec3 col = hue( time * 0.1 );
  gl_FragColor = vec4(col, 1.);
}
