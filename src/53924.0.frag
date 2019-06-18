/*
 * Original shader from: https://www.shadertoy.com/view/tsSXDc
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec4 date;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define N 800.     // number of random partics
#define K 400.     // plane sine wave (kx) propag from left to right
#define W1 .001    // dielectric material width middle
#define W2 .5      // dielectric material width bottom

#define rnd2(p) fract(sin((p)*mat2(127.1,311.7,269.5,183.3))*43758.5453123)

void mainImage( out vec4 O, vec2 U )
{
    vec2 R = iResolution.xy;
    U /= R.y;
    
    float v = 0., phi, a=1.,l,
          W = U.y < .35 ? W2 : W1;
    
    for (float i=0.; i<N; i++) {
        vec2 P = .5+vec2(W,1)*(2.*rnd2(vec2(i))-1.);// random partic
     // P.y = fract(.5*P.y-U.y+.5)+U.y-.5;          // sliding window for continuity
        l = length(U-P);
     // a = max(0.,(U-P).x/l);                      // (scattering function)
        phi = K*( a*l + P.x );                      // phase left -> P -> U
        if(U.y>.66) phi += 6.28*rnd2(P).x;          // top: incoherent phases
        v += sin(phi - 10.*iTime) /l; // (l*l)      // diffracted wave
    }
    O = vec4(.5+.5*v*.3/sqrt(N));
    
    if (abs(U.x-.5) < W/2.+2./R.x) O.g = .7;        // dielectric width
    if (U.y<.05) O = vec4(.5+.5*sin(K*U.x - 10.*iTime),0,0,1); // ref without material
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
