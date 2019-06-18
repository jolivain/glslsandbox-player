#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec2 hash(vec2 x) {
	vec2 n = vec2(dot(x, vec2(171, 311)), dot(x, vec2(269, 382)));
	return fract(sin(n)*43758.435832);
}

vec3 voronoi(vec2 x, bool a) {
	vec2 p = floor(x);
	vec2 f = fract(x);
	
	vec2 mg, mr;
	float md = 8.0;
	
	for(int i = -1; i <= 1; i++) {
		for(int j = -1; j <= 1; j++) {
			vec2 g = vec2(float(i), float(j));
			vec2 o = hash(p + g);
			if(a) o = 0.5 + 0.5*sin(time + o*6.28);
			vec2 r = g + o - f;
			float d = dot(r, r);
			
			if(d < md) {
				md = d;
				mg = g;
				mr = r;
			}
		}
	}
	
	md = 8.0;
	for(int i = -2; i <= 2; i++) {
		for(int j = -2; j <= 2; j++) {
			vec2 g = mg + vec2(float(i), float(j));
			vec2 o = hash(p + g);
			if(a) o = 0.5 + 0.5*sin(time + o*6.28);
			vec2 r = g + o - f;
			
			if(dot(mr-r, mr-r) > 0.000001)
				md = min(md, dot(0.5*(mr+r), normalize(r-mr)));
		}
	}
	
	return vec3(md, mr);
}

float map(vec3 p) {
	vec3 c = voronoi(1.5*p.xy, true);
	float r = 0.05*(smoothstep(0.04, 0.07, c.x)
	 + smoothstep(0.2, 0.25, length(c.yz)));
	return length(p) - 1.0 + r;
}

vec3 normal(vec3 p) {
	vec2 h = vec2(0.001, 0.0);
	vec3 n = vec3(
		map(p + h.xyy) - map(p - h.xyy),
		map(p + h.yxy) - map(p - h.yxy),
		map(p + h.yyx) - map(p - h.yyx)
	);
	
	return normalize(n);
}

float intersect(vec3 ro, vec3 rd) {
	float td = 0.0;
	for(int i = 0; i < 30; i++) {
		float h = map( ro + rd*td);
		if(h < 0.001 || td >= 20.0) break;
		td += h;
	}
	
	return td;
}

mat3 camera(vec3 e, vec3 l) {
	vec3 f = normalize(l - e);
	vec3 r = cross(vec3(0, 1, 0), f);
	vec3 u = cross(f, r);
	
	return mat3(r, u, f);
}

vec3 material(vec3 p) {
	vec3 c = voronoi(1.5*p.xy, true);
	vec3 col = vec3(1, 0.2, 0.8);
	col = mix(vec3(0.2, 0.8, 1), col, smoothstep(0.04, 0.07, c.x));
	col = mix(vec3(1, .5, .9), col, smoothstep(0.2, 0.25, length(c.yz)));

	return col;
}

void main( void ) {

	vec2 uv = -1.0 + 2.0*( gl_FragCoord.xy / resolution.xy );
	uv.x *= resolution.x/resolution.y;
	
	vec3 ro = 3.0*vec3(0, 0, -1);
	vec3 rd = camera(ro, vec3(0))*normalize(vec3(uv, 2.0));
	
	vec3 col = vec3(1)*voronoi(20.0*uv, true).x;
	
	float i = intersect(ro, rd);
	if(i < 20.0) {
		vec3 lig = normalize(vec3(-1, 1, 0));
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		
		float amb = 0.5 + 0.5*(nor.y + nor.x);
		float dif = clamp(dot(lig, nor), 0.0, 1.0);
		
		col = amb*vec3(1);
		col += dif*vec3(1);
		
		col *= material(pos);
	}

	gl_FragColor = vec4(col, 1);

}
