// See: https://www.shadertoy.com/view/Wds3Ws
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float random(float x){
    return fract(sin(x * 12.9898) * 43758.5453);
}

float valuenoise(float x) {
    float i = floor(x);
    float f = fract(x);

    float u = f * f * (3.0 - 2.0 * f);

    return mix(random(i), random(i + 1.0), u);
}

float fbm(float x) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4;i++) {
        s += a * valuenoise(x);
        a *= 0.5;
        x += 2.15;
    }
    return s;
}

float box(vec3 p, vec3 b) {
    p = abs(p) - b;
    return length(max(p, 0.0)) + min(0.0, max(p.x, max(p.y, p.z)));
}

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

float map(vec3 p) {
    float d = 10000.0;
    float s = 1.0;
    p.xz *= rotate(time * 0.39);
    for (int i = 0; i < 5; i++) {
        p.yz *= rotate(time * 0.34);
        p = abs(p);
        p -= 15.0;
        p.xz *= rotate(time * 1.94);
        p.xy *= rotate(time * 1.32);
        d = min(d, box(p, vec3(1.0)) / s);
        p *= 2.0;
        s *= 2.0;
    }
    return d;
}

vec3 calcNormal(vec3 p) {
    float d = 0.01;
    return normalize(vec3(
        map(p + vec3(d, 0.0, 0.0)) - map(p - vec3(d, 0.0, 0.0)),
        map(p + vec3(0.0, d, 0.0)) - map(p - vec3(0.0, d, 0.0)),
        map(p + vec3(0.0, 0.0, d)) - map(p - vec3(0.0, 0.0, d))
    ));
}

vec3 lightDir = normalize(vec3(0.5, 1.0, -0.8));
vec3 lightColor = vec3(1.0) * 2.0;
vec3 diffuseColor = vec3(0.4, 0.7, 0.9);
vec3 growColor = vec3(1.0, 0.8, 0.2);

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 p = ro;
    float minD = 10000.0;
    for (int i = 0; i < 64; i++) {
        float d = map(p);
        p += d * rd;
        minD = min(minD, d);
        if (d < 0.01) {
            vec3 n = calcNormal(p);
            vec3 diffuse = diffuseColor * max(0.0, dot(n, lightDir)) * lightColor; 
            vec3 grow = growColor * 0.3;
            return  diffuse + grow;
        }
    }
    return growColor * 0.08 / minD;
}

void main(void) {
    vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);

    vec2 m = 10.0 * (mouse * 2.0 - 1.0);

    vec3 ro = vec3( 0.0, 0.0, -50.0 + (fbm(time * 0.3) * 2.0 - 1.0) * 25.0);
    vec3 ta = vec3(0.0);
    vec3 z = normalize(ta - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 x = normalize(cross(z, up));
    vec3 y = normalize(cross(x, z));
    vec3 rd = normalize(x * st.x + y * st.y + z * 1.5);

    vec3 c = raymarch(ro, rd);

    gl_FragColor = vec4(c, 1.0);
}
