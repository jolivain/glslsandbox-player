/*
 * Original shader from: https://www.shadertoy.com/view/4tlfWX
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Created by SHAU - 2017
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

#define T iTime * 2.0
#define PI 3.14159265359
#define FAR 40.0 
#define SPEED 1.0

vec3 lp = vec3(4.0, 5.0, -2.0);

float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

// see mercury sdf functions
// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
    float angle = 2.0 * PI / repetitions;
    float a = atan(p.y, p.x) + angle / 2.0;
    float r = length(p);
    float c = floor(a / angle);
    a = mod(a, angle) - angle / 2.0;
    p = vec2(cos(a), sin(a)) * r;
    // For an odd number of repetitions, fix cell index of the cell in -x direction
    // (cell index would be e.g. -5 and 5 in the two halves of the cell):
    if (abs(c) >= (repetitions / 2.0)) c = abs(c);
    return c;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}

vec2 torusShower(vec3 rp, float a, float scale) {
    pModPolar(rp.xz, 6.0);
    vec3 q = rp - vec3(1.0 * scale, 0.0, 0.0);
    q.xy *= rot(PI * -0.5 + a);
    float aa = (atan(q.x, q.y) / (PI * 2.0)) + 0.5;
    q = rp - vec3(1.0 * scale, 0.0, 0.0);
    float torus = sdTorus(q, vec2(1.0 * scale, 0.05 * scale));
    q.xy *= rot(a);
    torus = max(torus, -sdBox(q - vec3(0.0, 1.4, 0.0), vec3(1.4)));
    return vec2(torus, aa);
}

vec4 map(vec3 rp) {
    
    rp.xz = mod(rp.xz, 6.0) - 3.0;
    
    float a = mod(-T * SPEED, PI * 2.0);  
    vec2 bs = torusShower(rp - vec3(0.0, 0.0, 0.0), a, 1.0);
    pModPolar(rp.xz, 6.0);
    vec2 ls = torusShower(rp - vec3(2.0, 0.0, 0.0), a + PI, 0.5);
    
    vec4 bigShower = vec4(bs.x, vec3(1.0, 0.0, 0.0) * (bs.y - 0.5) * 2.0);
    vec4 littleShower = vec4(ls.x, vec3(0.0, 1.0, 0.0) * (ls.y - 0.5) * 2.0);
 
    return bigShower.x < littleShower.x ? bigShower : littleShower;
}

vec4 march(vec3 ro, vec3 rd) {
 
    float t = 0.0;
    vec3 pc = vec3(0.0);
    
    for (int i = 0; i < 96; i++) {
        vec3 rp = ro + rd * t;
        vec4 scene = map(rp);
        if (rp.y < 0.0 || t > FAR) break; 
        pc += 0.15 / (1.0 + scene.x * scene.x * 1000.0) * scene.yzw;
        t += max(scene.x, 0.01);
    }
    
    return vec4(t, pc);
}

vec3 texRing(vec2 uv, vec3 col, float phase, float scale) {
    float ml = PI * 2.0;
    float uvt = length(uv * scale);
    float muv = mod(uvt - (T * SPEED) - phase, ml);
    float li = 1.0 / (1.0 + uvt * uvt * 0.1 * scale);     
    return li * col * smoothstep(ml, ml - 0.01, muv) * smoothstep(ml - 0.22, ml - 0.2, muv);;
}

vec3 texRings(vec2 uv, float phase, float scale) {
 
    vec3 pc = vec3(0.0);
    
    for (int i = 0; i < 6; i++) {
        
        vec2 nuv = uv - vec2(2.0, 0.0);
        pc += texRing(nuv, vec3(0.0, 1.0, 0.0), PI, 2.0);
        uv *= rot(PI / 3.0);
        
        for (int j = 0; j < 6; j++) {
            vec2 nuv2 = nuv - vec2(1.0, 0.0);    
            pc += texRing(nuv2, vec3(0.0, 0.0, 1.0), 0.0, 4.0);
            nuv *= rot(PI / 3.0);
        }
    }
    
    return pc;
}

vec3 tex(vec2 uv) {
    uv = mod(uv, 6.0) - 3.0;
    vec3 pc = texRing(uv, vec3(1.0, 0.0, 0.0), 0.0, 1.0);
    pc += texRings(uv, PI, 1.0);
    return pc;
}

void setupCamera(vec2 fragCoord, inout vec3 ro, inout vec3 rd) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    vec3 lookAt = vec3(sin(T * 0.2) * 3.0, 0.0, T * 2.0);
    ro = lookAt + vec3(0.0, 2.0 + sin(T * 0.1) * 0.8, -4.0);
    lp = lookAt + vec3(4.0, 5.0, -2.0);
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    vec3 pc = vec3(0.0);
    float mint = FAR;
    
    vec3 ro = vec3(0.), rd = vec3(0.);
    setupCamera(fragCoord, ro, rd);
    
    vec3 fo = vec3(0.0, 0.0, 0.0);
    vec3 fn = vec3(0.0, 1.0, 0.0);
    float ft = planeIntersection(ro, rd, fn, fo);
    if (ft > 0.0 && ft < FAR) {
        mint = ft;
        vec3 rp = ro + rd * ft;
        vec3 ld = normalize(lp - rp);
        float diff = max(dot(ld, fn), 0.05);        
        pc = tex(rp.xz) * diff;
    }    
    
    vec4 scene = march(ro, rd);
    if (scene.x > 0.0 && scene.x < FAR) {
        mint = scene.x;   
    }
    pc += scene.yzw;
    
    float fogAmount = exp(-mint * 0.1);
    pc *= fogAmount;
    
    fragColor = vec4(pc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
