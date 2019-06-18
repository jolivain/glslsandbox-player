/*
 * Original shader from: https://www.shadertoy.com/view/XsjBRm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Candle by Martijn Steinrucken aka BigWings - 2019
// countfrolic@gmail.com
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Code is horrible. This was used as a scratchpad for this effect:
// https://www.shadertoy.com/view/MsSBD1
//
// Use these to change the effect

#define INVERTMOUSE -1.

#define MAX_STEPS 100
#define MIN_DISTANCE 0.1
#define MAX_DISTANCE 10.
#define RAY_PRECISION 0.01

#define S(x,y,z) smoothstep(x,y,z)
#define B(x,y,z,w) S(x-z, x+z, w)*S(y+z, y-z, w)
#define sat(x) clamp(x,0.,1.)
#define SIN(x) sin(x)*.5+.5
#define CANDLE_HEIGHT 10.
#define FLAMECOL vec3(.99, .6, .35)
#define FLAMEBLUE vec3(.1, .1, 1.)
#define CANDLECOL  vec3(.2, .5, .2)

#define BG_STEPS 20.
#define BOKEH_SIZE .04


const vec3 lf=vec3(1., 0., 0.);
const vec3 up=vec3(0., 1., 0.);
const vec3 fw=vec3(0., 0., 1.);

const float halfpi = 1.570796326794896619;
const float pi = 3.141592653589793238;
const float twopi = 6.283185307179586;

vec2 m; // mouse

vec3 bg; // global background color

float N( float x ) { return fract(sin(x)*5346.1764); }
float N2(float x, float y) { return N(x + y*23414.324); }
float LN(float x) {return mix(N(floor(x)), N(floor(x+1.)), fract(x));}

float N21(vec2 p) {
	vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
    a += dot(a, a.yzx + 79.76);
    return fract((a.x + a.y) * a.z);
}


vec3 N31(float p) {
    //  3 out, 1 in... DAVE HOSKINS
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}


struct ray {
    vec3 o;
    vec3 d;
};

struct camera {
    vec3 p;			// the position of the camera
    vec3 forward;	// the camera forward vector
    vec3 left;		// the camera left vector
    vec3 up;		// the camera up vector
	
    vec3 center;	// the center of the screen, in world coords
    vec3 i;			// where the current ray intersects the screen, in world coords
    ray ray;		// the current ray: from cam pos, through current uv projected on screen
    vec3 lookAt;	// the lookat point
    float zoom;		// the zoom factor
};

struct de {
    // data type used to pass the various bits of information used to shade a de object
	float d;	// distance to the object
    float b;	// bump
    float m; 	// material
    float f;	// flame
    float w;	// distance to wick
    float fd;	// distance to flame
    float t;
    float s; // closest flame pass
    float sd;
    vec2 uv;
    // shading parameters
    vec3 pos;		// the world-space coordinate of the fragment
    vec3 nor;		// the world-space normal of the fragment
    float fresnel;	
};
    
struct rc {
    // data type used to handle a repeated coordinate
	vec3 id;	// holds the floor'ed coordinate of each cell. Used to identify the cell.
    vec3 h;		// half of the size of the cell
    vec3 p;		// the repeated coordinate
};
    
camera cam;


void CameraSetup(vec2 uv, vec3 position, vec3 lookAt, float zoom) {
	
    cam.p = position;
    cam.lookAt = lookAt;
    cam.forward = normalize(cam.lookAt-cam.p);
    cam.left = cross(up, cam.forward);
    cam.up = cross(cam.forward, cam.left);
    cam.zoom = zoom;
    
    cam.center = cam.p+cam.forward*cam.zoom;
    cam.i = cam.center+cam.left*uv.x+cam.up*uv.y;
    
    cam.ray.o = cam.p;						// ray origin = camera position
    cam.ray.d = normalize(cam.i-cam.p);	// ray direction is the vector from the cam pos through the point on the imaginary screen
}

float remap01(float a, float b, float t) { return sat(t-a)/(b-a); }
float remap(float a, float b, float c, float d, float t) { return sat((b-a)/(t-a)) * (d-c) +c; }

float DistLine(vec3 ro, vec3 rd, vec3 p) {
	return length(cross(p-ro, rd));
}

vec2 within(vec2 uv, vec4 rect) {
	return (uv-rect.xy)/rect.zw;
}

// DE functions from IQ
// https://www.shadertoy.com/view/Xds3zN

vec2 smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return vec2(mix( b, a, h ) - k*h*(1.0-h), h);
}

vec2 smax( float a, float b, float k )
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return vec2(mix( a, b, h ) + k*h*(1.0-h), h);
}

float sdSphere( vec3 p, vec3 pos, float s ) { return length(p-pos)-s; }

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec3 opCheapBend( vec3 p, float strength )
{
    float c = cos(strength*p.y);
    float s = sin(strength*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return q;
}

    
rc Repeat(vec3 pos, vec3 size) {
	rc o;
    o.h = size*.5;					
    o.id = floor(pos/size);			// used to give a unique id to each cell
    o.p = mod(pos, size)-o.h;
    return o;
}

float CB_Dist(rc q, vec3 rd) {						// returns the distance, along the ray, to the next cell boundary
	 vec3 rC = ((2.*step(0., rd)-1.)*q.h-q.p)/rd;	// ray to cell boundary
     return min(min(rC.x, rC.y), rC.z)+.01;			// distance to cell just past boundary
}

vec3 background(vec3 r) {
	float x = atan(r.x, r.z);		// from -pi to pi	
	float y = pi*0.5-acos(r.y);  		// from -1/2pi to 1/2pi		
    
    vec3 col = vec3(0.);
    
    return col;
}

// From http://mercury.sexy/hg_sdf
vec3 pModPolar(inout vec3 p, float repetitions, float fix) {
	float angle = twopi/repetitions;
	float a = atan(p.z, p.x) + angle/2.;
	float r = length(p.xz);
	float c = floor(a/angle);
	a = mod(a,angle) - (angle/2.)*fix;
	p = vec3(cos(a)*r, p.y, sin(a)*r);

	return p;
}

de map( vec3 p ) {
    // returns a vec3 with x = distance, y = bump, z = mat transition w = mat id
    de o;
    o.m = 1.;
    
    float t = iTime;
    
    
    p.y += (sin(p.x*10.)*sin(p.y*12.))*.01;
   	float outside = sdCappedCylinder(p+vec3(0., 2., 0.), vec2(.75, 2.))-.1;
    float inside = sdCappedCylinder(p-vec3(0., 2., 0.), vec2(.45, 2.))-.3;
    
    vec2 candle = smax(outside, -inside, .1);
    
    vec3 q = p+vec3(0., .15, 0.);
    q = opCheapBend(q+vec3(0., 0.2, 0.)*0., 1.);
    
    float angle = atan(q.x, q.z);
    
    q.xz *= 1.-abs(sin(angle*twopi+q.y*40.))*.02*S(.1, .2, q.y);
    q.xz *= 1.-S(.2, .0, q.y)*.2;
    float wick = sdCappedCylinder(q+vec3(0., 0.1, 0.), vec2(.01, .7))-.05;
    
    vec2 d = smin(candle.x, wick, .2);
    
    o.uv = vec2(angle, q.y);
    o.t = d.y;
    o.d = d.x*.8;
    o.w = wick;
    
    return o;
}

de fmap( vec3 p, float n ) {
    // returns a vec3 with x = distance, y = bump, z = mat transition w = mat id
    float t = iTime*2.;
    
    de o;
    o.m = 1.;
    
    p.z *= 1.5;
    
    float spikes = pow(abs(sin(p.x*50.+t*2.)), 5.);
    spikes *= pow(abs(sin(p.x*-30.+t*1.)), 5.);
    p.y += spikes*.1*S(1.5, 3., p.y);
    
    
    vec3 q = opCheapBend(p+vec3(0., 0.2, 0.), 1.);
    
    float wick = sdCappedCylinder(q+vec3(0., 0.1, 0.), vec2(.01, .7))-.01;
    float d = wick;
    float flame = wick;
    
    float t2 = t*.2;
    float top = 2.5-n*n;
    for(float i=0.; i<1.; i+=1./20.) {
        
        float y = mix(.3, top, i);
        float x = pow(abs(sin(y-t*2.)), 2.)*.1*n*p.y*n*n*n;
        
        float size = mix(.1, .05, i*i);
        float smth = mix(.4, .1, i);
    	flame = smin(flame, sdSphere(p, vec3(x-.12, y, .0), size), smth).x;
    }
    
    d = min(d, flame);
    
    d = max(d, -sdSphere(p, vec3(-.2, -.5, .0), .5)); 
    o.d = d/1.5;
    
    return o;
    
}

de castRay( ray r, float n ) {
    
    float dmin = 1.0;
    float dmax = 100.0;
    
	float precis = RAY_PRECISION;
    
    de o;
    o.d = dmin;
    o.m = -1.0;
    o.w = 1000.;
    o.s = 1000.;
    
    de res;
    
    for( int i=0; i<MAX_STEPS; i++ )
    {
	    
        res = map( r.o+r.d*o.d );
        if( res.d<precis || o.d>dmax ) break;
        
        float d = o.d;
        float w = o.w;
        o = res;
        if(w<o.w) o.w = w;
        
        o.d += d;
    }
    
    if( o.d>dmax ) o.m=-1.0;
    o.s = 1000.;
    o.fd = 0.;
    for( int i=0; i<MAX_STEPS; i++ )
    {
	    res = fmap( r.o+r.d*o.fd, n );
        if( res.d<precis || o.fd>dmax ) break;
        if(res.d<o.s) {
            o.s = res.d;
            o.sd = o.fd;
        }
        
        o.fd += res.d;
    }
    
    if(res.d<precis)
        o.f=1.;
    
    return o;
}

vec3 Background(ray r) {
    
    float t = iTime;
    
	float x = atan(r.d.x, r.d.z);
    float y = dot(vec3(0,1,0), r.d);
    
    float d = 4.1;
        
    vec2 size = vec2(3);
    vec2 h = size / 2.;
    
    float blur = .3;
    
    vec3 col = vec3(0);
    
    for(float i=0.; i<BG_STEPS; i++) {
    	vec3 p = r.o + r.d*d;
    						
    	vec2 id = floor(p.xz/size);								// used to give a unique id to each cell
   		
        vec3 q = p;
        
        q.xz = mod(p.xz, size)-h;								// make grid of flames
        
        vec3 cP = vec3(0, N21(id)*4.-2., 0);
        
        float dRayFlame = DistLine(q, r.d, cP);						// closest ray, point dist
        
        float dOriFlame = d + length(cP-p);		// approximate distance from ray origin to flame 
        float bSize = dRayFlame/dOriFlame;
        vec3 flame = FLAMECOL;
        flame *= S(BOKEH_SIZE, BOKEH_SIZE-BOKEH_SIZE*blur, bSize);
        
        flame *= 200.;
        flame /= (dOriFlame*dOriFlame);
        float flicker = LN(t+id.x*100.+id.y*345.);
        //flicker = mix(.3, 1., S(.2, .5, flicker));
        flame *= 1.-flicker*flicker*.7;
        
        if(length(id)>2.)
        col += flame;
        
        // step to the next cell
        vec2 rC = ((2.*step(0., r.d.xz)-1.)*h-q.xz)/r.d.xz;		// ray to cell boundary
        float dC = min(rC.x, rC.y)+.01;
        
        d += dC;
    }
    
    
    return col;
}

vec3 calcNormal( de o )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3(
	    map(o.pos+eps.xyy).d - map(o.pos-eps.xyy).d,
	    map(o.pos+eps.yxy).d - map(o.pos-eps.yxy).d,
	    map(o.pos+eps.yyx).d - map(o.pos-eps.yyx).d );
	return normalize(nor);
}

vec3 FlameNormal( vec3 p, float n )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3(
	    fmap(p+eps.xyy, n).d - fmap(p-eps.xyy, n).d,
	    fmap(p+eps.yxy, n).d - fmap(p-eps.yxy, n).d,
	    fmap(p+eps.yyx, n).d - fmap(p-eps.yyx, n).d );
	return normalize(nor);
}

de GetShadingBasics(de o, ray r) {
    o.pos = r.o + o.d*r.d;
    o.nor = calcNormal( o );
    o.fresnel = dot(o.nor, r.d);
    
    return o;
}



vec4 render( vec2 uv, ray camRay, float n ) {
    // outputs a color
    
    vec3 col = vec3(0.);
    de o = castRay(camRay, n);
    col = Background(camRay);
    
    if(o.m>0.) {
        o = GetShadingBasics(o, camRay);
        vec3 p = o.pos;
        float angle = atan(p.x, p.z);
        
        float inside = S(.9, .5, length(o.pos.xz));
        float dif = dot(o.nor, camRay.d)*.5+.5;
        float sss = S((n*n)*.2-1.5, -.0, p.y)*3.;
        sss += sin(angle*15.)*.05;
        sss *= (1.-inside);
        dif = max(dif, sss);
        
        col = vec3(.3, .3, .4)*dif;
        
        
        vec3 fv = vec3(0., 3., 0.)-o.pos;
        float fd = length(fv);
        float flame = sat(dot(o.nor, fv/fd)/(fd*fd));
        col += flame*10.*mix(FLAMECOL, vec3(1.), .5);
        
        
        vec3 candleCol = mix(CANDLECOL, vec3(1.), inside);
       
        
        vec3 wickCol = mix(candleCol, vec3(.2), S(.1, .2, o.uv.y));
        col *= mix(wickCol, candleCol, o.t);
        
        col += FLAMECOL*(1.-o.t)*S(.3, .8, o.uv.y)*2.;
       
        
        vec3 r = reflect(camRay.d, o.nor);
        
        float ref = sat(dot(r, fv/fd));
        col += FLAMECOL*2.*pow(ref, inside*50.+4.)*o.t;
        
    }
    
    if(o.f>0.&&o.fd<o.d) {
        vec3 p = camRay.o+camRay.d*o.fd;
        vec3 n = FlameNormal(p, n);
        float fresnel = sat(dot(n, -camRay.d));
        float flame = 1.;//fresnel;
        
        float wd = DistLine(camRay.o, camRay.d, vec3(-.3, .25, 0.));
       wd = o.w;
        
        flame *= S(-.1, .8, p.y);
        flame *= mix(1., .1, S(.85, .0, wd)*pow(abs(fresnel), 5.));
        
       flame *= S(3.5, 1., p.y);
       flame *= S(2.5, 2., p.y);
       
        float bottomFade = S(.05, .2, p.y);
        col = mix(col, FLAMECOL*3., flame*fresnel*bottomFade);
        float blue = S(.4, -.0, p.y);
       blue *= S(.7, .3, fresnel*fresnel);
        col += FLAMEBLUE*blue*bottomFade;
    }
    
    vec3 p = camRay.o + camRay.d*o.sd;
    float y = p.y-1.;
    float gw = sat(1.-y*y);
    gw*=gw;
    float glow = S(.25*gw, 0., o.s)*.5;
    glow*=glow;
    //glow *= S(.0, .5, p.y);
    //glow *= S(2.5, 1., p.y);
    
    col = max(col, glow*FLAMECOL);

    
    return vec4( col, o.m );
}

vec4 Flame(vec2 uv, vec2 p) {
    uv.x-=.5;
    p.x -= .5;
    
    vec3 col = vec3(.99, .6, .35);	// main color
    vec3 blue =  vec3(.1, .1, 1.);  // flame blue
    
    float alpha = 1.;
    
    p.x *= S(.0, p.y, uv.y);
   
    vec2 top = p;
    vec2 bottom = vec2(0., .15);
    float bl = length(bottom-uv);
    vec2 v = top-bottom;
    float vl = length(v);
    v /= vl;
    
    float fy = clamp(dot(uv-bottom, v), 0., vl);
    vec2 cp = bottom + fy * v;
    
    float fx = length(cp-uv);
    fy /= vl;
    
    float fw = mix(.13, .03, fy*fy);
    //fw *= mix(.5, 1., vl);
    
    
    col.b = bl;
    col.r = fx/fw;
    col.g = fy;
    
    fx /= fw;
    
    
    float d = S(1., .9, fx);
    
    //col = vec3(.99, .6, .35)*(1.+fy);
    
    col *= d; 
    
    return vec4(col, alpha);
}

void mainImage( out vec4 o, in vec2 uv )
{
    float t = iTime;
    uv = (2.*uv - (o.xy=iResolution.xy) ) / o.y ;  	// -1 <> 1
   	m = iMouse.xy/iResolution.xy;					// 0 <> 1
    
    float turn = (.1-m.x)*twopi+t*.2;
    float s = sin(turn);
    float c = cos(turn);
    mat3 rotX = mat3(	  c,  0., s,
                   		  0., 1., 0.,
                   		  s,  0., -c);
    
    vec3 lookAt = vec3(0., .8, 0.);
    float dist = 6.;
    float y = .4;//INVERTMOUSE*dist*sin((m.y*pi));
    vec3 pos = vec3(0., y, -dist)*rotX;
   	
    CameraSetup(uv, pos, lookAt, 3.);
    
    bg = background(cam.ray.d);

    float t2 = t;
    float n = mix(N(floor(t2)), N(floor(t2+1.)), fract(t2));
    
    vec4 info = render(uv, cam.ray, n);
   
    

    o = vec4(info.rgb, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
