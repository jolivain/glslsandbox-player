/*
 * Original shader from: https://www.shadertoy.com/view/MsVcRy
 */

#extension GL_OES_standard_derivatives : enable

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
#define T iTime
#define PI 3.14159265359
#define FAR 20.0
#define EPS 0.005

#define SPHERE_EXTERIOR 1.0
#define SPHERE_INTERIOR 2.0
#define FLOOR 3.0
#define SR 0.2

#define CA vec3(0.5, 0.5, 0.5)
#define CB vec3(0.5, 0.5, 0.5)
#define CC vec3(1.0, 1.0, 1.0)
#define CD vec3(0.0, 0.33, 0.67)

#define CT T / 14.0

const vec4 sphere = vec4(0.0, 0.0, 0.0, 1.0);

struct Scene {
    float t;
    float id;
    vec3 n;
    float stn;
    float stf;
};

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
//IQ cosine palattes
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {return a + b * cos(6.28318 * (c * t + d));}
vec3 glowColour() {return palette(T * 0.1, CA, CB, CC, CD);}
vec2 csqr(vec2 a) {return vec2(a.x * a.x - a.y * a.y, 2.0 * a.x * a.y);}

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

float tex(vec3 rp) {
    rp.xy *= rot(T);
    if (rp.x > 0.3 && rp.x < 0.5) return 0.0;
    return 1.0;
}        

//Cube mapping trick from Fizzer
float pattern(vec3 rp) {
    vec3 f = abs(rp);
    f = step(f.zxy, f) * step(f.yzx, f); 
    f.xy = f.x > .5 ? rp.yz / rp.x : f.y > .5 ? rp.xz / rp.y : rp.xy / rp.z; 
    return tex(f);
}

//See sphere functions IQ
//http://iquilezles.org/www/articles/spherefunctions/spherefunctions.htm
//slightly modified for cut patterns
vec4 sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    if (h < 0.0) return vec4(0.0); //missed
    h = sqrt(h);
    float tN = -b - h;
    float tNF = tN;
    if (pattern(ro + rd * tNF) == 0.0) tNF = 0.0;
    float tF = -b + h;
    float tFF = tF;
    if (pattern(ro + rd * tFF) == 0.0) tFF = 0.0;
    return vec4(tNF, tFF, tN, tF);
}

vec3 sphNormal(in vec3 pos, in vec4 sph) {
    return normalize(pos - sph.xyz);
}

float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
    vec3 oc = ro - sph.xyz;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - c;
    // physically plausible shadow
    float d = sqrt( max(0.0, sph.w * sph.w - h)) - sph.w;
    float tN = -b - sqrt( max(h, 0.0));
    float tF = -b + sqrt( max(h, 0.0));
    if ((pattern(ro + rd * tN) + pattern(ro + rd * tF)) == 0.0) return 1.0;
    if (tN > 0.0) return smoothstep(0.0, 1.0, 4.0 * k * d / tN) * 1.0;
    return 1.0;
}

float sphOcclusion(vec3 pos, vec3 nor, vec4 sph) {
    vec3  r = sph.xyz - pos;
    float l = length(r);
    float d = dot(nor, r);
    float res = d;

    if (d < sph.w) res = pow(clamp((d + sph.w) / (2.0 * sph.w), 0.0, 1.0), 1.5) * sph.w;
    
    return clamp(res * (sph.w * sph.w) / (l * l * l), 0.0, 1.0);
}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

float map(vec3 rp) {
	return min(length(rp) - sphere.w, rp.y + 1.0);
}

vec3 vMarch(vec3 ro, vec3 rd) {

    vec3 pc = vec3(0.0);
    float t = 0.0;
    
    for (int i = 0; i < 96; i++) {
        
        vec3 rp = ro + rd * t;
        float ns = map(rp);
        float fz = pattern(rp);
        
        if ((ns < EPS && fz > 0.0) || t > FAR) break;
        
        vec3 ld = normalize(-rp);
        float lt = length(rp);
        if (sphIntersect(rp, ld, sphere).x == 0.0 || lt < sphere.w) {
            lt -= SR;
            pc += glowColour() * 0.1 / (1.0 + lt * lt * 12.0);        
        }
        
        t += 0.05;
    }
    
    return pc;
}

//fractal from GUIL
//https://www.shadertoy.com/view/MtX3Ws
float fractal(vec3 rp) {
	
	float res = 0.0;
	float x = 0.8 + sin(T * 0.2) * 0.3;
    
    rp.yz *= rot(T);
    
    vec3 c = rp;
	
    for (int i = 0; i < 10; ++i) {
        rp = x * abs(rp) / dot(rp, rp) - x;
        rp.yz = csqr(rp.yz);
        rp = rp.zxy;
        res += exp(-99.0 * abs(dot(rp, c)));   
	}
    
    return res;
}

vec3 fractalMarch(vec3 ro, vec3 rd, float maxt) {
    
    vec3 pc = vec3(0.0);
    float t = 0.0;
    float ns = 0.;
    
    for (int i = 0; i < 64; i++) {
        
        vec3 rp = ro + t * rd;
        float lt = length(rp) - SR;

        ns = fractal(rp); 
        
        if (lt < EPS || t > maxt) break;
        t += 0.02 * exp(-2.0 * ns);

        pc = 0.99 * (pc + 0.08 * glowColour() * ns) / (1.0 + lt * lt * 1.);
        pc += 0.1 * glowColour() / (1.0 + lt * lt);  
    } 
    
    return pc;
}
    
