/*
 * Original shader from: https://www.shadertoy.com/view/4llfDl
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
#define HALFPI 1.5707963267948966
#define FAR 1000.0 
#define EPS 0.005
#define BODY 1.0
#define WINDOW 2.0
#define CHROME 3.0
#define ENGINE 4.0
#define FLOOR 5.0
#define MANIPULATOR 7.0
#define GREY_CHROME 8.0

float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

float gla = 0.0;
float gua = 0.0;
float gma = 0.0;

//SDF IQ and Mercury

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdConeSection(vec3 p, float h, float r1, float r2) {
    float d1 = -p.y - h;
    float q = p.y - h;
    float si = 0.5 * (r1 - r2) / h;
    float d2 = max(sqrt(dot(p.xz, p.xz) * (1.0 - si * si)) + q * si - r2, q);
    return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}

//mercury sdf
float fCylinder(vec3 p, float r, float height) {
	float d = length(p.xz) - r;
	d = max(d, abs(p.y) - height);
	return d;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdEllipsoid(vec3 p, vec3 r) {
    return (length(p / r) - 1.0) * min(min(r.x, r.y), r.z);
}

float smin(float a, float b, float k) {
	//float k = 32.0;
	//float res = exp( -k*a ) + exp( -k*b );
    //return -log( res )/k;
    //float k = 0.1;
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
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

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

//IQ Box, Sphere and DE functions
vec2 boxIntersection(vec3 ro, vec3 rd, vec3 boxSize) {
    float edge = 0.0;
    vec3 m = 1.0 / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * boxSize;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z);
    float tF = min(min(t2.x, t2.y), t2.z);
    if( tN > tF || tF < 0.0) return vec2(-1.0); // no intersection
    return vec2(tN, tF);
}

//neat trick from Shane
vec2 nearest(vec2 a, vec2 b){ 
    float s = step(a.x, b.x);
    return s * a + (1. - s) * b;
}

vec2 dfGun(vec3 rp) {
 
    vec3 q = rp;
    float grey = fCylinder(q.xzy - vec3(0.0, -4.2, 0.0), 0.15, 2.6);
    q.z = abs(q.z);
    grey = min(grey, fCylinder(q.xzy - vec3(0.0, 2.2, 0.0), 1.2, 0.3));   
    pModPolar(q.yx, 3.0);
    float body = fCylinder(q.xzy - vec3(0.0, 2.8, 0.6), 0.4, 0.4);
    body = max(body, -fCylinder(q.xzy - vec3(0.0, 2.8, 0.6), 0.1, 0.6));
    
    return nearest(vec2(body, BODY), vec2(grey, GREY_CHROME));
}

vec2 dfManipulator(vec3 rp, float ma) {
 
    float ns = FAR;
    
    vec3 q = rp;
    q.yz *= rot(ma);
    
    vec3 mad = vec3(0.0, 0.0, -1.0);
    vec3 mad2 = vec3(0.0, 0.0, 1.0);
    vec3 j5b = vec3(0.6, 0.0, 0.0);
    vec3 j5a = j5b + mad2 * 1.0;
    vec3 j5c = j5b + mad * 1.0;
    vec3 j5d = vec3(0.0, j5c.yz);
    
    float body = fCylinder(q.xzy - j5d.xzy, 0.8, 0.3);
    float manipulator = sdConeSection(q.xzy - vec3(0.0, -5.0, 0.0), 4.0, 0.05, 0.4);
    
    /* MIRROR ON X */
    
    q.x = abs(q.x);
    body = min(body, fCylinder(q.zxy - j5b.zxy, 0.4, 0.3));
    float chrome = sdCapsule(q, j5a, j5c, 0.2);

    vec2 near = nearest(vec2(body, BODY), vec2(chrome, CHROME));
    
    return nearest(near, vec2(manipulator, MANIPULATOR));
}

