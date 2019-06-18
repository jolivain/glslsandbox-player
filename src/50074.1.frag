/*
 * Original shader from: https://www.shadertoy.com/view/llcfDM
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

#define R iResolution.xy
#define EPS .001
#define FAR 15.
#define T iTime
#define PI 3.141592

#define BLUE 1.
#define EYE 2.
#define SKIN 3.
#define BLACK 4.
#define RED 5.
#define WHITE 6.
#define GOLD 7.
#define FLOOR 8.
#define MOUTH 9.

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

//distance functions from IQ
//http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

float sdSphere(vec3 p, float r) {
    return length(p) - r;    
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.) + length(max(d, 0.));
}

float sdEllipsoid(vec3 p, vec3 r) {
    return (length(p / r) - 1.) * min(min(r.x, r.y), r.z);
}

float sdRoundCone(vec3 p, float r1, float r2, float h){
    
    vec2 q = vec2( length(p.xz), p.y );
    
    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(q,vec2(-b,a));
    
    if( k < 0.0 ) return length(q) - r1;
    if( k > a*h ) return length(q-vec2(0.0,h)) - r2;
        
    return dot(q, vec2(a,b) ) - r1;
}

float sdConeSection(vec3 p, float h, float r1, float r2) {
    float d1 = -p.y - h;
    float q = p.y - h;
    float si = 0.5 * (r1 - r2) / h;
    float d2 = max(sqrt(dot(p.xz, p.xz) * (1.0 - si * si)) + q * si - r2, q);
    return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.);
	return mix(b, a, h) - k * h * (1. - h);
}

float smax(float a, float b, float k) {
	float h = clamp( 0.5 + 0.5 * (b - a) / k, 0.0, 1.0 );
	return mix(a, b, h) + k * h * (1.0 - h);
}

vec2 nearest(vec2 a, vec2 b) {
    return mix(a, b, step(b.x, a.x));    
}

//model

vec2 dfHead(vec3 p) {
 
    p.xz *= rot(0.7);
    p.yz *= rot(-0.2);
    
    vec3 q = p;
    
    //mouth
    float skin = sdEllipsoid(p - vec3(0., -0.4, 0.4), vec3(0.62, 0.58, 0.58));
    skin = smax(skin, -sdCapsule(p - vec3(0., 0.16 , 0.), 
                                       vec3(-1., 0.14, 0.82), 
                                       vec3(1., 0.14, 0.82), 0.87), 0.1);
    q.y -= q.x * q.x * 0.8;
    skin = max(skin, -sdBox(q - vec3(-0.06, -0.8, 0.), vec3(0.24, 0.028, 1.0))); 
    skin = max(skin, -sdCapsule(p - vec3(-0.24, -0.76, 0.), vec3(0., 0., 0.6), vec3(0., 0., 0.9), 0.04));
    
    //float mouth = max(skin, sdBox(q - vec3(-0.06, -0.8, 0.), vec3(0.24, 0.015, 1.0))); 
    float mouth = max(sdEllipsoid(p - vec3(0., -0.4, 0.4), vec3(0.61, 0.57, 0.57)),
                      sdBox(q - vec3(-0.06, -0.8, 0.), vec3(0.24, 0.018, 1.0)));
    //head and spikes
    float head = sdSphere(p, 1.);
    q = p; //top spike
    q.y += q.z * q.z * 0.5;
    q.yz *= rot(-0.6);
	head = smin(head, sdConeSection(q - vec3(0., 1.6, 0.3), 0.9, 0.4, 0.02), 0.2);
    q = p; //middle spike
    q.y += q.z * q.z * 0.2;
    q.yz *= rot(-1.2);
	head = smin(head, sdConeSection(q - vec3(0., 1.4, 0.1), 0.7, 0.5, 0.02), 0.2);
    q = p; //lower spike
    q.y += q.z * q.z * 0.3;
    q.yz *= rot(-2.2);
	head = smin(head, sdConeSection(q - vec3(0., 1.3, 0.1), 0.5, 0.4, 0.02), 0.2);
    q = p; //side spikes
    q.x = abs(q.x);
    q.y += q.x * q.x * 0.2;
    q.xz *= rot(1.);
    q.yz *= rot(-1.7);
	head = smin(head, sdConeSection(q - vec3(0., 1.4, 0.1), 0.6, 0.5, 0.02), 0.2);
        
    q = p; //iris
    q.x = abs(q.x);
    q.xy *= rot(-0.1);
    float black = sdEllipsoid(q - vec3(0.18, -0.26, .9), vec3(0.1, 0.2, 0.08));
    q.xy *= rot(-0.5); //ear
    float ear = sdRoundCone(q - vec3(0., 0.7, 0.4), 0.4, 0.1, 0.7);
    ear = max(ear, -sdRoundCone(q - vec3(0., 0.7, 0.6), 0.4, 0.1, 0.7));
    skin = min(skin, sdRoundCone(q - vec3(0., 0.7, 0.4), 0.3, 0.1, 0.6)); //inner ear
    skin = max(skin, -sdRoundCone(q - vec3(0., 0.7, 0.61), 0.4, 0.1, 0.72)); 
    head = smin(head, ear, 0.04);
    q.xy *= rot(0.1); //eyes
    head = smin(head, sdEllipsoid(q - vec3(0.26, 0., 0.82), //eyebrow
                                  vec3(0.32, 0.46, 0.32)), 0.1);
    head = smax(head, -sdEllipsoid(q - vec3(0.28, 0., 0.8), //eye cut out
                                   vec3(0.32, 0.46, 0.33)), 0.06);
    float eye = sdSphere(p, 0.97); //eye ball
    black = min(black, sdSphere(p - vec3(0., -0.56, 0.98), 0.1)); //nose
    
    vec2 near = nearest(vec2(head, BLUE), vec2(eye, EYE));
    near = nearest(near, vec2(skin, SKIN));
    near = nearest(near, vec2(mouth, MOUTH));
	return nearest(near, vec2(black, BLACK));
}

vec2 dfBody(vec3 p) {
    
    vec3 q = p;
    q.xz *= rot(0.4);
    q.yz *= rot(-0.3);
    q.xy *= rot(0.2);
    
    float a = sdEllipsoid(q - vec3(0., -1.9, 0.), vec3(0.7, 1., 0.6)); //body
    a = smin(a, sdSphere(q - vec3(-0.3, -1.16, 0.), 0.18), 0.1); //shoulders
    a = smin(a, sdSphere(q - vec3(0.3, -1.16, 0.), 0.18), 0.1); //shoulders
    float b = sdEllipsoid(q - vec3(0., -1.9, 0.1), vec3(0.6, 0.8, 0.6)); //belly   
    a = smin(a, sdCapsule(p, vec3(-0.3, -2.4, 0.8), vec3(-1.0, -5.6, 1.2), 0.22), 0.16); //left leg
    a = smin(a, sdCapsule(p, vec3(0.5, -2.4, 1.0), vec3(0.8, -3.5, 1.3), 0.22), 0.16); //right leg
    a = smin(a, sdCapsule(p, vec3(0.8, -3.5, 1.3), vec3(1.0, -5.6, 1.3), 0.22), 0.06); //right leg    
    q.y -= q.z * q.z * 0.2; //tail
	a = smin(a, sdConeSection(vec3(q.x, (q.z + 1.) * -1., q.y + 2.4), 0.5, 0.2, 0.02), 0.1);
    
    return nearest(vec2(a, BLUE), vec2(b, SKIN));
}

vec2 dfShoe(vec3 p, float lr, float a) {
    
    p.xz *= rot(a);
    
    vec3 q = p; //buckle
    q.xy *= rot(1.0 * lr); //buckle
    float b = sdBox(q - vec3(0.5 * lr, -0.2, 0.6), vec3(0.05, 0.2, 0.2)); //buckle
    b = max(b, -sdBox(q - vec3(0.5 * lr, -0.2, 0.6), vec3(0.1, 0.1, 0.1))); //buckle
    p.x = abs(p.x); //red upper
    float r = sdEllipsoid(p - vec3(-0.06, 0., 0.), vec3(0.6, 0.4, 1.4)); //red upper
    r = max(r, -sdBox(p - vec3(0., 0., -1.), vec3(1., 1., 1.))); //red upper
    r = min(r, sdSphere(p - vec3(-0.06, 0., 0.), 0.6)); //red upper
    r = max(r, -sdBox(p - vec3(0., -1., 0.), vec3(1.))); //red upper
    float w = sdEllipsoid(p - vec3(-0.06, 0., 0.), vec3(0.62, 0.42, 1.42)); //white sole
    w = max(w, -sdBox(p - vec3(0., 0., -1.), vec3(1., 1., 1.))); //white sole
    w = min(w, sdSphere(p - vec3(-0.06, 0., 0.), 0.62)); //white sole
    w = max(w, -sdBox(p - vec3(0., 1., 0.), vec3(2., 1., 2.))); //white sole
    float ws = sdEllipsoid(p - vec3(-0.06, 0., 0.), vec3(0.62, 0.42, 1.42)); //white stripe :)
    q = p; //white stripe :)
    q.yz *= rot(0.4); //white stripe :)
    ws = max(ws, -sdBox(q - vec3(0., 0., -0.7), vec3(1., 1., 1.))); //white stripe :)
    ws = max(ws, -sdBox(q - vec3(0., 0., 1.7), vec3(1., 1., 1.))); //white stripe :)
    w = min(w, ws); //put it all together
    w = max(w, -sdBox(p - vec3(0., -1.1, 0.), vec3(2., 1., 2.)));
    w = min(w, sdTorus(p.xzy - vec3(0., 0., 0.5), vec2(0.4, 0.1))); //boot hoops
    w = min(w, sdTorus(p.xzy - vec3(0., 0., 0.7), vec2(0.4, 0.1))); //boot hoops
    
    vec2 near = nearest(vec2(r, RED), vec2(w, WHITE));
    near = nearest(near, vec2(b, GOLD));
    return near;
} 

vec2 dfGloves(vec3 p) {
    
    vec3 q = p - vec3(-1.6, -1.1, 0.7); //left glove
    float lg = sdTorus(q.xzy - vec3(0., 0., 0.04), vec2(0.2, 0.08)); //cuff
    lg = min(lg, sdTorus(q.xzy - vec3(0., 0., 0.2), vec2(0.2, 0.08))); //cuff
    lg = min(lg, sdEllipsoid(q - vec3(0., 0.5, 0.0), vec3(0.34, 0.34, 0.16))); //back
    lg = smin(lg, sdCapsule(q, vec3(0.4, 0.75, 0.2), vec3(0.24, 0.5, 0.), 0.12), 0.03); //thumb
    lg = smin(lg, sdCapsule(q, vec3(-0.30, 0.65, 0.14), vec3(-0.26, 0.65, 0.05), 0.1), 0.03); //smooth pinkie joint
    lg = smin(lg, sdRoundCone(q - vec3(0.18, 0.6, 0.), 0.1, 0.12, 0.7), 0.02); //index finger
    lg = min(lg, sdCapsule(q, vec3(0.07, 0.5, 0.2), vec3(0., 0.75, 0.15), 0.1)); //2nd finger
    lg = min(lg, sdCapsule(q, vec3(0., 0.75, 0.15), vec3(0., 0.75, 0.02), 0.1)); //2nd finger
    lg = min(lg, sdCapsule(q, vec3(-0.09, 0.5, 0.2), vec3(-0.17, 0.70, 0.2), 0.1)); //3rd finger
    lg = min(lg, sdCapsule(q, vec3(-0.17, 0.70, 0.2), vec3(-0.17, 0.70, 0.05), 0.1)); //3rd finger
    lg = min(lg, sdCapsule(q, vec3(-0.23, 0.5, 0.2), vec3(-0.30, 0.65, 0.14), 0.1)); //pinkie
    
    q = p - vec3(1.3, -1.7, 0.5);//right glove
    q.xz *= rot(-0.4);
    q.xy *= rot(0.7);
    float rg = sdTorus(q.zyx - vec3(0., 0., -0.04), vec2(0.2, 0.08)); //cuff
    rg = min(rg, sdTorus(q.zyx - vec3(0., 0., -0.2), vec2(0.2, 0.08))); //cuff
    rg = min(rg, sdEllipsoid(q - vec3(-0.5, 0., 0.), vec3(0.34, 0.16, 0.34))); //back
    rg = smin(rg, sdCapsule(q, vec3(-0.75, 0., -0.4), vec3(-0.5, 0., -0.24), 0.12), 0.03); //thumb
    rg = smin(rg, sdCapsule(q, vec3(-0.75, -0.15, -0.17), vec3(-0.73, 0.0, -0.15), 0.1), 0.05); //smooth 1st finger
    rg = smin(rg, sdCapsule(q, vec3(-0.65, -0.14, 0.3), vec3(-0.65, -0.05, 0.24), 0.1), 0.05); //smooth pinkie joint
    rg = min(rg, sdCapsule(q, vec3(-0.5, -0.2, 0.23), vec3(-0.65, -0.14, 0.3), 0.1)); //pinkie
    rg = min(rg, sdCapsule(q, vec3(-0.5, -0.2, 0.09), vec3(-0.7, -0.20, 0.17), 0.1)); //3rd finger
    rg = min(rg, sdCapsule(q, vec3(-0.7, -0.20, 0.17), vec3(-0.7, -0.05, 0.17), 0.1)); //3rd finger
    rg = min(rg, sdCapsule(q, vec3(-0.5, -0.2, -0.17), vec3(-0.75, -0.15, -0.17), 0.1)); //1st finger
    rg = min(rg, sdCapsule(q, vec3(-0.5, -0.2, -0.07), vec3(-0.78, -0.16, 0.), 0.1)); //2nd finger
    rg = min(rg, sdCapsule(q, vec3(-0.78, -0.16, 0.), vec3(-0.75, -0.02, 0.0), 0.1)); //2nd finger

    return vec2(min(lg, rg), WHITE);
}

vec2 dfArms(vec3 p) {
    float a = sdCapsule(p, vec3(-0.2, -1.2, 0.3), vec3(-1.4, -1.8, 0.7), 0.15); //left arm
    a = min(a, sdCapsule(p, vec3(-1.4, -1.8, 0.7), vec3(-1.6, -1., 0.7), 0.15)); //left arm
    a = min(a,sdCapsule(p, vec3(0.4, -1.06, 0.56), vec3(1.5, -1.3, 0.), 0.15)); //right arm
    a = min(a, sdCapsule(p, vec3(1.5, -1.3, 0.), vec3(1.3, -1.74, 0.5), 0.15)); //right arm
    return vec2(a, SKIN);
}

vec2 map(vec3 p) {
    vec2 near = nearest(dfHead(p - vec3(0., 0., 0.4)), dfBody(p));
    near = nearest(near, dfArms(p));
    near = nearest(near, dfShoe(p - vec3(1.0, -6.0, 1.3), 1.0, 0.0));
    near = nearest(near, dfShoe(p - vec3(-0.96, -6.0, 1.16), -1.0, 0.6));
    near = nearest(near, vec2(p.y + 6.14, FLOOR));
    return nearest(near, dfGloves(p));
}

//tetrahedral normal - IQ
vec3 normal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}

//noise and environment mapping from Terrain Lattice by Shane
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
float AO(vec3 p, vec3 n) {
    float ra = 0., w = 1., d = 0.;
    for (float i = 1.; i < 5.; i += 1.){
        d = i / 5.;
        ra += w * (d - map(p + n * d).x);
        w *= .5;
    }
    return 1. - clamp(ra, 0., 1.);
}

//http://erleuchtet.org/~cupe/permanent/enhanced_sphere_tracing.pdf
vec2 relaxedMarch(vec3 ro, vec3 rd) {

    float om = 1.3; //omega
    float t = EPS;
    float ce = FAR; //candidate error
    float ct = EPS; //candidate t
    float pr = 0.0; //previous radius
    float sl = 0.0; //step length
    const float PR = EPS; //pixel radiud
    float fs = map(ro).x < 0.0 ? -1.0 : 1.0; //sign
    
    float id = 0.0;

    for (int i = 0; i < 100; ++i) {
        vec2 si = map(ro + rd * t);
        float sr = fs * si.x; //signed radius
        float r = abs(sr); //radius
        bool fail = om > 1.0 && (r + pr) < sl;
        if (fail) {
            sl -= om * sl;
            om = 1.0;
        } else {
            sl = sr * om;
        }
        pr = r;
        float err = r / t;
        if (!fail && err < ce) {
            ct = t;
            ce = err;
        }
        if (!fail && err < PR || t > FAR) {
            id = si.y;
            break;
        }
        t += sl;
    }

    if (t > FAR || ce > PR) ct = FAR;

    return vec2(ct, id);
}

/*
//interesting for comparison
vec2 march(vec3 ro, vec3 rd) {
    
    float t = 0., id = 0.;
    
    for (int i = 0; i < 128; i++) {
        vec2 si = map(ro + rd * t);
        if (si.x < EPS || t > FAR) {
            id = si.y;
            break;
        }
        t += si.x * 0.6;
    }
    
    return vec2(t, id);
}
//*/

