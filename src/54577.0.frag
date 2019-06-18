/*
 * Original shader from: https://www.shadertoy.com/view/4l2fRz
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

#define T iTime
#define CT T / 14.0
#define PI 3.14159265359
#define FAR 50.0 
#define EPS 0.002
#define BODY 1.0
#define WING_MESH 2.0
#define EYE 3.0
#define PLYNTH 5.0

const vec3 lp = vec3(20.0, 30.0, -10.0);

float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
float getGrey(vec3 p) {return dot(p, vec3(0.299, 0.587, 0.114));}

//dt 0 - 1
vec3 interpolate(vec3 from, vec3 to, float dt) {
    vec3 d = normalize(to - from);
    float lt = length(to - from);
    return from + d * lt * dt;
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

float fbm(vec3 x) {
    float r = 0.0;
    float w = 1.0;
    float s = 1.0;
    for (int i = 0; i < 5; i++) {
        w *= 0.5;
        s *= 2.0;
        r += w * noise(s * x);
    }
    return r;
}

//distance functions from IQ & Mercury
float sdEllipsoid(vec3 p, vec3 r) {
    return (length(p / r) - 1.0) * min(min(r.x, r.y), r.z);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

//https://www.shadertoy.com/view/4sXXRN
float dot2(vec3 v) {return dot(v, v);}
float udTriangle(vec3 v1, vec3 v2, vec3 v3, vec3 p) {
    vec3 v21 = v2 - v1; vec3 p1 = p - v1;
    vec3 v32 = v3 - v2; vec3 p2 = p - v2;
    vec3 v13 = v1 - v3; vec3 p3 = p - v3;
    vec3 nor = cross(v21, v13);

    return (sign(dot(cross(v21, nor), p1)) + 
           sign(dot(cross(v32, nor), p2)) + 
           sign(dot(cross(v13, nor), p3)) < 2.0) 
           ?
           min( min( 
           dot2(v21 * clamp(dot(v21, p1) / dot2(v21), 0.0, 1.0) - p1), 
           dot2(v32 * clamp(dot(v32, p2) / dot2(v32), 0.0, 1.0) - p2)), 
           dot2(v13 * clamp(dot(v13, p3) / dot2(v13), 0.0, 1.0) - p3))
           :
           dot(nor, p1) * dot(nor, p1) / dot2(nor);
}

float smax( float a, float b, float k ){
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( a, b, h ) + k*h*(1.0-h);
}

float smin(float a, float b, float k) {
	//float k = 32.0;
	//float res = exp( -k*a ) + exp( -k*b );
    //return -log( res )/k;
    //float k = 0.1;
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

//neat trick from Shane
vec2 nearest(vec2 a, vec2 b){ 
    float s = step(a.x, b.x);
    return s * a + (1. - s) * b;
}

/* MODEL */

float dfHoof(vec3 rp, float scale) {
    float foot = sdEllipsoid(rp - vec3(0.0, 0.0, 0.0), vec3(0.5 * scale, 0.38 * scale, 1.0 * scale));
    foot = max(foot, -sdBox(rp - vec3(0.0, 0.0, -1.0 * scale), vec3(0.6, 0.4, 0.5)));
    foot = smin(foot, sdEllipsoid(rp - vec3(0.0, 0.0, 0.0), vec3(0.48 * scale, 0.38 * scale, 0.98 * scale)), 0.1);
    foot = max(foot, -sdBox(rp - vec3(0.0, -1.1, 0.0), vec3(1.1)));
    return smax(foot, -sdBox(rp - vec3(0.0, 0.0, -1.1 * scale), vec3(0.04, 0.4, 0.5)), 0.05);
}

