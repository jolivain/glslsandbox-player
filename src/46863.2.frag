#ifdef GL_ES
precision mediump float;
#endif

// Disco Tunnel by WAHa.06x36^SVatG. Also available at https://www.shadertoy.com/view/XstfzB

uniform float time;
uniform vec2 resolution;

vec2 position(float z) {
	return vec2(
		0.0 + sin(z * 0.1) * 1.0 + sin(cos(z * 0.031) * 4.0) * 1.0 + sin(sin(z * 0.0091) * 3.0) * 3.0,
		0.0 + cos(z * 0.1) * 1.0 + cos(cos(z * 0.031) * 4.0) * 1.0 + cos(sin(z * 0.0091) * 3.0) * 3.0
	) * 1.0;
}

void main(void){
	vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
	float camZ = 25.0 * time;
	vec2 cam = position(camZ);

	float dt = 0.5;
	float camZ2 = 25.0 * (time + dt);
 	vec2 cam2 = position(camZ2);
	vec2 dcamdt = (cam2 - cam) / dt;
	
	vec3 f = vec3(0.0);
 	for(int j = 1; j < 300; j++) {
		float i = float(j);
		float realZ = floor(camZ) + i;
		float screenZ = realZ - camZ;
		float r = 1.0 / screenZ;
 		vec2 c = (position(realZ) - cam) * 10.0 / screenZ - dcamdt * 0.4;
	 	vec3 color = (vec3(sin(realZ * 0.07), sin(realZ * 0.1), sin(realZ * 0.08)) + vec3(1.0)) / 2.0;
 		f += color * 0.06 / screenZ / (abs(length(p - c) - r) + 0.01);
	}

	gl_FragColor = vec4(f, 1.0);
}
