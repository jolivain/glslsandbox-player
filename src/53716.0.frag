/*
 * Original shader from: https://www.shadertoy.com/view/WdjSDw
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
// Created by SHAU - 2019
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

#define R iResolution.xy
#define T iTime

#define PI 3.141592
#define EPS .005
#define FAR 100.

#define AT fract(T * -.05) * PI * 2.
#define BR .8

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

//noise IQ - Shane
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

//Eiffie
float sdHelix(vec3 p, float r1, float r2, float m) {
    float halfm = m*.5,
          b = mod(p.y, PI*m) - PI*halfm,
          a = abs(atan(p.x, p.z) * halfm - b);
    if (a > PI*halfm) a = PI*m - a;
    return length(vec2(length(p.zx) - r1, a)) - r2;
}

float sdBall(vec3 p, float a) {
    vec3 bc = vec3(0., 0., -3.5); 
	bc.xz *= rot(AT * 4. + a * PI);
    p.y -= .9 + AT * 2.;
    p.y = mod(p.y - PI * 2., PI * 4.) - PI * 2.;
    return length(p - bc);
}

float sdBalls(vec3 p) {
    float near = min(sdBall(p, 0.),
                     sdBall(p - vec3(0., -4.2, 0.), -.6667));
    return min(near, sdBall(p - vec3(0., 4.2, 0.), .6667));
}

vec4 map(vec3 p) {
    
    vec3 q = p;
    q.xz *= rot(AT * 4.);
    float a = .5 + atan(q.x , q.z) / 6.2831853;
    float ia = fract(a * 8.);

    float rail = min(sdHelix(p, 3.2, .1, 1.),
                     sdHelix(p, 3.8, .1, 1.));
    float ball = sdBalls(p) - BR;
    return vec4(min(rail, ball), rail, ball, step(ia, .5));    
}

vec3 normal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}

vec4 march(vec3 ro, vec3 rd, inout float t, inout vec3 gc) {
    
   for (int i = 0; i < 98; i++) {
        
        vec4 s = map(ro + rd * t);
        
        if (s.x < EPS) return s;
        if (t > FAR) break;
        
        float at = .05 / (1. + s.z * s.z * 12.);
        gc += vec3(1., .5, 0.) * at;
        at = .06 / (1. + s.y * s.y * 9.);
        gc += vec3(1., .5, 0.) * at * s.w;

        t += s.x * .6;
    }
    t = -1.;
    return vec4(-1., 0., 0., 0.);
}

float AO(vec3 p, vec3 n) {

    float r = 0.0,
          w = 1.0,
          d = 0.0;

    for (float i = 1.0; i < 5.0; i += 1.0){
        d = i / 5.0;
        r += w * (d - map(p + n * d).t);
        w *= 0.5;
    }

    return 1.0 - clamp(r, 0.0, 1.0);
}

vec3 camera(vec2 U, vec3 ro, vec3 la, float fl) {
    vec2 uv = (U - R*.5) / R.y;
    vec3 fwd = normalize(la-ro),
         rgt = normalize(vec3(fwd.z, 0., -fwd.x));
    return normalize(fwd + fl*uv.x*rgt + fl*uv.y*cross(fwd, rgt));
}

void mainImage(out vec4 C, vec2 U) {
    
    vec3 la = vec3(0),
         ro = vec3(cos(T * .2), sin(T * .13) * 4.7, 8. + sin(T * -.3)),
         lp = vec3(-3., 1., 0.),
         gc = vec3(0);
    
    ro.xz *= rot(T * .2);
    vec3 rd = camera(U, ro, la, 1.4);
    
    vec3 pc = vec3(.6, .1, 0.) * n3D(8. * rd + T * 0.1) * max(0., rd.y) * .7;
   
    float t = 0.;
    vec4 s = march(ro, rd, t, gc);
    if (t > 0.) {
        vec3 p = ro + rd * t;
        vec3 n = normal(p);
        vec3 ld = normalize(lp - p);
        float sp = pow(max(dot(reflect(-ld, n), -rd), 0.), 32.);
        float ao = AO(p,n);
        
        if (s.x == s.y) {
            pc = vec3(1., .5, 0.) * s.w * ao;
            pc += vec3(1) * sp;
        } else if (s.x == s.z) {
            pc = vec3(1., .5, 0.);
        }
        pc = mix(pc, vec3(.2, 0., 0.), t * 2. / FAR);
    }
    
    pc += gc;
    
    C = vec4(pc, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
