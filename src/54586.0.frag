/*
 * Original shader from: https://www.shadertoy.com/view/ldtSzl
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
// Created by Stephane Cuillerdier - Aiekick/2015 (twitter:@aiekick)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Tuned via XShade (http://www.funparadigm.com/xshade/)

const vec3 ld = vec3(0.,1., .5);

float t = 0., ts = 0.;

mat3 getRotZMat(float a){return mat3(cos(a),-sin(a),0.,sin(a),cos(a),0.,0.,0.,1.);}

float df(vec3 p)
{
	p.x += sin(p.z*1.2);
    p.y += cos(p.z*.2) * sin(p.x*.8);
	p *= getRotZMat(p.z*1.8+sin(p.x)+cos(p.y));
    p.xy = mod(p.xy, 0.8) - 0.4;
	return length(p.xy);
}

vec3 nor( vec3 p, float prec )
{
    vec2 e = vec2( prec, 0. );
    vec3 n = vec3(
		df(p+e.xyy) - df(p-e.xyy),
		df(p+e.yxy) - df(p-e.yxy),
		df(p+e.yyx) - df(p-e.yyx) );
    return normalize(n);
}

vec3 lighting(vec3 p, vec3 lp, vec3 rd, float prec) 
{
    vec3 l = lp - p;
    float d = max(length(l), 0.01);
    float atten = .8-exp( -0.01*d*d );
    vec3 n = nor(p, prec);
    float fre = pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 2.0);
    vec3 lin = vec3(0.08,0.32,0.47);
    lin += 2.5*fre*vec3(1);
    return lin * atten;
}

//--------------------------------------------------------------------------
// Grab all sky information for a given ray from camera
// from Dave Hoskins // https://www.shadertoy.com/view/Xsf3zX
vec3 GetSky(in vec3 rd, in vec3 sunDir, in vec3 sunCol)
{
	float sunAmount = max( dot( rd, sunDir), 0.0 );
	float v = pow(1.0-max(rd.y,0.0),6.);
	vec3  sky = vec3(0.5,0.49,0.72);
	sky = sky + sunCol * sunAmount * sunAmount * .25;
	sky = sky + sunCol * min(pow(sunAmount, 800.0)*1.5, .3);
	return clamp(sky, 0.0, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 si = iResolution.xy;
	vec2 uv = (2.*fragCoord.xy-si)/min(si.x, si.y);
	
	t = iTime;
	ts = sin(t)*.5+.5;
    
    vec3 ro = vec3(1.2*vec2(cos(t*.5),sin(t*.5)),t*2.);

    vec3 cu = vec3(0,1,0);
    vec3 co = ro + vec3(0.,0,1);
	
	float fov = .5;
	vec3 z = normalize(co - ro);
	vec3 x = normalize(cross(cu, z));
	vec3 y = normalize(cross(z, x));
	vec3 rd = normalize(z + fov * uv.x * x + fov * uv.y * y);
	
	float s = 0.01;
	float d = 0.;
	vec3 p = ro + rd * d;
	float dMax = 20.;
	for (float i=0.; i<250.; i++)
	{
		if (s<0.01*log(d*d/s/1000.) || d>dMax) break;
		s = df(p);
        d += s * 0.2;
        p = ro + rd * d;	
	}
	
    vec3 sky = GetSky(rd, ld, vec3(1.5));
    
	if (d<dMax)
	{
        fragColor.rgb = vec3(0.47,0.6,0.76) * lighting(p, ro, rd, .000001);
		fragColor.rgb = mix( fragColor.rgb, sky, 1.0-exp( -0.03*d*d ) ); 
	}
	else
	{
		fragColor.rgb = sky;
	}
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
