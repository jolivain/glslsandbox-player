/*
 * Original shader from: https://www.shadertoy.com/view/MdyfRV
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define iTime time
#define iResolution resolution
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// @lsdlive
// CC-BY-NC-SA

// Trying to reproduce the blue blob at the beginning of the Future Sound of London clip "Lifeforms".
// https://www.youtube.com/watch?v=kDSDeyfYJ5M


mat2 r2d(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, s, -s, c);
}

float smin(float a, float b, float k) {
	float h = clamp(.5 + .5*(b - a) / k, 0., 1.);
	return mix(b, a, h) - k * h * (1. - h);
}

#define nsin(x) (.5+.5*sin(x))

float de(vec3 p) {
	p.xz *= r2d(iTime*.3);
	// p.zy*=r2d(3.14*.25);

	const float num_tentacles = 5.;
	float sz_tentacles = .15;
	float sz_blob = .5;

	float ease_tentacle = 1.;//nsin(iTime)*1.5;
	float ease_blob = 1.;//.2*nsin(iTime);

	float dis_speed = iTime * 1.5;//sin(iTime*1.5)*2.;

	float sph = length(p) - sz_blob - ease_blob;
	float od = dot(p, normalize(sign(p))) - sz_blob - ease_blob;

	// Trying to be as organic as possible, so avoid axial & radial symetry abs(), amod() etc.
	vec3 q = p;

	// upper tentacles
	p.y += sin(dis_speed + p.x*1.*ease_tentacle);
	p.xy *= r2d(3.14*.25);
	float d = 1e6;
	for (float i = 0.; i < num_tentacles; i++) {
		p.xz *= r2d(3.14 / num_tentacles);
		d = smin(d, length(p.yz) - sz_tentacles, .2);
	}

	// down tentacles
	p = q;
	p.xy *= r2d(-3.14*.25);
	p.y += sin(dis_speed + p.x*1.*ease_tentacle);
	for (float i = 0.; i < num_tentacles; i++) {
		p.xz *= r2d(3.14 / num_tentacles);
		d = smin(d, length(p.yz) - sz_tentacles, .2);
	}

	// mid tentacles
	p = q;
	p.y += sin(dis_speed + p.x*1.*ease_tentacle);
	for (float i = 0.; i < num_tentacles; i++) {
		p.xz *= r2d(3.14 / num_tentacles);
		d = smin(d, length(p.yz) - sz_tentacles, .2);
	}

	// additionnal tentacles
	p = q;
	p.x += sin(sin(iTime*1.5) + p.y*1.*ease_tentacle);
	d = smin(d, length(p.xz) - sz_tentacles, .95);

	return smin(d, sph, .7);
}

vec3 normal(in vec3 pos)
{
	vec2 e = vec2(1., -1.)*.5773*.0005;
	return normalize(e.xyy*de(pos + e.xyy) +
		e.yyx*de(pos + e.yyx) +
		e.yxy*de(pos + e.yxy) +
		e.xxx*de(pos + e.xxx));
}

// https://www.shadertoy.com/view/Xsl3Dl
vec3 hash(vec3 p) // replace this by something better
{
	p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
		dot(p, vec3(269.5, 183.3, 246.1)),
		dot(p, vec3(113.5, 271.9, 124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise(in vec3 p)
{
	vec3 i = floor(p);
	vec3 f = fract(p);

	vec3 u = f * f*(3.0 - 2.0*f);

	return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
		dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
		mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
			dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
		mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
			dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
			mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
				dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

float fbm(vec3 p) {
	mat3 m = mat3(0.00, 0.80, 0.60,
		-0.80, 0.36, -0.48,
		-0.60, -0.48, 0.64);

	float f = 0.0;

	vec3 q = 8.0*p;
	f = 0.5000*noise(q); q = m * q*2.01;
	f += 0.2500*noise(q); q = m * q*2.02;
	//f += 0.1250*noise( q ); q = m*q*2.03;
	f += 0.0625*noise(q); q = m * q*2.01;
	return f;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 uv = fragCoord / iResolution.xy - .5;
	uv.x *= iResolution.x / iResolution.y;

	vec3 ro = vec3(0, 0, -5.);//-nsin(iTime)*8.
	vec3 rd = normalize(vec3(uv, 1));

	vec3 p;
	float t = 0.;
	float maxt = 30.;
	for (float i = 0.; i < 1.; i += .01) {
		p = ro + rd * t;
		float d = de(p);
		if (d < .001 || t > maxt) break;
		t += d * .7;
	}

	vec3 bg_rd = rd;
	bg_rd.xz *= r2d(iTime*.005);
	bg_rd.zy *= r2d(-iTime * .2);

	vec3 bg = smoothstep(0., 1., vec3(1.5) * fbm(bg_rd*.5 + iTime * .06 + fbm(bg_rd)*.2));
	vec3 col = sqrt(bg);
	if (t <= maxt) {
		vec3 n = normal(p);
		// diff 1
		float dotNL = dot(n, normalize(vec3(-1)));
		col = .8 * vec3(.08, .45, 1.) * max(0., dotNL);

		// diff 2
		dotNL = dot(n, -rd);
		col += .1 * vec3(.08, .45, 1.) * max(0., dotNL);

		// spec 1
		vec3 h = normalize(vec3(-1) - rd);
		float dotHN = dot(h, n);
		col += .2 * pow(clamp(0., 1., dotHN), 64.);

		// reflection
		col += .25 *  texture(iChannel0, reflect(rd, n)).rgb;
	}
	col = pow(col, vec3(.8));
	col *= .8;

	fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
