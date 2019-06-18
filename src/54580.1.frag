/*
 * Original shader from: https://www.shadertoy.com/view/MtlfRl
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Created by SHAU - 2017
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

#define EPS 0.002
#define FAR 40.0 
#define PI 3.14159265359
#define T iTime
#define NTILES 12.0

vec3 ro = vec3(0.0);
vec4 sphere = vec4(0.0, 0.0, 0.0, 0.3);

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}

vec3 path(float t) {
    float a = sin(t * PI / 16.0 + 1.5707963 * 1.0);
    float b = cos(t * PI / 16.0);
    return vec3(a * 2.0, b * a, t);    
}

float glyphcell(float uvz, float uva, vec2 cellid) {
    vec2 cuv = vec2(uvz, uva) * 10.0 - 5.0;
    vec2 cmx = mod(cuv, 1.0) - 0.5;
    float lc = length(cmx);
    float r1 = rand(floor(vec2(cuv.x + cellid.y, cuv.y + cellid.x + floor(T)))) > 0.7 ? 1.0 : 0.0;
    float pc = smoothstep(0.4, 0.3, lc) * r1; 
    pc *= step(cuv.x, 2.0) * step(-2.0, cuv.x);
    pc *= step(cuv.y, 0.0) * step(-4.0, cuv.y);
    return pc;
}

//IQ - Sphere functions
//http://www.iquilezles.org/www/articles/spherefunctions/spherefunctions.htm
float sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return -1.0;
    h = sqrt(h);
    return -b - h;
}

float sphDensity(vec3 ro, vec3 rd, vec4 sph, float dbuffer) {
    float ndbuffer = dbuffer / sph.w;
    vec3  rc = (ro - sph.xyz) / sph.w;
	
    float b = dot(rd, rc);
    float c = dot(rc, rc) - 1.0;
    float h = b*b - c;
    if (h < 0.0) return 0.0;
    h = sqrt(h);
    float t1 = -b - h;
    float t2 = -b + h;

    if (t2 < 0.0 || t1 > ndbuffer) return 0.0;
    t1 = max(t1, 0.0);
    t2 = min(t2, ndbuffer);

    float i1 = -(c * t1 + b * t1 * t1 + t1 * t1 * t1 / 3.0);
    float i2 = -(c * t2 + b * t2 * t2 + t2 * t2 * t2 / 3.0);
    return (i2 - i1) * (3.0 / 4.0);
}

vec2 nearest(vec2 a, vec2 b){ 
    float s = step(a.x, b.x);
    return s * a + (1. - s) * b;
}

vec4 map(vec3 rp) {

    rp.xy -= path(rp.z).xy;      

    rp.xy *= rot(T * 0.5);
    rp.z += T;
    
    vec3 q = rp;
    
    float a = atan(q.y, q.x) / 6.2831853;
    float ia = floor(a * NTILES) / NTILES * 6.2831853;

    vec2 cell = vec2(rp.z, a * NTILES);

    //panels
    q.xy *= rot(ia);
    q.z = abs(mod(q.z, 1.0) - 0.5);
    vec2 panels = vec2(max(length(q.xy) - 1.7, 1.65 - length(q.xy)), 1.0);
    panels.x = max(panels.x, q.z - 0.25);    
    panels.x = max(panels.x, q.y - 0.5);
    
    //rings
    q = rp;
    q.z = abs(mod(q.z + sin(T * 0.4) * 30.0, 80.0) - 40.0);
    vec2 rings1 = vec2(max(length(q.xy) - 1.5, 1.45 - length(q.xy)), 2.0);
    rings1.x = max(rings1.x, max(q.z - 0.3, 0.25 - q.z));

    q = rp;
    q.z = abs(mod(q.z + cos(T * 0.5) * 20.0, 60.0) - 30.0);
    vec2 rings2 = vec2(max(length(q.xy) - 0.8, 0.75 - length(q.xy)), 2.0);
    rings2.x = max(rings2.x, max(q.z - 0.3, 0.25 - q.z));

    q = rp;
    q.z = abs(mod(q.z + sin(T * 0.6) * 15.0, 40.0) - 20.0);
    vec2 rings3 = vec2(max(length(q.xy) - 0.4, 0.35 - length(q.xy)), 2.0);
    rings3.x = max(rings3.x, max(q.z - 0.3, 0.25 - q.z));

    return vec4(nearest(panels, nearest(rings1, nearest(rings2, rings3))), cell);
}

struct Scene {
    float t;
    float id;
    float li;
    vec2 cell;
};

Scene march(vec3 ro, vec3 rd) {

    float t = 0.0;
    float li = 0.0;
    float id = 0.0;
    vec2 cell = vec2(0.0);
    
    for (int i = 0; i < 96; i++) {
        vec3 rp = ro + rd * t;
        vec4 scene = map(rp);
        if (scene.x < EPS || scene.x > FAR) {
            id = scene.y;
            cell = scene.zw;
            break;
        }
        
        li += 0.005 / (1.0 + scene.x * scene.x * 20.5);
        
        t += scene.x;
    }
    
    return Scene(t, id, li, cell);
}

void setupCamera(vec2 fragCoord, inout vec3 rd) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;

    float ct = T * 6.0;

    vec3 lookAt = vec3(0.0, 0.0, ct);
    ro = lookAt + vec3(0.0, 0.0, -5.0);
    sphere.xyz = ro + vec3(0.0, 0.0, sin((T + 80.0) * 0.16) * 80.0);
    
    lookAt.xy += path(lookAt.z).xy;
    ro.xy += path(ro.z).xy;
    sphere.xy += path(sphere.z).xy;
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec3 pc = vec3(0.0);
    float mint = FAR;

    vec3 rd = vec3(0.0);
    setupCamera(fragCoord, rd);

    vec3 c1 = vec3(0.0, 1.0, 0.0);
    vec3 c2 = vec3(0.5, 1.0, 0.0);
    
    if (sphere.z < ro.z) {
        c1 = vec3(1.0, 0.0, 0.0);
        c2 = vec3(1.0, 0.5, 0.0);
    }
    
    Scene scene = march(ro, rd);
    if (scene.t > 0.0 && scene.t < FAR) { 
                
        if (scene.id == 1.0) {
            vec2 cellid = floor(scene.cell);
            vec2 celluv = fract(scene.cell);

            float r = rand(cellid);

            if (r > 0.4 && r < 0.8) {
                pc = c2 * glyphcell(celluv.x, celluv.y, cellid);
                pc /= scene.t * 0.25;
            }
        } else if (scene.id == 2.0 || scene.id == 3.0) {
            pc = c2;
        }
        
        mint = scene.t;
    }
    
    pc += c1 * scene.li;
    
    float st = sphIntersect(ro, rd, sphere);
    if (st > 0.0 && st < mint) {
        
        float h = sphDensity(ro, rd, sphere, mint);
        if (h > 0.0) {
            pc = mix(pc, vec3(1.0, 0.0, 0.0), h);
            pc = mix(pc, 0.85 * vec3(1.0, 0.7, 0.0), h * h * h);   
        }
    }
    
    fragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
