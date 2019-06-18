/*
 * Original shader from: https://www.shadertoy.com/view/tdSXWt
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
const vec4  iMouse = vec4(0.0);
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Rendering on a shader by Shane
// https://www.shadertoy.com/view/ll2SRy

#define PI 3.14159265359
#define grad_step 0.01
#define time 2.0*iTime


// Spectrum colour palette
// IQ https://www.shadertoy.com/view/ll2GD3
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 spectrum(float n) {
    return pal( n, vec3(0.5,0.5,0.5),vec3(0.0,0.5,0.5),vec3(.0,1.0,.0),vec3(0.62,0.33,0.37) );
}

// iq's distance functions
float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float opOnion( in float sdf, in float thickness )
{
    return abs(sdf)-thickness;
}

float sdUnion_s( float a, float b, float k ) {
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec3 carToPol(vec3 p) {
    float r = length(p);
    float the = acos(p.z/r);
    float phi = atan(p.y,p.x);
    return vec3(r,the,phi);
}

// 2D rotation : pitch, yaw
mat3 rotationXY( vec2 angle ) {
	vec2 c = cos( angle );
	vec2 s = sin( angle );
	
	return mat3(
		c.y      ,  0.0, -s.y,
		s.y * s.x,  c.x,  c.y * s.x,
		s.y * c.x, -s.x,  c.y * c.x
	);
}

float sdVerticalCapsule( vec3 p, float h, float r )
{
    p.z -= clamp( p.z, 0.0, h );
    return length( p ) - r;
}

float distortedCapsule(vec3 p){
    float dtime = 1.8*p.z-time-1.; // mix time with space to create wave
    float dt = sin((dtime)-0.8*sin(dtime)); // distorted time, asymmetric sine wave
    p.x += 0.2*(p.z)*dt;
   	float d = sdVerticalCapsule(p-vec3(0.5,0,0.1), 2.0,0.05*(4.0-1.5*p.z));
    float d2 = sdSphere(p-vec3(0.5,0,2.2),0.2);
    d = sdUnion_s(d,d2,0.1);
	return d;
}



float map( vec3 p ){
    float dt = sin((time+2.5)-0.8*sin(time+2.5)); // distorted time, asymmetric sine wave
    p.x += 0.2*dt;
    float d0 = sdSphere(p-vec3(0.2,0,0),0.4);
    float d2;
    vec3 p1;
    for(float i=0.; i<9.; i++)	{
        p1 = rotationXY(vec2(i*2.*PI/9.,0.8)) * p;
		d2 = distortedCapsule(p1);
 		d0 = sdUnion_s(d0,d2,0.2);
    }
    return d0;
}

// get gradient in the world
vec3 gradient( vec3 pos ) {
	const vec3 dx = vec3( grad_step, 0.0, 0.0 );
	const vec3 dy = vec3( 0.0, grad_step, 0.0 );
	const vec3 dz = vec3( 0.0, 0.0, grad_step );
	return normalize (
		vec3(
			map( pos + dx ) - map( pos - dx ),
			map( pos + dy ) - map( pos - dy ),
			map( pos + dz ) - map( pos - dz )			
		)
	);
}


vec3 fresnel( vec3 F0, vec3 h, vec3 l ) {
	return F0 + ( 1.0 - F0 ) * pow( clamp( 1.0 - dot( h, l ), 0.0, 1.0 ), 5.0 );
}



vec3 selfColor(vec3 pos) {
    vec3 pol = carToPol(pos-vec3(0.4,0,0));
    return spectrum(0.45*pol.x);
}

mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

vec3 reflectedColor(in vec3 p, in vec3 rd){
    
    vec3 Ks = vec3(0.7); // specular reflected intensity
    float shininess = 40.0;
    
   	vec3 n = gradient( p );
    vec3 ref = reflect( rd, n );
    vec3 rc = vec3(0);
    
    vec3 light_pos   = vec3( 15.0, 20.0, 5.0 );
	vec3 light_color = vec3( 1.0, 1.0, 1.0 );
	vec3 vl = normalize( light_pos - p );
	vec3 specular = vec3( max( 0.0, dot( vl, ref ) ) );
    vec3 F = fresnel( Ks, normalize( vl - rd ), vl );
	specular = pow( specular, vec3( shininess ) );
	rc += light_color * specular; 
    return rc;
}

void mainImage( out vec4 fragColor, vec2 fragCoord ) {
    
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;
    vec3 ro = vec3( -5.0*cos(0.2*iTime+10.0), 1.0, 5.0*sin(0.2*iTime+10.0));
    vec3 ta = vec3( 0. , 0. , 0. );
    
    float aa = 1.0/min(iResolution.y,iResolution.x);
    
    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, 0.0);  // 0.0 is the camera roll
    
	// create view ray
	vec3 rd = normalize( camMat * vec3(p.xy, 1.9+0.8*sin(0.15*iTime)) ); // 3.0 is the lens length
    
    // rotate camera with mouse
	mat3 rot = rotationXY(iMouse.xy * vec2( 0.01, -0.01 ) );
	rd = rot * rd;
	ro = rot * ro;
    vec3 col = vec3(0), sp;
    
	// Ray distance, bail out layer number, surface distance and normalized accumulated distance.
	float t=0., layers=0., d, aD;
    
    // Surface distance threshold. Smaller numbers give a sharper object. Antialiased with aa
    float thD = 0.3*sqrt(aa); 
    
    // Only a few iterations seemed to be enough. Obviously, more looks better, but is slower.
	for(int i=0; i<50; i++)	{
        
        // Break conditions. Anything that can help you bail early usually increases frame rate.
        if(layers>12. || col.g>1.0 || t>8.) break;
        
        // Current ray postion
        sp = ro + rd*t;
		
        d = map(sp); // Distance to nearest point in the cube field.
        
        // If we get within a certain distance of the surface, accumulate some surface values.
        // Values further away have less influence on the total.
        //
        // aD - Accumulated distance. I interpolated aD on a whim (see below), because it seemed 
        // to look nicer.
        //
        // 1/.(1. + t*t*.85) - Basic distance attenuation. Feel free to substitute your own.
        
         // Normalized distance from the surface threshold value to our current isosurface value.
        aD = (thD-abs(d))/thD;
        
        // If we're within the surface threshold, accumulate some color.
        // Two "if" statements in a shader loop makes me nervous. I don't suspect there'll be any
        // problems, but if there are, let us know.
        if(aD>0.) { 
            // Smoothly interpolate the accumulated surface distance value, then apply some
            // basic falloff (fog, if you prefer) using the camera to surface distance, "t."
            // selfColor is the color of the object at the point sp
            vec3 sc = selfColor(sp);
            col += 8.*sc*(aD*aD*(3. - 2.*aD)/(1. + t*t*0.85));
            col += 1.0*reflectedColor(sp, rd);
            layers++;
        }

		
        // Kind of weird the way this works. I think not allowing the ray to hone in properly is
        // the very thing that gives an even spread of values. The figures are based on a bit of 
        // knowledge versus trial and error. If you have a faster computer, feel free to tweak
        // them a bit.
        //t += abs(d)*0.5;
        t += max(abs(d)*0.8, thD*1.1); 
	}
    
    // I'm virtually positive "col" doesn't drop below zero, but just to be safe...
    col = max(col, 0.);
    
	fragColor = vec4(clamp(col, 0., 1.), 1);
 }

// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
