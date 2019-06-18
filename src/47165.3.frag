#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// Modified version of https://www.shadertoy.com/view/MstXWn

// cd publi http://evasion.imag.fr/~Fabrice.Neyret/flownoise/index.gb.html
//          http://mrl.nyu.edu/~perlin/flownoise-talk/

// The raw principle is trivial: rotate the gradients in Perlin noise.
// Complication: checkboard-signed direction, hierarchical rotation speed (many possibilities).
// Not implemented here: pseudo-advection of one scale by the other.

// --- Perlin noise by inigo quilez - iq/2013   https://www.shadertoy.com/view/XdXGW8
vec2 hash(vec2 p)
{
	p = vec2(dot(p,vec2(127.1, 311.7)),
	         dot(p,vec2(269.5, 183.3)));

	return 2.0 * fract(sin(p) * 43758.5453123) - 1.0;
}

float noise(vec2 p, float t)
{
   	vec2 i = floor(p);
   	vec2 f = fract(p);
	
//	vec2 u = f;
//	vec2 u = f * f * (3.0 - 2.0 * f);
	vec2 u = f * f * f * (10.0 + f * (6.0 * f - 15.0));
//	vec2 u = f * f * f * f * (f * (f * (-20.0 * f + 70.0) - 84.0) + 35.0);

   	mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));

	return 2.0 * mix(mix(dot(hash(i + vec2(0,0)) * R, (f - vec2(0,0))), 
                             dot(hash(i + vec2(1,0)) * R, (f - vec2(1,0))), u.x),
                         mix(dot(hash(i + vec2(0,1)) * R, (f - vec2(0,1))), 
                             dot(hash(i + vec2(1,1)) * R, (f - vec2(1,1))), u.x), u.y);
}

float Mnoise(vec2 p, float t) {
	return noise(p, t);
}

float turb(vec2 p, float t) {
	float f = 0.0;
 	mat2 m = mat2(1.6,  1.2, -1.2,  1.6);
 	f  = 0.5000 * Mnoise(p, t); p = m*p;
	f += 0.2500 * Mnoise(p, t * -2.1); p = m*p;
	f += 0.1250 * Mnoise(p, t * 4.1); p = m*p;
	f += 0.0625 * Mnoise(p, t * -8.1); p = m*p;
	return f / .9375; 
}

void main( void ) {
   	vec2 pos = (2.0 * gl_FragCoord.xy - resolution.xy) / min(resolution.x, resolution.y);
	
  	float f  = turb(1.0 * pos, time);
	float f2 = turb(1.0 * pos + vec2(0.0, 0.01), time);
	float f3 = turb(1.0 * pos + vec2(0.01, 0.0), time);
	float dfdy = (f2 - f) / 0.01;
	float dfdx = (f3 - f) / 0.01;
	//gl_FragColor = vec4(0.5 + 0.5 * f);
	gl_FragColor = vec4(0.2 + 0.7 * dot(normalize(vec3(dfdx, dfdy, 1.0)), normalize(vec3(0.0,1.0,1.0))));
	//gl_FragColor = mix(vec4(0,0,.3,1), vec4(1.3), vec4(.5 + .5* f)); 
}
