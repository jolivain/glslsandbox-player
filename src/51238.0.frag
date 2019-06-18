/*
 * UFO
 * by @aa_debdeb (https://twitter.com/aa_debdeb)
 */

#define PI 3.14159265359
#define INV_PI 0.31830988618
#define TAU 6.28318530718

precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float sphere(vec3 p, float r) {
    return length(p) - r;
}

float plane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}

float capsule(vec3 p, float h, float r) {
    p.y -= clamp(p.y, 0.0, h);
    return length(p) - r;
}

float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float ufo_core(vec3 p) {
    return max(
        sphere(p * vec3(0.8, 1.2, 0.8), 1.5),
        -plane(p, vec3(0.0, 1.0, 0.0), 0.0)
    );
}

float ufo_skirt(vec3 p) {
    return max(
        sphere(p * vec3(0.3, 0.8, 0.3), 1.0),
        -sphere(p * vec3(0.25, 1.2, 0.25) + vec3(0.0, 0.5, 0.0), 1.2)
    );
}

float ufo_antenna(vec3 p) {
    return capsule(p, 0.3, 0.1);
}

float ufo(vec3 p) {
    float d_skirt = ufo_skirt(p + vec3(0.0, 1.0, 0.0));
    float d_core = ufo_core(p);
    float d_antenna = ufo_antenna(p - vec3(0.0, 1.1, 0.0));
    return opSmoothUnion(
        opSmoothUnion(d_skirt, d_core, 0.05),
        d_antenna,
        0.15
    );
}

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

float map(vec3 p) {
    p.yz *= rotate(sin(time * 2.21) * 0.5);
    p.xz *= rotate(sin(time * 3.39) * 0.5);
    p += vec3(
        7.0 * sin(time * 1.83),
        3.0 * sin(time * 1.19),
        7.0 * sin(time * 0.91)
    );
    return ufo(p);
}

vec3 calcNormal(vec3 p) {
    float d = 0.01;
    return normalize(vec3(
        map(p + vec3(d, 0.0, 0.0)) - map(p - vec3(d, 0.0, 0.0)),
        map(p + vec3(0.0, d, 0.0)) - map(p - vec3(0.0, d, 0.0)),
        map(p + vec3(0.0, 0.0, d)) - map(p - vec3(0.0, 0.0, d))
    ));
}

vec3 LightDir = normalize(vec3(1.0, 2.0, 1.0));
vec3 LightColor = vec3(1.0);
vec3 DiffuseColor = vec3(0.85, 0.95, 0.55);
vec3 SpecularColor = vec3(0.8, 0.85, 0.9);
vec3 AmbientColor = vec3(0.15, 0.13, 0.13);
float Metallic = 0.5;

float diffuseLambert(float dotNL) {
    return max(0.0, dotNL) * INV_PI;
}

float specularBlinnPhongNormalized(float dotNH, float m) { 
    float n = (m + 2.0) / TAU;
    return n * pow(max(0.0, dotNH), m);
}

vec3 background(vec3 ro, vec3 rd) {
    return vec3(0.7, 0.9, 0.95);
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;
    for (int i = 0; i < 128; i++) {
        float d = map(p);
        p += d * rd;
        if (d < 0.01) {
            vec3 normal = calcNormal(p);
            vec3 halfDir = normalize(-rd + LightDir);
            float dotNL = dot(normal, LightDir);
            float dotNH = dot(normal, halfDir);
            vec3 dif = DiffuseColor * LightColor * diffuseLambert(dotNL);
            vec3 spec = SpecularColor * LightColor * specularBlinnPhongNormalized(dotNH, 8.0);
            return (1.0 - Metallic) * dif + Metallic * spec + AmbientColor;
        }
    }
    return background(ro, rd);
}

void main(void) {
    vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);

    vec3 ro = vec3(0.0, 5.0, -15.0);
    vec3 ta = vec3(0.0);
    vec3 z = normalize(ta - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 x = normalize(cross(z, up));
    vec3 y = normalize(cross(x, z));
    vec3 rd = normalize(x * st.x + y * st.y + z * 1.5);

    vec3 c = raymarch(ro, rd);

    gl_FragColor = vec4(c, 1.0);
}
