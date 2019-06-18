// Optical Circuit by 0x4015 http://www.pouet.net/prod.php?which=65125
// glslsandboxified by @301z

precision mediump float;

#define scene 4

#if scene==0
	#define shader 0
	#define timeOffset 0.122667
#elif scene==1
	#define shader 1
	#define timeOffset 115.984024
#elif scene==2
	#define shader 2
	#define timeOffset 229.984039
#elif scene==3
	#define shader 5
	#define timeOffset 627.984131
#elif scene==4
	#define shader 3
	#define timeOffset 350.986725
#elif scene==5
	#define shader 4
	#define timeOffset 23.984083
#else
	#define shader 0
	#define timeOffset 31.983999
#endif
#if shader==0
	#define zz(a) (a==1||a==7||a==11||a==31||a==45)
#elif shader==1
	#define zz(a) (a==2||a==7||a==11||a==31)
#elif shader==2
	#define zz(a) (a==4||a==7||a==12||a==31||a==45)
#elif shader==3
	#define zz(a) (a==8||a==11||a==12||a==31||a==45)
#elif shader==4
	#define zz(a) (a==16||a==31)
#else
	#define zz(a) (a==32||a==45)
#endif
#define z(a) (zz(a)?1:0)

uniform float time;
uniform vec2 resolution;

float A = 0., D = 0., E = 0.;
vec3 B = vec3(0.), C = vec3(0.);

vec3 F(vec3 a, float b) {
	float c = sin(b), d = cos(b);
	return mat3(d, -c, 0, c, d, 0, 0, 0, 1) * a;
}

vec3 G(vec3 a, float b) {
	a = fract(a * .2) * 2.0 - 1.0;
	a.z = b;
	float c = 50.0;
	for (int i = 0; i < 6 + z(16) + z(32) * 3; ++i) {
		float d = clamp(dot(a, a), .05, .65);
		c *= d;
		a = abs(a) / d - 1.31;
		a.xy = a.xy * mat2(1, 1, -1, 1) * .70710678118;
	}
	return a * c;
}

vec3 H(vec3 a) {
	float b = float(3 + z(4) * 4);
	a = F(a, (floor(atan(a.y, a.x) * b * .5 / 3.1415926546) * 2.0 + 1.0) * 3.1415926546 / b);
	a.y = abs(a.y);
	return a;
}

vec3 I(vec3 a) {
	a.z -= A * 1.5;
	float b = A * .5 + floor(a.z);
	return F(vec3(a.x, a.y + sin(b), fract(a.z) - .5), 3.1415926546 - cos(b));
}

vec3 Z(float t) {
	return vec3(0, -sin(t * .6), t * 1.6 + .5) + sin(t * .01 * vec3(11, 23, 19)) * vec3(.135, .25, .25);
}

float J(vec3 a) {
	vec3 b = abs(fract(a * 5.0) - .5) * .2;
	return max(max(b.x, b.y), b.z) - .078;
}

float K(vec3 a) {
	vec3 b = abs(fract(a * 2.0) - .5) * .5;
	return max(max(b.x, b.y), b.z);
}

float L(vec3 a) {
	vec3 b = abs(fract(a + vec3(0, .5, 0)) - .5), c = abs(fract(a + .5) - .5);
	return .033 - min(max(b.x - .46, b.y), .08 - max(c.x, c.y));
}

float M(vec3 a) {
	vec3 b = abs(fract(a * 4.0 + .5) - .5) * .25;
	return max(max(max(b.x, b.y), b.z) - .08, max(L(a) - .01, .012 - length(fract(a * 25.0) - .5) * .04));
}

float N(vec3 a) {
	return min(min(min(M(a), M(a.zyx)), M(a.zxy)), min(min(L(a), L(a.zyx)), L(a.zxy)));
}

float O(vec3 a) {
	vec4 b = vec4((fract(a * .2 + .5) - .5) * 4.0, 1.0);
	for (int i = 0; i < 4; ++i) {
		b.xyz = clamp(b.xyz, -1.0, 1.0) * 2.0 - b.xyz;
		b *= clamp(max(.21 / dot(b.xyz, b.xyz), .21), 0.0, 1.0) * -15.7;
	}
	a = b.xyz / b.w * 5.0;
	return max(length(a) - 1.0, N(a)) * .25;
}

