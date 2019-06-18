/*
 * Original shader from: https://www.shadertoy.com/view/tdjXDD
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

const int renderPassSteps = 98;

// --------[ Original ShaderToy begins here ]---------- //
#define FAR 100.
#define EPS 0.01
#define PI 3.141593
#define T iTime
#define R iResolution.xy

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
vec2 path(float t) {
    float a = sin(t * PI / 32. + 1.5707);
    float b = cos(t * PI / 32.);
    return vec2(a * 1., b * a);    
}
//IQ cosine palattes
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(float t) {return vec3(.5) + vec3(.5) * cos(6.28318 * (vec3(1.) * t + vec3(0., .33, .67)));}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
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

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.) + length(max(d, 0.));
}

vec3 map(vec3 p) {
    
    p.xy += path(p.z);
    
    float rep = 5. + clamp(sin(T*.1-.5) * 8., -2., 1.);
    
    vec3 q = p;
    q.xy *= rot(0.525);
    q.z = mod(q.z, 4.) - 2.;
    
    float c = pModPolar(q.xy, rep);
    
    float panel = sdBox(q - vec3(2.4, 0., 0.), vec3(.2, .8, 1.));
    panel = max(panel, -sdCapsule(vec3(q.x,abs(q.y),q.z), vec3(2.4,.8,-1.2), vec3(2.4,.8,1.2), .12));
    
    float ring = sdTorus(vec3(q.x,q.y,abs(q.z)) - vec3(0.,0.,1.1), vec2(2.5298, .1));
    ring = max(ring, -sdBox(q - vec3(2.4,0.,0.), vec3(.4,.8,1.4)));
    ring = min(ring, sdCapsule(vec3(q.x,abs(q.y),q.z), vec3(2.4, .8, -1.1), vec3(2.4, .8, 1.1), .1));    
    
    q.xy*=rot(PI/rep);
    ring = min(ring, sdCapsule(vec3(q.x,q.y,abs(q.z)), vec3(2.5298,0.,1.1), vec3(2.5298,0.,2.),.1));
    
    return vec3(min(panel, ring), panel, ring);
}

/*
vec3 normal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}
*/
vec3 normal(vec3 p) {
    vec2 e = vec2(EPS, 0);
    float d1 = map(p + e.xyy).x, d2 = map(p - e.xyy).x;
    float d3 = map(p + e.yxy).x, d4 = map(p - e.yxy).x;
    float d5 = map(p + e.yyx).x, d6 = map(p - e.yyx).x;
    float d = map(p).x * 2.0;
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}
//*/

struct Surface {
    float t;
    float refl;
    vec3 pc;
    vec3 n;
};

Surface renderPass(vec3 ro, vec3 rd, int steps) {

    vec3 pc = vec3(0),
         gc = vec3(0),
         si = vec3(0),
         n = vec3(0),
         col = palette(T*.1);
    
    float t = 0., refl = 0.;
    
    for (int i = 0; i < renderPassSteps; i++) {
        vec3 rp = ro + rd*t;
        si = map(rp);
        if (si.x < EPS || t > FAR) break;
        
        gc += .1 * (col / (1. + si.z*si.z*100.)) * step(5., mod(rp.z, 12.));
        t += si.x * .5;
    }

    if (t > 0. && t < FAR) {
        n = normal(ro + rd*t);
        if (si.x == si.y) refl = 1.;
    }
    
    pc += gc;

    return Surface(t,refl,pc,n);
}

vec3 renderScene(vec3 ro, vec3 rd) {
    
    vec3 pc = vec3(0);
    
    Surface pass1 = renderPass(ro,rd,98);    
    pc += pass1.pc * mix(1., (pass1.t/FAR), (sin(T*.4)+1.)*.5);

    if (pass1.refl == 1.) {
        vec3 rro = ro + rd*(pass1.t-.01);
        vec3 rrd = reflect(rd, pass1.n);
        
        Surface reflectionPass = renderPass(rro,rrd,98);
        pc += .4 * reflectionPass.pc*(reflectionPass.t/FAR);
    }
    
    return pc;
}

vec3 camera(vec2 U, vec3 ro, vec3 la, float fl) {
    vec2 uv = (U - R*.5) / R.y;
    vec3 fwd = normalize(la-ro),
         rgt = normalize(vec3(fwd.z, 0., -fwd.x));
    return normalize(fwd + fl*uv.x*rgt + fl*uv.y*cross(fwd, rgt));
}

void mainImage(out vec4 C, vec2 U) {

    float AT = T * 6.;
    
    vec3 ro = vec3(0., .01, -6. + AT),
         la = vec3(0., 0., AT),
         lp = vec3(0., 0.1, -2. + AT);

    ///*
    ro.xy -= path(ro.z);
    la.xy -= path(la.z);
    lp.xy -= path(lp.z);
    //*/
    
    vec3 rd = camera(U, ro, la, 1.4);
    
    C = vec4(renderScene(ro,rd) * 2., 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
