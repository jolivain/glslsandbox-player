#ifdef GL_ES
precision mediump float;
#endif

uniform float time;

void main(void) {
    float t = mod(time, 5.);
    vec3 col = vec3(0.);

    if (t >= 1. && t < 2.) {
        col.r = 1.;
    }
    else if (t >= 2. && t < 3.) {
        col.g = 1.;
    }
    else if (t >= 3. && t < 4.) {
        col.b = 1.;
    }
    else if (t >= 4.) {
        col = vec3(1.);
    }

    gl_FragColor = vec4(col, 1.);
}