float P(vec3 a) {
	vec3 b = abs(a);
	return max(max(max(b.x, b.y), b.z), max(max(length(b.xy), length(b.yz)), length(b.zx)) - .2) - 1.0;
}

float Q(vec3 a) {
	return max(abs(length(a * vec3(1, 1, .3)) - .325) - .025, -a.z);
}

float R(vec3 a) {
	vec3 b = abs(a);
	return max(b.y, dot(vec3(.87, .5, 0), b)) - 1.0;
}

float S(vec3 a) {
	return max(max(abs(length(a - vec3(0.0, 0.0, 5.0)) - 5.0) - .05, R(a)), a.z - 2.0);
}

float T(vec3 a) {
#if zz(1)
	return max(K(a) - .201, O(a))
#elif zz(2)
	vec3 b = a * 20.0;
	b.y += A * 5.0 * (fract(dot(floor(b), vec3(1, 0, 1)) * 3.1415926546) - .5);
	vec3
		c = F((fract(b.zxy) - .5) *.05, A * 8.0 * (fract(dot(floor(b), vec3(3.1415926546))) - .5)),
		e = abs(fract(a + vec3(.5, .5, 0)) - .5);
	a = F(a, A * .025 * (fract((a.z * 2.0 - fract(a.z * 2.0)) * .437) - .5));
	float d = K(a);
	return
		min(
			max(min(max(d - .201, O(a)), .299 - d), length(a) - 20.0),
			max(max(e.x, e.z) - .05, min(max(length(c) - .006, L(c * 10.0) * .1 - .0002), .04)))
#elif zz(4)
	float b = a.z * 2.0 - fract(a.z * 2.0);
	a = H(F(a, A * .8 * (fract(b * .347) - .5)));
	float d = abs(fract(a.z * 2.0) - .5) * .5;
	return
		min(
			max(
				min(
					N(a + mix(vec3(.7, .875, .5), vec3(.9, .925, .3), fract(vec3(.37, .53, 1) * b))),
					N(a / 1.3 + mix(vec3(.7, .7, .5), vec3(.9, .925, .3), fract(vec3(.71, .87, 1) * b))) * 1.3),
				d-.225),
			.275 - d)
#elif zz(8)
	a = H(a);
	float d = length(a);
	return max(max(J(a * .2) * 5.0 - .03, .015 - N((fract(a * 4.0 + .2) - .5) * .25)), max(min(d - 4.0, 5.9 - d), 1.5 - d))
#elif zz(16)
	vec3 b = I(a) * 20.0, c = H(b * 2.0 + vec3(0, 0, 2)) - vec3(1.4, 0, 0), d = b;
	d.y = abs(d.y);
	return
		min(
			min(
				min(
					min(max(R(d * 4.0 - vec3(2, 5, 0)) * .25, abs(d.z) - 1.0), S(d.yzx * vec3(1, .5, .5) * 1.5 + vec3(.3, 0, 0)) / 1.5),
					max(min(.1 - abs(d.x), -d.z), S(vec3(0, 0, 1) - d.xzy * vec3(1, .5, .5)))),
				min(
					min(max(P(c), -P(c * 1.2 + vec3(0, 0, 1.5)) / 1.2), Q(c + vec3(0, 0, 1.5))),
					Q(vec3(abs(c.xy), c.z) - vec3(.5, .5, -1.5))) * .5) * .05,
			.15 - abs(a.x))
#else
	vec3 b = (a - vec3(.1, .21, sin(A * .025) * 3.0)) * 5.0;
	b.y += (fract(floor(b.z) * 3.1415926546) - .5) * 3.1415926546;
	vec3 c = floor(b) + .5;
	vec4 d = vec4(normalize(sin(c * vec3(1, 2, 3))) * sin(A * .5), cos(A * .5));
	float e = d.x, f = d.y, g = d.z, h = d.w;
	b = abs(
			mat3(
				.5 - f * f - g * g, e * f - h * g, e * g + h * f,
				e * f + h * g, .5 - e * e - g * g, f * g - h * e,
				e * g - h * f, f * g + h * e, .5 - e * e - f * f) * 2.0 * (b - c));
	b.xy += fract(c.zz * c.yz * vec2(.11, .31)) * .095;
	return min(max(max(b.x, b.y), b.z) - .1, .3) * .2
#endif
	;
}

