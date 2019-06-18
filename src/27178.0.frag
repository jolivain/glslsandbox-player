#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


// Created by Martijn Steinrucken - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0
// 
const vec3 worldUp = vec3(0.,1.,0.);

const float pi = 3.141592653589793238;
const float twopi = 6.283185307179586;

const float NUM_SURFACE_BOKEH = 150.;	// number of twinkly lights on the surface
const float NUM_LIGHTS = 100.;			// number of twinkly lights falling down
const float _FocalDistance = 2.;	// focal distance of the camera
const float _DOF = 2.;				// depth of field. How quickly lights go out of focus
const float _ZOOM = 01.;		// camera zoom, smaller values means wider FOV

struct ray {
    vec3 o;
    vec3 d;
};
ray e;				// the eye ray

struct camera {
    vec3 p;			// the position of the camera
    vec3 forward;	// the camera forward vector
    vec3 left;		// the camera left vector
    vec3 up;		// the camera up vector

    vec3 lookAt;	// the lookat point
    float zoom;		// the zoom factor
};
camera cam;

// Helper functions - Borrowed from other peoples shaders =================================

float hash( float n )
{
    return fract(sin(n)*1751.5453);
}

vec2 hash2(float n) {
	vec2 n2 = vec2(n, -n+2.1323);
    return fract(sin(n2)*1751.5453);
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.;
    x /= w;
    return 1. - x*x*(3.-2.*x);
}

vec3 rotate_y(vec3 v, float angle)
{
	float ca = cos(angle); float sa = sin(angle);
	return v*mat3(
		+ca, +.0, -sa,
		+.0,+1.0, +.0,
		+sa, +.0, +ca);
}

vec3 rotate_x(vec3 v, float angle)
{
	float ca = cos(angle); float sa = sin(angle);
	return v*mat3(
		+1.0, +.0, +.0,
		+.0, +ca, -sa,
		+.0, +sa, +ca);
}

float PeriodicPulse(float x, float p) {
    // pulses from 0 to 1 with a period of 2 pi
    // increasing p makes the pulse sharper
	return pow((cos(x+sin(x))+1.)/2., p);
}


float BandStep(float ss, float se, float es, float ee, float t) {
    return smoothstep(ss, se, t)*smoothstep(ee, es, t);
}

vec3 ClosestPoint(ray r, vec3 p) {
    // returns the closest point on ray r to point p
    return r.o + max(1., dot(p-r.o, r.d))*r.d;
}

// ================================================================



vec3 Light(ray r, vec3 p) {
	// renders a pointlight at position p
    float dist = length( ClosestPoint(r, p)-p*5. );
    
    float lightIntensity = smoothstep(0.1, 0.8, dist);
    
    return lightIntensity*vec3(1.);
}

float Bokeh(ray r, vec3 p) {
	float dist = length( p-ClosestPoint(r, p) );
    
    float distFromCam = length(p-e.o);
    float focus = cubicPulse(_FocalDistance, _DOF, distFromCam);
    
    vec3 inFocus = vec3(0.5, -0.1, 1.);	// outer radius = 0.05, inner radius=0 brightness =1
    vec3 outFocus = vec3(0.25, 0.2, .05);	// out of focus is larger, has sharper edge, is less bright
    
    vec3 thisFocus = mix(outFocus, inFocus, focus);
    
	//thisFocus *= vec3(hash(p.x*0.01));
	
    return smoothstep(thisFocus.x, thisFocus.y, dist*0.37)*thisFocus.z;
}


vec3 Lights(ray r, float t) {
	
    vec3 col = vec3(0.);
    
    float height = 1.;
   	float halfHeight = height/2.;
   
    for(float i=0.; i<NUM_LIGHTS; i++) {
    	float c = i/NUM_LIGHTS;
        c *= twopi;
        
        vec2 xy = hash2(i)*10.-5.;
        
        float y = fract(c-t)*height-halfHeight;
        
        vec3 pos = vec3(xy.x, y, xy.y);
        
        float glitter = 1. +clamp((sin(c+t*30.)-0.9)*50., 0., 100.);
       
        float verticalFade = BandStep(halfHeight, halfHeight*0.8, -halfHeight*0.8, -halfHeight, y);
        col += Bokeh(r, pos)*verticalFade*glitter *mix( vec3(0.94,0.3,0.0), vec3(0.0,0.4,0.9), 0.5+0.5*sin(float(i)*1.2+1.9));
    }
    return col;
}


void main( void ) {
	vec2 uv = (gl_FragCoord.xy / resolution.xy) - 0.5;
   	uv.y *= resolution.y/resolution.x;
	float t = time;
    
    float speed = 0.0;
    
    float st = sin(t*speed);
    float ct = cos(t*speed);
    
    cam.p = vec3(st, st, ct)*vec3(4., 3.5, 4.);
    cam.p = normalize(cam.p);// NOTE this won't work if the lookat isn't at the origin
     
    cam.lookAt = vec3(0., 0., 0.);
    cam.forward = normalize(cam.lookAt-cam.p);
    cam.left = cross(worldUp, cam.forward);
    cam.up = cross(cam.forward, cam.left);
    cam.zoom = _ZOOM;
    
    vec3 screenCenter = cam.p+cam.forward*cam.zoom;
    vec3 screenPoint = screenCenter+cam.left*uv.x+cam.up*uv.y;
    
    e.o = cam.p;						// ray origin = camera position
    e.d = normalize(screenPoint-cam.p);	// ray direction is the vector from the cam pos through the point on the imaginary screen
   
    vec3 col = vec3(0.);
    
	col += Lights(e, t*0.1);							// lights falling down
  
	gl_FragColor = vec4(col.r, col.g, col.b, 1.);
}
