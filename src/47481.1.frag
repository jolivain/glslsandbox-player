/*
 * Original shader from: https://www.shadertoy.com/view/XsGfDD
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
// @lsdlive
// CC-BY-NC-SA

mat2 r2d(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, s, -s, c);
}

// http://mercury.sexy/hg_sdf/
// hglib mirrorOctant
void mo(inout vec2 p, vec2 d) {
	p.x = abs(p.x) - d.x;
	p.y = abs(p.y) - d.y;
	if (p.y > p.x)p = p.yx;
}

// hglib pMod1
float re(float p, float d) {
	return mod(p - d * .5, d) - d * .5;
}

// hglib pModPolar
void amod(inout vec2 p, float d) {
	float a = re(atan(p.x, p.y), d);
	p = vec2(cos(a), sin(a)) * length(p);
}

// signed cube
// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float cube(vec3 p, vec3 b) {
	b = abs(p) - b;
	return min(max(b.x, max(b.y, b.z)), 0.) + length(max(b, 0.));
}

float g = 0.;
float de(vec3 p) {
	float t = iTime * 7.;
	float s = (t*.1 + sin(t)*.1)*2.5;
	p.xz *= r2d(s);
    //p.xz *= r2d(iTime);

	amod(p.xz, 6.28 / 4.);
	mo(p.xz, vec2(2.7));

	vec3 q = p;
	q.xz *= r2d(q.y*.7 + iTime * 2.);
	amod(q.xz, 6.28 / 9.);
	q.x = abs(q.x) - 2.4;
	float c = cube(q, vec3(.1, 1e6, .1));

	q = p;
	mo(q.xz, vec2(.3));
	q.x = abs(q.x) - 2.;
	float cyl = length(q.xz) - .15;

	p.xz *= r2d(p.y*.3 + iTime * 4.);
	float d = cube(p, vec3(.9, 1e6, .9));
	d = min(d, cyl);
	d = min(d, c);
	g += .01 / (.01 + d * d);// glow trick from balkhan https://www.shadertoy.com/view/4t2yW1
	return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 uv = ( fragCoord - .5*iResolution.xy ) / iResolution.y;

	vec3 ro = vec3(0, -iTime * 6., -0);
	vec3 rd = normalize(vec3(uv, .4 - length(uv))); // fisheye learnt from xt95 & lamogui
	
    vec3 p;
	float t = 0., ri;
	for (float i = 0.; i < 1.; i += .01) {
		ri = i;
		p = ro + rd * t;
		float d = de(p);
		//if(d<.001)break;
		d = max(abs(d), .02);// phantom mode trick from aiekick https://www.shadertoy.com/view/MtScWW
		t += d * .2;
	}

	vec3 c = mix(vec3(.9, .8, .6), vec3(.1, .1, .2), sin(uv.x*2.) + ri);
	c.r += sin(iTime)*.3;
	c += g * .03; // glow trick from balkhan https://www.shadertoy.com/view/4t2yW1
	c = mix(c, vec3(.1, .1, .12), 1. - exp(-.07*t*t)); // fog

	fragColor = vec4(c, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
