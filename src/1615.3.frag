// Mandelbrot mountain by Kabuto

// Set quality to 1 (or even 0.5)

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const int MAX_ITER = 60;

const float ANTIALIAS = .5;

const float depth = 10.;

float point(vec2 s) {
	vec4 a = vec4(s,1,0);
	vec4 c = vec4(s,1,0);
	
	for(int iter = 0; iter < MAX_ITER; iter++) {	
		// Testing every 4th iteration is enough for not getting float overflow and makes this routine much faster
		a = a.x*a*vec4(1,1,2,2)+a.y*a.yxwz*vec4(-1,1,-2,2)+c;
		a = a.x*a*vec4(1,1,2,2)+a.y*a.yxwz*vec4(-1,1,-2,2)+c;
		a = a.x*a*vec4(1,1,2,2)+a.y*a.yxwz*vec4(-1,1,-2,2)+c;
		a = a.x*a*vec4(1,1,2,2)+a.y*a.yxwz*vec4(-1,1,-2,2)+c;
		if(a.x*a.x+a.y*a.y > 16.) {
			return length(a.zw)/length(a.xy)/log(length(a.xy));
		}
	}
	return 1e10;

}
 
void main( void ) {
	float zoom = .05*exp(-sin(time*.3)*4.0-1.1)*2.;
	
	float yd = 1.;
	float z;
	
	const vec2 perspective = vec2(0,.7);
	
	vec2 ct = ( gl_FragCoord.xy/ resolution.xy - vec2(.5,.5)+perspective)*vec2(resolution.x/resolution.y, 2.);
	for (int i = 0; i < 14; i++) {
		vec2 p = (ct*yd -2.*perspective) * zoom + vec2(-.799,-.179);
		z = max(0.,1.0/(point(p)*zoom/resolution.y)-ANTIALIAS);
		float dd = (z*depth/resolution.y +1./yd-1.)*.5 / depth * (1./length(ct));
		yd += dd;
		if (dd*resolution.y < .1 || yd > resolution.y*3.) break;
	}
	
	gl_FragColor = sqrt(vec4(1.-1./(1.+z*vec3(0.01,.1,.5)), 1.));
}

