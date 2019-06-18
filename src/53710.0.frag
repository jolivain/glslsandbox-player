/*
 * Original shader from: https://www.shadertoy.com/view/wsBXWw
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
// Raymarching code is the MINIMIZED version of https://www.shadertoy.com/view/Xl2XWt

const float MAX_TRACE_DISTANCE = 4.5;
const float INTERSECTION_PRECISION = 0.001; 
const int NUM_OF_TRACE_STEPS = 130;
const float SCALE_DIST = 0.16;

const float PI = 3.14159265359;

// Spectrum colour palette
// IQ https://www.shadertoy.com/view/ll2GD3
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 spectrum(float n) {
    return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}


mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}


float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdSub( float d0, float d1 ) {
    return max( d0, -d1 );
}

float opOnion( in float sdf, in float thickness )
{
    return abs(sdf)-thickness;
}

vec3 carToPol(vec3 p) {
    float r = length(p);
    float the = acos(p.z/r);
    float phi = atan(p.y,p.x);
    return vec3(r,the,phi);
}

vec2 map( vec3 pos ){
    
    vec3 pol = carToPol(pos);
    float d1 = opOnion(sdSphere( pos, 1.0 ), 0.0001);
    float wave = -0.1 -  0.9*sin(5.*(pol.y+0.2*iTime))*sin(1.0*pol.z);
    float d2 = d1 + wave;
    float d = sdSub(d1,d2);

	vec2 res = vec2(d, 1.0);
    return res;
    
}

vec3 selfColor(vec3 pos) {
    vec3 pol = carToPol(pos);
    return spectrum(1.0*pol.z/PI/2.0+0.5*pol.y/PI);
}

vec2 calcIntersection( in vec3 ro, in vec3 rd , inout vec3 col){

    float h =  MAX_TRACE_DISTANCE;
    float t = 0.0;
	float res = -1.0;
    float id = -1.;
    
    for( int i=0; i< NUM_OF_TRACE_STEPS ; i++ ){
        
        if(t > MAX_TRACE_DISTANCE ) break;
	   	vec2 m = map( ro+rd*t );
        h = m.x;
        
        vec3 pos = ro + rd * t;
        col += selfColor(pos) * exp(-5.0*h)*0.01 ;
        
        t += max(abs(h)*SCALE_DIST, INTERSECTION_PRECISION);
        id = m.y;
        
    }

    if( t < MAX_TRACE_DISTANCE ) res = t;
    if( t > MAX_TRACE_DISTANCE ) id =-1.0;
    
    return vec2( res , id );
    
}


// camera rotation : pitch, yaw
mat3 rotationXY( vec2 angle ) {
	vec2 c = cos( angle );
	vec2 s = sin( angle );
	
	return mat3(
		c.y      ,  0.0, -s.y,
		s.y * s.x,  c.x,  c.y * s.x,
		s.y * c.x, -s.x,  c.y * c.x
	);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;

    vec3 ro = vec3( 3.0*cos(0.2*iTime), 0.0, 3.0*sin(0.2*iTime));
    vec3 ta = vec3( 0. , 0. , 0. );
    

    
    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, sin(0.3*iTime) );  // 0.0 is the camera roll
    
	// create view ray
	vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length
    
    // rotate camera
	mat3 rot = rotationXY( ( iMouse.xy - iResolution.xy * 0.5 ).yx * vec2( 0.01, -0.01 ) );
	rd = rot * rd;
	ro = rot * ro;

    vec3 accCol = vec3(0);
    
    vec2 res = calcIntersection( ro , rd, accCol);

	vec3 color = accCol;
	fragColor = vec4(color,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
