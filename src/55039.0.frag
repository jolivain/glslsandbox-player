/*
 * Original shader from: https://www.shadertoy.com/view/3tj3zD
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
// Fuzz-flakes by Matt McLin

// random func based on one found here: https://thebookofshaders.com/10/
// @patriciogv - 2015, http://patriciogonzalezvivo.com
float rand (float seed) 
{
    return fract(sin(dot(vec2(seed, seed*0.5926535897),
                         vec2(12.9898,78.233)))*43758.5453123);
}

float flake(in vec2 uv, in vec2 pos, float speed, float size, float wind)
{
    uv.x *= 1.6;
    vec2 drop;
    drop.y = 1.0 - fract(((iTime+pos.y)*speed) / iResolution.y);
    drop.x = (pos.x * 1.6) + sin(drop.y*wind)*0.1;
    float d = distance(uv, drop);
    d = clamp(d, 0.0, 0.28);
    if (d < size) return 1.0;
    if (d > (size+0.02)) return 0.0;
    return mix(1.0,0.0, 50.0*(d - size));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = vec3(0.3,0.1,0.7) - 0.2*cos(iTime+uv.xyx);
    
    for (float i=0.0; i<200.0; i += 1.0) {
        vec3 flakecol = vec3(0.3+0.3*rand(i*0.9),0.7+0.3*rand(i*0.3),0.8+0.2*rand(i*0.6));
        vec2 pos = vec2(rand(i), rand(i*0.887787)*1.6 + 0.1);
        float speed = 150.0 + 100.0*rand(i*0.728734);
        float size = 0.005 + 0.02*rand(i*0.1415926);
        float wind = 4.0*rand(i*0.314159);
        col = mix(col, flakecol, flake(uv, pos, speed, size, wind));
    }

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
