/*
 * Original shader from: https://www.shadertoy.com/view/4lXXDB
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

// --------[ Original ShaderToy begins here ]---------- //
// Created by Martijn Steinrucken - msteinrucken@gmail.com - 2015
// License Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
// 
const vec3 worldUp = vec3(0.,1.,0.);

const float pi = 3.141592653589793238;
const float twopi = 6.283185307179586;

const float NUM_SURFACE_BOKEH = 150.;	// number of twinkly lights on the surface
const float NUM_LIGHTS = 100.;			// number of twinkly lights falling down
const float _FocalDistance = 3.;	// focal distance of the camera
const float _DOF = 2.;				// depth of field. How quickly lights go out of focus
const float _ZOOM = 0.4;		// camera zoom, smaller values means wider FOV

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

// Helper functions =================================

//  Borrowed from other peoples shaders =============
float hash( float n )
{
    return fract(sin(n)*1751.5453);
}

vec2 hash2(float n) {
	vec2 n2 = vec2(n, -n+2.1323);
    return fract(sin(n2)*1751.5453);
}

// http://iquilezles.org/www/articles/functions/functions.htm
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

// ================ End Borrowed Functions =================================

float PeriodicPulse(float x, float p) {
    // pulses from 0 to 1 with a period of 2 pi
    // increasing p makes the pulse sharper
	return pow((cos(x+sin(x))+1.)/2., p);
}

float SlantedCosine(float x) {
    // its a cosine.. but skewed so that it rises slowly and drops quickly
    // if anyone has a better function for this i'd love to hear about it
	x -= 3.55;	// shift the phase so its in line with a cosine
    return cos(x-cos(x)*0.5);
}

vec3 IntersectPlane(ray r, vec4 plane) {
    // returns the intersection point between a ray and a plane
	vec3 n = plane.xyz;
    vec3 p0 = plane.xyz*plane.w;
    float t = dot(p0-r.o, n)/dot(r.d, n);
    return r.o+max(0.,t)*r.d;				// not quite sure what to return if there is no intersection
    										// right now it just returns the ray origin
}

float BandStep(float ss, float se, float es, float ee, float t) {
    return smoothstep(ss, se, t)*smoothstep(ee, es, t);
}

vec3 ClosestPoint(ray r, vec3 p) {
    // returns the closest point on ray r to point p
    return r.o + max(0., dot(p-r.o, r.d))*r.d;
}

// ================================================================



vec3 Light(ray r, vec3 p) {
	// renders a pointlight at position p
    float dist = length( ClosestPoint(r, p)-p );
    
    float lightIntensity = smoothstep(0.1, 0.08, dist);
    
    return lightIntensity*vec3(1.);
}

float Bokeh(ray r, vec3 p) {
	float dist = length( p-ClosestPoint(r, p) );
    
    float distFromCam = length(p-e.o);
    float focus = cubicPulse(_FocalDistance, _DOF, distFromCam);
    
    vec3 inFocus = vec3(0.05, -0.1, 1.);	// outer radius = 0.05, inner radius=0 brightness =1
    vec3 outFocus = vec3(0.25, 0.2, .05);	// out of focus is larger, has sharper edge, is less bright
    
    vec3 thisFocus = mix(outFocus, inFocus, focus);
    
    return smoothstep(thisFocus.x, thisFocus.y, dist)*thisFocus.z;
}





float SineWave(vec2 pos, float phase, float frequency, float amplitude, float offset, float thickness, float glow) {
		// returns a sine wave band
    	// takes a position from -pi,-pi to pi, pi
				
    float dist = abs(pos.y-(sin(pos.x*frequency+phase)*amplitude-offset));  // distance to a sine wave
    return smoothstep(thickness+glow, thickness, dist);
}

vec3 Floor(ray r) {
	vec3 i = IntersectPlane(r, vec4(0.,1.,0.,0.));//Light(e, lightPos);
    vec3 col=vec3(0.);
    
    return col;
}

vec3 SurfaceBokeh(ray r, float t) {
    vec3 col = vec3(0.);
    
    float bokehArea = 30.;
    float halfBokehArea = bokehArea/2.;
    float bokehSize = 0.3*0.3;			// use square so we can use squared distance to avoid using length()
    float bokehBrightness = 0.1;
    vec3 bokehColor = vec3(1., 1., 0.5);
    
    t *= 1.;
    float T = iTime*3.;
    float fT = floor(T);
    
    for(float i=0.; i<NUM_SURFACE_BOKEH; i++) {
        float c = i/NUM_SURFACE_BOKEH;
        float thisT = T+c;
        
        vec2 n = hash2(floor(thisT)+c)*bokehArea-halfBokehArea;
        vec3 p = vec3(n.x, 10., n.y);
        
        //vec3 bokeh = vec3( smoothstep(bokehSize, bokehSize*0.8, length(p-ClosestPoint(e, p))) );
        vec3 d = p-ClosestPoint(e, p);
        vec3 bokeh = vec3( smoothstep(bokehSize, bokehSize*0.8, dot(d, d)) );
        
        
        float alpha = cubicPulse(0.5, 0.5, fract(thisT));
        col += vec3( bokeh*alpha);
    }
    col *= bokehBrightness;
    
    col *= bokehColor;
    
    return col;
}

vec3 Surface(ray r, vec2 coords, float t) {
    float st = sin(t);
    float ct = cos(t);
    mat2 rot = mat2(ct, st, st, -ct);
    
    vec3 col = vec3(0.);
    
    t *= -20.;
	vec2 I = IntersectPlane(r, vec4(0., 1., 0., 10.)).xz*0.2;
   
    
    vec2 W1 = vec2(12., -45)*rot;
    vec2 W2 = vec2(-210., 360.)*rot;
    vec2 W3 = vec2(870., -360.);
    vec2 W4 = vec2(130., 60.);
    vec2 W5 = vec2(1., -870.);
    vec2 W6 = vec2(0., 0.);
    
    float LW1 = length(I-W1);
    float LW2 = length(I-W2);
    float LW3 = length(I-W3);
    float LW4 = length(I-W4);
    float LW5 = length(I-W5);
    float LW6 = length(I-W6);
    
    float wave1 = sin(LW1*8.7+t);
    float wave2 = sin(LW2*12.2+t);
    float wave3 = sin(LW3*16.+t);
    float wave4 = sin(LW4*8.+t);
    float wave5 = sin(LW5*16.+t);
    float wave6 = sin(LW6*32.+t);
    
    float waves = wave1*wave2*wave3*wave4*wave5*wave6;
    waves /= 4.;
    waves += 0.25;

    col += vec3(waves);
    col *= vec3( smoothstep(5., 0., LW6) );		// LW6 was centered at 0, 0 so we can use it to fade the waves
    
    
    col += SurfaceBokeh(r, t);					// add surface wave sparkles
   	
    float camToLight = clamp(dot(worldUp, cam.forward), 0., 1.);
    camToLight = pow(camToLight, 12.);
    float rayToLight = clamp(dot(worldUp, e.d), 0., 1.);
  	
    float starShape =  1.+clamp(sin(coords.x*coords.x*100.)-cos(coords.y), 0.,1.);
    col += vec3(camToLight*rayToLight)*starShape;
    
    return col;
}

vec3 Backdrop(ray r, vec2 coords, float t) {
    vec3 col= vec3(0.1, 0.5, 1.);
    
	float band1 = SineWave(coords, t, 1., 1., 0., 0., 1.);
	float band2 = SineWave(coords, t*0.7686+1.1342132, 3., .5, 0., 0., 1.);
    
    col += (band1*band2)*vec3(0.1, 0.1, 1.);
    float wave = SineWave(coords, 0., 4., .1, 0., 0.01, 0.01);
    
   
    if(r.d.y>0.) col += Surface(r, coords, t);
    
    return col;
}




vec3 Lights(ray r, float t) {
	
    vec3 col = vec3(0.);
    
    float height = 4.;
   	float halfHeight = height/2.;
   
    for(float i=0.; i<NUM_LIGHTS; i++) {
    	float c = i/NUM_LIGHTS;
        c *= twopi;
        
        vec2 xy = hash2(i)*10.-5.;
        
        float y = fract(c-t)*height-halfHeight;
        
        vec3 pos = vec3(xy.x, y, xy.y);
        
        float glitter = 1. +clamp((sin(c+t*30.)-0.9)*50., 0., 100.);
       
        float verticalFade = BandStep(halfHeight, halfHeight*0.8, -halfHeight*0.8, -halfHeight, y);
        col += Bokeh(r, pos)*verticalFade*glitter;
    }
    return col;
}



vec4 FishLayer(ray r, vec2 coords, float depth, float pathThickness, float t, float shouldLight) {
	
    vec4 col = vec4(1.);
    
    vec2 I = IntersectPlane(r, vec4(0.,1.,0.,depth)).xz;
    
    float pathCenter = 4.5;
    
    float squareDist = dot(I, I);
    float dist = length(I);
    float x = coords.x*10.;
    
    dist += sin(coords.x*20.)*0.1;
   	
    float circle = BandStep(pathCenter-pathThickness, pathCenter, pathCenter, pathCenter+pathThickness, dist);
    
    col.rgb *= 1.- ((dist-pathCenter)/pathThickness)*shouldLight;		// add the light gradient to fake light from above
    
    x -= t+depth;
    
    float creature = SlantedCosine(x)*0.5+0.5;
    creature *= clamp(sin(x/2.)*100., 0., 1.);	// knock out every other creature
    pathCenter -= 0.2;
    float eyes = PeriodicPulse(x+1.5, 16.)*BandStep(pathCenter-0.4, pathCenter, pathCenter, pathCenter+0.4, dist);
    
    col.rgb -= vec3( eyes*eyes )*0.5;
    
    col.a = smoothstep(0., .5, circle*creature);
    col.rgb *= clamp(col.a*10.,0.,1.);			// premultiply alpha
    
    return col;
}

vec4 Fish(ray r, vec2 coords, float t) {
    vec4 topLayer = FishLayer(r, coords, 2., 0.7, t*2., 1.)*vec4(0.4,0.4,0.4,0.3);
    vec4 bottomLayer = FishLayer(r, coords, -3., 1., t, 0.)*vec4(0.,0.,0.,.3);
    
    vec4 layers = mix(topLayer, bottomLayer, bottomLayer.a);
    
    return layers;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy / iResolution.xy) - 0.5;
   	uv.y *= iResolution.y/iResolution.x;
    vec3 mouse = -vec3(iMouse.xy/iResolution.xy - 0.5,iMouse.z-.5);
	float t = iTime;
    
    float speed = 0.3;
    
    float st = sin(t*speed);
    float ct = cos(t*speed);
    
    cam.p = vec3(st, st, ct)*vec3(4., 3.5, 4.);
    cam.p = normalize(cam.p);// NOTE this won't work if the lookat isn't at the origin
    
   // cam.p = vec3(1., 2., 1.);
    cam.p = rotate_x(cam.p,mouse.y*2.); cam.p = rotate_y(cam.p,mouse.x*3.);
    
    
    cam.lookAt = vec3(0., 0., 0.);
    cam.forward = normalize(cam.lookAt-cam.p);
    cam.left = cross(worldUp, cam.forward);
    cam.up = cross(cam.forward, cam.left);
    cam.zoom = _ZOOM;
    
    vec3 screenCenter = cam.p+cam.forward*cam.zoom;
    vec3 screenPoint = screenCenter+cam.left*uv.x+cam.up*uv.y;
    
    e.o = cam.p;						// ray origin = camera position
    e.d = normalize(screenPoint-cam.p);	// ray direction is the vector from the cam pos through the point on the imaginary screen
    
    float x = atan(e.d.x, e.d.z);		// from -pi to pi	
	float y = pi*0.5-acos(e.d.y);  		// from -1/2pi to 1/2pi
	vec2 sphereCoords = vec2(x, y);					
    
   
    vec3 col = vec3(0.);
    	
    col += Backdrop(e, sphereCoords, t*0.1);			// blueish water + surface 
    
    vec4 fish = Fish(e, sphereCoords, t);				// fishies! or... some poor excuse for them ;)
    col = mix(col, fish.rgb, fish.a);
    
	col += Lights(e, t*0.1);							// lights falling down
   
    float depthGradient = (dot(e.d, worldUp)+1.)+0.3;	// STuff gets darker the deeper you go
    col *= vec3(depthGradient);
    
    
	fragColor = vec4(col.r, col.g, col.b, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
