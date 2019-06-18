precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define PI 3.14159265359
#define INV_PI 0.31830988618
#define TAU 6.28318530718

mat2 rotate(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

vec2 foldRotate(vec2 p, int n) {
    float nf = float(n);
    vec2 q = -p;
    float ang = atan(q.y, q.x) + PI;
    float step = TAU / nf;
    float idx = floor(ang / step);
    p *= rotate(idx * step);
    return p;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float map(vec3 p) {
    p.xy *= rotate(sin(time * 0.5) * 0.3);
    p.yz *= rotate(cos(time * 0.5) * 0.3);
    float rep = 10.0;
    p.xz *= rotate(floor(p.y / rep) * 0.5 + time * 0.5);
    p.y = mod(p.y, rep) - rep * 0.5;
    int n = 10;
    float nf = float(n);
    p.xz = foldRotate(p.xz, n);
    p.xz *= rotate(TAU / (2.0 * nf));
    p.x -= 25.0;
    return sdSphere(p, 2.0);
}

vec3 calcNormal(vec3 p) {
    float d = 0.01;
    return normalize(vec3(
        map(p + vec3(d, 0.0, 0.0)) - map(p - vec3(d, 0.0, 0.0)),
        map(p + vec3(0.0, d, 0.0)) - map(p - vec3(0.0, d, 0.0)),
        map(p + vec3(0.0, 0.0, d)) - map(p - vec3(0.0, 0.0, d))
    ));
}


vec3 background(vec3 rd) {
    return mix(
        vec3(1.0, 0.3, 0.3),
        vec3(0.3, 1.0, 0.8 ),
        dot(normalize(vec3(-0.2, 1.0, 0.0)), rd) * 0.5 + 0.5);
}

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;
    for (int i = 0; i < 128; i++) {
        float d = map(p);
        p += d * rd;
        if (d < 0.01) {
            vec3 n = calcNormal(p);
            return 0.5 + 0.5 * vec3(1.0) * max(0.0, dot(n, normalize(vec3(0.5, 0.5, -2.0))));
        }
    }
    return background(rd);
}

void main(void) {
    vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);

    vec3 ro = vec3(sin(time) * 30.0, sin(time * 2.0) * 10.0, -40.0);
    vec3 ta = vec3(0.0);
    vec3 z = normalize(ta - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 x = normalize(cross(z, up));
    vec3 y = normalize(cross(x, z));
    vec3 rd = normalize(x * st.x + y * st.y + z * 1.5);

    vec3 c = raymarch(ro, rd);

    gl_FragColor = vec4(c, 1.0);
}
