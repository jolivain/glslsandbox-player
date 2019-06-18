/*
 * Original shader from: https://www.shadertoy.com/view/Wll3Wl
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
float circle(vec2 pos, float radius){
    float dx = 1./iResolution.y;
    return clamp(.5*(radius - length(pos)+dx) / dx, 0., 1.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy - 0.5;
    vec2 u = uv;
    u.x*=iResolution.x/iResolution.y;
    float k = 1.;
    for(float i = 1.; i < 40.; i++){
        float a = .1*i*iTime;
        u += vec2(sin(a),cos(a))*.05;
        k += circle(u, 2.0 - 0.05*i);
    } 
    fragColor = vec4(1.-abs(1.-mod( k, 2.)));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
