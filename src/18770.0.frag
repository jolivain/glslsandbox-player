#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float rand(int seed, float ray) {
	return mod(sin(float(seed)*363.5346+ray*674.2454)*6743.4365, 1.0);
}

void main( void ) {
	float pi = 3.14159265359;
	vec2 position = ( gl_FragCoord.xy / resolution.xy ) - mouse;
	position.y *= resolution.y/resolution.x;
	float ang = atan(position.y, position.x);
	float dist = length(position);
	gl_FragColor.rgb = vec3(0.3, 0.5, 0.7) * (pow(dist, -1.0) * 0.05);
	for (float ray = 0.0; ray < 60.0; ray += 1.0) {
		//float rayang = rand(5234, ray)*6.2+time*5.0*(rand(2534, ray)-rand(3545, ray));
		float rayang = rand(5234, ray)*6.2+(mouse.x+time*0.01)*10.0*(rand(2546, ray)-rand(5785, ray))-mouse.y*10.0*(rand(3545, ray)-rand(5467, ray));
		rayang = mod(rayang, pi*2.0);
		if (rayang < ang - pi) {rayang += pi*2.0;}
		if (rayang > ang + pi) {rayang -= pi*2.0;}
		float brite = .3 - abs(ang - rayang);
		brite -= dist * 0.2;
		if (brite > 0.0) {
			gl_FragColor.rgb += vec3(0.2+0.4*rand(8644, ray), 0.4+0.4*rand(4567, ray), 0.5+0.4*rand(7354, ray)) * brite;
		}
	}
	gl_FragColor.a = 1.0;
}
