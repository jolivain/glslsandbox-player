/*
 * Original shader from: https://www.shadertoy.com/view/XsKcDy
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
#define B(x,y)   O += line( U, vec2(x,y+E),vec2(x,y-E) )    // vertical bar free
#define L(a,b)   O += line( U, vec2(a,E),  vec2(b,-E)  )    // slanted bar on rail
#define S(D)     smoothstep( 4./R.y, 0. ,  length(D)-e )
//#define S(D)     sin ( 100.*(length(D)-e) ) *.05 / dot(D,D)  // fun variant
#define T(a,b)   if ( t>a && t<b )                          // time span
#define f(T,a,b) mix( a, b, min(t-T,1.) )                   // interpolate, then still
#define R        iResolution
float e = .05, E = .5;                                      // bar radii
vec2 A,B;
#define line(p,a,b) S( -clamp(dot(B=b-a, A=U-a)/dot(B,B), 0.,1.) *B +A)
//float line(vec2 p, vec2 a, vec2 b) {                      // draw a line
//    b -= a; p -= a;
//    return S( p - b * clamp(dot(b,p)/dot(b,b), 0., 1.) );
//}

void mainImage( inout vec4 O, vec2 U )
{
    U = ( U+U - R.xy ) / R.y;
    O -= O;   
    float l = R.x/R.y+e+e, h = 1.+E+e,                      // distance out horiz & vert
          t = mod(iTime,10.) + 1.;
    
    T(1., 5.)  B( f(1.,-l,-.3), 0.);                        // bring bar 1
    T(2., 4.)  B( 0., f(2.,h,0.)  );                        // bring bar 2
    T(3., 4.)  B( f(3.,l,.3), 0.  );                        // bring bar 3
    T(4., 9.)  L( .0, f(4.,.0,.15)),                        // morph 2+3 to V
               L( .3, f(4.,.3,.15));
    T(5., 6.)  B( f(5.,-.3,-l), 0.);                        // out bar 1
    T(6., 9.)  B( f(6.,l,.6), 0.  );                        // bring bar 6
    T(7., 9.)  B( .9, f(7.,-h,0.) );                        // bring bar 7
    T(8., 9.)  B( f(8.,l,1.2), 0. );                        // bring bar 8
    T(9.,10.)  L( .0, f(9.,.15,.0));                        //   morph V to 1
    T(9.,11.)  L( .3, f(9.,.15,.6)),                        //   morph VI to X
               L( .6, f(9.,.6, .3)),
               B( .9, f(9.,0.,h)  ),                        //   out bar 7
               B( f(9.,1.2,l), 0. );                        //   out bar 8
    T(10.,11.) B( f(10.,0.,-l), 0.);                        // out bar 1
if(iTime>2.)
      T(1.,2.) L( f(1.,.3,l),   f(1.,.6,l)   ),             // out the X
               L( f(1.,.6,l+.2),f(1.,.3,l+.2));
        
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
