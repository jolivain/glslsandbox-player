/*
 * Original shader from: https://www.shadertoy.com/view/4lKfDy
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
#define B(c,h)     x < (r+=c) ? vec4( (p=r-x) > .2 && y < h ) // white block
#define L(X,Y,w,h) -vec4( abs(p-X) < w && abs(y-Y) < h )      // black line

void mainImage(inout vec4 o, in vec2 u) {
    vec2  U = 25.*u/iResolution.y;
    float z=0.,i=1.,l=2.,t=3.,f=5., e=.1,
          x = U.x-l, y = U.y-7., p, r=z;
    o = y < z || x < z ? o
    : B( f, t ) L( t,i, l,e )  L( l,l, l,e )        /* S */
    : B( i, 4.) L( z,3.1, i,e )                     /* I */
    : B( f, t ) L( 2.5,i, 1.5,1.1 )                 /* N */
    : B( f, t ) L( l,1.5, l,.6 )                    /* C */
    : B( i, 4.)                                     /* L */
    : B( f, t ) L( 2.5,i, 1.5,e )  L( t,l, l,e )    /* A */
    : B( i, 4.) L( z,3.1, i,e )                     /* I */
    : B( f, t ) L( l,i, l,i )                       /* R */
    : (t=x-.5*y-r)>z && t<8. && y<6. ? vec4(t<4.,t>l,t>6.,0) : o;
      // +1 to fix windows bug: x-=.5*y+r wrongly compiles upstream
      //                       ( v=x-.5*y-r, test(v)?: ) wrong as well
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    gl_FragColor.rgb = vec3(0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
