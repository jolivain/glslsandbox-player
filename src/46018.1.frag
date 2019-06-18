/*
 * Original shader from: https://www.shadertoy.com/view/XsXGR4
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
// Copyright (c) 2012-2013 Andrew Baldwin (baldand)
// License = Attribution-NonCommercial-ShareAlike (http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US)
// Logo from http://thndl.com/

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 d=1./iResolution.xy;
	vec2 scale=vec2(iResolution.x/iResolution.y,1.)*2.1;
	vec2 c=(.5-fragCoord.xy*d)*scale;
	// d is used later for anti-aliasing
	d*=scale;
	vec4 f;
	
	// Angle of the needle from top in radians
	float o=1.5*sin(3.*sin(iTime*.271)+.2*sin(iTime*7.1)+iTime*.1); 
	
	// The needle (unfortunately not anti-aliased at top and bottom)
	vec2 b=vec2(c.x*cos(o)-c.y*sin(o), c.x*sin(o)+c.y*cos(o));
	float r,s,l,h,i,k,m,n;
	m=clamp(1.5-abs(b.y),0.2,1.5)+d.x*50.;
	i=step(-0.01,c.y);
	h=step(-0.01,b.y);
	k=step(-0.99,b.y)*(1.-h)*(1.-smoothstep(0.027*m-d.x*2., 0.03*m,abs(b.x)));
	
	// The colour wheel
	l=length(c);
	r=1.0-smoothstep(1.-d.x*2.,1.,l);
	s=1.0-smoothstep(.5-d.x*2.,0.5,l);
	float t=atan(c.x/c.y);
	float u=(t+3.141*0.5)/3.141;
	vec4 ryg=vec4(0.69*clamp(mix(vec3(.0,2.,0.), vec3(2.,0.,0.),u),0.0,1.0),2.4-2.*l);
	vec4 tg=mix(vec4(ryg.rgb,0.),ryg,r);
	n=clamp(1.75*l-0.75,0.,1.);
	vec4 bg=mix(tg,vec4(0.,0.,0.,1.-n),i);
	
	float v=atan(c.x,c.y)-o;
	float vs=atan(c.x,c.y);
	
	// Base of the needle
	n=.9+.1*sin((20.*l+v)*5.);
	vec4 w=vec4(n,n,n,1.);
	
	// Shadow for the base of the needle
	vec4 e=mix(bg,w*vec4(vec3(abs(mod(vs+3.141*0.75, 2.*3.141)/3.141-1.)),1.),s);
	
	// Put it all together...
	f=mix(e,vec4(vec3(1.-(30.*abs((b.x/m+0.01)))),1.),k);
	
	fragColor=mix(vec4(0.2),f,f.a);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