//la - lower arm angle, ua - upper arm angle, ma - manipulator angle 
vec2 dfArm(vec3 rp, float la, float ua, float ma) {
    
    vec3 q = rp;
    
    //calculate joint positions
    vec3 lad = vec3(0.0, 1.0, 0.0);
    lad.yz *= rot(la);
    //lower arm
    vec3 j1a = vec3(0.7, 0.0, -1.5);
    vec3 j1b = j1a + lad * 7.0;
    vec3 j1c = j1a + lad * 11.0;
    vec3 j1d = j1a + lad * 14.0;
    //lower arm piston
    vec3 j2a = vec3(0.0, 0.0, 1.5);
    vec3 j2b = vec3(0.0, j1b.yz);  
    vec3 lad2 = normalize(j2b - j2a);
    float adt = length(j2b - j2a);
    vec3 j2c = j2a + lad2 * (adt - 2.0);
    //upper arm
    vec3 uad = vec3(0.0, 0.0, -1.0);
    vec3 uad2 = vec3(0.0, 0.0, 1.0);
    uad.yz *= rot(ua);
    uad2.yz *= rot(ua);
    vec3 j3b = vec3(0.0, j1c.yz);
    vec3 j3a = j3b + uad2 * 1.6;
    vec3 j3c = j3b + uad * 9.0;
    vec3 j3d = j3b + uad * 19.0;
    //upper arm piston
    vec3 j4a = vec3(0.0, j1d.yz);
    vec3 ud3 = normalize(j3c - j4a);
    float udt = length(j3c - j4a);
    vec3 j4b = j4a + ud3 * 4.0;
    vec3 j4c = j4a + ud3 * 5.0;
    vec3 j4d = vec3(0.6, j4c.yz);
    vec3 j4e = vec3(0.6, j3c.yz);
    
    //lower arm piston
    float body = fCylinder(q.zxy - j2a.zxy, 0.6, 0.4);
    body = min(body, fCylinder(q.zxy - j2b.zxy, 0.6, 0.3));
    float chrome = sdCapsule(q, j2a, j2b, 0.25);
    body = min(body, sdCapsule(q, j2a, j2c, 0.4));
    
    //upper arm
    chrome = min(chrome, sdCapsule(q, j3a, j3d, 0.2));
    body = min(body, fCylinder(q.zxy - j3b.zxy, 0.6, 0.3));
    body = min(body, fCylinder(q.zxy - j3c.zxy, 0.6, 0.3));
    body = min(body, fCylinder(q.zxy - j3d.zxy, 0.6, 0.3));
    
    //upper arm piston top
    body = min(body, fCylinder(q.zxy - j4a.zxy, 0.6, 0.3));
    body = min(body, sdCapsule(q, j4a, j4b, 0.3));
    chrome = min(chrome, sdCapsule(q, j4a, j4c, 0.2));
        
    //manipulator
    vec2 manipulator = dfManipulator(q - j3d, ma);
    
    /* MIRROR ON X */
    
    //lower arm
    q.x = abs(q.x);
    body = min(body, fCylinder(q.zxy - j1a.zxy, 0.5, 0.4));    
    chrome = min(chrome, sdCapsule(q, j1a, j1d, 0.2));
    body = min(body, fCylinder(q.zxy - j1b.zxy, 0.5, 0.3));
    body = min(body, fCylinder(q.zxy - j1c.zxy, 0.5, 0.3));
    body = min(body, fCylinder(q.zxy - j1d.zxy, 0.5, 0.3));
    
    //upper arm piston   
    chrome = min(chrome, sdCapsule(q, j4c, j4d, 0.2));
    chrome = min(chrome, sdCapsule(q, j4d, j4e, 0.2));
    body = min(body, fCylinder(q.zxy - j4e.zxy, 0.4, 0.3));
    
    vec2 near = nearest(vec2(body, BODY), vec2(chrome, CHROME));
    near = nearest(near, manipulator);
    
    return near;
}

