/*
 * Original shader from: https://www.shadertoy.com/view/XsGyRm
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
#define R       iResolution
#define P(i)    vec2( cos(k*(i)+T/10.), sin(k*(i)+T/10.) )           // heptastar vertex i
#define S(D,w)  smoothstep( 3., 0.,  length(D)*R.y - w )             // smooth draw
#define F(t,dt) smoothstep(.2,-.2, abs(t+.5-mod(T/3.-2.,14.))-dt/2.) // fading
float   T = 0.0 , k = 6.28*3./7.;                                    // angle between heptastar vertices

float line(vec2 p, vec2 a, vec2 b) {                       // draw a line
    b -= a; p -= a;
    return S( p - b * clamp(dot(b,p)/dot(b,b), 0., 1.) , 0. );
}

vec2 point(float n) {                                      // point(n,t) on heptastar 
    float t = mod(T/5.+ n*7./12.,7.), i = floor(t);
    return mix( P(i), P(i+1.), .5-.5*cos(3.14*fract(t)) );
}

void mainImage( inout vec4 O,  vec2 U )
{
    U = ( U+U - R.xy ) / R.y;
    T = iTime;
    O -= O;
    for (float i=0.; i<7.; i++)
        O.rga += line( U, P(i), P(i+1.) ) * F(9.,7.);      // yellow lines

    for (float n=0.; n<12.; n++) {  
        vec2 P0 = point(n),
             P1 = point(n+4.),
             P2 = point(n+3.);
            
        O.a += S( P0-U, 8. ) ;                             // dots
        O.ra += line( U, P0, P1 ) * (F(2.,1.)+F(9.,3.));   // triangles
        O.ba += line( U, P0, P2 ) * (F(4.,1.)+F(9.,5.));   // squares
    }
    O += (1.-O.a) * .7;                                    // background
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  gl_FragColor = vec4(0.0);
  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
