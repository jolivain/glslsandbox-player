#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

const float pi = 3.1415926535897932384626433832795;

void main(void) {
    float y = (gl_FragCoord.y / resolution.y) * 26.0;
    float x = (gl_FragCoord.x / resolution.x) * (pi / 2.0);
    float base = pow(2.0, floor(y));
    base = base + (2.0 * pi) - mod(base, (2.0 * pi));
    float val = base + x;
    float b = sin(val);

    if(fract(y) >= 0.9)
        b = 0.0;

    gl_FragColor = vec4(b, b, b, 1.0);
}
