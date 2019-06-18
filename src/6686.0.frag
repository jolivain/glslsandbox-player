// anime head study. by @c5h12
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float PI = 3.14159265358979;
const float STEP = 0.05;
const float THRE = 0.4;

struct Surf {
	vec3 col;
	vec2 spec;
};

// utils
vec3 rot(vec3 p, vec3 e) {
	vec3 s = sin(e);
	vec3 c = cos(e);
	return mat3(
		1.0, 0.0, 0.0,
		0.0, c.x, -s.x,
		0.0, s.x, c.x
	) * mat3(
		c.y, 0.0, s.y,
		0.0, 1.0, 0.0,
		-s.y, 0.0, c.y
	) * mat3(
		c.z, -s.z, 0.0,
		s.z, c.z, 0.0,
		0.0, 0.0, 1.0
	) * p;
}

float intersectSphere(vec3 p, vec3 dir, vec4 cr) {
	float ret = 0.0;
	vec3 v = p - cr.xyz;
	float B = dot(v, dir);
	float C = dot(v, v) - cr.w * cr.w;
	float D = B * B - C;
	if (D > 0.0) {
		ret = -B - sqrt(D);
	}
	return max(0.0, ret);
}

float hash(float x) {
	return fract(sin(x)*43758.5453);
}

float loopnoise1(float x, float freq, float seed) {
	float x0 = mod(x * freq, freq);
	float t = smoothstep(0.0, 1.0, fract(x0));
	x0 = floor(x0);
	float x1 = mod(x0 + 1.0, freq);
	return mix(hash(x0 + seed), hash(x1 + seed), t);
}

float loopnoise2(vec2 p, float freq) {
	float y0 = mod(p.y * freq, freq);
	float t = smoothstep(0.0, 1.0, fract(y0));
	y0 = floor(y0);
	float y1 = mod(y0 + 1.0, freq);
	return mix(loopnoise1(p.x, freq, hash(y0)), loopnoise1(p.x, freq, hash(y1)), t);
}

// metaball
float falloff(float x, float s) { //falloff x: value, s:stiffness
	float d = 1.0 - x * x;
	return (d > 0.0)? (s * d * d * d) : 0.0;
}

float lengthn(vec3 v, float n) {
	return pow(dot(pow(abs(v), vec3(n)), vec3(1.0)), 1.0 / n);
}

float lengthn(vec2 v, float n) {
	return pow(dot(pow(abs(v), vec2(n)), vec2(1.0)), 1.0 / n);
}

float ellipse(vec3 p, vec3 r) {
	return length(p / r);
}

float rellipse(vec3 p, vec3 r, float n) {
	return lengthn(p / r, n);
}

float capsule(vec3 p, vec2 rl) { // aligned to x
	p.x = max(0.0, abs(p.x) - rl.y);
	return length(p / rl.x);
}

/////
float facedisplace(vec3 p, out vec4 mask) {
	// mask=(x:eye, y:mouth distance, z:mouth side fade, w:)
	float dd, d = 0.0;
	float k;
	vec3 tp;
	p = vec3(abs(p.x), p.y, 0.0); // x mirror
	mask = vec4(0.0); //mask:eye
	
	// eye hole
	float d1, d2;
	tp = rot(p - vec3(0.412, -0.286, 0.0), vec3(.0, .0, 0.274));
	d1 = ellipse(tp, vec3(0.232, 0.182, 1.0)) - 1.0; //top line
	d2 = ellipse(rot(p - vec3(0.406, -0.220, 0.0), vec3(.0, .0, 0.552)), vec3(0.233, 0.207, 1.0)) - 1.0; //bottom line
	dd = max(d1, d2);
	dd = max(-1.0, -1.0 / pow(dd + 1.0, 28.0));
	d += dd * 1.0;
	mask.x = -dd;
	
	// lid
	dd = -1.0 / pow(1.0 + abs(d1 - 0.2), 16.0);
	dd *= smoothstep(0.16, 1.0, dot(vec3(0.0, 1.0, 0.0), normalize(tp)));
	d += dd * 0.2;
	
	// nose
	dd = rellipse(p - vec3(0.0, -0.54 - abs(p.x * p.x) * 1.6, 0.0), vec3(0.15, 0.18, 1.0), 1.8);
	d += exp(-dd * dd * 3.0);
	
	// mouth
	tp = p - vec3(0.0, -0.78 + (p.x * p.x) * 1.0, 0.0);
	dd = capsule(tp, vec2(0.2, 0.118));
	mask.y = dd; //mask:mouth distance
	k = 4.0 * dd;
	dd = k * exp(1.0 - k);
	k = exp(-p.x * p.x * 80.0); // side fade
	dd *= k;
	mask.z = k; //mask:mouth side fade
	dd *= 0.8 + smoothstep(-0.03, 0.03, tp.y) * 0.2; // top and bottom
	d += dd * 0.6;
	
	return d;
}

