/*
 * Original shader from: https://www.shadertoy.com/view/WdBSWd
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
#define SIZE 25.0 
#define COL_BLACK vec3(23.0, 32.0, 38.0) / 255.0 
#define COL_WHITE vec3(245, 248, 250) / 255.0 
 
void mainImage(out vec4 fragColor, in vec2 fragCoord)
 {     
    vec2 uv = (fragCoord - iResolution.xy * 0.5) / iResolution.y;
     
    vec2 ouv = floor(uv * SIZE) / SIZE;    
    uv *= SIZE;    
    uv = fract(uv) - 0.5;
    
    float a = length(ouv * 5.0) - iTime * 2.5;
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, - sa, sa, ca);
    
    uv *= rot;
    
    float sm = 1.0 / (iResolution.x / SIZE) * 2.0;
    float s = 0.05;
    float mask = smoothstep(s + sm, s, abs(uv.x));
    mask += smoothstep(s + sm, s, abs(uv.y));
    
    s = 0.25 + (ca * 0.5 + 0.5) * 0.2;
    mask *= smoothstep(s, s - sm, abs(uv.x));
    mask *= smoothstep(s, s - sm, abs(uv.y));
    
    vec3 col = mix(COL_BLACK, COL_WHITE, mask);
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
