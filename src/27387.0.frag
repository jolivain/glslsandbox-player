#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

// http://www.nrc.gov/reading-rm/doc-collections/cfr/part020/part020-1901.html
// now more compact & without careless trig funcs (learned a bit since) 
// ...of course using angles (not baked in) meant more obvious animation hacks

//comment for fast non-aa
#define ANTIALIAS

const vec3 x = vec3(1.7320508, 0.0, 1.7320508); //sqrt(3)
const vec3 y = vec3(-1.0, 1.0, 1.0);

float rad_sym_aa(vec2 uv)
{
	float c = 1.0;
	float r = length(uv);
	for (int i = 0; i < 3; ++i)
		c = abs(c - smoothstep(0.005, 0.0, dot(uv, vec2(x[i], y[i]))));
	c *= smoothstep(0.495, 0.5, r) - smoothstep(0.145, 0.15, r);
	c += 1.0 - smoothstep(0.1, 0.095, r);
	return c;
}

float rad_sym(vec2 uv)
{
	float c = 1.0;
	float r = length(uv);
	for (int i = 0; i < 3; ++i)
		c = abs(c - step(dot(uv, vec2(x[i], y[i])), 0.0));
	c *= step(0.5, r) - step(0.15, r);
	c += 1.0 - step(r, 0.1);
	return c;
}

void main(void)
{
	vec2 uv = (gl_FragCoord.xy / resolution - vec2(0.5)) * vec2(resolution.x / resolution.y, 1.0) * 1.05;
#ifdef ANTIALIAS
	float col = rad_sym_aa(uv);
#else
	float col = rad_sym(uv);
#endif
	gl_FragColor = vec4(col, col * 0.8, 0.0, 1.0);
}
