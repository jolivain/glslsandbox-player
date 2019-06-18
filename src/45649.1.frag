/*
 * Original shader from: https://www.shadertoy.com/view/ll2SWt
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
float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float map(vec3 p)
{
    vec3 q = fract(p) * 2.0 - 1.0;
    return sdBox(q, vec3(0.25)) - 1.0;
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 r = normalize(vec3(uv, 2.0));
    float the = iTime * 0.25;
    r.xz *= mat2(cos(the), -sin(the), sin(the), cos(the));
    vec3 o = vec3(0.5, 0.5, iTime);
    
    float t = trace(o, r);
    
    float fog = 1.0 / (1.0 + t * t * 0.1);
    
    vec3 fc = vec3(fog * 2.0);
    
    vec3 tint = vec3(0.9,0.5,0.2);
	fragColor = vec4(fc * tint, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
