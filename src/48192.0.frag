/*
 * Original shader from: https://www.shadertoy.com/view/XldcR2
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Created by SHAU - 2018
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

#define FAR 20.
#define EPS 0.001
#define PI 3.141593
#define T 4. + iTime
#define AT mod(T, 30.)
#define SKIN 1.
#define LEYE 2.
#define REYE 3.
#define TEYE 4.
#define PIN 5.
#define LE vec4(-0.5, -0.1, -0.27, 0.61)
#define RE vec4(0.5, -0.1, -0.27, 0.61)
#define TE vec4(0., 1.2, -0.9, 0.42)  

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
vec3 rotOrigin(vec3 origin, vec3 pos, float a) {
    pos -= origin;
    pos.xz *= rot(a);
    return pos += origin;
}

vec3 faceRotation(vec3 p) {
    float a = clamp((AT - 8.) * 0.1, 0., 0.26) 
              - clamp((AT - 14.) * 0.05, 0., 0.20) 
              - clamp((AT - 25.) * 0.05, 0., 0.06);    
    float ab = clamp((AT - 12.) * 0.5, 0., PI * 2.0);
    p.yz *= rot(-0.1 + a);
    p = rotOrigin(vec3(0., 0., 1.6), p, sin(ab) * 0.34);
    return p;
}

//Distance function IQ and Shane

float sdEqTriangle(vec2 p) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0 / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, - k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0, 0.0);
    return -length(p) * sign(p.y);
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.) + length(max(d, 0.));
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h) - r;
}

float sdEllipsoid(vec3 p, vec3 r) {
    return (length(p / r) - 1.) * min(min(r.x, r.y), r.z);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.);
	return mix(b, a, h) - k * h * (1. - h);
}

float smax(float a, float b, float k) {
	float h = clamp( 0.5 + 0.5 * (b - a) / k, 0.0, 1.0 );
	return mix(a, b, h) + k * h * (1.0 - h);
}

vec2 nearest(vec2 a, vec2 b){ 
    float s = step(a.x, b.x);
    return s * a + (1. - s) * b;
}

//Model

float dfThirdEyeLid(vec3 p) {
    float a = clamp((AT - 11.) * 0.2, 0., 0.2) - clamp((AT - 23.) * 0.1, 0., 0.2);
    float t = max(sdSphere(p, 0.45), -sdSphere(p, 0.43));
    p.x = abs(p.x);
    p.xy *= rot(-PI/3.);
    return smax(t, -sdBox(p - vec3(0.48 - a, 0., 0.), vec3(0.5)), 0.01);
}

float dfThirdEyeLids(vec3 p) {
    float t = dfThirdEyeLid(p);
    p.xy *= rot(PI/1.5);
    t = min(t, dfThirdEyeLid(p));
    p.xy *= rot(PI/1.5);
    return min(t, dfThirdEyeLid(p));
}

float dfEyeLid(vec3 p) {
    float t = sdSphere(p, 0.65);
    float a = clamp((AT - 10.) * 0.5, 0., 0.4) - clamp((AT - 25.) * 0.3, 0., 0.4);
    p.yz *= rot(-0.4 + a);
    return smax(t, -sdEllipsoid(p - vec3(0.1, 0., -0.63), vec3(0.5, 0.04 + a * 0.3, 0.6)), 0.02);
}

float dfFace(vec3 p) {
    
    vec3 q = p;
    float a = clamp((AT - 11.0) * 0.05, 0., 0.1) - clamp((AT - 15.) * 0.02, 0., 0.1);
    
    float f = sdEllipsoid(p, vec3(1.4, 2.6, 1.3)); 
    f = smin(f, sdEllipsoid(p - vec3(0., 0., 0.5), vec3(1.8, 2.0, 1.3)), 0.4);
    f = smin(f, sdSphere(p - vec3(0., 1.2, 0.6), 1.6), 0.1);
    f = smin(f, sdSphere(p - vec3(0., 0.9, 1.1), 2.14), 0.1);
    q.x = abs(q.x);
    f = smax(f, -sdBox(p - vec3(0., -1., -2.0), vec3(1., 1., 1.)), 0.8); 
    f = smax(f, -sdEllipsoid(q - vec3(0.8, -0.2, -0.9), vec3(0.6, 0.4, 0.2)), 0.3); 
    float eyeLid = sdSphere(q - vec3(0.5, -0.1, -0.27), 0.65);
    eyeLid = smax(eyeLid, -sdEllipsoid(q - vec3(0.6, -0.1, -1.0), vec3(0.5, 0.04, 0.6)), 0.02);
    float eyeLids = dfEyeLid(q - vec3(0.5, -0.1, -0.27));
    f = smin(f, eyeLids, 0.1);
    f = smax(f, -sdEllipsoid(p - vec3(0., -2.7, -0.84), vec3(1.2, 2.0, 0.16)), 0.04);
    f = max(f, -sdBox(p - vec3(0.0, -1.5, -0.6), vec3(0.4, 0.12, 0.3)));
    float topLip = sdEllipsoid(p - vec3(0., -1.3, -0.7), vec3(0.6, 0.4, 0.3));
    topLip = smax(topLip, -sdCapsule(p, vec3(0., -1.0, -1.0), vec3(0., -1.6, -1.1), 0.06), 0.08);
    topLip = smax(topLip, -sdEllipsoid(q - vec3(0., -1.8 + a, -0.7), vec3(0.8, 0.3, 1.0)), 0.01);
    f = smin(f, topLip, 0.08);
    float bottomLip = sdEllipsoid(p - vec3(0., -1.4, -0.65), vec3(0.6, 0.5, 0.2));
    bottomLip = smax(bottomLip, -sdEllipsoid(q - vec3(0., -1.1 - a, -0.7), vec3(0.7, 0.4, 1.0)), 0.01);
    f = smin(f, bottomLip, 0.06);
    float nostrilHole = sdCapsule(q, vec3(0.2, -1.2, -1.1), vec3(0.1, -0.9, -1.0), 0.08);
    q.yz *= rot(-0.2);
    f = smin(f, sdEllipsoid(q - vec3(0.0, -0.7, -1.1), vec3(0.26, 0.18, 0.4)), 0.06);
    f = smin(f, sdCapsule(p, vec3(0.0, -0.8, -1.1), vec3(0.0, 0.4, -0.9), 0.11), 0.14); 
    f = smax(f, -nostrilHole, 0.08);
    q = p;
    q.x = abs(q.x); 
    f = smax(f, -sdSphere(q - vec3(2.3, -1.5, -1.2), 1.4), 0.3); 
	f = smin(f, dfThirdEyeLids(p - vec3(0., 1.2, -0.9)), 0.2);    

    return f;
}

vec3 map(vec3 p) {
    
    vec3 q = p;
    
    float body = sdCapsule(p, vec3(0., 1., 0.8), vec3(0., -7., 3.), 1.);
    body = smin(body, sdEllipsoid(p - vec3(0., -3.0, 1.1), vec3(0.2, 0.3, 0.3)) , 0.3);
    q.x = abs(q.x);
    body = smin(body, sdCapsule(q, vec3(0.6, 1., 0.4), vec3(1.0, -7., 2.6), 0.2), 0.2);
    body = smin(body, sdEllipsoid(p - vec3(0., -5.0, 2.4), vec3(4.0, 1.8, 1.6)), 0.4);
    body = smin(body, sdSphere(q - vec3(3.4, -5.0, 2.4), 1.2), 0.4);
    body = smin(body, sdEllipsoid(p - vec3(0., -3.0, 1.4), vec3(1.16, 0.2, 0.2)), 0.06);
    body = smin(body, sdEllipsoid(p - vec3(0., -2.6, 1.3), vec3(1.16, 0.2, 0.2)), 0.06);
    body = smin(body, sdEllipsoid(p - vec3(0., -2.2, 1.2), vec3(1.16, 0.2, 0.2)), 0.06);

    float pins = sdEllipsoid(p - vec3(0., -3.0, 1.4), vec3(2.4, 0.06, 0.06));
    pins = min(pins, sdEllipsoid(p - vec3(0., -2.6, 1.3), vec3(2.0, 0.06, 0.06)));
    pins = min(pins, sdEllipsoid(p - vec3(0., -2.2, 1.2), vec3(1.6, 0.06, 0.06)));
    
    q = faceRotation(p);    
    float f = dfFace(q);

    float leftEye = sdSphere(q - LE.xyz, LE.w);
    float rightEye = sdSphere(q - RE.xyz, RE.w);
	float thirdEye = sdSphere(q - TE.xyz, TE.w);    

    vec2 near = nearest(vec2(smin(f, body, 0.3), SKIN), vec2(leftEye, LEYE));
    near = nearest(near, vec2(rightEye, REYE));
    near = nearest(near, vec2(thirdEye, TEYE));
    near = nearest(near, vec2(pins, PIN));
   
    return vec3(near, f);
}

vec3 normal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}

float tattoo(vec2 uv) {
    float t = 1.0 - sign(sdEqTriangle(uv * 0.5)) * sign(sdEqTriangle(uv * 0.6));
    return uv.x > 0. ? 1. - clamp(t, 0., 0.5) : 0.2 + (t * 0.2);    
}

//noise and environment mapping from Terrain Lattice by Shane
//Shader of the week at the moment :)
float n3D(vec3 p) {    
	const vec3 s = vec3(7, 157, 113);
	vec3 ip = floor(p); 
    p -= ip; 
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p * p * (3. - 2. * p);
    h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
}

vec3 envMap(vec3 p){    
    p *= 2.;
    p.xz += T * .5;
    float n3D2 = n3D(p * 2.);
    float c = n3D(p) * .57 + n3D2 * .28 + n3D(p * 4.) * .15;
    c = smoothstep(0.5, 1., c);    
    p = vec3(c * .8, c * .9, c);
    return mix(p.zxy, p, n3D2 * .34 + .665);
}

//IQ - http://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
float AO(vec3 rp, vec3 n) {

    float r = 0.0;
    float w = 1.0;
    float d = 0.0;

    for (float i = 1.0; i < 5.0; i += 1.0){
        d = i / 5.0;
        r += w * (d - map(rp + n * d).x);
        w *= 0.5;
    }

    return 1.0 - clamp(r, 0.0, 1.0);
}

//IQ - https://www.shadertoy.com/view/lsKcDD
float softShadow(vec3 ro, vec3 rd, float mint, float tmax) {
	float res = 1.0;
    float t = mint;
    float ph = 1e10;
    
    for (int i = 0; i < 32; i++) {
		float h = map(ro + rd * t).x;
        float y = h * h / (2.0 * ph);
        float d = sqrt(h * h - y * y);
        res = min(res, 10.0 * d / max(0.0, t-y));
        ph = h;        
        t += h;
        if (res < 0.0001 || t > tmax) break;
    }
    
    return clamp(res, 0.0, 1.0);
}

vec3 vMarch(vec3 ro, vec3 rd, vec4 eye) {
    
    vec3 pc = vec3(0.0);
    float t = 0.0;
    float a = clamp((AT - 14.) * 0.3, 0., 0.3) - clamp((AT - 22.) * 0.3, 0., 0.3);
    ro.xyz = faceRotation(ro.xyz);
    
    for (int i = 0; i < 64; i++) {
        vec3 rp = ro + t * rd;
        float c = length(rp - eye.xyz);
        if (c > eye.w + EPS) break;
        t += 0.05;
        pc += vec3(1., 0., 0.) / (1.0 + c * c * 1000.1);
        pc += (0.06 + a) * vec3(1., 0.8, 0.) / (1.0 + c * c * c * 1000.1);
    } 
    
    return pc;
}

vec3 march(vec3 ro, vec3 rd) {
    
    float t = 0.;
    float id = 0.;
    float f = 0.;
    for (int i = 0; i < 98; i++) {
        vec3 ns = map(ro + rd * t);
        if (ns.x < EPS || t > FAR) {
            id = ns.y;
            f = ns.z;
            break;
        }
        t += ns.x * 0.8;
    }
    
    return vec3(t, id, f);
}

void setupCamera(vec2 fragCoord, inout vec3 ro, inout vec3 rd) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    vec3 lookAt = vec3(0.0, -0.5, 0.0);
    ro = lookAt + vec3(0.0, -2.0 - sin(T * 0.3), -6.6 + sin(T * 0.06) * 0.3);
    ro.xz *= rot(sin(T * 0.14) * 0.6);    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    vec3 ro = vec3(0.0), rd = vec3(0.0);
    vec3 lp = vec3(8., 15., -12.);
    float mint = FAR;
    
    setupCamera(fragCoord, ro, rd);
    
    vec3 pc = vec3(0., 0.3, 0.1) * n3D(8. * rd + T * 0.1) * max(0., rd.y) * 0.6;
    
    vec3 t = march(ro, rd);
    if (t.x > 0. && t.x < mint) {
        mint = t.x;
        vec3 rp = ro + rd * t.x;
        vec3 n = normal(rp);
        vec3 ld = normalize(lp - rp);
        float lt = length(lp - rp);
        float atten = 1. / (1. + lt * lt * 0.003);
        float diff = max(dot(ld, n), 0.05);
	    float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.); 
        float sspec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 2.); 
        float fre = pow(clamp(dot(n, rd) + 1., .0, 1.), 4.) * 0.5;
        vec3 env = envMap(reflect(rd, n)) * 2.;
		float ao = AO(rp, n);
        float sh = softShadow(rp, ld, 0.01, 3.0);
        vec3 sc = vec3(1.);
        
        if (t.y == LEYE) {
            
            sc = vec3(1., 0., 0.) * 0.3;
            sc *= diff;
            sc += vMarch(rp, rd, LE);
            sc += vec3(1.) * spec;
            sc += vec3(1.) * fre;
        
        } else if (t.y == REYE) {
        
            sc = vec3(1., 0., 0.) * 0.3;    
            sc *= diff;
            sc += vMarch(rp, rd, RE);
            sc += vec3(1.) * spec;
            sc += vec3(1.) * fre;
        
        } else if (t.y == TEYE) {
            
            sc = vec3(1., 0., 0.) * 0.3;    
            sc *= diff;
            sc += vMarch(rp, rd, TE);
            sc += vec3(1.) * spec;
            sc += vec3(1.) * fre;
        
        } else if (t.y == PIN) {  
            
            sc = vec3(0.1);
            sc *= diff;
            sc += env;
            sc += vec3(1.0) * spec;
        
        } else {
            
            if (t.z < EPS) rp = faceRotation(rp);
            float tat = tattoo(rp.xy);
		    sc = vec3(1.) * tat;
            sc *= diff;
            sc += vec3(0.4) * sspec;
            sc *= atten;
            
        }
        
        sc += 0.1 * vec3(0., 0.3, 0.1) * clamp(n.x * -1., 0., 1.);
        sc *= 0.4 + sh * 0.6;
        
        pc = sc * ao;
    }
            
    fragColor = vec4(pc, mint / FAR * 0.3);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
