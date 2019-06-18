/*
 * Original shader from: https://www.shadertoy.com/view/td2SRW
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
/*
This shader was created live on stream!
You can watch the VOD here: https://www.twitch.tv/videos/398555459

I use the Bonzomatic tool by Gargaj/Conspiracy:
https://github.com/Gargaj/Bonzomatic

Wednesdays around 9pm UK time I stream at https://twitch.tv/lunasorcery
Come and watch a show!

~yx
*/

//#define pi uintBitsToFloat(0x40490FDBu)
#define pi acos(-1.)

const float BPM = 128./2.;

vec2 rotate(vec2 a, float b)
{
	float c=cos(b);
	float s=sin(b);
	return vec2(
		a.x*c-a.y*s,
		a.x*s+a.y*c
	);
}

float sdBox(vec3 p, vec3 r)
{
	p=abs(p)-r;
	return max(max(p.x,p.y),p.z);
}

vec3 p2;

float sdOctahedron(vec3 p, float r)
{
	p=abs(p);
	return (p.x+p.y+p.z-r)/sqrt(3.);
}


float shape(vec3 p)
{
	p=abs(p);
	
	p.xz=vec2(max(p.x,p.z),min(p.x,p.z));
	p.yx=vec2(max(p.x,p.y),min(p.x,p.y));
	
	float r = 1. + pow(cos(iTime*(BPM/60.)*pi*2.)*.5+.5,6.)*.2;
	return min(
		max(
			sdOctahedron(p,2.),
			-min(
				sdBox(p,vec3(r)),
				sdBox(p-vec3(0,1,0),vec3(r/2.))
			)
		),
		length(p)-.5+(r-1.)*.5
	);
}

float tick(float t)
{
	float a=floor(t);
	float b=fract(t);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	return a+b;
}

float tick2(float t)
{
	float a=floor(t);
	float b=fract(t);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	b=smoothstep(0.,1.,b);
	return a+b;
}

float scene(vec3 p)
{
	float outershape = -sdOctahedron(p,20.);
	
	p=-p;
	
	float mode = clamp(sin(iTime*.3)*6.,0.,1.);
	
	float radial=-atan(p.x,p.z);
	
	p.xz = rotate(p.xz, radial * mode * 2.);
	
	for(float i=0.;i<3.;++i) {
		p=p.yzx;
		if (i >= mod(iTime*BPM/60.,3.))
			break;
	}
	
	p.xy = rotate(p.xy, tick(iTime*BPM/60.)*pi*.5);
	
	p2=p;
	
	return min(outershape, shape(p));
}

vec3 trace(vec3 cam, vec3 dir)
{
	vec3 accum = vec3(1);
	for(int bounce=0;bounce<3;++bounce)
	{
		float t=0.;
		float k=0.;
		for(int i=0;i<250;++i){
			k=scene(cam+dir*t)*.4;
			t+=k;
			if(abs(k)<.001||k>10.)
				break;
		}
		if(abs(k)<.001)
		{
			vec3 h=cam+dir*t;
			vec2 o=vec2(.001,0);
			vec3 n=normalize(vec3(
				scene(h+o.xyy)-scene(h-o.xyy),
				scene(h+o.yxy)-scene(h-o.yxy),
				scene(h+o.yyx)-scene(h-o.yyx)
			));
			
			if (length(h) < 1.)
			{
				//return vec3(pow(n.y*.5+.5, 5.))+.25;
				float fresnel = pow(1.-dot(-dir,n),5.);
				//fresnel=mix(.002,1.,fresnel);
				accum *= fresnel;
				cam=h+n*.01;
				dir=reflect(dir,n);
			}
			else if (length(h) > 2.)
			{
				h = mod(abs(h)-vec3(0,0,.5+tick2(iTime*BPM/120.)),2.)-1.;
				accum *= (step(0.,h.x*h.y*h.z))*.2+.4;
				return accum;
			}
			else
			{
				float fresnel = pow(1.-dot(-dir,n),5.);
				vec3 color = sin(iTime+vec3(0,1,2)+h)*.5+.5;
				//accum *= mix(color,vec3(1),fresnel);
				accum *= mix(vec3(.1,.3,1).brg,vec3(0),(1.-fresnel)*.5);
				cam=h+n*.01;
				dir=reflect(dir,n);
			}
		}
	}
	return accum;
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
	vec2 uv = fragCoord / iResolution.xy - .5;
    uv.x *= iResolution.x / iResolution.y;

	vec3 cam=vec3(0,0,-5);
	vec3 dir=normalize(vec3(uv,1));
	
	cam.xz = rotate(cam.xz, iTime*.3);
	dir.xz = rotate(dir.xz, iTime*.3);
	
	cam.yz = rotate(cam.yz, iTime*.3);
	dir.yz = rotate(dir.yz, iTime*.3);
	
	out_color.rgb = trace(cam,dir);
	out_color.rgb = pow(out_color.rgb, vec3(.45));
	out_color.rgb *= 1.-dot(uv,uv)*.4;
	out_color.rgb = pow(out_color.rgb, vec3(1,1.3,1.1));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
