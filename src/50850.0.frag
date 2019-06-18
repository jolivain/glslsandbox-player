/*
 * Original shader from: https://www.shadertoy.com/view/MtKfD3
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
void mainImage( out vec4 O, vec2 U )
{
    float x = U.x < iResolution.x/2. ? U.x : U.x - .5,
          y = ceil(U.y/iResolution.y*20.)/20.,
        //l =       x  *  (1.+y);
          l = (x+iTime)*  (1.+y);
    O = vec4( .5+.5* sin( 3.1419/2.*l ) );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
