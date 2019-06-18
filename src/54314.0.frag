/*
 * Original shader from: https://www.shadertoy.com/view/llSfzR
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

#define T iTime * 2.0
#define PI 3.14159265359
#define FAR 1000.0 
#define EPS 0.005
#define TERRAIN 1.0
#define TERRAIN_FLOOR 2.0
#define SPHERE 3.0
#define RODSA 5.0
#define RODSB 6.0
#define CA vec3(0.5, 0.5, 0.5)
#define CB vec3(0.5, 0.5, 0.5)
#define CC vec3(1.0, 1.0, 1.0)
#define CD vec3(0.0, 0.33, 0.67)
#define RR 0.8

struct Scene {
    float t;
    float tF;
    vec3 n;
    float id;
    vec3 sc;
    float rala;
    float rbla;
    float edge;
};
 
vec3 cro = vec3(0.0);    
vec3 lp = vec3(0.0);

float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

float tri(float x) {return abs(x - floor(x) - 0.5);} //Nimitz via Shane
vec2 tri(vec2 x) {return abs(x - floor(x) - 0.5);}
float layer(vec2 p) {return dot(tri(p / 1.5 + tri(p.yx / 3. + .25)), vec2(1)); }

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

//IQ cosine palattes
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

//IQ distance functions
//http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

vec2 sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return vec2(0.0);
    h = sqrt(h);
    float tN = -b - h;
    float tF = -b + h;
    return vec2(tN, tF);
}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

vec3 sphNormal(in vec3 pos, in vec4 sph) {
    return normalize(pos - sph.xyz);
}

//IQ
// cc center, ca orientation axis, cr radius, ch height
vec4 iCapsule(vec3 ro, vec3 rd, vec3 cc, vec3 ca, float cr, float ch) {
    
    vec3  oc = ro - cc;
    ch *= 0.5;

    float card = dot(ca,rd);
    float caoc = dot(ca,oc);
    
    float a = 1.0 - card*card;
    float b = dot( oc, rd) - caoc*card;
    float c = dot( oc, oc) - caoc*caoc - cr*cr;
    float h = b*b - a*c;
    if( h<0.0 ) return vec4(-1.0);
    float t = (-b-sqrt(h))/a;

    float y = caoc + t*card;

    // body
    if( abs(y)<ch ) return vec4( t, normalize( oc+t*rd - ca*y ) );
    
    // caps
    float sy = sign(y);
    oc = ro - (cc + sy*ca*ch);
    b = dot(rd,oc);
    c = dot(oc,oc) - cr*cr;
    h = b*b - c;
    if( h>0.0 )
    {
        t = -b - sqrt(h);
        return vec4( t, normalize(oc+rd*t ) );
    }

    return vec4(-1.0);
}

//neat trick from Shane
vec2 nearest(vec2 a, vec2 b){ 
    float s = step(a.x, b.x);
    return s * a + (1. - s) * b;
}

Scene map(vec3 rp) {
    
    vec3 q = rp;
    q.xz *= 0.8;
    q.y += sin(q.z * 0.05) * 8.; //roll hills
    float ridge = 1.0 / (1.0 + q.x * q.x * 0.002); //central ridge
    q.y -= ridge * 34.0;
    vec2 terrain = vec2(q.y, TERRAIN);    
    float ax = abs(q.x);
    terrain.x -= ax * ax * 0.003; //valley
    
    //slightly modified logic from Shane (...or breaking it)
    //https://www.shadertoy.com/view/MtdSRn
    float a = 20.0;
    for (int i = 0; i < 3; i++) {
        terrain.x += abs(a) * layer(q.xz / a) * 0.8; 
        q.xz = mat2(.6, .757, -.577, .98) * q.xz * 0.6;
        a *= -0.5;     
    }
    vec2 near = terrain;

    //rods
    q = rp;
    q.x = abs(q.x);
    float rt = mod(T * 80.0, 1600.0) - 200.0;
    vec2 rodsa = vec2(FAR, RODSA);
    for (int i = 0; i < 2; i++) {
        float nsc = sdCapsule(q, 
                              vec3(50.0 + float(i) * 30.0, 10.0, cro.z + rt + 100.0),
                              vec3(50.0 + float(i) * 30.0, 10.0, cro.z + rt - 100.0),
                              RR);
        rodsa.x = min(rodsa.x, nsc);
    }
    
    rt = mod(T * 50.0, 1600.0) - 200.0;
    vec2 rodsb = vec2(FAR, RODSB);
    for (int i = 0; i < 3; i++) {
        float nsc = sdCapsule(q,
                              vec3(35.0 + float(i) * 30.0, 10.0, (cro.z + rt) + (70.0 - float(i) * 20.0)),
                              vec3(35.0 + float(i) * 30.0, 10.0, (cro.z + rt) - (70.0 - float(i) * 20.0)),
                              RR);
        rodsb.x = min(rodsb.x, nsc);
        nsc = sdCapsule(q,
                        vec3(35.0 + float(i) * 30.0, 10.0, (cro.z + rt - 600.0) + (70.0 - float(i) * 20.0)),
                        vec3(35.0 + float(i) * 30.0, 10.0, (cro.z + rt - 600.0) - (70.0 - float(i) * 20.0)),
                        RR);
        rodsb.x = min(rodsb.x, nsc);
    }
    
    return Scene(near.x, 
                 FAR, 
                 vec3(0.0), 
                 near.y,
                 vec3(-1.0),
                 rodsa.x,
                 rodsb.x,
                 0.0);
}

vec3 normal(vec3 rp) {
    vec2 e = vec2(EPS, 0);
    float d1 = map(rp + e.xyy).t, d2 = map(rp - e.xyy).t;
    float d3 = map(rp + e.yxy).t, d4 = map(rp - e.yxy).t;
    float d5 = map(rp + e.yyx).t, d6 = map(rp - e.yyx).t;
    float d = map(rp).t * 2.0;
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

//Nice bump mapping from Nimitz
vec3 bump(vec3 rp, vec3 n) {
    vec2 e = vec2(EPS, 0.0);
    float nz = noise(rp);
    vec3 d = vec3(noise(rp + e.xyy) - nz, noise(rp + e.yxy) - nz, noise(rp + e.yyx) - nz) / e.x;
    n = normalize(n - d * 0.2 / sqrt(0.1));
    return n;
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
    vec3  fogColor  = mix(vec3(0.5, 0.05, 0.0),
                          vec3(0.5, 0.3, 0.8),
                          pow(sunAmount, 16.0));
    return mix(rgb, fogColor, fogAmount);
}

vec3 vMarch1(vec3 ro, vec3 rd, vec3 sc, vec3 gc, float maxt) {
 
    vec3 pc = vec3(0.0);
    float t = 0.0;
    
    for (int i = 0; i < 128; i++) {
        if (t > maxt) break;
        vec3 rp = ro + rd * t;
        float lt = length(sc - rp);
        lt = 0.05 / (1.0 + lt * lt * 0.001);
        //pc += gc * 0.05;
        pc += gc * lt;
        t += 0.5;
    }
    
    return pc;
}

Scene march(vec3 ro, vec3 rd, float maxt) {
 
    float h = EPS * 2.0;
    float t = 0.0;
    float id = 0.0;
    float rala = 0.0;
    float rbla = 0.0;
    
    for(int i = 0; i < 128; i++) {
        t += h;
        vec3 rp = ro + rd * t;
	    Scene scene = map(rp);
        if (abs(h) < EPS || t > maxt) {
            id = scene.id;
            break;
        }
        float lat = rp.z - cro.z;
        lat = (1.0 / (1.0 + lat * lat * 0.000001)) * step(3.8, rp.y);;
        rala += 0.3 / (1.0 + scene.rala * scene.rala * 1.0) * lat;
        rbla += 0.3 / (1.0 + scene.rbla * scene.rbla * 1.0) * lat;
        
        h = scene.t * 0.7;
    }
    
	return Scene(t, 
                 FAR, 
                 vec3(0.0), 
                 id,
                 vec3(-1.0),
                 rala,
                 rbla,
                 0.0);
}

Scene traceScene(vec3 ro, vec3 rd, float maxt) {
    
    float mint = FAR;
    float mintf = FAR;
    vec3 minn = vec3(0.0);
    float id = 0.0;
    vec3 sc = vec3(-1.0);
    
    //floor
    vec3 fo = vec3(0.0, 3.8, 0.0);
    vec3 fn = vec3(0.0, 1.0, 0.0);
    float ft = planeIntersection(ro, rd, fn, fo);
    if (ft > 0.0 && ft < mint) {
        mint = ft;
        minn = fn;
        id = TERRAIN_FLOOR;
    }
    //*/
    
    float rt = mod(T * 80.0, 1600.0) - 200.0;
    for (int i = 0; i < 2; i++) {
        vec4 ct = iCapsule( ro, rd, vec3(50.0 + float(i) * 30.0, 10.0, cro.z + rt), normalize(vec3(0.0, 0.0, 1.0)), RR, 200.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSA;
        }
        ct = iCapsule( ro, rd, vec3(-50.0 - float(i) * 30.0, 10.0, cro.z + rt), normalize(vec3(0.0, 0.0, 1.0)), RR, 200.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSA;
        }
    }
    rt = mod(T * 50.0, 1600.0) - 200.0;
    for (int i = 0; i < 3; i++) {
        vec4 ct = iCapsule( ro, rd, vec3(35.0 + float(i) * 30.0, 10.0, cro.z + rt), normalize(vec3(0.0, 0.0, 1.0)), RR, 140.0 - float(i) * 40.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSB;
        }
        ct = iCapsule( ro, rd, vec3(35.0 + float(i) * 30.0, 10.0, cro.z + rt - 600.0), normalize(vec3(0.0, 0.0, 1.0)), RR, 140.0 - float(i) * 40.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSB;
        }
        ct = iCapsule( ro, rd, vec3(-35.0 - float(i) * 30.0, 10.0, cro.z + rt), normalize(vec3(0.0, 0.0, 1.0)), RR, 140.0 - float(i) * 40.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSB;
        }
        ct = iCapsule( ro, rd, vec3(-35.0 - float(i) * 30.0, 10.0, cro.z + rt - 600.0), normalize(vec3(0.0, 0.0, 1.0)), RR, 140.0 - float(i) * 40.0);
        if (ct.x > 0.0 && ct.x < mint) {
            mint = ct.x;
            minn = ct.yzw;
            id = RODSB;
        }
    }
    //*/
    
    //spheres
    //FAR is 800 in front of camera. divide space into 100s
    float dt = (floor((cro.z + FAR) * 0.01) * 100.);
    for (int i = 0; i < 10; i++) {
       
        //large spheres
        float r = rand(vec2(20.0, dt - 20.0));
        vec4 sphere = vec4(20.0 + r * 100.0, 16.0, dt - 20.0, 24.);
        if (r > 0.75) {
            vec2 si = sphIntersect(ro, rd, sphere);
            if (si.x > 0.0 && si.x < mint) {
                mint = si.x;
                mintf = si.y;
                minn = sphNormal(ro + rd * si.x, sphere);
                id = SPHERE;
                sc = sphere.xyz;
            }
        }
        
        r = rand(vec2(-20.0, dt - 60.0));
        sphere = vec4(-20.0 - r * 100.0, 16.0, dt - 60.0, 24.);
        if (r > 0.8) {
            vec2 si = sphIntersect(ro, rd, sphere);
            if (si.x > 0.0 && si.x < mint) {
                mint = si.x;
                mintf = si.y;
                minn = sphNormal(ro + rd * si.x, sphere); 
                id = SPHERE;
                sc = sphere.xyz;
            }
        }        
        
        //small spheres
        r = rand(vec2(4.0, dt - 5.0));
        sphere = vec4(4.0 + r * 60.0, 10.0, dt - 5.0, 12.);
        if (r > 0.75) {
            vec2 si = sphIntersect(ro, rd, sphere);
            if (si.x > 0.0 && si.x < mint) {
                mint = si.x;
                mintf = si.y;
                minn = sphNormal(ro + rd * si.x, sphere); 
                id = SPHERE;
                sc = sphere.xyz;
            }
        }        
        
        r = rand(vec2(-4.0, dt - 25.0));
        sphere = vec4(-4.0 - r * 60.0, 10.0, dt - 25.0, 12.);
        if (r > 0.7) {
            vec2 si = sphIntersect(ro, rd, sphere);
            if (si.x > 0.0 && si.x < mint) {
                mint = si.x;
                mintf = si.y;
                minn = sphNormal(ro + rd * si.x, sphere); 
                id = SPHERE;
                sc = sphere.xyz;
            }
        }        
        
        dt -= 100.;    
    }
    //*/
    
    return Scene(mint, 
                 mintf, 
                 minn, 
                 id,
                 sc,
                 0.0,
                 0.0,
                 0.0);
}


vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
 
    vec3 pc = vec3(0.0);
    
    vec3 rp = ro + rd * scene.t;
    vec3 ld = normalize(vec3(160.0, 50.0, 10.));    
    float lt = length(lp - rp);
    float diff = max(dot(ld, scene.n), 0.05);
    float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 32.0);
    float atten = 2.0 / (1.0 + lt * lt * 0.0002);
    
    if (scene.id == TERRAIN_FLOOR) {
        
        pc = vec3(0.0, 0.04, 0.02) * 0.5 * diff;
        pc += vec3(1.0) * spec * 0.3;
        pc *= atten;
        
    } else if (scene.id == SPHERE) {

        pc = vec3(0.1, 0.0, 0.01) * diff;
        pc += vec3(1.0) * spec;
        pc *= atten;
        vec3 gc = palette(rand(scene.sc.xz), CA, CB, CC, CD);
        pc += vMarch1(rp, rd, scene.sc, gc, scene.tF - scene.t) * atten;
        
    } else if (scene.id == RODSA) {

        atten = 1.0 / (1.0 + lt * lt * 0.00001);
        pc = vec3(1.3, 0.0, 0.0) * atten;
        
    } else if (scene.id == RODSB) {

        atten = 1.0 / (1.0 + lt * lt * 0.00001);
        pc = vec3(1.3, 0.8, 0.0) * atten;
        
    } else {
         
        pc = vec3(0.01) * diff;
        pc += vec3(0.5, 0.0, 0.05) * max(scene.n.z, 0.0) * 0.15;
        pc += vec3(0.05, 0.0, 0.3) * max(scene.n.z * -1.0, 0.0) * 0.02;
        pc += vec3(0.05, 0.0, 0.3) * max(scene.n.x, 0.0) * 0.02;
        pc += vec3(1.0) * spec * 0.6;
        pc *= atten;
    
    }
    
    return pc;
}

