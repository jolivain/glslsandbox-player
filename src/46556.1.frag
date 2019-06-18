/*
 * Original shader from: https://www.shadertoy.com/view/XdtBzN
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
vec3 f(vec2 u, float i)
{
    vec2 a = floor(u*.25)+i;
    vec2 c = vec2(1.,1.123);
    vec3 d = vec3(dot(a,c), dot(a+1.1,c), dot(a+2.1,c));
    d = fract(sin(d)*1111.);
    vec2 b = mod(u,vec2(4.))-1.-(sin(d.yz*iTime*2.)+1.);
    return (fract(sin(d+5.22)*1111.)*.5+.25)/dot(b,b);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 u = 32.*fragCoord/iResolution.x+iTime*.5;
    vec3 l = f(u,0.);
    l = max(l, f(u+vec2(2.,0.),.11));
    l = max(l, f(u+vec2(0.,2.),.22));
    l = max(l, f(u+2.         ,.33));
    l = min(l, f(u+1.         ,.44));
    
    fragColor = vec4(l,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
