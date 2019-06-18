#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float noise2d(vec2 p) {
	return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 456367.5453);
}

vec4 sample(int x, int y)
{
	vec2 p = ( (gl_FragCoord.xy + vec2(x, y)) / resolution.xy );
	
	float a = 0.0;
	for (int i = 1; i < 20; i++) {
		float fi = float(i);
		float s = floor(200.0*(p.x)/fi + 50.0*fi + time / 5.);
		
		if (p.y < noise2d(vec2(s))*fi/35.0 - fi*.05 + 1.0 + 0.125*cos(time / 5. + float(i)/5.0 + p.x*5.0)) {
			a = float(i)/20.;
		}
	}

	return vec4(vec3(a*p.x, a*p.y, a * (1. - p.x) ), 1.0 );
}

#define EDGE_THRESHOLD 1e-2

bool edge()
{
	vec4 mid = sample(0, 0);
	return distance(mid, sample(0, 1)) > EDGE_THRESHOLD || distance(mid, sample(1, 0)) > EDGE_THRESHOLD;
}

void main( void )
{
	gl_FragColor = edge() ? vec4(0.0, 0.0, 0.0, 1.0) : sample(0, 0);
}
