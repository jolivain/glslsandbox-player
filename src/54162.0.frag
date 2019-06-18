/*
 * Original shader from: https://www.shadertoy.com/view/XtyGDR
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
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//#define PI ( (asin(1.)*(sqrt(5.)*.5-.5)*2.718281828) + cos(iTime/8.0)*0.5)
//#define PI (asin(1.)*(sqrt(5.)*.5-.5)*2.718281828)
#define PI 3.1415926535

mat3 m_rot(float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat3( c, s, 0, -s, c, 0, 0, 0, 1);
}
mat3 m_trans(float x, float y)
{
    return mat3(1., 0., 0., 0., 1., 0, -x, -y, 1.);
}
mat3 m_scale(float s)
{
    return mat3(s, 0, 0, 0, s, 0, 0, 0, 1);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec2 pos = (fragCoord.xy - iResolution.xy*.5) / iResolution.yy;
   
    pos*=6.0;
    pos.y+=1.9;
   	vec3 p = vec3(pos, 1.);
    float d = 1.0;
    float iter = mod(floor(iTime), 20.0);
    float len = fract(iTime);
    for(int i = 0; i < 20; ++i)
    {
        if(i<=int(iter+0.5))
        {
            d=min(d,(length(max(abs(p.xy)-vec2(0.01,1.0), 0.0)))/p.z);
            p.x=abs(p.x);
        	p=m_scale(1.22) * m_rot(0.25*PI) * m_trans(0.,1.) * p;
        }
        else
        {
            d=min(d,(length(max(abs(p.xy)-vec2(0.01,len), 0.0)))/p.z);
        }
    }
    d=smoothstep(0.1, 0.15,d);
	fragColor = vec4(d,d,d,1.);	
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