float dfLeg(vec3 rp) {
    vec3 q = rp;
    float foot = dfHoof(q - vec3(0.0, 0.0, 0.0), 0.9);
    float shin = sdCapsule(q, vec3(0.0, 0.3, 0.5), vec3(0.0, 2.1, -0.6), 0.26);
    q.yz *= rot(-0.55);
    shin = smin(shin, sdEllipsoid(q - vec3(0.0, 1.3, 0.6), vec3(0.35, 1.2, 0.4)), 0.1);
    float thigh = sdCapsule(rp, vec3(0.0, 2.1, -0.6), vec3(0.0, 1.3, 1.1), 0.3);
    q = rp;
    q.yz *= rot(-1.1);
    thigh = smin(thigh, sdEllipsoid(q - vec3(0.0, 0.5, 1.6), vec3(0.35, 1.22, 0.55)), 0.1);
    thigh = smin(thigh, sdSphere(rp - vec3(-0.3, 1.3, 1.1), 0.6), 0.2);
    shin = smin(shin, foot, 0.1);
    return min(thigh, shin);
}

float dfArm(vec3 rp) {
    vec3 q = rp;
    q.yz *= rot(-0.8);
    float hand = dfHoof(q - vec3(0.0, 2.5, 0.8), 0.7);
    q = rp;
    float upperarm = sdCapsule(q, vec3(0.0, 4.2, 0.0), vec3(0.0, 2.6, 1.0), 0.2);
    q.yz *= rot(-0.55);
    upperarm = smin(upperarm, sdEllipsoid(q - vec3(0.0, 2.6, 2.2), vec3(0.3, 1.1, 0.30)), 0.1);
    upperarm = smin(upperarm, sdSphere(rp - vec3(-0.2, 4.2, 0.0), 0.4), 0.2);
    float lowerarm = sdCapsule(rp, vec3(0.0, 2.6, 1.0), vec3(0.0, 2.8, -0.8), 0.2);
    q = rp;
    q.yz *= rot(-1.45);
    lowerarm = smin(lowerarm, sdEllipsoid(q - vec3(0.0, 0.25, 2.7), vec3(0.3, 1.0, 0.27)), 0.1);
    lowerarm = smin(lowerarm, hand, 0.1);
    return smin(upperarm, lowerarm, 0.1);
}

