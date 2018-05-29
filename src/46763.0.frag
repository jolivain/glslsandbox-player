#ifdef GL_ES
precision mediump float;
#endif

uniform float time;

void main(void) {
    float t = 1. + mod(time, 16.);
    float s = floor(t);
    vec2  a = mod(gl_FragCoord.xy, s * 2.) - s;
    float c = sign(a.x * a.y);
    gl_FragColor = vec4(0., c, 0., 1.);
}
