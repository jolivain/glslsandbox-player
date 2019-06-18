/*
 * Original shader from: https://www.shadertoy.com/view/3djXWD
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
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.x;
    vec2 u = uv - 0.24;
    
    float e = iTime*0.5,
          a = atan(u.x,u.y),
          k = mod(a+e +3.14,6.28)-3.14, g;  
    
    u = uv - vec2(.7,.32);
    a = atan(u.x,u.y);
    g = mod(a-e +3.14,6.28)-3.14;
    
    fragColor = vec4((k-g)*.2);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
