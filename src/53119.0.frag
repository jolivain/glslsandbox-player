/*
 * Original shader from: https://www.shadertoy.com/view/wdlXz2
 */

#extension GL_OES_standard_derivatives : enable

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
float fn1(float v, float a) {
    return v * 0.35 + (sin(v * 0.02 + iTime * a) * 15.0);
}

void mainImage( out vec4 fragColor, in vec2 xy )
{
    float tx = sin(iTime * 0.03) * 0.05 + 0.2;
    float ty = cos(iTime * 0.03) * 0.05 + 0.2;
    
    float x = sin(fn1(xy.x, tx));
    float y = sin(fn1(xy.y, ty));
    float f = x * y;
    
    float q = 1.5;
    
    vec3 col1 = vec3(0.0);
    vec3 col2 = vec3(1.0);
    float b = smoothstep(-q, q, f / fwidth(f));
    
    vec3 col  = mix(col1, col2, b);
    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
