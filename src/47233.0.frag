#ifdef GL_ES
precision mediump float;
#endif

varying vec2 surfacePosition;

void main(void) {
    vec2  a = mod(surfacePosition.xy + 0.5, 2.) - 1.;
    float c = sign(a.x * a.y);
    gl_FragColor = vec4(0., c, 0., 1.);
}