vec2 dfWing(vec3 rp) {

    const vec3 w1 = vec3(0.0, 1.3, 1.1); //lower spine anchor - fixed
    const vec3 w2 = vec3(0.0, 4.2, 0.0); //upper spine anchor - fixed
    vec3 w3 = vec3(1.4, 6.5, 1.0); //first knuckle
    vec3 w4 = vec3(3.4, 5.0, 2.5); //first finger tip
    vec3 w5 = vec3(6.0, 7.5, 1.0); //second knuckle
    vec3 w6 = vec3(6.0, 6.4, 1.6); //second finger tip
    vec3 w7 = vec3(8.0, 6.0, -1.0); //wing tip
    vec3 w1a = vec3(1.8, 4.0, 2.0); //first arch
    vec3 w2a = vec3(4.6, 6.0, 2.5); //second arch
    vec3 w3a = vec3(7.0, 6.7, 1.3); //third arch
    
    //It seems to be quicker running this inline rather than initialising at start?
    //INITIALISE VECTORS AND LENGTHS
    //w3 w5 and w7 top bones
    float lw3 = 2.87; //distance between joints
    vec3 aw3 = normalize(vec3(1.4, 2.3, 1.0)); //direction between joints
    float lw5 = 4.71;
    vec3 aw5 = normalize(vec3(4.6, 1.0, 0.0));
    float lw7 = 3.20;
    vec3 aw7 = normalize(vec3(2.0, -1.5, -2.0));
    float lw4 = 2.92;
    vec3 aw4 = normalize(vec3(2.0, -1.5, 1.5));
    float lw6 = 1.25;
    vec3 aw6 = normalize(vec3(0.0, -1.1, 0.6));
    vec3 aw5relaxed = normalize(vec3(1.6, -3.0, 0.0)); //relaxed wing position
    
    //ANIMATE - TODO movement is too linear
    //float dt = clamp(T * 0.1, 0.0, 1.0);
    float dt1 = clamp(sin(T * 0.2) * 2.0, 0.0, 1.0);
    float dt2 = clamp(sin(T * 0.2) * 2.0, 0.0, 1.8);
    aw5 = interpolate(aw5, aw5relaxed, dt1);
    aw6 = interpolate(aw6, aw4, dt1);
    aw7 = interpolate(aw7, aw5, dt2);
    
    //RECALCULATE POSITIONS
    //top first
    w3 = w2 + aw3 * lw3;
    w5 = w3 + aw5 * lw5;
    w7 = w5 + aw7 * lw7;
    //fingers
    w4 = w3 + aw4 * lw4;
    w6 = w5 + aw6 * lw6;
    
    //arches
    //first arch
    float lw1a = length(w4 - w1) * 0.5; //length in between bottom anchor and first arch
    vec3 aw1a = normalize(w4 - w1); //dirction between bottom anchor and first arch
    //second arch
    float lw2a = length(w6 - w4) * 0.5;
    vec3 aw2a = normalize(w6 - w4);
    //third arch
    float lw3a = length(w7 - w6) * 0.5;
    vec3 aw3a = normalize(w7 - w6);
    w1a = w1 + aw1a * lw1a;
    w2a = w4 + aw2a * lw2a;
    w3a = w6 + aw3a * lw3a;
    w1a.y += 0.5;
    w2a.y += 0.5;
    w3a.y += 0.5;
    
    //now draw it
    float r1 = 0.1 / (clamp(rp.x, 1.0, 10.0) * 0.5);
    float wing = sdCapsule(rp, w2, w3, r1);
    wing = min(wing, sdCapsule(rp, w3, w5, r1));
    wing = min(wing, sdCapsule(rp, w5, w7, r1));    
    wing = min(wing, sdCapsule(rp, w3, w4, 0.05));
    wing = min(wing, sdCapsule(rp, w5, w6, 0.05));
    
    float mesh = udTriangle(w1, w2, w1a, rp);
    mesh = min(mesh, udTriangle(w2, w3, w1a, rp));
    mesh = min(mesh, udTriangle(w3, w4, w1a, rp));
    mesh = min(mesh, udTriangle(w3, w4, w2a, rp));
    mesh = min(mesh, udTriangle(w3, w5, w2a, rp));
    mesh = min(mesh, udTriangle(w5, w6, w2a, rp));
    mesh = min(mesh, udTriangle(w5, w6, w3a, rp));
    mesh = min(mesh, udTriangle(w5, w7, w3a, rp));
    mesh = sqrt(mesh) - 0.01;
    
    return nearest(vec2(wing, BODY), vec2(mesh, WING_MESH));
}

float dfTail(vec3 rp) {
    rp.x += sin(rp.z + T * 0.8) * rp.z * 0.05;
    rp.y += cos(rp.z + T * 1.0) * rp.z * 0.05;
    float r = 0.2 / (clamp(rp.z, 1.0, 10.0) * 0.5);
    return sdCapsule(rp, vec3(0.0, 1.3, 1.1), vec3(0.0, 0.0, 8.0), r);
}

float dfTorso(vec3 rp) {
    float torso = sdEllipsoid(rp, vec3(0.8, 0.5, 0.5));
    torso = max(torso, -sdBox(rp - vec3(0.0, -1.2, 0.0), vec3(1.2)));
    float b = sdEllipsoid(rp, vec3(0.8, 2.0, 0.5));
    b = max(b, -sdBox(rp - vec3(0.0, 1.2, 0.0), vec3(1.2)));
    return min(torso, b);
}

float dfBody(vec3 rp) {
    vec3 q = rp;
    float neck = sdCapsule(rp, vec3(0.0, 4.1, 0.0), vec3(0.0, 4.6, -0.9), 0.4);
    q.yz *= rot(-0.35);
    float torso = dfTorso(q - vec3(0.0, 3.9, 1.45));
    q = rp;
    q.yz *= rot(2.85);
    torso = smin(torso, dfTorso(q - vec3(0.0, -0.8, -1.40)), 0.2);
    return smin(torso, neck, 0.05);
}

