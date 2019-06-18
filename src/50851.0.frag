/*
 * Original shader from: https://www.shadertoy.com/view/XlKfW3
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
vec3 N23(vec2 p)
{
    vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
    a += dot(a, a + 34.45);
    return fract(a);
}

vec2 N22(vec2 p)
{
    vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
    a += dot(a, a + 34.45);
    return fract(vec2(a.x * a.y, a.y * a.z));
}

float voro(vec2 uv, float t, float dmix)
{
    vec2 guv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    
    float md = 100.;
    for (float x = -1.; x <= 1.; x++)
    {
        for (float y = -1.; y <= 1.; y++)   
        {
            vec2 offs = vec2(x, y);
            vec2 n = N22(id + offs);
            
            vec2 p = offs + sin(n * t) * .3;
            p -= guv;
            float d1 = length(p);
            float d2 = abs(p.x) + abs(p.y);
            
            float d = mix(d1, d2, dmix);
            
            md = min(md, d);
        }
    }
    return md;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/iResolution.x;
    
    float t = iTime*0.5;
    float mode = step(0.5, fract(t*0.1));
    
    float dis = 0.5 * sin(t*0.8);
    
    vec2 duv = uv;
    duv.y += sin(duv.x*3.0+t*0.2)*dis;
    duv.x += cos(duv.y*2.0-t*0.1)*dis;
    
    float m = 0.0;
    vec3 col = vec3(0);
    for (float i = 0.0; i <= 10.0; i++) {
        float dir = sin(i * 0.4 + sin(t * 0.01));
        dir = mix(dir, -dir, mode);
        
        vec2 co = mix(uv, duv, i * 0.1);
        
        vec2 p = co * (1.0 + i*0.6)-t*vec2(sin(dir), cos(dir));
        float tt = 23.0+i*12.0 + t;
        float md = sin(i * 0.2);
        
    	float v = voro(p, tt, md);
        
        float th = 0.65 + i * 0.01;
        float blur = (0.1+i)*0.005;
        m += smoothstep(th - blur, th + blur, v) * 0.1;
        
        float cs = 0.02 + 0.02 * cos(i*0.1);
        col += m * N23(vec2(i * cs)) * vec3(0.7, 0.7, 1.0);
    }
    
    float k1 = smoothstep(0.1, 0.4, m);
    float k2 = smoothstep(0.2, 0.3, m);
    float k3 = smoothstep(0.4, 0.5, m);
    
    vec3 col2 = vec3(10, 2, 0) * k1 +
        vec3(0, 2, 1) * k2 +
        vec3(0, 10, 1) * k3;
    
    vec3 res = mix(col, col2, mode);
    res = res / (res + 1.0);
    
    fragColor = vec4(res, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //


void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 1.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