vec2 dfShip(vec3 rp) {

    //ship body
    float body = sdEllipsoid(rp, vec3(2.0, 2.0, 14.0));
    body = max(body, rp.z - 0.0);
    body = min(body, sdSphere(rp, 2.0));
    float bodycut =  fCylinder(rp.xzy - vec3(0.0, 0.0, 0.0), 1.1, 4.0);
    body = max(body, - bodycut);

    //window
    float window = sdEllipsoid(rp, vec3(1.5, 1.5, 13.0));
    window = max(window, rp.z - 0.0);
    float windowring = sdTorus(rp - vec3(0.0, 0.0, -10.0), vec2(1.1, 0.1));
    
    //docking thing
    float dock = fCylinder(rp - vec3(0.0, 1.0, -8.0), 0.4, 1.0);    
    dock = max(dock, -fCylinder(rp - vec3(0.0, 1.0, -8.0), 0.3, 1.2));    
    body = smin(body, dock, 0.1);
    
    //engine
    float enginecowl = sdConeSection(rp.xzy - vec3(0.0, 1.0, 0.0), 1.0, 1.85, 1.2);
    float cowlcut =  fCylinder(rp.xzy - vec3(0.0, 0.0, 0.0), 1.0, 4.0);
    enginecowl = max(enginecowl, -cowlcut);
    float enginecore = sdSphere(rp -vec3(0.0, 0.0, 0.6), 1.0);
    
    vec3 q = rp;
    pModPolar(q.yx, 3.0); //arm platforms
    body = smin(body, sdBox(q - vec3(0.0, 1.0, -3.0), vec3(0.8, 1.2, 3.0)), 0.4);

    //armature mounts
    float amount1 = fCylinder(q.zxy - vec3(-4.0, 0.0, 1.0), 3.2, 0.1);
    amount1 = max(amount1, -q.z - 5.0);
    amount1 = max(amount1, -q.y);
    body = min(body, amount1);

    //arms
    vec2 arm = dfArm(q - vec3(0.0, 3.5, -3.0), gla, gua, gma);

    //armature mounts
    q.x = abs(q.x);
    float amount2 = fCylinder(q.zxy - vec3(-2.0, 0.5, 1.0), 3.2, 0.1);
    amount2 = max(amount2, q.z + 1.0);
    amount2 = max(amount2, -q.y);
    body = min(body, amount2);

    //windows
    q = rp;
    q.xy *= rot(PI / 3.0);
    pModPolar(q.yx, 3.0);
    body = max(body, -sdEllipsoid(q - vec3(0.0, 1.5, -11.0), vec3(0.8, 1.2, 4.0)));
    body = min(body, windowring);

    //gun mounts
    body = smin(body, sdBox(q - vec3(0.0, 2.0, -3.0), vec3(0.2, 3.0, 1.4)), 0.4);
    body = min(body, fCylinder(q.xzy - vec3(0.0, -3.0, 5.0), 0.6, 2.0));
    
    //gun
    vec2 gun = dfGun(q - vec3(0.0, 5.0, -3.0));
   
    vec2 near = vec2(body, BODY);
    near = nearest(near, vec2(window, WINDOW));
    near = nearest(near, vec2(enginecowl, CHROME));
    near = nearest(near, vec2(enginecore, ENGINE));
    near = nearest(near, gun);
    near = nearest(near, arm);
    
    return near;   
}

vec2 map(vec3 rp) {
    return dfShip(rp);
}

vec2 march(vec3 ro, vec3 rd) {
 
    float t = 0.0;
    float id = 0.0;
    
    for (int i = 0; i < 96; i++) {
        vec3 rp = ro + rd * t;
        vec2 ns = map(rp);
        if (ns.x < EPS || t > FAR) {
            id = ns.y;
            break;
        }
        
        t += ns.x;            
    }
    
    return vec2(t, id);
}

