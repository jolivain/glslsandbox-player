/*
 * Original shader from: https://www.shadertoy.com/view/WdjSzd
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
vec3 red = vec3(0.8 ,0.0 ,0.0);
vec3 white = vec3(1.0, 1.0, 1.0);
vec3 yellow = vec3(0.9, 0.9, 0.3);
vec3 blue = vec3(0.0, 0.2, 1.0);
vec3 black = vec3(0.0, 0.0, 0.0);
vec3 green = vec3(0.0, 1.0, 0.0);

float createCircle(vec2 uv)
{
    uv -= 0.5;
    uv.x *= iResolution.x/iResolution.y;
    
    float dist = length(uv);
    float ratio = 0.3;
    float rate = clamp(sin(20.0 * ratio * iTime)*ratio , 0.25, 0.3);
        
    float angle = (atan(uv.y, uv.x) + iTime * 3.0);
        
    float value = smoothstep( rate,ratio = 0.2 ,dist);
    
    float radius = 0.0;
    radius = smoothstep(-1.0, 20.0, cos(angle * 5.0)) * 10.0 + 0.15;
    
    value = 1.0 - step(radius, dist) + clamp(sin(20.0 * radius * iTime) , 0.25, 0.30);
    
    
    return value * radius * 5.0;
}


mat2 rotate2d(float angle)
{
    return mat2 (cos(angle), -sin(angle), sin(angle), cos(angle));
}

mat2 scale2d(vec2 value)
{
    return mat2 (value.x, 0, 0,  value.y);
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
    vec2 uv = fragCoord/iResolution.xy;
    float ratio = iResolution.x / iResolution.y;
    uv *= 10.0;
    float offset = mod(uv.y,2.)>1. ? -1. : 1.;
    //float offset = step(1.,mod(uv.y,2.0));
    //float offset2 = step(mod(uv.y,2.0), 1.);
    
	uv.x += offset * sin(iTime) * 2.0;
	
    //uv.x -= offset2 *iTime;
    uv.x *= ratio;
    
    vec2 pos = vec2(0.5*ratio, 0.5);
    
    
    uv = fract(uv);
    uv -= pos ;
   	//uv *= rotate2d(tan(iTime * 3.0)  );
    uv += pos;
    //uv *= scale2d(vec2(1.0, 1.0)); 
   	
    uv *= scale2d(vec2(1.0, 1.0)); 
    vec3 image = vec3(createCircle(uv));
    vec3 mixed = mix(white, red, vec3(createCircle(uv)));

    fragColor = vec4(mixed,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
