/*
 * Original shader from: https://www.shadertoy.com/view/4ddfDS
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

/*
    I've been playing with partitioned space marching techniques recently 
    and I've been struggling to get movement between domain repeaated objects in cells.
    This one is based on approach by Nimitz in Sparse Grid Marching and it works a treat
    https://www.shadertoy.com/view/XlfGDs

    Other interesting approaches I've found
    https://www.shadertoy.com/view/Xljfzw a great example from Mattz

	... and the branchless approach by fb39ca4
    https://www.shadertoy.com/view/4dX3zl

    ... and my favourite voxel marcher IQ
    https://www.shadertoy.com/view/4dfGzs
*/

#define EPS 0.001
#define FAR 100.
#define T iTime
#define PI 3.141592

const float c = 1.0;
const float ch = c * 0.5;
const float ch2 = ch + 0.01;

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

//Shane
vec3 path(float t) {
    float a = sin(t * PI / 24.0 + 1.7);
    float b = cos(t * PI / 24.0);
    return vec3(a * 2.0, b * a, t);    
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

//IQ - sphere functions
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

float sphDensity(vec3 ro, vec3 rd, vec4 sph, float dbuffer) {

    float ndbuffer = dbuffer / sph.w;
    vec3  rc = (ro - sph.xyz) / sph.w;

    float b = dot(rd, rc);
    float c = dot(rc, rc) - 1.0;
    float h = b * b - c;
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

//Nimitz
float dBox(vec3 ro, vec3 rd)  {
    vec3 m = 1.2 / rd;
    vec3 t = -m * ro + abs(m) * ch2;
	return min(min(t.x, t.y), t.z);
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

vec4 map(vec3 rp, vec3 rd) {

    //vec4 sound = texture(iChannel0, vec2(0.5) / iResolution.xy);
    
    //rp.y = mod(rp.z, 2.0) < 1.0 ? rp.y : rp.y + min(1.0, mod(T, 2.0));
    //rp.x = mod(rp.z, 2.0) < 1.0 ? rp.x : rp.x + max(1.0, mod(T, 2.0));
    rp.y = mod(rp.z, 2.0) < 1.0 ? rp.y : rp.y + T;
    
    vec3 col = vec3(0.0);
    
    vec3 q  = mod(rp, c) -ch;
   	float t = dBox(q, rd); //Base distance is cell exit distance
    
    if (mod(rp.z - 2.0, 24.0) > 18.0) {
        col = noise(floor(rp)) > 0.9 ? vec3(1.0, 0.7, 0.1) : vec3(0.0);
        t = min(t, sdBox(q, vec3(0.2)));
    }
    
    return vec4(col, t);
}

vec4 castRay(vec3 ro, vec3 rd) {
    
    float t = 0.0;
    vec3 col = vec3(0.0);
    
    for (int i = 0; i < 98; i++) {
        vec4 ns = map( ro + rd * t, rd);
        if (ns.w < EPS || t > FAR) {
            col = ns.xyz;
            break;
    	}
        t += ns.w;
    }
	
    return vec4(col, t);
}

vec3 normal(vec3 rp, vec3 rd) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(rp + e.yxx, rd).w + e.xxy * map(rp + e.xxy, rd).w + 
					 e.xyx * map(rp + e.xyx, rd).w + e.yyy * map(rp + e.yyy, rd).w);   
}

void setupCamera(vec2 fragCoord, inout vec3 ro, inout vec3 rd, inout vec3 lp) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;

    vec3 lookAt = vec3(0.0, 0.0, T * 6.0);
    ro = lookAt + vec3(0.0, 0.0, -1.0);
    lp = lookAt + vec3(0.0, 0.0, 10.0 + sin(T * 0.2) * 6.0);

    lookAt = path(lookAt.z);
    ro = path(ro.z);
	lp = path(lp.z);
      
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
    rd.xy *= rot(sin(-ro.x  * 0.5) * 0.4);//isdive
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {	
	
    vec3 pc = vec3(0.0), ro = vec3(0.0), rd = vec3(0.0), lp = vec3(0.0);
    setupCamera(fragCoord, ro, rd, lp);
    float mint = FAR;
    
	vec4 scene = castRay(ro,rd);
    
    if (scene.w < FAR) {
        
        mint = scene.w;
        vec3 rp = ro + rd * scene.w;
        vec3 n = normal(rp, rd);
        
        //camera light
        vec3 ld = normalize(vec3(4.0, 5.0, -4.0));
        float atten = 1.0 / (1.0 + scene.w * scene.w * 0.05);
        float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);
        vec3 ac = vec3(1.0) * max(dot(ld, n), 0.05) * 0.2;
        ac += vec3(0.1, 0.0, 0.9) * max(0.0, n.y) * 0.1;
        ac += vec3(1.0) * spec * atten;
        
        //glowball light
        ld = normalize(lp - rp);
        float lt = length(lp - rp);
        atten = 1.0 / (1.0 + lt * lt * 0.03);
        spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 64.0);
        //shadow
        vec4 shadow = castRay(rp - rd * 0.01, ld);
        float sh = shadow.w > 0.0 && shadow.w < lt ? 0.0 : 1.0;
        vec3 gc = vec3(1.0, 0.5, 0.0) * max(dot(ld, n), 0.05) * atten * sh;
        atten = 1.0 / (1.0 + lt * lt * 0.08);
        gc += vec3(1.0, 0.8, 0.0) * max(dot(ld, n), 0.05) * atten * sh;
        gc += vec3(1.0, 1.0, 0.3) * spec * atten * sh;
        
        pc = ac + gc;
        pc += scene.xyz;
    }
    
    //glow light
    vec2 si = sphIntersect(ro, rd, vec4(lp, 1.0));
    if (si.x > 0.0 && si.x < mint) {
        float w = sphDensity(ro, rd, vec4(lp, 1.0), FAR);
        if (w > 0.0) {
        	pc += vec3(1.0, 0.2, 0.0) * w * w;    
        	pc += vec3(1.0, 0.5, 0.0) * w * w * w;    
        	pc += vec3(1.0, 1.0, 0.0) * w * w * w * w * w;    
        }
    }

	fragColor = vec4(pc, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
