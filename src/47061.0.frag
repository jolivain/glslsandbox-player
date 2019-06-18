/*
 * Original shader from: https://www.shadertoy.com/view/ldcBRs
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
void mainImage( out vec4 O, vec2 U )
{
    vec2 R = iResolution.xy;
    U = (U+U-R)/R.y;
    float t = 4.*iTime, l = length(U), a = atan(U.y,U.x);
    O = vec4(.5 + sin(  l < .7  ? 3.*(a+20.*l+t)
                      : l < 1.4 ? 3.*(a-15.*l+t)
                      :           3.*(a+12.*l+t) ) );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
