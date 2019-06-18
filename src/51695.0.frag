/*
 * Original shader from: https://www.shadertoy.com/view/4lVfDW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define iterations 256

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 center = vec2(0.90001,0.269995);
    float scale = iMouse.x/iResolution.x;//1.0/iTime * 10.0;
    
    float t = exp(-mod(iTime*0.5, 12.5));
    scale = t;
        
    vec2 uv = fragCoord/iResolution.xy;
    uv = (2.0 * uv.xy) - 1.0;
    uv.x *= iResolution.x/iResolution.y;
    float cosT = cos(iTime * 0.2);
    float sinT = sin(iTime * 0.2);
    mat2 rot = mat2(cosT, -sinT,
                    sinT, cosT);
    uv *= rot;
    
    vec2 z,c;
    
    c.x = (uv.x-0.5) * scale - center.x;
    
    c.y = (uv.y-0.5) * scale - center.y;
    
    z = c;

    int ii = 0;
    for (int i = 0; i < iterations; i++)
    {
        float x = (z.x * z.x - z.y * z.y) + c.x;
        float y = (z.y * z.x + z.x * z.y) + c.y;
	ii = i;
        
        //If magnitude exceeds 2 it is guaranteed to diverge to infinity
        if ((x*x + y*y) > 4.0)
            break;
        
        z.x = x;
        z.y = y;
    }
    
    vec3 col = (ii == iterations - 1) ? vec3(0.0) : mix(vec3(0.2,0.2,0.5), vec3(0.9,0.5,0.4),float(ii)/75.0);
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
