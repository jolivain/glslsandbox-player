/*
 * Original shader from: https://www.shadertoy.com/view/WlS3WR
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
#define S(v) smoothstep(-.5,.5, (v)/fwidth(v))
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.x;

    vec3 col = vec3(0,0,0);    
    if (uv.x < 0.25)
    {
    	float stripe = S(sin((uv.x - uv.y) * 100.0 + iTime * 3.0));
        col = mix(vec3(0.75,0,0.75), vec3(1,1,0), stripe);
    }
    else if (uv.x < 0.5)
    {
    	float wave = S(sin(uv.y * 60.0 + 1.5 * sin(uv.x * 60.0 - iTime)));
        col = mix(vec3(1,.6,0), vec3(0,.9,.7), wave);
    }
    else if (uv.x < 0.75)
    {
    	float tri = S(sin((uv.y + iTime * -0.05) * 100.0 + 100.0 * (abs(mod(uv.x, 0.05) - 0.025))));
        col = mix(vec3(.2,.9,.1), vec3(.85,0,.15), tri);
    }
    else
    {
        float s = 32.0;
        vec2 uvS = uv * s - vec2(s * 0.5, s * 0.5 * 9.0 / 16.0);
        float r = 1.3;
        float y = 0.77;
        uvS.x = mod(uvS.x + iTime - floor((uvS.y * y + y * 0.6) + 0.5) * 1.95, r) - 0.5 * r;
        uvS.y = mod(uvS.y, r) - 0.5 * r;
        float polka = S(.45-length(uvS));
        col = mix(vec3(0,0.25,1), vec3(0.75,0.5,0.75), 1.0 - polka);
    }

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
