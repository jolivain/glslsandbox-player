#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float pi = 3.14159265359;
/*
#define PI 3.14159
float toPolar(vec2 p) {
	float a = atan(p.y/p.x);
	if (p.x < 0.0) a += PI;
	return a;
}
float toPolar(vec2 p) {
	float r = length(p);
	if (r + p.x == 0.) return PI;
	float a = 2. * atan(p.y/(r + p.x));
	return a + PI; // range [0, 2*PI]
}*/
float rand(int seed, float ray) {
	return mod(sin(float(seed)*363.5346+ray*674.2454)*6743.4365, 1.0);
}


vec3 lamp (vec2 position){
	
	float ang = atan(position.x, position.y)/(2.*pi);
	float dist = length(position);
	vec3 col = vec3(0.3, 0.5, 0.7) * (pow(dist, -1.0) * 0.05);
	for (float ray = 0.5; ray < 5.0; ray += 0.3) {
		//float rayang = rand(5234, ray)*6.2+time*5.0*(rand(2534, ray)-rand(3545, ray));
		float rayang = time*ray/2./pi;
		rayang = fract(rayang);//mod(rayang, 1.);
		if (rayang < ang - 0.5) {rayang += 1.;} //needed to fix atan(x,y) 
		if (rayang > ang + 0.5) {rayang -= 1.;}
		float brite = .3 - abs(ang - rayang)*2.*pi;
		brite -= dist * 0.1;
		if (brite > 0.0) {
			col.rgb += vec3(0.9+0.4*ray, 0.4+0.4*ray, 0.2+0.4*ray) *0.5* brite;
		}
	}
	
	return col;
}


void main( void ) {
	
	vec2 position = ( gl_FragCoord.xy / resolution.xy );//- mouse;
	position.y *= resolution.y/resolution.x;
	
	vec3 col1, col2, col3,col4;
	
	col1 = lamp(position-vec2(0.3,  0.5));
	col2 = lamp(position-vec2(0.7,  0.5));
	col3 = lamp(position-vec2(0.3,  0.2));
	col4 = lamp(position-vec2(0.7,  0.2));
	
	gl_FragColor = vec4((col1*col2*col3*col4)*76., 1.0);   // Hight contrast
	//gl_FragColor = vec4((col1+col2+col3+col4)*.5, 1.0);  // Low contrast
	
}