vec3 eyecolor(vec2 p) {
	vec3 col;
	float theta = atan(p.x, p.y);
	float b, r = length(p);
	
	// background
	float bg = max(0.0, sqrt(1.0 - r * r));
	col = mix(vec3(0.1, 0.0, 0.0), vec3(1.0, 0.95, 0.9), bg);
	
	// iris
	vec3 pcol;
	float pr = r * 2.0;
	// outline
	pcol = mix(vec3(0.5, 0.0, 0.0), vec3(0.1, 0.0, 0.0), smoothstep(0.7, 0.95, pr));
	// center
	pcol = mix(vec3(0.0), pcol, smoothstep(0.2, 0.6, pr));
	// radial lines
	vec2 pnxy = vec2(theta / PI, r * 0.1);
	float pnf = 56.0;
	float pn = loopnoise2((pnxy + 0.0), pnf) * 0.5;
	pn += loopnoise2((pnxy + 0.7), pnf * 2.0) * 0.25;
	pn += loopnoise2((pnxy + 0.4), pnf * 4.0) * 0.125;
	pn += loopnoise2((pnxy + 0.3), pnf * 8.0) * 0.0625;
	pcol *= mix(0.5, 1.0, pn);
	
	col = mix(pcol, col, smoothstep(0.97, 1.0, pr));
	
	// fake specular
	b = length(p - vec2(0.24, 0.24)) / 0.2;
	b = min(b, length(p - vec2(-0.27, -0.27)) / 0.06);
	col = mix(col, vec3(1.0, 0.95, 0.9), smoothstep(1.0, 0.4, b));
	
	return col;
}

Surf facecolor(vec3 p) {
	const vec3 basecol = vec3(0.9, 0.82, 0.76);
	const vec2 basespec = vec2(14.0, 0.2);
	vec3 tp, col = basecol;
	vec2 spec = basespec;
	
	float b, d;
	vec3 mp = vec3(abs(p.x), p.y, 0.0); // x mirror
	
	// around eyes
	d = ellipse(mp - vec3(0.412, -0.274, 0.0), vec3(0.33, 0.27, 1.0));
	col = mix(col, vec3(0.5, 0.2, 0.15), exp(-d*d*1.4) * 0.7);
	
	// cheek
	d = ellipse(mp - vec3(0.373, -0.617, 0.0), vec3(0.3));
	col = mix(col, vec3(1.0, 0.7, 0.6), exp(-d*d*1.5) * 0.45);
	
	// eye braw
	tp = rot(mp - vec3(0.453, -0.498, 0.0), vec3(0.0, 0.0, 0.1));
	d = ellipse(tp, vec3(0.787, 0.661, 1.0)) - 1.0;
	d = -1.0 / pow(1.0 + abs(d), 12.0);
	d *= smoothstep(0.8, 1.0, dot(vec3(0.052, 0.999, 0.0), normalize(tp))); //side
	col = mix(col, vec3(0.71, 0.51, 0.35), smoothstep(0.6, 0.9, abs(d))); // sharpe
	
	// from displace
	vec4 mask;
	d = facedisplace(p, mask);
	
	// nose highlight
	b = smoothstep(0.5, 1.8, d);
	col = mix(col, vec3(1.0, 0.96, 0.9), b * 0.8);
	
	// eye line
	col = mix(col, vec3(1.0, 0.3, 0.0), smoothstep(0.0, 0.35, mask.x));
	
	// eye
	const vec2 ec = vec2(0.396, -0.254);
	vec2 ep = p.xy - ec;
	if(p.x < 0.0) {
		ep.x += ec.x * 2.0;
	}
	vec3 ecol = eyecolor(ep / 0.37);
	float em = smoothstep(0.8, 1.0, mask.x);
	col = mix(col, ecol, em);
	spec = mix(spec, vec2(160.0, 2.0), em);
	
	// lips
	b = clamp((1.0 - mask.y * 4.0) * mask.z, 0.0, 1.0);
	b = smoothstep(0.0, 0.5, b);
	col = mix(col, vec3(1.0, 0.75, 0.68), b * 0.8);
	spec = mix(spec, vec2(32.0, 1.0), b);
	
	// displace fake ao
	// lips
	vec3 ao = vec3(1.0);
	ao -= smoothstep(0.8, 1.5, b) * 0.1;
	// from displace
	ao -= smoothstep(0.0, 1.0, -d) * 2.0;
	// eye mask
	ao = mix(ao, vec3(1.0), em);
	ao = smoothstep(vec3(0.0, 0.2, 0.4), vec3(1.0, 1.0, 1.0), ao);
	
	col *= clamp(ao, 0.2, 1.0);
	
	b = clamp(1.0 - pow(abs(-p.z - 1.0), 3.0), 0.0, 1.0);
	Surf ret;
	ret.col = mix(basecol, col, b);
	ret.spec = mix(basespec, spec, b);
	return ret;
}

