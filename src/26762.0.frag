// water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07
// Altered
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;
//vec2 surfacePosition = vec2 (104.,128.);
#define MAX_ITER 8
void main( void ) {
	vec2 p = surfacePosition*3.0- vec2(15.0);
	vec2 i = p;
	float c = 1.0;
	float inten = .05;

	for (int n = 0; n < MAX_ITER; n++) 
	{
		float t = time * (1.0 - (3.0 / float(n+1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0/length(vec2(p.x / (2.*sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
	}
	c /= float(MAX_ITER);
	c = 1.5-sqrt(pow(c,3.+mouse.x*0.5));
	gl_FragColor = vec4(vec3(c*c*c*c*0.3,c*c*c*c*0.5,c*c*c*c*0.925), 1.0);

}
