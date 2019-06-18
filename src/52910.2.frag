#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec2 rot(vec2 p, float a) {
	float s = sin(a);
	float c = cos(a);
	
	return mat2(c, s, -s, c)*p;
}

void main( void ) {
	vec2 p = (2.0*gl_FragCoord.xy - resolution)/resolution.y;
	
	float s = 1000.0;
	float c = 1000.0;
	float z = 1000.0;
	
	for(int i = 0; i < 4; i++) {
		p = abs(p)/dot(p, p) - vec2(0.9, 0.7);
		p = rot(p.yx, time*0.1);
		s = min(s, abs(p.y));
		c = min(c, abs(p.x));
		if(i < 5) z = min(z, length(p));
	}
	
	vec3 col = mix(vec3(0.6, 0.34, 0.13), vec3(1.0), s);
	col = mix(col, vec3(2.0), smoothstep(0.3, 1.0, z));
	
	
	
	col=vec3(.020/(c*c))*col*col*col-0.4;
	col = mix(col, vec3(18, 8, 0), smoothstep(0.1, 1.0, c))/4.0;
	gl_FragColor = vec4(col, 1);
}
