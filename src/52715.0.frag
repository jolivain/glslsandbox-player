/*
 * Original shader from: https://www.shadertoy.com/view/WdXSzn
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
#define GLOW 0.75
#define NUM_PARTICLES 300.0

vec3 particles(vec2 uv, vec3 color, float radius, float offset)
{        
    vec2 position = vec2(sin(offset * (iTime+4.0))*1.0,sin(offset * (iTime+1.0)))*
  				(cos((iTime ) - sin(offset)) * atan(offset*1.0));
    
 
    float dist = radius / distance(uv, position);
    return color * pow(dist, 0.95 / GLOW);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // center pixel
    //vec2 uv = (fragCoord.xy - 0.5* iResolution.xy)/iResolution.y; //Sit Still
  	//vec2 uv = (fragCoord.xy - (-0.25*sin(iTime)+.55)*iResolution.xy)/iResolution.y; //Float from corner to corner
    vec2 uv = (fragCoord.xy - (-.25*(sin((iTime+1.0)))*
  				cos((iTime )  * atan(1.0))+.55)*iResolution.xy)/iResolution.y; //Move along a 2d spiral-ish shape
    	
    // Time varying pixel color
    vec3 color ;
    color.r = ((sin(((iTime)) * 0.15) + 0.05) * 0.4);
    color.g = ((sin(((iTime)) * 0.14) + 0.00) * 0.4);
    color.b = ((sin(((iTime)) * 2.0) + 0.05) * 0.3);
	
    
    vec3 pixel = vec3(0.);
    float radius= clamp(abs(0.006*sin(iTime*1.0)), 0.002, 1.0);
        
    for	(float i = 0.0; i < NUM_PARTICLES; i++)
        pixel += abs(particles(uv, color, radius, i / NUM_PARTICLES));
    
    fragColor = mix(vec4(uv,0.8+0.5*sin(iTime),1.0), vec4(pixel, 1.0), 0.8);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
