/*
 * Original shader from: https://www.shadertoy.com/view/Wtl3D2
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
//-----------------------------------------------------
// noise from: https://thebookofshaders.com/12/
//-----------------------------------------------------

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

//-----------------------------------------------------
// end
//-----------------------------------------------------

float wave(vec2 st, float c) {
    float f = smoothstep(c - .02, c, st.y) * smoothstep(c, c + .02, st.y);
	return 1. - clamp(f, 0., 1.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy - .5;
    
    vec3 col = vec3(0.);
    
    float wave1 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .00) * 20.) * .05
    );
    float wave2 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .01) * 20.) * .05
    );
    float wave3 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .20) * 20.) * .05
    );
    float wave4 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .21) * 20.) * .05
    );
    float wave5 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .40) * 20.) * .05
    );
    float wave6 = wave(
        uv + vec2(0., noise(uv * 5. + iTime * .6) * .05),
        sin((uv.x + iTime * .2 + .41) * 20.) * .05
    );

    col = vec3(1., 0., 0.) * (1. - wave1) * wave2;
    col += vec3(0., 1., 0.) * (1. - wave3) * wave4;
    col += vec3(0., 0., 1.) * (1. - wave5) * wave6;
    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
