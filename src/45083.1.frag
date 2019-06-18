/*
 * Adapted from: https://www.shadertoy.com/view/lsd3DS
 * by J.
 */

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
varying vec2 surfacePosition;

vec3 CalcOffset() {
    float t = time * 1000.; float tt = mod(t,8192.);
    float targetIndex = mod(t / 8192., 5.);
    vec2 pos1 = vec2(0.30078125, 0.0234375);
    vec2 pos2 = vec2(-0.82421875,0.18359375);

    if (targetIndex > 1.) { pos1 = pos2; pos2 = vec2(+0.07031250, -0.62109375); }
    if (targetIndex > 2.) { pos1 = pos2; pos2 = vec2(-0.07421875, -0.66015625); }
    if (targetIndex > 3.) { pos1 = pos2; pos2 = vec2(-1.65625, 0.); }
    if (targetIndex > 4.) { pos1 = pos2; pos2 = vec2(0.30078125, 0.0234375); }

    float t1 = tt * (1. / 8192.);  float f = 4. * (t1 - t1 * t1);
    f *= f; f *= f; f *= f; f *= f;
    float s = t1;
    s = s * s * (3. - s - s); s = s * s * (3. - s - s);
    s = s * s * (3. - s - s); s = s * s * (3. - s - s);

    return vec3(mix(pos1, pos2, s), f + (1. / 8192.));
}

void main(void) {
    vec3 tex = CalcOffset();
    vec2 x = (gl_FragCoord.xy * (2. / resolution.y) - 1.) * tex.z + tex.xy;
    vec2 y = x; vec2 z = y; float lw = 255.;

    for (int w = 0; w < 255; w++) {
        if (y.x < 5.) {
           y = x * x; x.y *= x.x * 2.; x.x = y.x - y.y; x += z; y.x += y.y;
           lw -= 1.;
        }
    }
    gl_FragColor = sin(vec4(2.,3.5,5.,5.) + (lw/18. + log(y.x) / 28.)) / 2. + 0.5;
    gl_FragColor.w = 1.;
}
