/*
 * Original shader from: https://www.shadertoy.com/view/XtlfRB
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
#define T iTime * 0.4
#define EPS 0.005
#define FAR 20.0 
#define PI 3.14159265359

//compact 2 axis rotation
mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

//IQs noise
float noise(vec3 rp) {
    vec3 ip = floor(rp);
    rp -= ip; 
    vec3 s = vec3(7, 157, 113);
    vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
    rp = rp * rp * (3.0 - 2.0 * rp); 
    h = mix(fract(sin(h) * 43758.5), fract(sin(h + s.x) * 43758.5), rp.x);
    h.xy = mix(h.xz, h.yw, rp.y);
    return mix(h.x, h.y, rp.z); 
}

//wireframe edges
float tex(vec3 rp) {
    float tx = clamp(step(0.8, abs(rp.x)) + step(0.8, abs(rp.y)), 0.0, 1.0);
    tx *= step(0.1, abs(rp.x)) * step(0.1, abs(rp.y));
    return tx;
}        

// Cube mapping routine from Fizzer
// I'm not sure where I got this from
float fizz(vec3 rp) {
    vec3 f = abs(rp);
    f = step(f.zxy, f) * step(f.yzx, f); 
    f.xy = f.x > .5 ? rp.yz / rp.x : f.y > .5 ? rp.xz / rp.y : rp.xy / rp.z; 
    return tex(f);
}

//IQ - Box and Sphere functions
vec2 boxIntersection(vec3 ro, vec3 rd, vec3 boxSize) {
    vec3 m = 1.0 / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * boxSize;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z);
    float tF = min(min(t2.x, t2.y), t2.z);
    if(tN > tF || tF < 0.0) return vec2(-1.0); // no intersection
    //vec3 outNormal = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    float fzN = fizz(ro + rd * tN); //wireframe near face
    return vec2(tN, fzN);
}

float sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    h = sqrt(h);
    return -b - h;
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdSphere(vec3 p, float s) {
  return length(p) - s + noise((p * 5.) + T) * 0.1;
}

float map(vec3 rp) {

    float sphere = sdSphere(rp, 1.2);    
    
    rp = abs(rp);
    float ns = sdBox(rp - vec3(2.0, 2.0, 1.2), vec3(0.2, 0.2, 1.0));
    ns = min(ns, sdBox(rp - vec3(1.2, 2.0, 2.0), vec3(1.0, 0.2, 0.2)));
    ns = min(ns, sdBox(rp - vec3(2.0, 1.2, 2.0), vec3(0.2, 1.0, 0.2)));
             
    return min(sphere, ns);
}

float march(vec3 ro, vec3 rd, float maxStep, float ls, float la) {
 
    float t = 0.0;
    float li = 0.0;
    
    for (int i = 0; i < 24; i++) {
        vec3 rp = ro + rd * t;
        float ns = map(rp);
        if (ns < EPS || t > FAR) break;
        
        vec2 box = boxIntersection(rp, normalize(-rp), vec3(2.2));
        float ld = sdSphere(rp, 1.2);
        float fli = 1.0 * ls / (1.0 + ld * ld * la);
        if (box.x > 0.0 && box.x < ld) {
            fli *= (1.0 - box.y);
        }
        
        li += fli;
        
        t += min(ns, maxStep);
    }
    
    return li;
}

void setupCamera(vec2 uv, inout vec3 ro, inout vec3 rd) {

    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    ro = lookAt + vec3(3.0, 1.0, -6.0);
    
    ro.xz *= rot(T);
    ro.yz *= rot(T * 0.3);

    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec3 pc = vec3(0.0);
    
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    
    vec3 ro = vec3(0.), rd = vec3(0.);
    setupCamera(uv, ro, rd);
    
    pc = vec3(0.0, 1.0, 0.0) * march(ro, rd, 4.0, 0.03, 0.05);
    
    fragColor = vec4(pc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
