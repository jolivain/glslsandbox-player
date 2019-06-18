// cleaned up the code + some minor tweaks --novalis

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;

float sdBox(vec3 p, vec3 b) {
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdCross(vec3 p) {
	return min(sdBox(p, vec3(1e38, 1., 1.)), min(sdBox(p, vec3(1., 1e38, 1.)), sdBox(p, vec3(1., 1., 1e38))));
}

float dist2nearest(vec3 p) {
	vec3 q = mod(p, 1.0) - .5;
	return sdCross(q * 27.) / 27.;
}

void main() {
	vec3 camDir = vec3(gl_FragCoord.xy / resolution.xy, 1.) * 2. - 1.;
	camDir.x *= resolution.x / resolution.y;
	camDir = normalize(camDir);
	
	vec3 camPos = vec3(sin(time/3.), cos(time/2.), sin(time/2.));
	
	float t = 0., d = 2e-6;
	int j = 0;
	
	for(int i = 0; i < 64; i++) {
		if(abs(d) < 1e-6 || t > 64.) continue;
		d = dist2nearest(camPos + t * camDir);
		t += d;
		j = i;
	}
	
	float col = 0.;
	if(abs(d) < 1e-6) col = 1.-float(j)/64.;
	
	gl_FragColor = vec4(vec3(col), 1.);
}