float face(vec3 p) {
	float d = 0.0;
	
	// face
	d += falloff(ellipse(rot(p - vec3(0.0000, 0.0535, 0.1563), vec3(-0.4160, -0.0000, 0.0000)), vec3(1.4428, 1.5308, 1.3247)), 2.000);
	d += falloff(rellipse(rot(p - vec3(-0.0000, -0.0836, -0.6564), vec3(0.1218, -0.1210, 0.7780)), vec3(0.8771, 0.8771, 0.6218), 2.5), 2.000);
	d += falloff(ellipse(p - vec3(0.0000, 0.0603, -0.3075), vec3(0.9503, 0.8468, 0.7960)), 2.000);
	d -= falloff(ellipse(p - vec3(-0.0000, 0.3303, -1.2447), vec3(1.3481, 1.2013, 1.1293)), 2.000);
	d -= falloff(ellipse(p - vec3(0.0000, -2.3202, -0.2378), vec3(2.6248)), 0.966);
	d += falloff(ellipse(p - vec3(0.0000, 0.2563, 0.3126), vec3(0.9870, 1.1145, 1.1145)), 2.000);
	
	for(int i = 0; i < 2; i++) {
		d -= falloff(ellipse(p - vec3(0.6986, -0.8106, -0.4153), vec3(0.9233, 0.4934, 0.5480)), 0.668);
		d += falloff(ellipse(rot(p - vec3(0.3239, -0.3113, -0.2104), vec3(0.0000, -0.0000, 0.2713)), vec3(0.4087, 0.2980, 0.4087)), 1.442);
		d += falloff(ellipse(rot(p - vec3(0.7603, 0.3716, -0.3633), vec3(-0.3844, 0.6267, -0.2955)), vec3(0.1257, 0.3093, 0.3533)), 1.667);
		d += falloff(ellipse(rot(p - vec3(0.6404, 0.2543, -0.4745), vec3(-0.9111, 0.6267, -0.2955)), vec3(0.1030, 0.1742, 0.2053)), 1.630);
		d -= falloff(ellipse(rot(p - vec3(0.8008, 0.2680, -0.4440), vec3(-0.9111, 0.6267, -0.2955)), vec3(0.0936, 0.1670, 0.1968)), 1.852);
		p.x *= -1.0;
	}

	// displace
	vec4 v;
	d += facedisplace(p.xzy, v) * 0.25 * max(0.0, -normalize(p).y);
	
	// eyeball
	vec3 mp = vec3(abs(p.x), p.y, p.z);
	float d2 = falloff(ellipse(mp - vec3(0.2551, -0.1828, -0.1680), vec3(0.6749, 0.6749, 0.6749)), 2.000);
	d = max(d, d2);
	
	return d;
}

float scene(vec3 p) {
	float d = THRE - face(p);
	return d;
}

vec3 normal(vec3 p) {
	const vec3 E = vec3(0.002, 0.0, 0.0);
	return normalize(vec3(
		scene(p + E.xyz) - scene(p - E.xyz),
		scene(p + E.zxy) - scene(p - E.zxy),
		scene(p + E.yzx) - scene(p - E.yzx)
	));
}

/////
void main() {
	vec2 scrn = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
	// zup!
	vec3 dir = vec3(scrn.x, 4.0, scrn.y);
	dir = normalize(dir);
	vec3 p = vec3(0.0, -5.5, 0.0);
	
	vec3 camangle = (vec3(0.5 - mouse.y, 0.0, mouse.x * 2.0 - 1.0)) * 3.1415926535;
	p = rot(p, camangle);
	dir = rot(dir, camangle);
	
	// bg
	vec3 color = mix(vec3(0.0), vec3(0.5, 0.45, 0.4), pow(1.0 - length(scrn) * 0.2, 2.0));
	
	// initial position
	float t = intersectSphere(p, dir, vec4(0.0, 0.091, 0.016, 1.18));
	
	if(t > 0.0) {
		// ray march
		p += dir * t;
		float d;
		for(int i = 0; i < 32; i++) {
			d = scene(p);
			if(d <= 0.0) {
				float stepbias = 0.5;
				for(int j = 0; j < 8; j++) {
					vec3 np = p + dir * stepbias * STEP * ((d < 0.0)? -1.0 : 1.0);
					float nd = scene(np);
					if(abs(d) > abs(nd)) {
						if(abs(d) < 0.001) break;
						d = nd;
						p = np;
					}
					stepbias *= 0.5;
				}
				vec3 n = normal(p);
				Surf srf = facecolor(p.xzy);
				
				vec3 litv = rot(vec3(-0.364, -0.727, 0.582), camangle);
				
				float lmbt = dot(n, litv);
				float hlmbt = lmbt * 0.5 + 0.5;
				vec3 sss = vec3(hlmbt - max(0.0, lmbt)) * vec3(1.0, 0.87, 0.81);
				sss = pow(sss, vec3(2.0)) * 1.0;
				vec3 dfs = (max(0.0, lmbt) + sss);
				
				vec3 hlfv = normalize(litv - dir);
				float spc = (lmbt < 0.0)? 0.0 : pow(dot(n, hlfv), srf.spec.x) * srf.spec.y;
				//color = vec3(spc);
				color = srf.col * dfs * 1.0 + 0.1 + spc;
				break;
			}
			p += dir * STEP;
		}
	}
	
	gl_FragColor = vec4(color, 1.0);
}

