/*
 * Original shader from: https://www.shadertoy.com/view/lsycDG
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// @lsdlive

// Doodling session for live-coding or sketching new ideas.
// Thanks to iq, mercury, lj, shane, shau, aiekick, balkhan
// & all shadertoyers.
// Greets to all the shader showdown paris gang.


mat2 r2d(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, s, -s, c);
}

void amod(inout vec2 p, float m) {
	float a = mod(atan(p.x, p.y) - m*.5, m) - m*.5;
	p = vec2(cos(a), sin(a)) * length(p);
}

float rep(float p, float m) {
	return mod(p - m*.5, m) - m*.5;
}

vec3 rep(vec3 p, float m) {
	return mod(p - m*.5, m) - m*.5;
}

float cmin(float a, float b, float k) {
	return min(min(a, b), (a - k + b) * sqrt(.5));
}

float stmin(float a, float b, float k, float n) {
	float s = k / n;
	float u = b - k;
	return min(min(a, b), .5 * (u + a + abs((mod(u - a + s, 2. * s)) - s)));
}

float length8(vec2 p) {
	vec2 q = p*p*p*p*p*p*p*p;
	return pow(q.x + q.y, 1. / 8.);
}

float torus82(vec3 p, vec2 d) {
	vec2 q = vec2(length(p.xz) - d.x, p.y);
	return length8(q) - d.y;
}

float path(float t) {
	return cos(t*.1)*2.;
}

float g = 0.;
float de(vec3 p) {

	p.x -= path(p.z);
    
    vec3 q = p;
    q.x += sin(q.z*.2)*4.;
    q.y += cos(q.z*.3)*4.;
    q += iTime*2.;
    q.yz += sin(iTime*.2)*4.;
    q = rep(q, 1.);
    float s1 = length(q) - .01 + sin(iTime*30.)*.004;

	p.z = rep(p.z, 3.);

	float d = torus82(p.xzy, vec2(1., .1));
	float pl = p.y + 2.4 + p.y*texture(iChannel1, p.xz*.1).r*1.;
    float pl2 = p.y + .7;
	d = min(d, pl-d*.9);
    d = cmin(d, pl2, .1);

	amod(p.xy, 6.28 / 3.);
	p.x = abs(p.x) - 1.;
	float cyl = length(p.xy) - .05;
	d = stmin(d, cyl, .1, 4.);
   
    d = min(d, s1);

	g += .015 / (.01 + d*d);
	return d;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 uv = (fragCoord - .5*iResolution.xy) / iResolution.y;

	float dt = iTime * 8.3;

	vec3 ro = vec3(0, 0, -3. + dt);
	vec3 ta = vec3(0, 0, dt);
	ro.x += path(ro.z);
	ta.x += path(ta.z);

	vec3 fwd = normalize(ta - ro);
	vec3 left = cross(vec3(0, 1, 0), fwd);
	vec3 up = cross(fwd, left);
	vec3 rd = normalize(fwd + uv.x*left + uv.y*up);

	rd.xy *= r2d(sin(-ro.x / 3.14)*.4);

	vec3 p;
	float t = 0., ri;
	for (float i = 0.; i < 1.; i += .01) {
		ri = i;
		p = ro + rd*t;
		float d = de(p);
		if (d < .001) break;
		t += d*.3;
	}

	vec3 bg = vec3(.2, .1, .2);
	vec3 col = bg;
	col = mix(vec3(.4, .52, .6)*1.5, bg,  uv.x*uv.y*uv.y+ri);
    col += g*.01;
    col.b += sin(p.z*.1)*.1;
	col = mix(col, bg, 1. - exp(-.01*t*t));
    
	fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