float dfTentacles(vec3 rp) {
    float r = 0.1 / (1.0 + clamp(rp.y * -1.0, 0.5, 2.5) * 0.6);
    rp.xz = abs(rp.xz);
    rp.x += sin(rp.y * 4.0 + T * 4.8) * rp.y * 0.1;
    rp.z += cos(rp.y * 3.0 + T * 6.0) * rp.y * 0.1;
    float tentacles = sdCapsule(rp - vec3(0.1, 0.0, 0.1), 
                                vec3(0.0, 0.0, 0.0),
                                vec3(0.0, -2.0, 0.0),
                                r);
    return tentacles;
}

float dfHead(vec3 rp) {
    float head = sdEllipsoid(rp - vec3(0.0, 4.6, -1.0), vec3(0.6, 1.0, 0.6));
    head = max(head, -sdBox(rp - vec3(0.0, 5.6, -1.0), vec3(1.0)));
    head = min(head, sdSphere(rp - vec3(0.0, 4.6, -1.0), 0.6));
    head = smin(head, sdSphere(rp - vec3(0.0, 4.55, -0.95), 0.65), 0.1);
    vec3 q = rp; 
    q.x = abs(q.x);
    q.xy *= rot(-0.4);
    head =  smax(head, -sdEllipsoid(q - vec3(-1.2, 4.15, -1.5), vec3(0.4, 0.2, 0.2)), 0.1);
    head = smin(head, dfTentacles(rp - vec3(0.0, 3.7, -1.0)), 0.1);
    return head;
}

vec3 dfCthulhu(vec3 rp) {
    vec3 q = rp;
    float head = dfHead(q - vec3(0.0, 0.0, 0.0));
    float body = dfBody(q - vec3(0.0, 0.0, 0.0));
    float tail = dfTail(q -vec3(0.0, 0.0, 0.0));
    body = smin(body, tail, 0.3);
    body = min(body, head);
    q.x = abs(q.x);
    float leg = dfLeg(q - vec3(0.8, 0.0, 0.0));
    float arm = dfArm(q - vec3(0.8, 0.0, 0.0));
    vec2 wing = dfWing(q - vec3(0.0, 0.0, 0.0));
    float eyes = sdSphere(q - vec3(0.2, 4.35, -1.2), 0.26);
    body = smin(body, leg, 0.2);
    body = smin(body, arm, 0.15);
    vec2 near = vec2(body, BODY);
    near = nearest(near, vec2(eyes, EYE));
    near = nearest(near, wing);
    return vec3(near, eyes);
}

vec2 dfPlynth(vec3 rp) {
    vec3 q = rp;
    q.xz *= 4.0;    
    float tx = noise(q * 2.0) * 0.06;
    float plynth = sdBox(rp - vec3(0.0, -20.0, 0.0), vec3(2.0 - tx, 20.0, 2.0 + noise(q) * 0.1 - tx)); 
    return vec2(plynth, PLYNTH);
}

vec3 map(vec3 rp) {
    vec3 cthulhu = dfCthulhu(rp);
    vec2 near = dfPlynth(rp);
    near = nearest(near, cthulhu.xy);  
    return vec3(near, cthulhu.z);
}

vec3 march(vec3 ro, vec3 rd) {
 
    float t = 0.0;
    float id = 0.0;
    float li = 0.0;
    
    for (int i = 0; i < 128; i++) {
        vec3 rp = ro + rd * t;
        vec3 ns = map(rp);
        if (ns.x < EPS || t > FAR) {
            id = ns.y;
            break;
        }
        
        li += 0.1 / (1.0 + ns.z * ns.z * 2000.0);
        
        t += ns.x * 0.9;       
    }
    
    return vec3(t, id, li);
}

