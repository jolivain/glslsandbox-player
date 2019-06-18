/*
 * Original shader from: https://www.shadertoy.com/view/3sSXRz
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
// --- noise functions from https://www.shadertoy.com/view/XslGRr
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

const mat3 m = mat3( 0.00,  0.80,  0.60,
           		    -0.80,  0.36, -0.48,
             		-0.60, -0.48,  0.64 );

float hash( float n ) {
    return fract(sin(n)*43758.5453);
}

float noise( in vec3 x ) { // in [0,1]
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.-2.*f);

    float n = p.x + p.y*57. + 113.*p.z;

    float res = mix(mix(mix( hash(n+  0.), hash(n+  1.),f.x),
                        mix( hash(n+ 57.), hash(n+ 58.),f.x),f.y),
                    mix(mix( hash(n+113.), hash(n+114.),f.x),
                        mix( hash(n+170.), hash(n+171.),f.x),f.y),f.z);
    return res;
}

float snoise( in vec3 x ) {
    return noise(x) * 2.0 - 1.0;
}

float sfbm( vec3 p ) { // in [-1,1]
    float f;
    f  = 0.5000*snoise( p ); p = m * p * 2.02;
    f += 0.2500*snoise( p ); p = m * p * 2.03;
    f += 0.1250*snoise( p ); p = m * p * 2.01;
    f += 0.0625*snoise( p );
    return f;
}

// --------------------------------------------------------
// SDF
// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
// --------------------------------------------------------

float sdSphere( vec3 p, float s ) {
  return length(p)-s;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); }

float opSmoothIntersection( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) + k*h*(1.0-h); }

// --------------------------------------------------------
// Spectrum colour palette
// IQ https://www.shadertoy.com/view/ll2GD3	
// --------------------------------------------------------

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 spectrum(float n) {
    return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}


// --------------------------------------------------------
// Main SDF
// --------------------------------------------------------

float map(vec3 p) {
    
    float d1, d2;

    vec3 p2 = p;
    p2.x += 0.1 * sin( iTime + 2.0 * p.y ) ;
    p2.y += 0.1 * sin( iTime + 2.0 * p.x ) ;
    p2.z += 0.1 * sin( iTime + 2.0 * p.y ) ;
    
    d1 = sdSphere(p, 2.0);
    d2 = sfbm( p2 * 1.5 + sin(0.1 * iTime) );
    
    float d = opSmoothSubtraction(d2, d1, 0.0);
    
    return d;
}

// --------------------------------------------------------
// Rendering
// raytracing colorization by Thomas Hooper.
// https://www.shadertoy.com/view/WdB3Dw
// --------------------------------------------------------

mat3 calcLookAtMatrix(vec3 ro, vec3 ta, vec3 up) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww,up));
    vec3 vv = normalize(cross(uu,ww));
    return mat3(uu, vv, ww);
}       

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3 camPos = vec3(0, -10, -10);
    vec3 camTar = vec3(0,0,0);
    vec3 camUp = vec3(0,0,-1);
    mat3 camMat = calcLookAtMatrix(camPos, camTar, camUp);
    float focalLength = 5.;
    vec2 p = (-iResolution.xy + 2. * fragCoord.xy) / iResolution.y;

    vec3 rayDirection = normalize(camMat * vec3(p, focalLength));
    vec3 rayPosition = camPos;
    float rayLength = 0.;

    float distance = 0.;
    vec3 color = vec3(0);

    vec3 c;

    // Keep iteration count too low to pass through entire model,
    // giving the effect of fogged glass
    const float ITER = 82.;
    const float FUDGE_FACTORR = .8;
    const float INTERSECTION_PRECISION = .001;
    const float MAX_DIST = 20.;

    for (float i = 0.; i < ITER; i++) {

        // Step a little slower so we can accumilate glow
        rayLength += max(INTERSECTION_PRECISION, abs(distance) * FUDGE_FACTORR);
        rayPosition = camPos + rayDirection * rayLength;
        distance = map(rayPosition);

        // Add a lot of light when we're really close to the surface
        c = vec3(max(0., .01 - abs(distance)) * .5);
        c *= vec3(1.4,2.1,1.7); // blue green tint

        // Accumilate some purple glow for every step
        c += vec3(.6,.25,.7) * FUDGE_FACTORR / 160.;
        c *= smoothstep(20., 7., length(rayPosition));

        // Fade out further away from the camera
        float rl = smoothstep(MAX_DIST, .1, rayLength);
        c *= rl;

        // Vary colour as we move through space
        c *= spectrum(rl * 6. - .6);

        color += c;

        if (rayLength > MAX_DIST) {
            break;
        }
    }

    // Tonemapping and gamma
    color = pow(color, vec3(1. / 1.8)) * 2.;
    color = pow(color, vec3(2.)) * 3.;
    color = pow(color, vec3(1. / 2.2));

    fragColor = vec4(color, 1);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
