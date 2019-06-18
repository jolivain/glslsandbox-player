/*
 * Original shader from: https://www.shadertoy.com/view/wt2GzW
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
#define float2 vec2
#define float3 vec3
#define float4 vec4
#define lerp   mix
#define frac   fract
#define fmod   mod

float  noise(float param)   { return frac(sin(param) * 43758.937545312382); }

float2 noise2(float2 param) { return frac(sin(param) * 43758.937545312382); }

float3 circle(float2 uv, float seed)
{
    float rnd = noise(seed);
    float period = 2.0 + 2.0*rnd;
    float age = fmod(iTime + seed, period);
    float nAge = age / period;
    float t = floor(iTime - age + 0.5) + seed;
    
    float2 n = noise2(float2(t, t + 42.34231));
    
    float grad = length((uv*2.0-1.0) - n);
    
    nAge = sqrt(nAge);
    
    //shape
    float r = 1.0;
    r *= smoothstep(0.3*nAge, 0.8*nAge, grad);
    r *= 1.0-smoothstep(0.8*nAge, 1.0*nAge, grad);
    
    //opacity
    r *= sin(nAge*3.1415);
    //r *= 1.0-nAge*nAge;
    
    float3 clr = float3(1.0, 0.8, 0.4);
    
    return float3(r) * clr * (0.3+0.7*frac(100.0*float3(n.x, n.y, 1.0-n.x*n.y)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy; 
    uv.x *= iResolution.x / iResolution.y;

    float3 c = float3(0.0);
    c.rgb  = circle(uv, 0.321517);
    c.rgb += circle(uv, 1.454352);
    c.rgb += circle(uv, 2.332126);
    c.rgb += circle(uv, 3.285356);
    c.rgb += circle(uv, 4.194621);    
    
    //tone mapping
    float lum = dot(c.rgb, float3(0.3333));
    if(c.r>1.0) c.r = 2.0 - exp(-c.r + 1.0);
    if(c.g>1.0) c.g = 2.0 - exp(-c.g + 1.0);
    if(c.b>1.0) c.b = 2.0 - exp(-c.b + 1.0);
    
    fragColor.rgb = c*0.7;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