//IQ
//http://www.iquilezles.org/www/articles/fog/fog.htm
vec3 applyFog(vec3  rgb,      // original color of the pixel
              float d, // camera to point distance
              vec3  rayDir,   // camera to point vector
              vec3  sunDir,
              float b)  // sun light direction
{
    float fogAmount = 1.0 - exp(-d * b);
    float sunAmount = max(dot(rayDir, sunDir), 0.0);
    vec3  fogColor  = mix(vec3(0.2, 0.01, 0.0), // purple
                          vec3(0.4, 0.25, 0.0), // blue
                          pow(sunAmount, 16.0));
    return mix(rgb, fogColor, fogAmount);
}

//Moody clouds from Patu
//https://www.shadertoy.com/view/4tVXRV
vec3 clouds(vec3 rd) {
    vec2 uv = rd.xz / (rd.y + 0.6);
    float nz = fbm(vec3(uv.yx * 1.4 + vec2(CT, 0.0), CT)) * 1.5;
    return clamp(pow(vec3(nz), vec3(4.0)) * rd.y, 0.0, 1.0);
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

// Tetrahedral normal IQ
vec3 tnormal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}

void setupCamera(vec2 uv, inout vec3 ro, inout vec3 rd) {

    vec3 lookAt = vec3(0.0, 3.0, 0.0);
    ro = lookAt + vec3(0.0, -4.0 , -10.0);
    
    ro.xz *= rot(T * 0.2);
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}


void mainImage(out vec4 fragColor, vec2 fragCoord) {
    
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    vec2 uv2 = fragCoord.xy / iResolution.xy;
    vec3 pc = vec3(0.0, 0.0, 0.0);
    float mint = FAR;
    
    vec3 ro = vec3(0.), rd = vec3(0.);
    setupCamera(uv, ro, rd);
    
    vec3 bgc = vec3(1.0, 0.0, 0.0) * clouds(rd);
    
    vec3 scene = march(ro, rd);
    if (scene.x > 0.0 && scene.x < FAR) {
        
        mint = scene.x;
        vec3 rp = ro + rd * scene.x;
        vec3 ld = normalize(lp - rp);
        float lt = length(lp - rp);
        vec3 n = tnormal(rp);
        float diff = max(dot(ld, n), 0.05);
        float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 16.0);
        float atten = 1.0 / (1.0 + lt * lt * 0.001);        
        float ao = AO(rp, n);
        float sh = shadow(rp, lp);
        
        if (scene.y == BODY) {
            
            float atten = 1.0 / (1.0 + lt * lt * 0.005);
            pc = vec3(0.02, 0.0, 0.0) * diff;
            pc += vec3(0.0, 0.01, 0.02) * max(n.y * -1.0, 0.0);
            pc += vec3(1.0, 0.8, 0.0) * spec * atten;
            pc *= ao * sh;
        
        } else if (scene.y == WING_MESH) {
            
            pc = vec3(0.04, 0.0, 0.0) * diff;  
            pc += vec3(1.0, 0.8, 0.0) * spec * atten;
            pc = mix(pc, bgc, clamp(n.y * -1.0, 0.0, 0.4));
            pc *= ao * sh;
        
        } else if (scene.y == EYE) {
        
            pc = vec3(0.0, 1.0, 0.0) * ao;
        
        } else if (scene.y == PLYNTH) {
            
            float atten = 1.0 / (1.0 + lt * lt * 0.008);
            pc = vec3(0.02, 0.01, 0.01) * 0.2 * diff; 
            pc += vec3(0.0, 0.01, 0.02) * max(n.y * -1.0, 0.0);
            pc += vec3(1.0, 0.8, 0.0) * spec * atten;
            pc *= ao * sh;
        }
        
    } else {
        pc = 4.0 * applyFog(pc, mint, rd, normalize(vec3(0.5, 0.4, 1.0)), 0.06);
        pc *= bgc;
    }
    
    pc += vec3(1.0, 1.0, 0.0) * scene.z;
    pc *= sin((uv2.y + T * 0.05) * 800.0) * 0.2 + 0.5;
        
	fragColor = vec4(sqrt(clamp(pc * 2.0, 0.0, 1.0)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
