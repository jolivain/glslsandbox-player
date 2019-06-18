/*
 * Original shader from: https://www.shadertoy.com/view/4ty3WW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
//-----------------CONSTANTS MACROS-----------------

#define PI 3.14159265359
#define E 2.7182818284
#define GR 1.61803398875

//-----------------UTILITY MACROS-----------------

#define stime ((sin(float(__LINE__))*GR/2.0/PI+GR/PI)*iTime+100.0)
#define saw(x) (acos(cos(x))/PI)
#define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)
#define rotatePoint(p,n,theta) (p*cos(theta)+cross(n,p)*sin(theta)+n*dot(p,n) *(1.0-cos(theta)))


//#define iTime (iTime*.1)

#define PI 3.14159265359

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy*2.0-1.0;
    uv.x *= iResolution.x/iResolution.y;
    
	//vec3 eye = vec3(0.0, 0.0, 3.0);
	vec3 eye = vec3(cos(iTime), sin(iTime*.5), sin(iTime))*2.0;
    vec3 look = vec3(0.0, 0.0, 0.0);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 foward = normalize(look-eye);
    vec3 right = normalize(cross(foward, up));
    up = normalize(cross(right, foward));
    vec3 ray = normalize(foward+uv.x*right+uv.y*up);
    
    fragColor = vec4(0.0);
    
 	const float outerCount = 12.0;
 	const float innerCount = 8.0;
        
    float map = 0.0;
    float sum = 0.0;
    
    for(float i = 0.0; i < 10.0; i+=1.0)
    {
        if(i >= outerCount)
            break;
        
        float theta1 = i/outerCount*2.0*PI;
        
        for(float j = 0.0; j < 10.0; j+=1.0)
        {
            if(j >= innerCount)
                break;
            
            float theta2 = theta1+j/innerCount*PI*2.0;

            
            float omega1 = theta1;
            float omega2 = theta2+stime*sign(cos(i*PI));
            
            
       	 	vec3 p1 = vec3(cos(omega1)*sin(omega2),
                           sin(omega1)*sin(omega2),
                           cos(omega2));
                           
       	 	vec3 p2 = vec3(cos(omega1)*sin(omega2+PI/8.0),
                           sin(omega1)*sin(omega2+PI/8.0),
                           cos(omega2+PI/8.0));
            
            vec3 ray2 = normalize(p2-p1);
            
            float a = dot(ray,ray);
            float b = dot(ray,ray2);
            float c = dot(ray2,ray2);
            float d = dot(ray,eye-p1);
            float e = dot(eye-p1,ray2);
            
            float t1 = (b*e-c*d)/(a*c-b*b);
            float t2 = (a*e-b*d)/(a*c-b*b);
            
            float dist = length((eye+ray*t1)-(p1+ray2*t2));
            
            float lineWidth = 50.0/max(iResolution.x, iResolution.y);
            
            float lineLength = 2.5+.5*sin(stime);
            
            float isFoward = (sign(t1)*.5+.5);
            
            
            
                float sides = (1.0-smoothstep(0.0, lineWidth, dist));
                float ends = (1.0-smoothstep(0.0, lineLength, abs(t2)));
                float line = sides*ends*isFoward;
                
                map += line*(1.0+i/innerCount+j/outerCount)/2.0;
                sum += 1.0*line*isFoward;
        }
    }
    
	fragColor = vec4(flux(PI*map/sum+stime), 1.0)*clamp(map, 0.0, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
