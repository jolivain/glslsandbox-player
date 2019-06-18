/*
 * Original shader from: https://www.shadertoy.com/view/WlXGzM
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define MAT_BODY 1.0
#define MAT_FACE 2.0
#define MAT_HAND 3.0

const float pi = acos(-1.);
const float pi2 = pi * 2.;

float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

vec2 opU(vec2 d1, vec2 d2)
{
	return (d1.x<d2.x) ? d1 : d2;
}

vec2 opS( vec2 d1, vec2 d2 )
{ 
    return (-d1.x>d2.x) ? vec2(-d1.x, d1.y): d2;
}

vec2 opSU( vec2 d1, vec2 d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2.x-d1.x)/k, 0.0, 1.0 );
    return vec2(mix( d2.x, d1.x, h ) - k*h*(1.0-h), d1.y); }

mat2 rot( float th ){ vec2 a = sin(vec2(1.5707963, 0) + th); return mat2(a, -a.y, a.x); }

vec2 pMod(in vec2 p, in float s) {
    float a = pi / s - atan(p.x, p.y);
    float n = pi2 / s;
    a = floor(a / n) * n;
    p *= rot(a);
    return p;
}

vec2 thinkingFace(vec3 p)
{
    float boundingSphere = sdSphere(p, 1.5);
    if (boundingSphere > 0.5) {
    	return vec2(boundingSphere, 0.0);
    }
    
    vec2 face = vec2(sdSphere(p, 1.0), MAT_BODY);
    
    vec3 q = p;
    q.x = abs(q.x);
    q.xz *= rot(-.3);
    q.yz *= rot(-0.25 + 0.05 * step(0.0, p.x));
    q.y *= 0.8;q.z *= 2.0;q.z -= 2.0;
    vec2 eye =  vec2(sdSphere(q, .11) * 0.5, MAT_FACE);
    
    q = p;
    q.x = abs(q.x);
    q.xz *= rot(-.35);
    q.yz *= rot(-0.62 + 0.26 * step(0.0, p.x) + pow(abs(q.x), 1.7) * 0.5);
    q.z -= 1.0;
    vec2 brow = vec2(sdCapsule(q, vec3(0.2, 0.0, 0.0), vec3(-.2, 0.0, 0.0), .05) * 0.5, MAT_FACE);

    q = p;
    q.yz *= rot(0.2 + pow(abs(p.x), 1.8));
    q.xy *= rot(-0.25);
    q.z -= 1.0;
    vec2 mouth = vec2(sdCapsule(q, vec3(0.2, 0.0, 0.0), vec3(-.2, 0.0, 0.0), .045), MAT_FACE);
    
    p -= vec3(-.25, -.73, .93);
    p.xy *= rot(0.2);
    q = p;
    q = (q * vec3(1.2, 1.0, 2.0));
    q -= vec3(0.0, 0.01, 0.0);
    vec2 hand = vec2(sdSphere(q, .3) * 0.5, MAT_HAND);
    
    q = p;
    
    vec2 finger1 = vec2(sdCapsule(q - vec3(0.3, 0.2, 0.02), vec3(0.2, 0.0, 0.0), vec3(-.2, 0.0, 0.0), .07), MAT_HAND);
    vec2 finger2 = vec2(sdCapsule(q * vec3(1.2, 1.0, .8) - vec3(0.2, 0.06, 0.02), vec3(0.1, 0.0, 0.0), vec3(-.1, 0.0, 0.0), .08), MAT_HAND);
    vec2 finger3 = vec2(sdCapsule(q * vec3(1.2, 1.0, .8) - vec3(0.15, -0.08, 0.015), vec3(0.1, 0.0, 0.0), vec3(-.1, 0.0, 0.0), .08), MAT_HAND);
    vec2 finger4 = vec2(sdCapsule(q * vec3(1.2, 1.0, .9) - vec3(0.1, -0.2, -0.01), vec3(0.1, 0.0, 0.0), vec3(-.1, 0.0, 0.0), .08), MAT_HAND);
    
    p -= vec3(-0.1, 0.3, 0.0);
    q = p;
    q.x -= q.y * 0.7;

    vec2 finger5 = vec2(sdCapsule(p, vec3(0.0, -0.2, 0.0) - q, vec3(0.0, 0.2, 0.0), .1 - p.y * 0.15), MAT_HAND);
    vec2 finger = opU(finger1, opU(finger5, opSU(finger2, opSU(finger3, finger4, 0.035), 0.035)));
    
    hand = opSU(hand, finger, 0.02);
    
    vec2 d = opU(eye, face);
    d = opU(brow, d);
    d = opS(mouth, d);
    d = opU(hand, d);
    return d;
}

vec2 remap(vec2 val, vec2 im, vec2 ix, vec2 om, vec2 ox)
{
    return clamp(om + (val - im) * (ox - om) / (ix - im), om, ox);
}

#define ITERATION_NUM 6

float it = 0.0;

vec2 map(vec3 p)
{
    float s = 1.0;
    vec3 offset = vec3(1., .5, 2.) * 0.75;
    float d = 99999.9;
    float distFromCam = length(p)*0.4;
    
    vec3 spacesize = vec3(3.,10.,4.2);
    p.xyz = mod(p.xyz, spacesize) - spacesize*0.5;
    
    vec2 mouse = remap(iMouse.xy/iResolution.xy, vec2(0.0), vec2(1.0), vec2(-pi), vec2(pi));
    for (int i = 0; i < ITERATION_NUM; i++) {
    	p = abs(p) - offset * s;
        
        float phase = iTime * 4.0+float(i)*0.25+distFromCam*5.;
        
        p.xz *= rot(1.0 + float(i+1) * 0.6 + sin(phase) * 0.08);
        p.zy *= rot(float(i+1) * 0.5 + sin(phase * 0.33) * 0.05);
        p.xy *= rot(float(i+1) * 0.6 + sin(phase * 0.77) * 0.075);

        
        vec3 pp = p / s;
        //pp.xz *= rot(-pi * 0.5);
        pp.xz = pMod(pp.xz, 4.0);
        //d = min(d, thinkingFace(pp).x * s);
        float thinkd = thinkingFace(pp).x * s;
        if (d > thinkd) {
        	d = thinkd;
            it = float(i);
        }
        s *= 0.6;
        
    }
    return vec2(d, 0.0);
}

vec2 map2(vec3 p)
{
    float s = 1.0;
    vec3 offset = vec3(1., .5, 2.) * 0.75;
    float d = 99999.9;
    float distFromCam = length(p)*0.4;
    
    vec3 spacesize = vec3(3.,10.,4.2);
    p.xyz = mod(p.xyz, spacesize) - spacesize*0.5;
    
    vec2 mouse = remap(iMouse.xy/iResolution.xy, vec2(0.0), vec2(1.0), vec2(-pi), vec2(pi));
    for (int i = 0; i < ITERATION_NUM; i++) {
    	p = abs(p) - offset * s;
        
        float phase = iTime * 4.0+float(i)*0.25+distFromCam*5.;
        
        p.xz *= rot(1.0 + float(i+1) * 0.6 + sin(phase) * 0.08);
        p.zy *= rot(float(i+1) * 0.5 + sin(phase * 0.33) * 0.05);
        p.xy *= rot(float(i+1) * 0.6 + sin(phase * 0.77) * 0.075);

        
        vec3 pp = p / s;
        //pp.xz *= rot(-pi * 0.5);
        pp.xz = pMod(pp.xz, 4.0);
        d = min(d, thinkingFace(pp).x * s);
        s *= 0.6;
        
    }
    return vec2(d, 0.0);
}

vec3 normal( in vec3 pos, float eps )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*eps;
    return normalize( e.xyy*map2( pos + e.xyy ).x +
					  e.yyx*map2( pos + e.yyx ).x +
					  e.yxy*map2( pos + e.yxy ).x +
					  e.xxx*map2( pos + e.xxx ).x );
}

vec3 sunDir = normalize(vec3(.0, .25, .5));

float remap(float val, float im, float ix, float om, float ox)
{
    return clamp(om + (val - im) * (ox - om) / (ix - im), om, ox);
}

float sm(float start, float end, float t, float smo)
{
    return smoothstep(start, start + smo, t) - smoothstep(end - smo, end, t);
}

vec3 hsv2rgb(float h, float s, float v)
{
    return ((clamp(abs(fract(h+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*s+1.)*v;
}

float linerFog(float x, float ma, float len)
{
  return pow(min(max(x - ma, 0.0) / len, 1.0), 1.7);
}

vec3 materialize(vec3 p, vec3 ray, float depth, vec2 mat)
{
    vec3 col = vec3(0.0);
    vec3 nor = normal(p, 0.001);
    col = vec3(max(.75+dot(ray,nor), 0.0));
   	nor.b = .1-nor.b;
    nor.g = 0.;
    if (depth > 100.0) {
        col = vec3(0.0);
    }
    
    float t = mod(iTime * 3.0, float(ITERATION_NUM));
    float val = sm(it, it+1.0, t, 0.5);
    nor = mix(nor, hsv2rgb(it / float(ITERATION_NUM), 0.8, 1.0) * 20.0, val);
    col *= (nor.rgb*0.5+0.5);
    col = mix(col, vec3(0.0), linerFog(depth, 0.1, 20.0));
    return col;
}

vec3 trace(vec3 p, vec3 ray)
{
    float t = 0.0;
    vec3 pos;
    vec2 mat;
    for (int i = 0; i < 128; i++) {
        pos = p + ray * t;
        mat = map(pos);
        if (mat.x < 0.001 || t > 100.0) {
        	break;
        }
        t += mat.x;
    }
    return materialize(pos, ray, t, mat);
}

mat3 camera(vec3 ro, vec3 ta, float cr )
{
	vec3 cw = normalize(ta - ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float luminance(vec3 col)
{
    return dot(vec3(0.298912, 0.586611, 0.114478), col);
}

vec3 acesFilm(const vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d ) + e), 0.0, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    
    float t = iTime;
    sunDir = vec3(cos(t), 0.3, sin(t));
    
    vec3 ro = vec3(6.0 - t * 0.5, 7.5,-2.5);
    vec3 ta = ro + vec3(-2.0,-1.5,1.0);
    mat3 c = camera(ro, ta, 0.0);
    vec3 ray = c * normalize(vec3(p, 3.5));
    vec3 col = trace(ro, ray);

    col = acesFilm(col);
    col = pow(col, vec3(1.0/2.2));
    
    p = fragCoord.xy / iResolution.xy;
    p *=  1.0 - p.yx;
    float vig = p.x*p.y * 200.0;
    vig = pow(vig, 0.2);

    fragColor = vec4(col * vig,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
