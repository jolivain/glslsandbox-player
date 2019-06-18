#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

float hash(vec2 p){
	vec3 a = vec3(p.x, p.y, 1.0);
	vec3 b = vec3(6.66, 8.888, 8.8);
	return fract(sin(dot(a, b))*8.888);
}

float noise(vec2 p){
   	vec2 i = floor(p);
	vec2 f = fract(p);
	f = smoothstep(0.0, 1.0, f);

	float f00 = hash(i + vec2(0.0, 0.0));
	float f10 = hash(i + vec2(1.0, 0.0));
	float f01 = hash(i + vec2(0.0, 1.0));
	float f11 = hash(i + vec2(1.0, 1.0));
	float f0010 = mix(f00, f10, f.x);
	float f0111 = mix(f01, f11, f.x);
	return mix(f0010, f0111, f.y);
}

float octaves(vec2 p){
	return
		noise(p*1.0)*0.5 + 
		noise(p*2.0)*0.25 +
		noise(p*4.0)*0.125;
}

void main() {
	vec2 pos = gl_FragCoord.xy/resolution;
	pos.x *= resolution.x/resolution.y;

	float angle = sin(time*3.0 + 0.8*floor(pos.x*2.0) + 2.8*floor(pos.y*2.0));
	float c = cos(angle);
	float s = sin(angle);
	mat2 m = mat2(c, -s, s, c);
	vec3 color = vec3(0.0);
	float w = 0.08;
	float r = 0.6;
	float d = 9999.0;
	vec2 q = pos;
	q = fract(q*2.0);
	q = q*2.0 - 1.0;
	q = m*q;
	
	d = min(d,  abs(length(q)-0.7)-0.05); // circle
	d = min(d,  max(abs(length(q)-0.35)-0.05, q.y+0.11)); // arc
	d = min(d,  length(vec2(q.x+0.25, q.y-0.25))-0.04); // dot
	d = min(d,  length(vec2(q.x-0.25, q.y-0.25))-0.04); // dot
	q = vec2(-q.y, q.x);

	float f = smoothstep(0.0, 0.15, d)*octaves((pos + time*vec2(0.0, -0.5))*8.0);
	color += clamp(f*vec3(5.0, 2.0, 0.0), 0.0, 1.0);

	gl_FragColor = vec4(color, 1.0);
}

