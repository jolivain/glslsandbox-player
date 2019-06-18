/*
 * Original shader from: https://www.shadertoy.com/view/tsjSzh
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
float rect(vec2 uv, vec2 pos, float width, float height)
{
    float square = (step(pos.x - width, uv.x) - step(pos.x + width, uv.x)) *
                   (step(pos.y - height, uv.y) - step(pos.y + height, uv.y));
    
    
    return square;
}

float Circle(vec2 uv, vec2 pos, float rad, float blur) 
{
	float d = length(uv-pos);
	float t = smoothstep(rad, rad-blur, d);
    
    
	return t;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
     //Colors in vec3
    vec3 red = vec3(0.8 ,0.0 ,0.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 yellow = vec3(0.9, 0.9, 0.3);
    vec3 blue = vec3(0.5, 0.8, 0.9);
    vec3 black = vec3(0.0, 0.0, 0.0);
    vec3 green = vec3(0.0, 1.0, 0.0);

    vec2 uv = fragCoord/iResolution.xy;
	float a = 0.0;
    uv -= 0.5;
    uv.x *= iResolution.x/iResolution.y;
    
    vec3 Mask = mix(black, vec3(3.0 , 3.0, 0.0), Circle(uv , vec2(0.0, 0.01), 0.2, 0.01));
    
    			
    Mask = mix(Mask, vec3(3.0 , 3.0, 0.0), Circle(uv , vec2(-0.13, 0.15), 0.07, 0.01) );
    Mask = mix(Mask, vec3(3.0 , 3.0, 0.0), Circle(uv , vec2(0.13, 0.15), 0.07, 0.01) );
    
    float v = abs(clamp(sin(iTime), 0.0, 0.07));
    Mask = mix(Mask, black, Circle(uv , vec2(0.05 + v, 0.07), 0.03, 0.01) );
    Mask = mix(Mask, black, Circle(uv , vec2(-0.10 + v, 0.07), 0.03, 0.01) );
    
    //blink a bit
    float w = abs(clamp(sin(iTime * 3.0) , 0.0, 0.03));
    Mask = mix(Mask, vec3(3.0 , 3.0, 0.0), rect(uv , vec2(0.00, 0.13 - w), 0.15, 0.03) );
    
    //real mouth
    Mask = mix(Mask, black, rect(uv , vec2(-0.02 + v, -0.05), 0.03, 0.010) );
    
    vec3 Mouth = mix(black, vec3(-10.0, -10.0, -10.0),
                     										//width
                     rect(uv, 	vec2(-0.02 + v, -0.05),			 0.08 , 				0.015));

    Mask = mix(Mouth, blue, Mask);

    //cheeks
    Mask = mix(Mask, red, Circle(uv , vec2(0.05+ v, -0.05), 0.04, 0.01) );
    Mask = mix(Mask, red, Circle(uv , vec2(-0.09+ v, -0.05), 0.04, 0.01) );
    
    fragColor = vec4(Mask, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
