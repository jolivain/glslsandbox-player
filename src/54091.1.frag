#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main()
{
	vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
	vec2 f = vec2(0.0);
	vec3 c = vec3(1.0);
	float light = 0.0;
	
	for (float x = 0.0; x < 12.0; x += 1.0)
	{
		f = vec2(sin(sin(time + uv.x * x) - uv.y * dot(vec2(x + uv.y), vec2(sin(x), cos(x)))));
		light += (0.04 / distance(uv, f)) - (0.01 * distance(vec2((sin(time + uv.y))), vec2(uv)));
		c.y = sin(time + x) * 0.2 + 0.8;
	}
	
	c *= light;
	
	gl_FragColor = vec4(c, 1.0);
}