Scene drawScene(vec3 ro, vec3 rd) {
 
    float mint = FAR;
    vec3 minn = vec3(0.0);
    float id = 0.0;

    vec3 fo = vec3(0.0, -1.0, 0.0);
    vec3 fn = vec3(0.0, 1.0, 0.0);
    float ft = planeIntersection(ro, rd, fn, fo);
    if (ft > 0.0 && ft < FAR) {
        mint = ft;
        id = FLOOR;
        minn = fn;
    }    
    
    vec4 si = sphIntersect(ro, rd, sphere);
    if (si.x > 0.0 && si.x < mint) {        
        vec3 rp = ro + rd * si.x;
        mint = si.x;
        id = SPHERE_EXTERIOR;
        minn = sphNormal(rp, sphere);
    } else if (si.y > 0.0 && si.y < mint) {        
        vec3 rp = ro + rd * si.y;
        mint = si.y;
        id = SPHERE_INTERIOR;
        minn = -sphNormal(rp, sphere);
    }
    
    return Scene(mint, id, minn, si.z, si.w);;
}

//Moody clouds from Patu
//https://www.shadertoy.com/view/4tVXRV
vec3 clouds(vec3 rd) {
    vec2 uv = rd.xz / (rd.y + 0.6);
    float nz = fbm(vec3(uv.yx * 1.4 + vec2(CT, 0.0), CT)) * 1.5;
    return clamp(pow(vec3(nz), vec3(4.0)) * rd.y, 0.0, 1.0);
}

// see https://www.shadertoy.com/view/MtffWs
vec3 pri(vec3 x) {
    vec3 h = fract(x / 2.0) - 0.5;
    return x * 0.5 + h * (1.0 - 2.0 * abs(h));
}

float checkersTextureGradTri(vec3 p, vec3 ddx, vec3 ddy) {
    p.z += T;
    vec3 w = max(abs(ddx), abs(ddy)) + 0.01; // filter kernel
    vec3 i = (pri(p + w) - 2.0 * pri(p) + pri(p - w)) / (w * w); // analytical integral (box filter)
    return 0.5 - 0.5 * i.x *  i.y * i.z; // xor pattern
}

vec3 texCoords(vec3 p) {
	return 5.0 * p;
}

vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
    
    vec3 pc = clouds(rd) * glowColour();
    vec3 gc = vec3(0.0);
    vec3 lp = vec3(4.0, 5.0, -2.0);
	    
    vec3 rp = ro + rd * scene.t;
    	
    vec3 ld = normalize(lp - rp);
    float lt = length(lp - rp);
    float atten = 1.0 / (1.0 + lt * lt * 0.051);
    
    if (scene.stn > 0.0) {
        gc = fractalMarch(ro + rd * scene.stn, rd, scene.stf - scene.stn);
        pc = gc;
    }

    if (scene.id == FLOOR) {
        
        // calc texture sampling footprint	
        vec3 uvw = texCoords(rp * 0.15);
		vec3 ddx_uvw = dFdx(uvw); 
    	vec3 ddy_uvw = dFdy(uvw);
        float fc = checkersTextureGradTri(uvw, ddx_uvw, ddy_uvw);
        
    	float diff = max(dot(ld, scene.n), 0.05);
        float ao = 1.0 - sphOcclusion(rp, scene.n, sphere);  
        float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 32.0);
        float sh = sphSoftShadow(rp, ld, sphere, 2.0);

        pc += glowColour() * fc * diff * atten;
        pc += vec3(1.0) * spec;
        pc *= ao * sh; 
        
        vec3 gld = normalize(-rp);
        if (sphIntersect(rp, gld, sphere).x == 0.0) {
            pc += glowColour() / (1.0 + length(rp) * length(rp));    
        }
    }
    
    if (scene.id == SPHERE_EXTERIOR) {
    	
        float ao = 0.5 + 0.5 * scene.n.y;
        float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 32.0);
        float fres = pow(clamp(dot(scene.n, rd) + 1.0, 0.0, 1.0), 2.0);
        
        pc *= 0.4 * (1.0 - fres);
        pc += vec3(1.0) * fres * 0.2;
        pc *= ao;
        pc += vec3(1.0) * spec;
    }

      
    if (scene.id == SPHERE_INTERIOR) {
    	float ao = 0.5 + 0.5 * scene.n.y;
        float ilt = length(rp) - SR;
        pc += glowColour() * ao / (1.0 + ilt * ilt);
    }
    //*/
    
    return pc;
}

void setupCamera(vec2 uv, inout vec3 ro, inout vec3 rd) {

    ro = vec3(0.0, 0.0, -4.0);
    vec3 lookAt = ro + vec3(0.0, 0.0 , 4.0);
    
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
	pc = colourScene(ro, rd, scene);    
    
    pc += vMarch(ro, rd);
    
    fragColor = vec4(pc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