float U(vec3 a) {
#if zz(7)
	return abs(fract(a.z + float(z(4)) * .5) - .5)
#elif zz(8)
	a = H(a);
	float d = length(a);
	return abs(max(min(d - 4.0, 5.95 - d), J(a * .4) * 2.5 - .08 + d * .018))
#elif zz(16)
	return .15 - abs(a.x);
#else
	return abs(max(.02 - L(a), O(a)))
#endif
	;
}

vec3 V(float a, vec3 b, float c) {
	a *= c;
	return 1.0 / ((1.0 + 2.0 * b / a + b * b / (a * a)) * c + .0001);
}

vec3 W(vec3 a, float b, float c, float d) {
	vec3 e =
		(V(.01, abs(a), d) * 2.0 + V(.05, vec3(length(a.yz), length(a.zx), length(a.xy)), d) * 5.0) *
			(sin(A * vec3(2.1, 1.3, 1.7) + b * 10.0) + 1.0);
	return(e * 7.0 + e. yzx * 1.5 + e.zxy * 1.5) * max(1.0 - c * 200.0 / d, 0.0) / d * float(100 - z(2) * 30 - z(32) * 80 - z(16) * 88);
}

float X(vec3 a, float t, float b) {
	float c = fract(t + b), e = t - c;
	vec3
		f = Z(e) * vec3(0, 1, 1) + sin(vec3(0, 23, 37) * e),
		g = normalize(sin(vec3(0, 17, 23) * e)) * 8.0,
		h = f + g + vec3(sin(e * 53.0) * .15, 0, 0),
		j = f - g + vec3(sin(e * 73.0) * .15, 0, 0),
		k = mix(h, j, c - .15),
		l = mix(h, j, c + .15);
	t = dot(a - k, l - k) / dot(l - k, l - k);
	return length((t < 0.0 ? k : t > 1.0 ? l : k + t * (l - k)) - a);
}

vec4 Y(vec3 a, float b, float t) {
	vec3
		c = I(a) * 20.0,
		d = vec3(length(c + vec3(-.35, .57, 2)), length(c + vec3(-.35, -.57, 2)), length(c + vec3(.7, 0, 2))),
		e = V(.2, d, b),
		f = vec3(X(a, t, 0.0), X(a, t, .3), X(a, t, .6)), g = V(.001, f, b);
		return vec4(
			(e.x + e.y + e.z) * vec3(30, 75, 150) * (E + 1.0) + (g.x + g.y + g.z) * vec3(1.0, .1, .2) * 5000.0,
			min(min(min(d.y, d.z), d.x) * .05, min(min(f.y, f.z), f.x)));
}

