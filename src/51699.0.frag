/*
 * Original shader from: https://www.shadertoy.com/view/ldycWK
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
#define float2 vec2
#define float3 vec3
#define float4 vec4

float2 dw(float2 p, float2 c, float t)
{
    p-=c;
    float l=length(p);
    float s=sin(l-t);
    s/=l;
    s*=clamp(1.0-l*0.02,0.0,1.0);
    float x = 0.5 + 0.5*(p.x*s);
    float y = 0.5 + 0.5*(p.y*s);
    return float2(x,y);
    return float2(s*0.5+0.5);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
   	float2 uv = ((fragCoord-iResolution.xy/2.0)/iResolution.xx)*100.0;
    float2 m=((iMouse.xy-iResolution.xy/2.0)/iResolution.xx)*100.0;
    float t=iTime*15.0;
    float2 col=float2(0);
    col+=dw(uv,m,t);
    col+=dw(uv,float2(-13,8),t+1.0);
    col+=dw(uv,float2(8,15),t+2.0);
    col+=dw(uv,float2(-18,-5),t-1.0);
    col*=0.25;
    fragColor = vec4(col.xxy,1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