vec3 normal(vec3 rp) {
    vec2 e = vec2(EPS, 0);
    float d1 = map(rp + e.xyy).x, d2 = map(rp - e.xyy).x;
    float d3 = map(rp + e.yxy).x, d4 = map(rp - e.yxy).x;
    float d5 = map(rp + e.yyx).x, d6 = map(rp - e.yyx).x;
    float d = map(rp).x * 2.0;
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

// Based on original by IQ.
// http://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
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

float shadow(vec3 ro, vec3 lp) {

    vec3 rd = normalize(lp - ro);
    float shade = 1.0;
    float t = 0.05;    
    float end = length(lp - ro);
    
    for (int i = 0; i < 20; i++) {
        float h = map(ro + rd * t).x;
        shade = min(shade, smoothstep(0.1, 0.5, 2.0 * h / t));
        t += clamp(h, 0.01, 1.);
        if (h < EPS || t > end) break; 
    }

    return min(max(shade, 0.) + 0.08, 1.0);
}

bool boundsTest(vec3 ro, vec3 rd) {
    bool hit = false;
    //ship
    vec2 box = boxIntersection(ro - vec3(0.0, 2.0, -10.0), rd, vec3(18.0, 14.0, 14.0));
    if (box.x > 0.0 || box.y > 0.0) {
        hit = true;    
    }
    return hit;
}

struct Scene {
    float t;
    vec3 n;
    float id;
    bool bounds;
};

Scene drawScene(vec3 ro, vec3 rd) {

    float mint = FAR;
    float id = 0.0;
    vec3 minn = vec3(0.0);
    bool bounds = false;
    
    vec3 wo = vec3(0.0, -15.0, 0.0);
    vec3 wn = vec3(0.0, 1.0, 0.0);
    float wt = planeIntersection(ro, rd, wn, wo);
    if (wt > 0.0 && wt < FAR) {
        id = FLOOR;
        mint = wt;
        minn = wn;
    }
            
    if (boundsTest(ro, rd) == true) {
        vec2 t = march(ro, rd);
        if (t.x > 0.0 && t.x < mint) {
            vec3 rp = ro + rd * t.x;
            id = t.y;
            mint = t.x;
            minn = normal(rp);
        }
        
        bounds = true;
    }

    return Scene(mint, minn, id, bounds);
}

vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
 
    vec3 pc = vec3(0.0);

    vec3 rp = ro + rd * scene.t;

    vec3 lp = vec3(10, 20.0, 10.0); //main lights    
    vec3 ld = normalize(lp - rp);
    float lt = length(lp - rp);    
    float diff = max(dot(ld, scene.n), 0.05);    
    float atten = 1.0 / (1.0 + lt * lt * 0.0005);
    float sh = shadow(rp, lp);

    float ao = AO(rp, scene.n); 

    if (scene.id == FLOOR) {
        
        pc = vec3(0.05) * diff;
        vec2 uv = fract(rp.xz * 0.0125);
        pc *= 1.0 - clamp((step(uv.x, 0.01) + step(uv.y, 0.01)), 0.0, 1.0);       
    
    } else if (scene.id == BODY) {
        
        pc = vec3(0.02) * diff * atten; 
    
    } else if (scene.id == GREY_CHROME) {
        
        pc = vec3(0.2) * diff * atten; 

    } else if (scene.id == WINDOW) {
        
        pc = vec3(1.0, 0.0, 0.0);
    
    } else if (scene.id == CHROME) {
        
        pc = vec3(0.0);
    
    } else if (scene.id == ENGINE) {
        
        pc = vec3(0.0, 1.0, 0.0);
    
    } else if (scene.id == MANIPULATOR) {
        
        pc = vec3(0.0, 0.0, 1.0);
    }

    pc *= sh;
    pc *= ao;

    return pc;
}

void setupCamera(vec2 uv, inout vec3 ro, inout vec3 rd) {

    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    ro = lookAt + vec3(0.0, 0.0, -35.0);

    ro.xz *= rot(T * 0.05);
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage(out vec4 fragColor, vec2 fragCoord) {
	
    vec3 pc = vec3(0.0);
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    float tt = 0.0;
    
    vec3 ro = vec3(0.), rd = vec3(0.);
    setupCamera(uv, ro, rd);
    
    float tl = mod(T, 5.0);
    gla = -0.5 + max(sin(T * 0.2) * 0.5, 0.0);
    gua = 0.6 - max(sin(T * 0.2) * 0.5, 0.0);
    gma = 0.0 - max(sin(T * 0.2) * 0.5, 0.0);
    
    float refl = 1.0;
    
    for (int i = 0; i < 2; i++) {
        
        Scene scene = drawScene(ro, rd);
        if (scene.t <= 0.0 || scene.t > FAR) break;
        
        vec3 sc = colourScene(ro, rd, scene);
        tt += scene.t;
        float la = 1.0 / (1.0 + tt * tt * 0.001);
        pc += sc * la * refl;
        
        if (scene.id == FLOOR) {
            refl = 0.5;
        } else if (scene.id == BODY) {
            refl = 0.3;
        } else if (scene.id == ENGINE) {
            refl = 0.0;
        } else if (scene.id == GREY_CHROME) {
            refl = 0.2;
        }
        
        ro = ro + rd * (scene.t - EPS);
        rd = reflect(rd, scene.n);
    }
    
    /*
    if (scene.bounds == true) {
        pc += vec3(1.0, 0.0, 0.0) * 0.1;
    }
    //*/
    
    fragColor = vec4(sqrt(clamp(pc * 7.0, 0.0, 1.0)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
