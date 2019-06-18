/*
 * Original shader from: https://www.shadertoy.com/view/4ljSDt
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float map(vec3 p)
{
    vec3 q = fract(p) * 2.0 - 1.0;
    //return length(q) - 0.1;
    return sdBox(q, vec3(0.25));
}

float trace(vec3 o, vec3 r)
{
    float t = 0.0;
    for (int i = 0; i < 32; ++i)
    {
        vec3 p = o + r * t;
        float d = map(p);
        t += d * 0.5;
    }
    return t;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    uv = uv * 2.0 - 1.0;
    
    uv.x *= resolution.x / resolution.y;
    
    vec3 r = normalize(vec3(uv, 2.0));
    float the = time * 0.25;
    r.xz *= mat2(cos(the), -sin(the), sin(the), cos(the));
    vec3 o = vec3(0.0, time, time);
    
    float st = (sin(time) + 1.5) * 0.4;
    
    float t = trace(o, r * st);
    
    float fog = 1.0 / (1.0 + t * t * 0.1);
    
    vec3 fc = vec3(fog * 2.0);
    
    vec3 tint = vec3(st - 0.5,st,st + 0.5);
    gl_FragColor = vec4(fc * tint, 1.0);
}