vec3 render(vec3 ro, vec3 rd) {

    vec3 pc = vec3(0.), 
         lp = vec3(-5, 6, 2);

    //interesting for comparison
    //for both perforrmance and ray penetration into scene
    //vec2 si = march(ro, rd);
    vec2 si = relaxedMarch(ro, rd);
    
    float t = si.x;
    float id = si.y;
    
    if (t > 0. && t < FAR) {
        vec3 p = ro + rd * t;
        vec3 ld = normalize(lp - p);
        vec3 n = normal(p);
        float dif = max(dot(ld, n), 0.2);
        float sp = pow(max(dot(reflect(ld, n), rd), 0.), 8.);
        float ao = AO(p, n);
        vec3 env = envMap(reflect(rd, n)) * 2.;
        
        vec3 sc = vec3(0., 0., 1.);
        if (id == 1.) {
            //blue
            pc = vec3(0., 0., 1.) * ao * dif
                 + vec3(0.05) * sp;
        } else if (id == 2.) {
            //eyes
            pc = vec3(1.) * ao    
                 + vec3(0.4, 0.4, 1.) * 0.24 * env;    
        } else if (id == 3.) {
            //skin
            pc = vec3(1., 0.5, 0.5) * ao * dif    
                 + vec3(0.05) * sp;
        } else if (id == 4.) {
            //black
            sp = pow(max(dot(reflect(ld, n), -rd), 0.), 32.);
            pc = vec3(.01) + vec3(1.) * sp
                 + vec3(0.05) * env;    
        } else if (id == 5.) {
            //red
            pc = vec3(1., 0., 0.) * ao * dif    
                 + vec3(0.05) * sp;
        } else if (id == 6.) {
            //white
            pc = vec3(1.) * ao * dif    
                 + vec3(0.2) * sp;
        } else if (id == 7.) {
            //gold
            pc = vec3(1., 1., 0.) * ao * 0.5
                 + vec3(1., 1., 0.) * env * 2.;    
        } else if (id == 8.) {
            //floor
            float lt = length(vec2(0., 1.4) - p.xz);
            lt = 1. / (1. + lt * lt * .6);                  
            pc = mix(vec3(1), vec3(0.2), lt) * max(ao, 0.8);
        }
    } else {
        pc = vec3(1.);    
    }
    
    return sqrt(clamp(pc, 0.0, 1.0));
}

void camera(vec2 U, inout vec3 ro, inout vec3 rd) {
    
    const float fo = 1.4;

    vec2 uv = (U - R * .5) / R.y;
    
    vec3 la = vec3(0, -2.8, 0);
    ro = vec3(0, -2. + sin(T * 0.07), 7. + sin(T * 0.05)); 
    
    ro.xz *= rot(sin(T * -.1) * 0.8);
    
    vec3 fwd = normalize(la - ro);
    vec3 rgt = normalize(vec3(fwd.z, 0., -fwd.x)); 

    rd = normalize(fwd + 1.4 * uv.x * rgt + 1.4 * uv.y * cross(fwd, rgt));
}

void mainImage(out vec4 C, vec2 U) {    
    vec3 ro = vec3(0.), rd = vec3(0.);
    camera(U, ro, rd);
    C = vec4(render(ro, rd), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
