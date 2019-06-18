/*
 * by @aa_debdeb (https://twitter.com/aa_debdeb)
 */

precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float random(float x){
    return fract(sin(x * 12.9898) * 43758.5453);
}

float random(vec2 x){
    return fract(sin(dot(x,vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 random4(float x) {
    return fract(sin(x * vec4(12.9898, 51.431, 29.964, 86.432)) * vec4(43758.5453, 71932.1354, 39215.4221, 67915.8743));
}

float square(vec2 p, float s) {
    p = abs(p) - s;
    return length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
}

float distG(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(1.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -2.0 * s), t));
    return d;
}

float distL(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(2.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(1.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -2.0 * s), t));
    return d;
}

float distI(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(0.0, 2.0 * s), t));
    d = min(d, square(p - vec2(0.0, 1.0 * s), t));
    d = min(d, square(p, t));
    d = min(d, square(p - vec2(0.0, -1.0 * s), t));
    d = min(d, square(p - vec2(0.0, -2.0 * s), t));
    return d;
}

float distT(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(2.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(0.0, 1.0 * s), t));
    d = min(d, square(p, t));
    d = min(d, square(p - vec2(0.0, -1.0 * s), t));
    d = min(d, square(p - vec2(0.0, -2.0 * s), t));
    return d;
}

float distC(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(1.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, -2.0 * s), t));
    return d;
}

float distH(vec2 p, float s) {
    s /= 5.0;
    float t = s * 0.5;
    float d = 10000.0;
    d = min(d, square(p - vec2(2.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 2.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(1.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(0.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(-1.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, 0.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -1.0 * s), t));
    d = min(d, square(p - vec2(2.0 * s, -2.0 * s), t));
    d = min(d, square(p - vec2(-2.0 * s, -2.0 * s), t));
    return d;
}


float distGlitch2D(vec2 p, float s) {
    float d = 10000.0;
    float gap = 1.5;
    d = min(d, distG(p - vec2(2.5 * gap * s, 0.0), s));
    d = min(d, distL(p - vec2(1.5 * gap * s, 0.0), s));
    d = min(d, distI(p - vec2(0.5 * gap * s, 0.0), s));
    d = min(d, distT(p - vec2(-0.5 * gap * s, 0.0), s));
    d = min(d, distC(p - vec2(-1.5 * gap * s, 0.0), s));
    d = min(d, distH(p - vec2(-2.5 * gap * s, 0.0), s));
    return d;
}

float distGlitch3D(vec3 p, float t, float s) {
    float d1 = distGlitch2D(p.xy, s);
    float d2 = abs(p.z) - t;
    return min(max(d1, d2), 0.0) + length(max(vec2(d1, d2), 0.0));
}

float map(vec3 p) {
    p.y = mod(p.y + 1.5, 3.0) - 1.5;
    return distGlitch3D(p, 1.0, 1.5);
}

vec3 calcNormal(vec3 p) {
    float d = 0.01;
    return normalize(vec3(
        map(p + vec3(d, 0.0, 0.0)) - map(p - vec3(d, 0.0, 0.0)),
        map(p + vec3(0.0, d, 0.0)) - map(p - vec3(0.0, d, 0.0)),
        map(p + vec3(0.0, 0.0, d)) - map(p - vec3(0.0, 0.0, d))
    ));
}

bool raymarch(vec3 ro, vec3 rd, out vec3 c) {
    vec3 p = ro;
    for (int i = 0; i < 32; i++) {
        float d = map(p);
        p += d * rd;
        if (d < 0.01) {
            vec3 n = calcNormal(p);
            vec3 dif = vec3(0.7, 0.3, 0.1) * (max(0.0, dot(n, normalize(vec3(0.2, 0.5, -0.5)))) + 0.2);
            c = dif;
            return true;
        }
    }
    return false;
}


vec2 noisedCoord(vec2 st) {
    float id = floor(st.y * 20.0);
    float t = floor(time * 15.0);

    //float intensity = sin(time) * 0.5 + 0.5;
    float intensity = 1.0 - exp(2.0 * sin(time * 0.3)) / exp(2.0);

    float c = (random(vec2(id + 151.03, t + 81.19)) * 2.0 - 1.0) * 2.0;
    float w = random(vec2(id + 216.32, t + 115.19)) * 0.5 + 0.2;

    st.x += 0.2 * (random(vec2(id + 432.342, t)) * 2.0 - 1.0) * 
        step(intensity * 0.5 + 0.5, random(vec2(id + 143.32, t * 234.43  + 182.43))) *
        step(c - w, st.x) * step(st.x, c + w);

    return st;
}

vec3 background(vec2 st) {
    return mix(vec3(0.8), vec3(0.3, 0.6, 0.5), smoothstep(0.0, 1.5, length(st)));
}

void main(void) {
    vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);

    st = noisedCoord(st);

    vec3 ro = vec3(8.0 * sin(time * 0.5), 2.0 * cos(time * 1.2), -10.0 + 5.0 * sin(time * 0.7));
    vec3 ta = vec3(0.0, 0.0, 0.0);
    vec3 z = normalize(ta - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 x = normalize(cross(z, up));
    vec3 y = normalize(cross(x, z));
    vec3 rd = normalize(x * st.x + y * st.y + z * 1.5);

    vec3 c;
    if(!raymarch(ro, rd, c)) {
        c = background(st);
    }

    gl_FragColor = vec4(c, 1.0);
}
