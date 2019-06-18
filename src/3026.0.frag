#ifdef GL_ES
precision mediump float;
#endif

// non-interacive version

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

	vec2 posScale = vec2(resolution.y,resolution.x)/sqrt(resolution.x*resolution.y);
	vec2 position = (( gl_FragCoord.xy / resolution.xy ) );
	
	float sum = 0.;
	float qsum = 0.;
	float t = time * 0.07;
	
	for (float i = 0.; i < 100.; i++) {
		float x2 = i*i*.3165+(t*i*0.01)+.5;
		float y2 = i*.161235+sin(t*i*0.13)*0.1+.5;
		vec2 p = (fract(position-vec2(x2,y2))-vec2(.5))/posScale;
		float a = atan(p.y,p.x);
		float r = length(p)*100.;
		float e = exp(-r*.5);
		sum += sin(r+a+time)*e;
		qsum += e;
	}
	
	float color = sum/qsum;
	
	gl_FragColor = vec4(color,color-.5,-color, 1.0 );
}
