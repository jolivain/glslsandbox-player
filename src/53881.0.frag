/*
 * Original shader from: https://www.shadertoy.com/view/3sBXDy
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define R iResolution
#define S(a, b, t) smoothstep(a, b, t)

mat2 rot(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(s, c, -c, s);
}

mat3 camera(vec3 ro, vec3 ta)
{
    const vec3 up = normalize(vec3(0, 1, 0));
    vec3 cw = normalize(ta - ro);
    vec3 cu = normalize(cross(cw, up));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

float map(vec3 p)
{
    vec3 q = abs(p);
    q = abs(q - floor(q + 0.5));
    
    mat2 rm = rot(sin(iTime * 0.1));
    q.xy *= rm;
    q.xz *= rm;
        
    float d1 = min(length(q.xy), length(q.yz));
    float d2 = min(d1, length(q.xz));
    float d = min(d1, d2);
    
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - R.xy) / R.y;

    vec2 mouse = (2.0 * (iMouse.xy / R.xy) - 1.0) * 5.0 + 0.1;
    vec3 ro = vec3(mouse, iTime * 0.5);
    vec3 ta = vec3(0.0, sin(iTime), iTime * 0.5 + 1.5);
    
    vec3 ray = camera(ro, ta) * normalize(vec3(uv, 1.5));
    
    float d = 0.0;
    
    float dist = 0.0;
    for (int i = 0; i < 50; i++)
    {
        dist = map(ro + ray * d);
                
        if (dist < 0.01)
        {
            break;
        }
                
        d += dist;
    }
    
    vec3 col = vec3(0.0);
    
    if (dist < 0.01)
    {
        float r = 1.0 - d;
        float g = exp(-d * 0.30) * 2.0;
        float b = exp(-d * 0.50) * 2.0;
        col = vec3(r, g, b);
    }
    
    //col.rgb += mix(vec3(0.323, 0.334, 0.776), vec3(0.25, 0.3, 0.8), uv.y);
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
