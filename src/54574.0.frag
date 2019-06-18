/*
 * Original shader from: https://www.shadertoy.com/view/lsGyDG
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
// Created by SHAU - 2018
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

#define T iTime
#define PI 3.141592
#define FAR 50.0
#define EPS 0.005

#define DISTANCE 0.0
#define ID 2.0

#define CA vec3(0.5, 0.5, 0.5)
#define CB vec3(0.5, 0.5, 0.5)
#define CC vec3(1.0, 1.0, 1.0)
#define CD vec3(0.0, 0.33, 0.67)

struct Scene {
    float t;
    float id;
    vec3 n;
    float disp;
};

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
//https://www.shadertoy.com/view/Ms2SzV
float truncf(float x, float levels) {return floor(x * levels) / levels;}
vec3 truncv3(vec3 x, vec3 levels) {return floor(x * levels) / levels;}
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {return a + b * cos(6.28318 * (c * t + d));}
vec3 glowColour() {return palette(T * 0.1, CA, CB, CC, CD);}

vec3 shash3(vec3 p) {
	p = vec3(dot(p, vec3(127.1, 311.7,  74.7)),
			 dot(p, vec3(269.5, 183.3, 246.1)),
			 dot(p, vec3(113.5, 271.9, 124.6)));

	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

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

//sphere functions from IQ
float sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return 0.0;
    return -b - sqrt(h);
}

float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
    vec3 oc = ro - sph.xyz;
    float r = sph.w * sph.w;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - r;
    float h = b * b - c;
    float d = -sph.w + sqrt(max(0.0, r - h));
    float t = -b - sqrt(max(0.0, h));
    return (t < 0.0) ? 1.0 : smoothstep(0.0, 1.0, k * d / t);
}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

float map(vec3 rp, float displace) {
    
    vec3 ofs = shash3(truncv3(rp, vec3(5.0)));
    vec3 h2 = shash3(truncv3(rp, vec3(8.0) + ofs));
    vec3 h3 = shash3(truncv3(rp, vec3(4.0)));
	rp += 0.08 * h2 * displace;
	rp += 0.04 * h3 * displace;
    
    return length(rp) - 1.0;    
}

vec3 normal(vec3 rp, float displace) {
    vec2 e = vec2(EPS, 0);
    float d1 = map(rp + e.xyy, displace), d2 = map(rp - e.xyy, displace);
    float d3 = map(rp + e.yxy, displace), d4 = map(rp - e.yxy, displace);
    float d5 = map(rp + e.yyx, displace), d6 = map(rp - e.yyx, displace);
    float d = map(rp, displace) * 2.0;
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

float march(vec3 ro, vec3 rd, float displace) {
    
    float t = 0.0;
    
    for (int i = 0; i < 96; i++) {
        vec3 rp = ro + rd * t;
        float ns = map(rp, displace);
        if (ns < EPS || t > FAR) break;
        t += ns * 0.3;
    }
    
    return t;
}

vec3 vMarch(vec3 ro, vec3 rd, float displace) {
 
    vec3 pc = vec3(0.0);
    float t = 0.0;
        
    for (int i = 0; i < 48; i++) {
        vec3 rp = ro + rd * t;
        float ns = map(rp, displace);
        if (ns > 0.05) break;
        float lt = length(rp) - 0.2;
        pc += 0.02 * glowColour() / (1.0 + lt * lt * 10.0);
        t += 0.05;
    }
    
    return pc;
}

Scene drawScene(vec3 ro, vec3 rd) {
 
    float mint = FAR;
    float id = 0.0;
    vec3 minn = vec3(0.0);
	float displace = 1.0;
    
    float si  = sphIntersect(ro, rd, vec4(0.0, 0.0, 0.0, 1.0));
    if (si > 0.0) {
        vec3 rp = ro + rd * si;
        displace = step(0.5, noise((rp + T * 0.1) * 4.0));
    }
    
    float t = march(ro, rd, displace);
    if (t > 0.0 && t < mint) {
        mint = t;
        id = 2.0;
        minn = normal(ro + rd * t, displace);
    }

    vec3 fo = vec3(0.0, -3.0, 0.0);
    vec3 fn = vec3(0.0, 1.0, 0.0);
    float ft = dot(fo - ro, fn) / dot(rd, fn);
    if (ft > 0.0 && ft < mint) {
        mint = ft;
        id = 1.0;
        minn = fn;
        displace = 0.0;
    }
        
    return Scene(mint, id, minn, displace);
}

vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
 
    vec3 pc = vec3(0.0);
    
    vec3 lp = vec3(4.0, 5.0, -1.0);
    vec3 rp = ro + rd * scene.t;
    vec3 ld = normalize(lp - rp);
    float lt = length(lp - rp);
    float diff = max(dot(ld, scene.n), 0.05);
    float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 16.0);
    float atten = 1.0 /(1.0 + lt * lt * 0.01);
	    
    pc = vec3(1.0) * diff * atten;

    if (scene.id == 1.0) {
        //floor
        pc *= sphSoftShadow(rp, ld, vec4(0.0, 0.0, 0.0, 1.0), 4.0);
    } else {
        pc += vMarch(rp, refract(rd, scene.n, 0.9), scene.disp);    
    }
    
    pc += vec3(1.0) * spec;

    return pc;
}

void setupCamera(vec2 uv, inout vec3 ro, inout vec3 rd) {

    ro = vec3(0.0, 1.0, -5.0);
    vec3 lookAt = vec3(0.0, 0.0 , 0.0);
    
    ro.xz *= rot(T * 0.4);
    
    float FOV = PI / 4.0;
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
    
    Scene scene = drawScene(ro, rd);
    if (scene.t > 0.0 && scene.t < FAR) {
        pc = colourScene(ro, rd, scene);   
    }
    
    fragColor = vec4(pc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
