/*
 * Original shader from: https://www.shadertoy.com/view/4dt3R8
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
#define scale 25.

float superellipse(vec2 uv,vec2 o,float r,float n)
{
    float res=pow(abs((uv.x-o.x)/r),n)+pow(abs((uv.y-o.y)/r),n);
    return res<=1.?sqrt(1.-res):.0;
}

vec3 putPixel(vec2 uv)
{
    return superellipse(fract(uv),vec2(.5),.5,3.5)*vec3(.1,.9,.07);
}

void mainImage(out vec4 C,in vec2 U)
{
    vec2 R=iResolution.xy;
    vec2 uv=(2.*U-R)/R.y*scale,
        fuv=floor(uv)+.5,
          t=vec2(sin(iTime),cos(iTime))*scale/2.,
         o1=vec2(0,t.x),
         o2=vec2(1.7*t.x,0),
         o3=2.*t.yx;
    vec3 l=vec3(distance(o1,fuv),distance(o2,fuv),distance(o3,fuv)),
    	 g=scale*vec3(.5/(l.x*l.x),1./(l.y*l.y),.75/(l.z*l.z));
    C.xyz=g.x+g.y+g.z>10./scale?putPixel(uv):vec3(0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
