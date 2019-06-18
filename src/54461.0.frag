/*
 * Original shader from: https://www.shadertoy.com/view/Msd3DN
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
const vec4  iMouse = vec4(0.0);

// Emulate a black texture
//#define texture(s, uv) vec4(0.0)
#define textureLod(s, uv, lod) vec4(0.0)
//#define texelFetch(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Created by sebastien durand - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

// Lightening, essentially based on one of incredible TekF shaders:
// https://www.shadertoy.com/view/lslXRj

// Pupils effect came from lexicobol shader: [famous iq tutorial]
// https://www.shadertoy.com/view/XsjXz1

// Smooth max from cabbibo shader:
// https://www.shadertoy.com/view/Ml2XDw



//-----------------------------------------------------

// Display distance field in a plane perpendicular to camera crossing pt(0,0,0)


// Change this to improve quality (3 is good)
	#define ANTIALIASING 1

#define CLOUD_FAST

float g_time = 0.;

// consts
const float tau = 6.2831853;
const float phi = 1.61803398875;

// Isosurface Renderer
const int g_traceLimit=64;
const float g_traceSize=.005;

// globals
const vec3 g_nozePos = vec3(0,-.28+.04,.47+.08);
const vec3 g_eyePos = vec3(.14,-.14,.29);
const float g_eyeSize = .09;

vec3 g_envBrightness = vec3(.5,.6,.9); // Global ambiant color
vec3 g_lightPos = vec3(0.), g_deltaPast = vec3(0.);
mat2 ma = mat2(0.), mb = mat2(0.), mc = mat2(0.);
mat2 g_eyeRot = mat2(0.), g_headRotH = mat2(0.), rotTime = mat2(0.);
    
bool g_bHead = true, g_bBody = true;

// -----------------------------------------------------------------

float hash( float n ) { return fract(sin(n)*43758.5453123); }

vec3 hash3( vec2 p )
{
    vec3 q = vec3( dot(p,vec2(127.1,311.7)), 
				   dot(p,vec2(269.5,183.3)), 
				   dot(p,vec2(419.2,371.9)) );
	return fract(sin(q)*43758.5453);
}

float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.-2.*f);
	vec2 uv = (p.xy+vec2(37.,17.)*p.z) + f.xy;
	vec2 rg = textureLod( iChannel0, (uv+ .5)/256., -100.).yx;
	return -1.+2.*mix( rg.x, rg.y, f.z );
}

mat2 matRot(in float a) {
    float ca = cos(a), sa = sin(a);
    return mat2(ca,sa,-sa,ca);
}


// Smooth HSV to RGB conversion 
// [iq: https://www.shadertoy.com/view/MsS3Wc]
vec3 hsv2rgb_smooth(float x, float y, float z) {
    vec3 rgb = clamp( abs(mod(x*6.+vec3(0.,4.,2.),6.)-3.)-1., 0., 1.);
	rgb = rgb*rgb*(3.-2.*rgb); // cubic smoothing	
	return z * mix( vec3(1), rgb, y);
}

// Distance from ray to point
float dist(vec3 ro, vec3 rd, vec3 p) {
	return length(cross(p-ro,rd));
}

// Intersection ray / sphere
bool intersectSphere(in vec3 ro, in vec3 rd, in vec3 c, in float r, out float t0, out float t1) {
    ro -= c;
	float b = dot(rd,ro), d = b*b - dot(ro,ro) + r*r;
    if (d<0.) return false;
	float sd = sqrt(d);
	t0 = max(0., -b - sd);
	t1 = -b + sd;
	return (t1 > 0.);
}


//#ifdef NOISE_SKIN
// By Shane -----

// Tri-Planar blending function. Based on an old Nvidia tutorial.
vec3 tex3D( sampler2D tex, in vec3 p, in vec3 n ){
    n = max((abs(n) - .2)*7., .001); // n = max(abs(n), 0.001), etc.
    n /= (n.x + n.y + n.z );  
    p*=6.;
	return (textureLod(tex, p.yz, 5.)*n.x + textureLod(tex, p.zx, 5.)*n.y + textureLod(tex, p.xy, 5.)*n.z).xyz;
}

vec3 doBumpMap( sampler2D tex, in vec3 p, in vec3 nor, float bumpfactor){
    const float eps = 0.001;
    float ref = (tex3D(tex,  p , nor)).x;                 
    vec3 grad = vec3( (tex3D(tex, vec3(p.x-eps, p.y, p.z), nor).x)-ref,
                      (tex3D(tex, vec3(p.x, p.y-eps, p.z), nor).x)-ref,
                      (tex3D(tex, vec3(p.x, p.y, p.z-eps), nor).x)-ref )/eps;
             
    grad -= nor*dot(nor, grad);          
                      
    return normalize( nor + grad*bumpfactor );
}

//#endif


// -- Modeling Primitives ---------------------------------------------------

float udRoundBox(in vec3 p,in vec3 b, in float r) {
  return length(max(abs(p)-b,0.0))-r ;
}
float mBox(vec3 p, vec3 b){
	return max(max(abs(p.x)-b.x,abs(p.y)-b.y),abs(p.z)-b.z);
}


float sdCapsule(in vec3 p, in vec3 a, in vec3 b, in float r0, in float r1 ) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0., 1.);
    return length( pa - ba*h ) - mix(r0,r1,h);
}

// capsule with bump in the middle -> use for neck
vec2 sdCapsule2(in vec3 p,in vec3 a,in vec3 b, in float r0,in float r1,in float bump) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1. );
    float dd = bump*sin(3.14*h);  // Little adaptation
    return vec2(length(pa - ba*h) - mix(r0,r1,h)*(1.+dd), 1.); 
}

float smin(in float a, in float b, in float k ) {
    float h = clamp( .5+.5*(b-a)/k, 0., 1. );
    return mix( b, a, h ) - k*h*(1.-h);
}

// Smooth max from cabbibo shader:
// https://www.shadertoy.com/view/Ml2XDw
float smax(in float a, in float b, in float k) {
    return log(exp(a/k)+exp(b/k))*k;
}

float smax2( float a, float b, float k )
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( a, b, h ) + k*h*(1.0-h);
}

float sdEllipsoid( in vec3 p, in vec3 r) {
    return (length(p/r ) - 1.) * min(min(r.x,r.y),r.z);
}



// -- Modeling Head ---------------------------------------------------------

float dSkinPart(in vec3 pgeneral, in vec3 p) {

    float d = 1000.;
   
// Skull modeling -------------------------
    d = sdEllipsoid(p-vec3(0,.05,.0), vec3(.39,.48,.46));	
    if (d > .2) return d;
    
 //   d = smin(d, sdEllipsoid(p-vec3(0.,.1,-.15), vec3(.42,.4,.4)),.1);     
    d = smin(d, udRoundBox(p-vec3(0,-.28,.2), vec3(.07,.05,.05),.05),.4); // Basic jaw 
// Symetrie -------------------------------
    p.x = abs(p.x);
// Eye hole 
    d = smax(d, -sdEllipsoid(p-vec3(.12,-.16,.48), vec3(.09,.06,.09)), .07);

// Noze ------------------------------------
    d = smin(d, max(-(length(p-vec3(.032,-.325,.45))-.028),   // Noze hole
                    smin(length(p-vec3(.043,-.29,.434))-.01,  // Nostrils
                    sdCapsule(p, vec3(0,-.13,.39), vec3(0,-.28,.47), .01,.04), .05)) // Bridge of the nose
            ,.065); 
   
// Mouth -----------------------------------    
    d = smin(d, length(p- vec3(.22,-.34,.08)), .17); // Jaw
    d = smin(d, sdCapsule(p, vec3(.16,-.35,.2), vec3(-.16,-.35,.2), .06,.06), .15); // Cheeks
   
    d = smin(d, max(-length(p.xz-vec2(0,.427))+.015,  	// Line under the noze
        		max(-p.y-.41,   						// Upper lip
                    sdEllipsoid(p- vec3(0,-.34,.37), vec3(.08,.15,.05)))), // Mouth bump
             .032);

// Eyelid ---------------------------------
	vec3 p_eye1 = p - g_eyePos;
    p_eye1.xz *= mb;
    
    vec3 p_eye2 = p_eye1;
    float d_eye = length(p_eye1) - g_eyeSize;
          
	p_eye1.yz *= g_eyeRot;
	p_eye2.zy *= mc;
    
    float d1 = min(max(-p_eye1.y,d_eye - .01),
                   max(p_eye2.y,d_eye - .005));
    d = smin(d,d1,.01);

	return d; 
}

float dEye(vec3 p_eye) {
    p_eye.xz *= ma;     
    return length(p_eye) - g_eyeSize;
}

vec2 min2(in vec2 dc1, in vec2 dc2) {
	return dc1.x <= dc2.x ? dc1 : dc2; 
}

float sdTorus(in vec3 p, in vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float dfTrailPart0(vec3 p, float t, float lineId)
{
    vec3 pm = p;
    t*=20.;
    t += hash(lineId);
    pm.x = mod(p.x+t+1.6,3.2)-1.6;
    
    float index = (p.x+t)-pm.x;
    float id = lineId*10. + floor(((index+1.6)/3.2)+1.6);
    vec3 size = (.2+.5*hash3(vec2(id, id+1.)));//*smoothstep(3.,7.,-p.x);
    
    pm.z += .25*cos(id);
    //pm.xy *= rotTime;
    pm.xz *= matRot(3.14*hash(id));
    pm.yz *= rotTime;
     
    return  max(p.x+4., udRoundBox(pm,size,.025));
}


float spaceship0(vec3 p, float lineId) {
    p += vec3(0.,1.7,.5);
	vec2 p2 = vec2(sqrt(dot(p,p)-p.z*p.z), p.z);
	
    float d = length(p2-vec2(-6.,0))-7.5;
    
    d = min(d, max(p2.y, p2.x-.3+.2*(p2.y+3.)));
    d = max(-p2.y-4., d);
            
    vec3 p3 = p;
    p3.xy = abs(p3.xy);
    p3-=vec3(1.,1.,-3.);
    p3.xy *= mc;
    
    float d2 = mBox(p3, vec3(.05,.5,.8));
    d2 = max(d2, length(p-vec3(0.,0.,-3.5))-1.8);
    d = min(d, length(p - vec3(0,.95,1.1))-.83);
    d = smax2(d, -length(p - vec3(0,.8,.8))+1., .15); 
    d = min(d,d2);
    return min(d, dfTrailPart0(p.zxy, 5.*g_time, lineId)); 
}

float dToga0(vec3 p) {

    float move = -1.+2.*g_deltaPast.x;
    
    p.z -= .04;
    p.y += .05;
    float bonnet = length(p- vec3(0,.25,-.03)) - .42;
    
    bonnet = smin(bonnet, length(p-vec3(.15*move,.5,-.35)) - .18, .25);

    vec3 sp = p-vec3(0.,-1.2,.15);
    sp.yz *= ma;
    bonnet = min(bonnet, udRoundBox(sp, vec3(.4,.5,0.), .4));
        
    sp = sin(111.*p);
    float echarpe = length(p- vec3(.3*move,.45,-.57)) - .15 - .007*sp.x*sp.y*sp.z;
    
    
    p -= vec3(0.,-.05,-.05);
  
    p.y = -abs(p.y);
 
    p.zy *= mb;  
    float dy = -.8+1.2*cos(p.x);
    
    echarpe =  min(echarpe, sdTorus(p+vec3(0,+dy,0), vec2(.42,.07)));
    echarpe = smin(echarpe, sdTorus(p+vec3(0,-.2+dy,0), vec2(.46,.09)),.15);
	float result =  min(echarpe,bonnet);
    result -= .001*sp.x*sp.y*sp.z;
    return result *.8;
}

vec2 dfTrailPart(vec3 p, float t, float lineId)
{
    vec3 pm = p;
    t*=20.;
    t += hash(lineId);
    pm.x = mod(p.x+t+1.6,3.2)-1.6;
    
    float index = (p.x+t)-pm.x;
    float id = lineId*10. + floor(((index+1.6)/3.2)+1.6);
    vec3 size = (.2+.5*hash3(vec2(id, id+1.)));//*smoothstep(4.,7.,-p.x);
    
    pm.z += .25*cos(id);  
    
    //pm.xy *= rotTime;
    pm.xz *= matRot(3.14*hash(id));
    pm.yz *= rotTime;
    
    vec3 k3 = smoothstep(.08*size.x, .12*size.x, abs(pm));
    float k = k3.x*k3.y*k3.z*.95;
     
    float d = max(p.x+4., udRoundBox(pm,size,.025));
    return vec2(d, 40. + id + k);    
}


vec2 spaceship(vec3 p, float lineId) {
    p += vec3(0.,1.7,.5);
	
    vec2 p2 = vec2(sqrt(dot(p,p)-p.z*p.z), p.z);
	float d = length(p2-vec2(-6.,0))-7.5;
    
    d = min(d, max(p2.y, p2.x-.3+.2*(p2.y+3.)));
    d = max(-p2.y-4., d);
            
    vec3 p3 = p;
    p3.xy = abs(p3.xy);
    p3-=vec3(1.,1.,-3.);
    p3.xy *= mc;
   
    float d2 = mBox(p3, vec3(.05,.5,.8));
    d2 = max(d2, length(p-vec3(0.,0.,-3.5))-1.8);

    d = min(d, length(p - vec3(0,.95,1.1))-.83);
//	d = max(d, -length(p - vec3(0,.8,.8))+1.1);
    d = smax2(d, -length(p - vec3(0,.8,.8))+1., .15); 
    
    d = min(d,d2);
    p = p.zxy;
    
    return min2(vec2(d,20.+ mod(lineId,3.) + .95*smoothstep(.8,.9,cos(5.*p.z*p.y))), dfTrailPart(p, 5.*g_time, lineId)); 
}

vec2 dToga(vec3 p) {

    float move = -1.+2.*g_deltaPast.x;
    
    p.z -= .04;
    p.y += .05;
    float bonnet = length(p- vec3(0,.25,-.03)) - .42;
    bonnet = smin(bonnet, length(p-vec3(.15*move,.5,-.35)) - .18, .25);

    vec3 sp = p-vec3(0.,-1.2,.15);
    sp.yz *= ma;
    bonnet = min(bonnet, udRoundBox(sp, vec3(.4,.5,0.), .4));
        
    sp = sin(111.*p);
    float echarpe = length(p- vec3(.3*move,.45,-.57)) - .15 - .007*sp.x*sp.y*sp.z;
    
    
    p -= vec3(0.,-.05,-.05);
  
    p.y = -abs(p.y);
 
    p.zy *= mb;  
    float dy = -.8+1.2*cos(p.x);
    
    echarpe =  min(echarpe, sdTorus(p+vec3(0,+dy,0), vec2(.42,.07)));
    echarpe = smin(echarpe, sdTorus(p+vec3(0,-.2+dy,0), vec2(.46,.09)),.15);
	vec2 result =  min2(vec2(echarpe,0.), vec2(bonnet, 1.));
    result.x -= .001*sp.x*sp.y*sp.z;
    result.x *=.8;
    return result;
}


vec3 headRotCenter = vec3(0,-.2,-.07);
float map( vec3 p) {
    
    float px = mod(p.x+8.,16.)-8.;
    
    float lineId = floor((px-p.x+8.)/16.);
    p.x = px;
    float rnd = hash(lineId+10.);
    p.z += cos(g_time*rnd+2.*rnd)*rnd;
    p.y += cos(g_time+5.*rnd)*rnd;
    
    float d = dToga0(p);
    d = min(d, spaceship0(p, lineId));
        
    vec3 p0 = p;
    p -= headRotCenter;
    p.yz *= g_headRotH;
    p += headRotCenter;
    
	d = min(d, dSkinPart(p0,p));
    p.x = abs(p.x);
    d = min(d, dEye(p- g_eyePos));

    return d;
}


// render for color extraction
float colorField(vec3 p) {

    float px = mod(p.x+8.,16.)-8.;
    
    float lineId = floor((px-p.x+8.)/16.);
    p.x = px;
    float rnd = hash(lineId+10.);
    p.z += cos(g_time*rnd+2.*rnd)*rnd;
    p.y += cos(g_time+5.*rnd)*rnd;
    
    vec2 dc = dToga(p);
    dc = min2(dc, spaceship(p,lineId));
    
    vec3 p0 = p;
    p -= headRotCenter;
    p.yz *= g_headRotH;
    p += headRotCenter;

    dc = min2(vec2(dSkinPart(p0,p), 2.), dc);
         
    p.x = abs(p.x);
	return min2(dc, vec2(dEye(p - g_eyePos), 3.)).y;
}


// ---------------------------------------------------------------------------

float SmoothMax( float a, float b, float smoothing ) {
	return a-sqrt(smoothing*smoothing + pow(max(.0,a-b),2.0));
}

vec3 Sky( vec3 ray) {
	return g_envBrightness*mix( vec3(.8), vec3(0), exp2(-(1.0/max(ray.y,.01))*vec3(.4,.6,1.0)) );
}



//--------------------------------------------------------------------

const float cloudScale = .15;

float map5( in vec3 p )
{
	vec3 q = p*cloudScale;
	float f;
    f  = .50000*noise( q ); q = q*2.02;
    f += .25000*noise( q ); q = q*2.03;
    f += .12500*noise( q ); q = q*2.01;
    f += .06250*noise( q ); q = q*2.02;
    f += .03125*noise( q );
	return clamp( 1.5 - p.y - 2. + 1.75*f, 0., 1. );
}

float map4( in vec3 p )
{
	vec3 q = p*cloudScale;
	float f;
    f  = .50000*noise( q ); q = q*2.02;
    f += .25000*noise( q ); q = q*2.03;
    f += .12500*noise( q ); q = q*2.01;
    f += .06250*noise( q );
	return clamp( 1.5 - p.y - 2. + 1.75*f, 0., 1. );
}
float map3( in vec3 p )
{
	vec3 q = p*cloudScale;
	float f;
    f  = .50000*noise( q ); q = q*2.02;
    f += .25000*noise( q ); q = q*2.03;
    f += .12500*noise( q );
	return clamp( 1.5 - p.y - 2. + 1.75*f, 0., 1. );
}
float map2( in vec3 p )
{
	vec3 q = p*cloudScale;
	float f;
    f  = .50000*noise( q ); q = q*2.02;
    f += .25000*noise( q );
	return clamp( 1.5 - p.y - 2. + 1.75*f, 0., 1. );
}

vec3 sundir = normalize(vec3(.5,1.5,1.5)); 


vec4 integrate( in vec4 sum, in float dif, in float den, in vec3 bgcol, in float t )
{
  //  bgcol *= 1.2;
    // lighting
    vec3 lin = vec3(.65,.7,.75)*1.4 + vec3(1.0, .6, .3)*dif;        
    vec4 col = vec4( mix( vec3(1.,.95,.8), vec3(.25,.3,.35), den ), den );
    col.xyz *= lin;
    //col.xyz = mix( col.xyz, bgcol, 1.0-exp(-0.00008*t*t) );
    // front to back blending         
	col.xyz = mix(bgcol, col.xyz, exp2(-t*vec3(.4,.6,1.)/39.) );
    col.a *= 0.5;
    col.rgb *= col.a;
    return sum + col*(1.0-sum.a);
}

#ifdef CLOUD_FAST

#define MARCH(STEPS,MAPLOD,TEND) for(int i=0; i<STEPS; i++) { vec3  pos = ro + t*rd; if( t>TEND || sum.a > 0.95 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif =  clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); sum = integrate( sum, dif, den, bgcol, t ); } t += max(.3,0.2*t); }

vec4 raymarch( in vec3 ro, in vec3 rd, in vec3 bgcol, in float tend )
{
    ro.y *= .3;
    rd.y *= .3;
    
	vec4 sum = vec4(0);

	float t = 0.0;
//    MARCH(30,map5, tend);
    MARCH(30,map4, tend);
//    MARCH(30,map3, tend);
    MARCH(30,map2, tend);

    return clamp( sum, 0., 1. );
}

#else

#define MARCH(STEPS,MAPLOD,TEND) for(int i=0; i<STEPS; i++) { vec3  pos = ro + t*rd; if( t>TEND || sum.a > 0.95 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif =  clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); sum = integrate( sum, dif, den, bgcol, t ); } t += max(.3,0.06*t); }

vec4 raymarch( in vec3 ro, in vec3 rd, in vec3 bgcol, in float tend )
{
    ro.y *= .3;
    rd.y *= .3;
    
	vec4 sum = vec4(0);

	float t = 0.0;
    MARCH(30,map5, tend);
    MARCH(30,map4, tend);
    MARCH(30,map3, tend);
    MARCH(30,map2, tend);

    return clamp( sum, 0., 1. );
}

#endif // CLOUD_FAST








// -------------------------------------------------------------------
// pupils effect came from lexicobol shader:
// https://www.shadertoy.com/view/XsjXz1
// -------------------------------------------------------------------


float iqnoise( in vec2 x, float u, float v )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
	float k = 1.+63.*pow(1.-v,4.);
	float va = 0.;
	float wt = 0.;
    for( int j=-2; j<=2; j++ )
    for( int i=-2; i<=2; i++ ) {
        vec2 g = vec2(i,j);
		vec3 o = hash3( p + g )*vec3(u,u,1.);
		vec2 r = g - f + o.xy;
		float d = dot(r,r);
		float ww = pow( 1.-smoothstep(0.,1.414,sqrt(d)), k );
		va += o.z*ww;
		wt += ww;
    }
	
    return va/wt;
}

float noise ( vec2 x)
{
	return iqnoise(x, 0., 1.);
}

mat2 m = mat2( .8, .6, -.6, .8);

float fbm( vec2 p)
{
	float f = .0;
    f += .5000 * noise(p); p *= m* 2.02;
    f += .2500 * noise(p); p *= m* 2.03;
    f += .1250 * noise(p); p *= m* 2.01;
    f += .0625 * noise(p); p *= m* 2.04;
    f /= .9375;
    return f;
}


vec3 iris(vec2 p, float open)
{
    float background = 1.;// smoothstep(-0.25, 0.25, p.x);
    
    float r = sqrt( dot (p,p));
    float r_pupil = .15 + .15*smoothstep(.5,2.,open);

    float a = atan(p.y, p.x); // + 0.01*g_time;
    vec3 col = vec3(1);
    
    float ss = .5;// + 0.5 * sin(g_time * 2.0);
    float anim = 1.0 + .05*ss* clamp(1.0-r, 0., 1.);
    r *= anim;
        
    if( r< .8) {
		col = vec3(.12, .60, .57);
        float f = fbm(5. * p);
        col = mix(col, vec3(.12,.52, .60), f); // iris bluish green mix
        
        f = 1.0 - smoothstep( r_pupil, r_pupil+.2, r);
        col = mix(col, vec3(.60,.44,.12), f); //yellow
        
        a += .05 * fbm(20.*p);
        
        f = smoothstep(0.3, 1.0, fbm(vec2(5.0 * r, 20.0 * a))); // white highlight
        col = mix(col, vec3(1.0), f);
        
        f = smoothstep(0.3, 1.0, fbm(vec2(5.0 * r, 5.0 * a))); // yellow highlight
        col = mix(col, vec3(0.60,0.44,0.12), f);
        
        f = smoothstep(0.5, 1.0, fbm(vec2(5.0 * r, 15.0 * a))); // dark highlight
        col *= 1.0 - f;
        
        f = smoothstep(0.55, 0.8, r); //dark at edge
        col *= 1.0 - 0.6*f;
        
        f = smoothstep( r_pupil, r_pupil + .05, r); //pupil
        col *= f; 
        
        f = smoothstep(0.75, 0.8, r);
        col = .5*mix(col, vec3(1.0), f);
    }
    
	return col * background;
}

// -------------------------------------------------------------------

float lineSegDist( vec2 uv, vec2 ba, vec2 a, float r ) {
    vec2 pa = uv - a - ba*r; ba = -ba*r;
    return length( pa - ba*clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 ) );
}

float snowFlake(vec2 p) {
    p*= 8.;
    if (length(p)>2.2) return 0.;
    p.y = -abs(p.y);

    float d2 = lineSegDist(p, vec2(-1., 0.), vec2(-1.2,-.5), 1.2); 
    d2 = min(d2, lineSegDist(p, vec2(-1., 0.), vec2(-1.6,-.15), .8)); 

    p.x = abs(p.x);
    

    float a = .6;
    float d = lineSegDist(p, vec2(1., 0.), vec2(.0,0.), 1.);
    d = min(d, lineSegDist(p, vec2(.5, -.866), vec2(0.,0.), 1.));
    d = min(d, lineSegDist(p, vec2(.5, -.866), vec2(a,0.), .25));
    d = min(d, lineSegDist(p, vec2(-.5, -.866), vec2(a*.5,-.866*a), .25));
    d = min(d, lineSegDist(p, vec2(1., 0.), vec2(a*.5,-.866*a), .25));
	
    return (1.-smoothstep(.05,.08,abs(d-.15))) + 
        (1.-smoothstep(.0,.03,d2-.05));
}


// -------------------------------------------------------------------



vec3 Shade( vec3 pos, vec3 ray, vec3 normal, vec3 lightDir1, vec3 lightDir2, vec3 lightCol1, vec3 lightCol2, float shadowMask1, float shadowMask2, float distance )
{
    
    float colorId = colorField(pos);
    
	vec3 ambient = g_envBrightness*mix( vec3(.2,.27,.4), vec3(.4), (-normal.y*.5+.5) ); // ambient
    
    // ambient occlusion, based on my DF Lighting: https://www.shadertoy.com/view/XdBGW3
	float aoRange = distance/20.0;
	
	float occlusion = max( 0.0, 1.0 - map( pos + normal*aoRange )/aoRange ); // can be > 1.0
	occlusion = exp2( -2.0*pow(occlusion,2.0) ); // tweak the curve
    
	ambient *= occlusion*.8+.2; // reduce occlusion to imply indirect sub surface scattering

	float ndotl1 = max(.0,dot(normal,lightDir1));
	float ndotl2 = max(.0,dot(normal,lightDir2));
    
	float lightCut1 = smoothstep(.0,.1,ndotl1);
	float lightCut2 = smoothstep(.0,.1,ndotl2);

	vec3 light = vec3(0);
    

	light += lightCol1*shadowMask1*ndotl1;
	light += lightCol2*shadowMask2*ndotl2;

    
	// And sub surface scattering too! Because, why not?
    float tr = distance/10.0; // this really should be constant... right?
    float transmission1 = map( pos + lightDir1*tr )/tr;
    float transmission2 = map( pos + lightDir2*tr )/tr;
    
    vec3 sslight = lightCol1 * smoothstep(0.0,1.0,transmission1) + lightCol2 * smoothstep(0.0,1.0,transmission2);
    vec3 subsurface = vec3(1,.8,.5) * sslight;

    float specularity = .2; 
	vec3 h1 = normalize(lightDir1-ray);
	vec3 h2 = normalize(lightDir2-ray);
    
	float specPower;
    specPower = exp2(3.0+5.0*specularity);

    vec3 p = pos;
    p -= headRotCenter;
    p.yz *= g_headRotH;
    p += headRotCenter;
         
    float px = mod(p.x+8.,16.)-8.;
    float lineId = floor((px-p.x+8.)/16.);
    p.x = px;
    float rnd = hash(lineId+10.);
    p.z += cos(g_time*rnd+2.*rnd)*rnd;
    p.y += cos(g_time+5.*rnd)*rnd;
        
     
    vec3 albedo;

    if (colorId < 1.5) {  
        // closes
        albedo = mix(vec3(.8),vec3(.7,0.,0.),colorId);
        specPower = sqrt(specPower);
    } else if (colorId < 2.5) {
         // Skin color
        albedo = vec3(.6,.43,.3); 
      //  normal = doBumpMap(iChannel1, p, normal,.003); 
    } else if (colorId < 3.5) {

        // Eye
        if (p.z>0.) {
            vec3 g_eyePosloc = g_eyePos;
            g_eyePosloc.x *= sign(p.x);
            
            vec3 pe = p - g_eyePosloc;
            // Light point in face coordinates
        	vec3 g_lightPos2 = g_lightPos - headRotCenter;
    		g_lightPos2.yz *= g_headRotH;
    		//g_lightPos2.xz *= g_headRot;
    		g_lightPos2 += headRotCenter;

            vec3 dir = normalize(g_lightPos2-g_eyePosloc);
            
            float a = clamp(atan(-dir.x, dir.z), -.2,.2), 
                  ca = cos(a), sa = sin(a);
            pe.xz *= mat2(ca, sa, -sa, ca);

            float b = clamp(atan(-dir.y, dir.z), -.1,.1), 
                  cb = cos(b), sb = sin(b);
            pe.yz *= mat2(cb, sb, -sb, cb);
            
            
            albedo = (pe.z>0.) ? iris(17.*(pe.xy), length(g_lightPos2-g_eyePosloc)) : vec3(1);
        }
        specPower *= specPower;
    } else if (colorId < 39.5) {  
        // spaceship
        vec3 shipColor = hsv2rgb_smooth(.75+(colorId-20.)*.25,1.,.5);
        albedo = mix(vec3(.8), shipColor,fract(colorId));
        if (lineId == 0.)
        	albedo = mix(albedo, vec3(1), snowFlake((p.zy-vec2(-.06,-.8))));

        //normal = doBumpMap(iChannel2, p*1.2, normal,.02);
        normal = normalize(normal - max(.0,dot (normal,ray ))*ray); 
        specPower*=1.5;
        
    } else {
    	albedo = mix(vec3(.7,.2,.2),hsv2rgb_smooth(hash(colorId),.6,1.), fract(colorId));  
        specPower*2.;//specPower;
    }
    
	vec3 specular1 = lightCol1*shadowMask1*pow(max(.0,dot(normal,h1))*lightCut1, specPower)*specPower/32.0;
	vec3 specular2 = lightCol2*shadowMask2*pow(max(.0,dot(normal,h2))*lightCut2, specPower)*specPower/32.0;
    
	vec3 rray = reflect(ray,normal);
	vec3 reflection = Sky( rray );
	
	// specular occlusion, adjust the divisor for the gradient we expect
	float specOcclusion = max( 0., 1. - map( pos + rray*aoRange )/(aoRange*max(.01,dot(rray,normal))) ); // can be > 1.0
	specOcclusion = exp2( -2.*pow(specOcclusion,2.) ); // tweak the curve
	
	// prevent sparkles in heavily occluded areas
	specOcclusion *= occlusion;

	reflection *= specOcclusion; // could fire an additional ray for more accurate results
    
	float fresnel = pow( 1.+dot(normal,ray), 5. );
	fresnel = mix( mix( .0, .01, specularity ), mix( .4, 1., specularity ), fresnel );

    light += ambient;
	light += subsurface;

    vec3 result = light*albedo;
	result = mix( result, reflection, fresnel );
	result += specular1;
    result += specular2;

	return result;
}


float Trace( vec3 pos, vec3 ray, float traceStart, float traceEnd )
{
    float t0=0.,t1=1e3;
    float t2=0.,t3=1e3;
  
    float t = max(traceStart, min(t2,t0));
    traceEnd = min(traceEnd, max(t3,t1));
    float h;
    for( int i=0; i < g_traceLimit; i++) {
        h = map( pos+t*ray );
        if (h < g_traceSize || t > traceEnd)
            return t>traceEnd?1e3:t;
        t = t+h;
    }
    
	return 1e3;
}



vec3 Normal( vec3 pos, vec3 ray, float t) {

	float pitch = .2 * t / iResolution.x;
    
//#ifdef FAST
//	// don't sample smaller than the interpolation errors in Noise()
	pitch = max( pitch, .005 );
//#endif
	
	vec2 d = vec2(-1,1) * pitch;

	vec3 p0 = pos+d.xxx, // tetrahedral offsets
         p1 = pos+d.xyy,
         p2 = pos+d.yxy,
         p3 = pos+d.yyx;
	
	float f0 = map(p0),
	      f1 = map(p1),
	      f2 = map(p2),
	      f3 = map(p3);
	
	vec3 grad = p0*f0+p1*f1+p2*f2+p3*f3 - pos*(f0+f1+f2+f3);
	// prevent normals pointing away from camera (caused by precision errors)
	return normalize(grad - max(.0,dot (grad,ray ))*ray);
}


// Camera
vec3 Ray( float zoom, in vec2 fragCoord) {
    mat2 rot = matRot(.2*cos(.2*g_time)*cos(.71*g_time)); 
	return vec3( (fragCoord.xy-iResolution.xy*.5)*rot, iResolution.x*zoom );
}

vec3 Rotate( inout vec3 v, vec2 a ) {
	vec4 cs = vec4( cos(a.x), sin(a.x), cos(a.y), sin(a.y) );
	
	v.yz = v.yz*cs.x+v.zy*cs.y*vec2(-1,1);
	v.xz = v.xz*cs.z+v.zx*cs.w*vec2(1,-1);
	
	vec3 p;
	p.xz = vec2( -cs.w, -cs.z )*cs.x;
	p.y = cs.y;
	
	return p;
}


// Camera Effects

void BarrelDistortion( inout vec3 ray, float degree ){
	// would love to get some disperson on this, but that means more rays
	ray.z /= degree;
	ray.z = ( ray.z*ray.z - dot(ray.xy,ray.xy) ); // fisheye
	ray.z = degree*sqrt(ray.z);
}




// -------------------------------------------

const float
    a_eyeClose = .55, 
    a_eyeOpen = -.3;


mat3 lookat(in vec3 ro, in vec3 up){
    vec3 fw=normalize(ro),
    	 rt=normalize(cross(fw,up));
    return mat3(rt, cross(rt,fw),fw);
}

vec3 RD(in vec3 ro, in vec3 cp, in vec2 fCoord) {
    return lookat(cp-ro, vec3(0.,1.,0.))*normalize(vec3(((2.*fCoord-iResolution.xy)/iResolution.y)*ma, 12.0));
} 


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    float yy = fragCoord.y/iResolution.y;
	if(yy<.11 || yy >.89) discard;

	g_time = 1.2*iTime;// - .25*smoothstep(2.,4.,iTime);
    
    float st = 1.2; // speed coeff
    float time = g_time-19.;
    
// constantes
    ma = matRot(-.5);
    mb = matRot(-.15);
    mc = matRot(-.6);

    rotTime = matRot(5.*g_time); 
    
// Eye blink
    float a_Paupieres = mix(a_eyeOpen,a_eyeClose, hash(floor((time-2.)*10.))>.94?2.*abs(fract(20.*(time-2.))-.5):0.);    

    g_eyeRot = matRot(a_Paupieres);

// rotation de la tete 
    float a_headRot = 0.1, a_headRotH = -.1;

    g_headRotH = matRot(a_headRotH); 

    mat2 g_headRotH2 = matRot(-a_headRotH); 



    g_lightPos = vec3(0,0,40);

// intensitee et couleur du point
    float lightAppear = 0.; 
	vec3 lightCol2 = vec3(1,0,0);
    
	// Ambiant color
	g_envBrightness = vec3(.6,.65,.9);
	

	vec3 lightDir1 = normalize(vec3(.5,1.5,1.5)),
	     lightCol1 = vec3(1.1,1.,.9)*.7*g_envBrightness;

	float lightRange2 = .4,
		  traceStart = 0.,
		  traceEnd = 200.;

    vec3 col, colorSum = vec3(0.);
        g_deltaPast = hash3(vec2(g_time));

#if (ANTIALIASING == 1)	
	int ii=0;
#else
	for (int ii=0;ii<ANTIALIASING;ii++) {
#endif
		col = vec3(0);

        // Camera    

#if (ANTIALIASING == 1)	        
        float randPix = 0.;
#else 
        float randPix = hash(g_time); // Use frame rate to improve antialiasing ... not sure of result
#endif        
		vec2 subPix = .4*vec2(cos(randPix+6.28*float(ii)/float(ANTIALIASING)),
                              sin(randPix+6.28*float(ii)/float(ANTIALIASING)));
		

        
        vec3 ray = Ray(1.8,fragCoord.xy+subPix);		
		BarrelDistortion(ray, 2.15 );
		ray = normalize(ray);
		vec3 localRay = ray;
        
        
		vec2 mouse = vec2(-.1-.1*cos(.4*g_time),0.);

		if ( iMouse.z > 0. )
			mouse = .5-iMouse.yx/iResolution.yx;
		vec3 pos; // = vec3(0,-.2,-2.) + 37.*Rotate(ray, vec2(-.1,1.+time*.1)+vec2(-1.0,-3.3)*mouse );        

        vec2 q = ((2.*(fragCoord.xy+subPix)-iResolution.xy)/iResolution.y);

        float time2 = /*mod(*/g_time;//,52.);
        if (time2 < 5.5) {
        	pos = vec3(10., 1., 450.-200.*(time2));
            q *= matRot(mix(-.5, .5, smoothstep(1.8, 2.2, time2))); 
            ray = lookat(-pos, vec3(0,1,0))*normalize(vec3(q, 12));
        } else if (time2 < 24.) {
        //	pos = mix(vec3(6., 0., 5.), vec3(6., 0., 5.-200.*(time2-17.)), smoothstep(16.,16.2,time2));
        	pos = vec3(6., -.15, 3.5);
            float a = mix(0., 2.2, /*8.5,*/ smoothstep(14., 19., time2));
            float k = mix(1., 5., smoothstep(17., 20., time2));
            k = mix(k, 55., smoothstep(23.5, 24., time2));
            pos *= k;
            pos.xz *= matRot(a);
            ray = lookat(vec3(0,.05,.7)-pos, vec3(0,1,0))*normalize(vec3(q, 6));
            pos -= .1*g_deltaPast;

        } else {
			g_time = 1.2*iTime+9.;
            
            ray = Ray(1.8, fragCoord.xy+subPix);		
            BarrelDistortion(ray, 2.15 );
            ray = normalize(ray);
            localRay = ray;

			mouse = vec2(-.1-.1*cos(.4*g_time),0.);
			pos = vec3(0,-.2,-2.) + 37.*Rotate(ray, vec2(-.1,1.+time*.1)+vec2(-1,-3.3)*mouse );        
            pos -= .2*g_deltaPast;
        }
        
		vec3 skyColor = Sky( ray );
        

		float t = Trace(pos, ray, traceStart, traceEnd );
        if ( t < 900. )
		{           
			vec3 p = pos + ray*t;
			
			// Shadows
			vec3 lightDir2 = g_lightPos-p;
			float lightIntensity2 = length(lightDir2);
			lightDir2 /= lightIntensity2;
			lightIntensity2 = lightAppear*lightRange2/(.1+lightIntensity2*lightIntensity2);
			
			float s1 = Trace(p, lightDir1, .05, 4. );
			float s2 = Trace(p, lightDir2, .05, 4. );
			
			vec3 n = Normal(p, ray, t);
			col = Shade(p, ray, n, lightDir1, lightDir2,
						lightCol1, lightCol2*lightIntensity2,
						(s1<20.)?0.:1., (s2<20.)?0.:1., t );
			
			// fog
			float f = 25.;
			col = mix(skyColor, col, exp2(-t*vec3(.4,.6,1.)/f) );
		}
		else
		{
            t = 200.;
            col = skyColor; 
		}
        
        
         vec4 cloud = raymarch(pos+vec3(0.,3.,g_time*200.), ray, skyColor, t);
         col = col*(1.-cloud.a) + cloud.xyz; //col*(1.-cloud.a) + cloud.rgb*cloud.a;
        
        		

	// Post traitments -----------------------------------------------------    
		// Vignetting:
		col *= smoothstep(.15, .0, dot(localRay.xy,localRay.xy) );

			
		colorSum += col;
        