void main() {
	{
		A = time + timeOffset;
		vec2 glVertex = gl_FragCoord.xy / resolution.xy * 2.0 - 1.0;

		vec3
			a = float(z(2)) * normalize(sin(A * .001 * vec3(21, 11, 17))) * 20.1 + float(z(16)) * Z(A) + float(z(45)) *
					(vec3(0, 0, sin(A * .025)) * float(5 + z(4) * 15 + z(8) * 7) + sin(A * .001 * vec3(21, 11, 17)) * (.01 + float(z(11)) * .04)),
			b = normalize(
					float(z(2)) * (sin(A * .001 * vec3(26, 106, 62)) - a * .05) +
					float(z(16)) * (vec3(0, -sin((A + sin(A * .2) * 4.0) * .5 + A * .1), (A + sin(A * .2) * 4.0) * 1.6 + .5) - a) +
					float(z(45)) * (sin(A * .002 * vec3(13, 53, 31)) * 50.0 + vec3(0, 0, sin(A * .05) * 5.0) - a)),
			c = normalize(cross(b, sin(A * .001 * vec3(31, 17, 29))));
		float d = A * float(1 + z(16) * 4);
		for (int i = 0; i < 20; ++i) {
			float t = A - float(i) * .1;
			vec4 y = Y(Z(t), 25.0, t);
			d += float(z(16)) * sin((y.w + t) * 5.0) * y.x * .05 * exp(float(i) * -.25);
		}
		vec3
			e = normalize(vec3(sin(vec2(.53, .47) * d) * 4.0 + sin(vec2(.91, 1.1) * d) * 2.0 + sin(vec2(2.3, 1.7) * d), 200)),
			f = normalize(cross(e, vec3(sin(d), 50, 0)));
		B = a;
		C = mat3(c, cross(c, b), b) * (f * glVertex.x * 1.78 + cross(f, e) * glVertex.y + e * 1.4);

		D = fract(sin((C.x + C.y + C.z) * 99.317 * 3.1415926546) * 85.081 * 3.1415926546);
		E = fract(sin(A * 99.317 * 3.1415926546) * 85.081 * 3.1415926546);
	}

	vec3 a = normalize(C), c = vec3(1), e = B, f = a, g = e, b = g * 0.0, s = vec3(1, -1, -1) * .0005;
	vec4 l = vec4(B, 1), k = l * 0.0, j = k, h = j;
	int m = 1;
	float t = 0.0, o = 1.0, p = 1.0, q = D * .01 + .99, n;
	for (int i = 0; i < 64 + z(1) * 16 + z(16) * 32 - z(32) * 32; ++i) {
		g = e + f * t;
		float d = T(g);
		if (d < (t * 5.0 + 1.0) * .0001) {
			vec3 u = normalize(T(g + s) * s + T(g + s.yyx) * s.yyx + T(g + s.yxy) * s.yxy + T(g + s.xxx) * s.xxx);
			float r = pow(abs(1.0 - abs(dot(u, f))), 5.0) * .9 + .1;
			o += t * p;
			p = p * 5.0 / r;
			e = g + u * .0001;
			f = reflect(f, u);
			t = 0.0;
			float v = dot(u, u);
			if (v < .9 || 1.1 < v || v != v)
				u = vec3(0);
			if (m < 4) {
				h = j;
				j = k;
				k = l;
				l = vec4(g, max(floor(o), 1.0) + clamp(r, .001, .999));
				++m;
			}
		}
		else
			t = min(t + d * q, 100.0);
	}
	if (m < 4) {
		h = j;
		j = k;
		k = l;
		l = vec4(g, o + t * p);
		++m;
	}
	{
		int a = m;
		for (int i = 0; i < 4; ++i)
			if (a < 4) {
				h = j;
				j = k;
				k = l;
				++a;
			}
	}
	e = h.xyz;
	f = normalize(j.xyz - h.xyz);
	n = length(j.xyz - h.xyz);
	t = 0.0;
	q = D * .1 + .8 + float(z(11)) * .1;
	o = 1.0;
	p = 0.0;
	for (int i = 0; i < 64 + z(1) * 16 + z(16) * 32 - z(32) * 32; ++i) {
		if (t > n) {
			if (m < 3)
				break;
			h = j;
			j = k;
			k = l;
			--m;
			e = h.xyz;
			f = normalize(j.xyz - h.xyz);
			n = length(j.xyz - h.xyz);
			t = 0.0;
			if (n < .0001)
				break;
			float r = fract(h.w);
			o = h.w - r;
			p = (floor(j.w) - o) / n;
			c *= mix(vec3(.17, .15, .12), vec3(1), r);
		}
		g = e + f * t;
	#if zz(16)
		vec4 y = Y(g, o + p * t, A);
	#endif
		float u = U(g);
	#if zz(16)
		u = min(u, y.w);
	#endif
		g -=
	#if zz(7)
			vec3(0,0, vec2(sign(fract(g.z) - .5))) // vec3(0,0, sign(fract(g.z) - .5))
	#else
			normalize(U(g + s) * s + U(g + s.yyx) * s.yyx + U(g + s.yxy) * s.yxy + U(g + s.xxx) * s.xxx)
	#endif
			* u;
		float v = sin(A * .05 + g.z) * .5, w = u * q + float(z(32)) * .0005 + float(z(31)) * .001;
		vec3 x = G(
	#if zz(12)
			H(g)
	#else
			g
	#endif
			, v);
		b += (W(x, v, u, o + p * t) + W(x, v, u, o + p * t + 50.0 + float(z(8) * 50))
	#if zz(16)
			+ y.xyz
	#endif
			) * c * w;
		c *= pow(.7, w);
		t += w;
	}
	gl_FragColor = vec4(pow(b, vec3(.45)) - float(z(1)) * max(A * .2 - 8.0, 0.0), 1.0);
}
