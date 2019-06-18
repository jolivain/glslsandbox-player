/*
 * Original shader from: https://www.shadertoy.com/view/WdBGzd
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// By Hervé Bonafos
// v1.0 - 2019 02 18
// v1.1 - 2019 02 18 - horizontal scan

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 UV = fragCoord/iResolution.xy;
	float Scale = 3.0;
    UV *= Scale * vec2(iResolution.x / iResolution.y, 1.0);
        
    // Time varying Soften :
    float Soften = fract(iTime/2.0 + UV.x*0.01); // <- For demo
	//float Soften = 0.1; // <- Real case use
    
    vec2 PartieNegative = abs(fract((2.0*UV.xy-Soften)/2.0)-0.5);
    vec2 PartiePositive = abs(fract((2.0*UV.xy+Soften)/2.0)-0.5);
    vec2 Pente = (PartieNegative-PartiePositive) / Soften;
    
    // Output to screen
    vec4 Color1 = vec4(1,1,0,1);
    vec4 Color2 = vec4(0,0.5,1,1);
    fragColor = mix(Color1, Color2, 0.5 - 0.5*Pente.x*Pente.y);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