#if (ANTIALIASING > 1)	
	}
    
    col = colorSum/float(ANTIALIASING);
#else
	col = colorSum;
#endif
    

    // Compress bright colours, (because bloom vanishes in vignette)
    vec3 c = (col-1.);
    c = sqrt(c*c+.05); // soft abs
    col = mix(col,1.-c,.48); // .5 = never saturate, .0 = linear
	
	// compress bright colours
	float l = max(col.x,max(col.y,col.z));//dot(col,normalize(vec3(2,4,1)));
	l = max(l,.01); // prevent div by zero, darker colours will have no curve
	float l2 = SmoothMax(l,1.0,.01);
	col *= l2/l;
    
    		// grain
		vec2 grainuv = fragCoord.xy + floor(g_time*60.)*vec2(37,41);
		vec2 filmNoise = 1.5*textureLod( iChannel1, .5*grainuv/iChannelResolution[0].xy, 0. ).rb;
		col *= mix( vec3(1), mix(vec3(1,.5,0),vec3(0,.5,1),filmNoise.x), .1*filmNoise.y );
    /*
   float gray = dot(col, vec3(0.299, 0.587, 0.114));
	
    const vec3 SEPIA = vec3(1.25, 1.0, 0.85); 
    col = gray*gray*gray*SEPIA;
    */
 //   col = mix(col, vec3(1), snowFlake(3.*(fragCoord/iResolution.y)+vec2(-5.1,-.52)));
	fragColor =  vec4(pow(col,vec3(1./1.6)),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
