// line - line intersection and basic raycast

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 mouse;
uniform vec2 resolution;

float line(vec2 p, vec2 a, vec2 b) {
	vec2 ap = a - p;
	vec2 ab = a - b;
	return length(ap - ab * clamp(dot(ap, ab) / dot(ab, ab), 0., 1.));
}

vec2 intersect(vec2 a, vec2 b, vec2 c, vec2 d, out float _t) {
	vec2 r = b - a;
	vec2 s = d - c;
	float det = r.x * s.y - r.y * s.x;
	
	float u =  ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / det;
	float t =  ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / det;
	
	if ((t >= 0. && t <= 1.) && (u >= 0. && u <= 1.)) {
		vec2 p = a + r * t;
		_t = distance(a, p);
		return p;
	} else {
		_t = 1e5;
		vec2(0);
	}
}

void main() {
	vec2 uv = (2. * gl_FragCoord.xy - resolution) / resolution.y;
	vec2 st = gl_FragCoord.xy / resolution;
	vec3 col = vec3(0.);
	
	// boundary
	vec2 ba = vec2(.6, .3);
	vec2 bb = vec2(.5, -.7);
	
	vec2 ro = vec2(mouse * 2. - 1.);
	ro.x = ro.x * resolution.x / resolution.y;
	float d;

// toggle lines vs each pixel
#define LINES 1
#if LINES
	
	const float N = 100.;
	for (float k = 0.; k <= N; k++) {
		
		
		float a = mix(-3.14, 3.14, 1. / N * k);
		vec2 rd = vec2(cos(a), sin(a));
		float t = 1e5;
		
		vec2 i = intersect(ro, rd + rd * t, ba, bb, t);
		

		float d = line(uv, ro, ro + rd * t);	
		col += smoothstep(.005, .0, d) * 0.5;

		
				
	}
	
	d = line(uv, ba, bb);	
	col += smoothstep(.01, .0, d) * vec3(1, 0, 0);

#else
	ro = vec2(0);
	vec2 rd = normalize(uv);
	float t = 1e5;
	
	vec2 i = intersect(ro, rd + rd * t, ba, bb, t);
	if (t < 1e5) {
		d = line(uv, ro, ro + rd * t);	
		col += smoothstep(.01, .0, d);
	}
		
	d = line(uv, ba, bb);	
	col *= smoothstep(.0, .01, d);
	col += smoothstep(.01, .0, d) * vec3(1, 0, 0);

#endif

	gl_FragColor = vec4(col, 1.);
}