void setupCamera(vec2 uv, inout vec3 rd) {

    vec3 lookAt = vec3(0.0, 28.0, T * 40.);
    cro = lookAt + vec3(0.0, 30.0, -54.0);
    lp = lookAt + vec3(50.0, 50.0, 10.);
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - cro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec3 pc = vec3(0.0);
    float mint = FAR;
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
    vec3 rala = vec3(0.0);
    vec3 rbla = vec3(0.0);
    bool glow = true;
    float terrainDepth;
    
    vec3 rd = vec3(0.);
    setupCamera(uv, rd);
    
    Scene terrain = march(cro, rd, FAR);
    if (terrain.t > 0.0 && terrain.t < mint) {
        mint = terrain.t;
        vec3 rp = cro + rd * terrain.t;
        terrainDepth = rp.y;
        terrain.n = normal(cro + rd * terrain.t);
        pc = colourScene(cro, rd, terrain);        
    }

    rala = vec3(1.0, 0.0, 0.0) * terrain.rala;
    rbla = vec3(1.0, 0.5, 0.0) * terrain.rbla;
    //*/
    
    Scene scene = traceScene(cro, rd, FAR);
    if (scene.t < mint) {
        
        mint = scene.t;
        vec3 rp = cro + rd * (scene.t - EPS);
        vec3 n = scene.n;
        
        if (scene.id == TERRAIN_FLOOR) {
            pc = mix(colourScene(cro, rd, scene), pc, 0.2 / (1.0 + rp.y - terrainDepth)); 
            n = bump(rp * 0.6 + T, n);
        } else {
            pc = colourScene(cro, rd, scene);
        }
        
        if (scene.id == SPHERE) glow = false;
        
        //TODO: Read up on how to do this properly
        vec3 rrd = reflect(rd, n);
        Scene reflectedScene = traceScene(rp, rrd, 200.0);
        if (reflectedScene.t < FAR) {
            float tt = scene.t + reflectedScene.t;
            float atten = 0.5 / (1.0 + tt * tt * 0.0005);
            vec3 rc = colourScene(rp, rrd, reflectedScene);
            if (scene.id == SPHERE && (reflectedScene.id == RODSA || reflectedScene.id == RODSB)) {
                rc /= scene.t * 0.01;
                pc = mix(pc, pc + rc, 1.0 - (reflectedScene.t / FAR));
            } else {
                rc *= atten;
                pc += rc;
            }
        }
    }
    
    if (glow) {
        pc += rala;
        pc += rbla;
    }
    
    pc = applyFog(pc, mint, rd, normalize(vec3(4.0, 5.0, 2.0)), 0.0005);  
    
    fragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
