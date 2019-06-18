//something like Mr.doob's zoom blur
//but no so cool

//by nikoclass

//update: now with some stars

//update2: day and night sky


#ifdef GL_ES
precision mediump float;
#endif


const int iterations = 50;

const vec3 day = vec3(0.3, 0.4, 0.8);
const vec3 night = vec3(0.05);
	
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec2 m = vec2(0.);
float aspect = 0.;


vec3 getColor(vec2 pos) {
	if (distance(pos, m) < 0.11) {
		return vec3(0.0);
	}
	if (length(pos) < 0.1) {
		return vec3(1.0, 1.0, 0.8);	
	}
	
	float lm = length(m);
	if (lm < 0.2) {
		return mix(night, day, lm / 0.2);	
	}
	return day;
	
}

float rand(float x) {
	float res = 0.0;
	
	for (int i = 0; i < 5; i++) {
		res += 0.244 * float(i) * sin(x * 0.68171 * float(i));
		
	}
	return res;
	
}

void main( void ) {
	m = mouse - 0.5;
	aspect = resolution.x / resolution.y;
	vec2 position = ( gl_FragCoord.xy / resolution.xy ) - 0.5;
	position.x *= aspect;
	m.x *= aspect;
	
	
	vec3 color = getColor(position);		
		
	vec3 light = vec3(0.0);
	vec2 incr = position / float(iterations);
	vec2 p = vec2(0.0, 0.0) + incr;
	for (int i = 1; i < iterations; i++) {
		light += getColor(p);
		p += incr;
	}
	
	light /= float(iterations) * max(.01, dot(position, position)) * 50.0;
	
	vec2 star = vec2(gl_FragCoord);
	if (rand(star.y * star.x) >= 2.1 && rand(star.y + star.x) >= .7) {
		float lm = length(m);
		if (lm < 0.15) {
			color = mix(vec3(1.0), day, lm / 0.15);
		}
	}
	
	if (distance(position, m) < 0.11) {
		color = vec3(0.0);
	}
		
	gl_FragColor = vec4(color + light, 1.0);

}
