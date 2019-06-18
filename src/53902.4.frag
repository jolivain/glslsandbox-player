#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

mat2 rotate(float a)  {
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

float hash(vec2 uv) {
	return fract(45343.35 * sin(dot(uv, vec2(454.45, 767.66))));
}

vec2 hash2(vec2 uv) {
	float k = hash(uv);
	return vec2(k, hash(uv + k));
}

float manhattan(vec2 uv) {
	uv = abs(uv);
	return uv.x + uv.y;
}

float voronoi(vec2 uv) {
	float d = 1000.;
	vec2 id = floor(uv);
	vec2 st = fract(uv) - .5;
	for (int i = -2; i <= 2; i++) {
		for (int j = -2; j <= 2; j++) {
			vec2 o = vec2(i, j);
			d = min(d, manhattan(vec2(st - o + hash2(id + o))));
		}
	}
	return d;
}

float sin01(float a) {
	return sin(a) * 0.5 + 0.5;
}

float layer(vec2 uv) {
	
	float col = 0.;
	
	col += smoothstep(.04, .0, abs(voronoi(uv) - .5));
	if(distance(vec2(cos(time), sin(time)),uv) < 1.1){
		col += smoothstep(.04, .00, abs(voronoi(uv) - .5));
	}
	
	
	return col;
}

void main() {
	
	vec2 uv = (2. * gl_FragCoord.xy - resolution) / resolution.y;
	vec3 col = vec3(0.);
	vec2 st = uv;
	uv *= 10.;
	
	for (float i = 0.; i < 1.; i += 0.1) { 
		
		uv *= rotate(3.14 / 4.);
		float t = fract(time / 10.+ i);
		float s = smoothstep(1., .01, t);
		float f = smoothstep(.01, 1., t) * smoothstep(1., .01, t);
		col += layer(uv * s) * f;
		col +=  f  * 0.1 * sin01(st.x + time);
	
	}
	
	gl_FragColor = vec4(col*(1.+col*vec3(1.-mouse.x, mouse.x, mouse.y)), 1.);

}
