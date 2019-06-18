/*
 * Original shader from: https://www.shadertoy.com/view/ltfBzj
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

#define EPS 0.005
#define FAR 200.0 
#define PI 3.14159265359
#define T iTime * 2.0

vec3 lp = vec3(4.0, 5.0, -2.0);

struct Box {
    float tN;
    float tF;
    vec3 nN;
    vec3 nF;
    float wN;
    float wF;
};

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
    float bs = 0.9;
    if (abs(rp.x) < bs && abs(rp.y) < bs) return 0.0;
    return 1.0;   
}        

// Cube mapping routine from Fizzer
// I'm not sure where I got this from
float fizz(vec3 rp) {
    vec3 f = abs(rp);
    f = step(f.zxy, f) * step(f.yzx, f); 
    f.xy = f.x > .5 ? rp.yz / rp.x : f.y > .5 ? rp.xz / rp.y : rp.xy / rp.z; 
    return tex(f);
}

// http://www.iquilezles.org/www/articles/boxfunctions/boxfunctions.htm
Box boxIntersection(vec3 ro, vec3 rd, vec3 boxSize) {

    Box box = Box(0.0, 0.0, vec3(0.0), vec3(0.0), 0.0, 0.0);

    vec3 m = 1.0 / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * boxSize;

    vec3 t1 = -n - k;
    vec3 t2 = -n + k;

    float tN = max(max(t1.x, t1.y), t1.z);
    float tF = min(min(t2.x, t2.y), t2.z);

    if (tN > tF || tF < 0.0) return box;

    float fzN = fizz(ro + rd * tN);
    float fzF = fizz(ro + rd * tF);

    vec3 nN = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    vec3 nF = -sign(rd) * step(t2.xyz, t2.yzx) * step(t2.xyz, t2.zxy); 

    return Box(tN, tF, nN, nF, fzN, fzF);
}

Box translateBox(vec3 ro, vec3 rd, float i) {

    vec3 bc = vec3(-i * (1.4 - i * 0.06), sin(T * 0.5 + i) * 1.4, 0.0); //box center
    vec3 boxSize = vec3(1.0 - i * 0.1);

    ro += bc;

    ro.xz *= rot(T + i * 0.25);
    rd.xz *= rot(T + i * 0.25);
    ro.xy *= rot(-T - i * 0.5);
    rd.xy *= rot(-T - i * 0.5);

    Box box = boxIntersection(ro, rd, boxSize);

    //unwind rotation of normals
    box.nN.xy *= rot(T + i * 0.5);
    box.nF.xy *= rot(T + i * 0.5);
    box.nN.xz *= rot(-T - i * 0.25);
    box.nF.xz *= rot(-T - i * 0.25);

    return box;
}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

float floorTex(vec3 rp) {
    rp.x += T * -2.0;
    vec2 m = mod(rp.xz, 4.0) - 2.0;
    if (m.x * m.y > 0.0) {
        return 0.8 + noise(rp * 4.0) * 0.16;
    }
    return 0.2 + noise((rp + 0.3) * 3.0) * 0.1;
}

struct Scene {
    float t;
    vec3 nN;
    vec3 pc;
    float edge;
    float k;            
};

Scene drawBoxes(vec3 ro, vec3 rd, vec3 pc) {

    vec3 sc = vec3(0.0);
    float edge = 0.0;
    float k = 0.0;

    Box nearest = Box(FAR, FAR, vec3(0.0), vec3(0.0), 0.0, 0.0);
    float index = 0.0;

    for (int i = 0; i < 8; i++) {
        float fi = float(i);
        Box box = translateBox(ro, rd, fi);
        if (box.tN > 0.0) {
            if (box.wN > 0.0) edge = 1.0;
            if (box.wF > 0.0) edge = 1.0;
            if (box.tN < nearest.tN) {
                nearest = box;
                index = fi;
            }
        }
    }

    if (edge > 0.0) {
        sc = vec3(0.0, 1.0, 0.0);
    } else {
        sc = pc;
    }

    if (nearest.tN < FAR) {

        k = clamp(index * 0.06, 0.0, 1.0);

        vec3 rp = ro + rd * nearest.tN;
        vec3 ld = normalize(lp - rp);
        float lt = length(lp - rp);
        float diff = max(dot(nearest.nN, ld), 0.05);
        float spec = pow(max(dot(reflect(-ld, nearest.nN), -rd), 0.0), 16.0);
        float atten = 1. / (1.0 + lt * lt * .05);
        vec3 fsc = vec3(0.0, 1.0, 0.0) * diff * atten;
        fsc += vec3(0.05, 0.0, 0.4) * nearest.nN.y * -0.04;
        fsc += vec3(1.0) * spec;

        rp = ro + rd * nearest.tF;
        ld = normalize(lp - rp);
        spec = pow(max(dot(reflect(-ld, nearest.nF), -rd), 0.0), 16.0);
        fsc += vec3(1.0) * spec * 0.5 * k;

        sc = mix(fsc, sc, k);
    }

    return  Scene(nearest.tN, nearest.nN, sc, edge, k);
}

float shadow(vec3 rp) {

    float sh = 1.0;

    vec3 ld = normalize(lp - rp); 
    float lt = length(lp - rp); 

    Scene boxes = drawBoxes(rp, ld, vec3(0.0)); 
    if (boxes.t > 0.0 && boxes.t < lt) {
        sh = 0.14 + (boxes.k * (1.0 - boxes.edge) * 0.86);
        sh *= boxes.t;
    }

    return clamp(sh, 0.1, 1.0);
}
                        
void setupCamera(vec2 fragCoord, inout vec3 ro, inout vec3 rd) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;

    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    ro = lookAt + vec3(0.0, 0.5 + (sin(T * 0.2) + 1.0) * 0.3, -12.0 - (sin(T * 0.3) + 1.0));

    ro.xz *= rot(T * 0.2);

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

    vec3 fo = vec3(0.0, -3.0, 0.0); 
    vec3 fn = vec3(0.0, 1.0, 0.0); 

    float ft = planeIntersection(ro, rd, fn, fo);
    if (ft > 0.0 && ft < FAR) {

        mint = ft;

        vec3 rrd = reflect(rd, fn);
        vec3 rp = ro + rd * ft; 
        vec3 ld = normalize(lp - rp); 
        float lt = length(lp - rp); 
        float diff = max(dot(fn, ld), 0.05); 
        float spec = pow(max(dot(reflect(-ld, fn), -rd), 0.0), 8.0); 
        float shad = shadow(rp); 
        float atten = 1. / (1.0 + lt * lt * .03); 

        vec3 sc = vec3(0.4, 1.0, 0.4) * floorTex(rp); 

        Scene boxes = drawBoxes(rp, rrd, vec3(0.0));
        if (boxes.t > 0.0 && boxes.t < FAR) {
            sc += boxes.pc * exp(boxes.t * -boxes.t * 0.0005);
        }

        sc += vec3(1.0) * spec; 
        pc = sc * diff * atten; 
        pc *= shad;
    }

    Scene boxes = drawBoxes(ro, rd, pc);
    if (boxes.t < mint) {

        pc = boxes.pc;

        vec3 rrd = reflect(rd, boxes.nN);
        vec3 rro = ro + rd * (boxes.t - EPS);
        float rft = planeIntersection(rro, rrd, fn, fo);
        if (rft > 0.0 && rft < FAR) {
            vec3 frp = rro + rrd * rft;
            vec3 rld = normalize(lp - frp);
            float rlt = length(lp - frp);
            float rdiff = max(dot(fn, rld), 0.05);
            float ratten = 1. / (1.0 + rlt * rlt * .03);
            vec3 rsc = vec3(0.4, 1.0, 0.4) * floorTex(frp);
            rsc *= rdiff * ratten;
            pc += rsc * exp(rft * -rft * 2.5) * 0.3;
        }
    }

    fragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
