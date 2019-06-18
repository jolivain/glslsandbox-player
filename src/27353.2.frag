#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float smin( float a, float b, float k ) {
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

void main( void ) {
	vec2 p = ( gl_FragCoord.xy / resolution.xy);
	p = p * 2.0 - 1.0;
	p.x *= resolution.x / resolution.y;
	float col = 0.0;
	float a = length(p - vec2(sin(time), 0.0)) - 0.2;
	float b = length(p - vec2(0.25, 0.0)) - 0.2;
	col = smin(a, b, 0.35);
	if (col > 0.005)  col = 1.0;
	if (col < -0.005)  col = 1.0;
	col = 1.0 - col;
	gl_FragColor = vec4(col, col, col, 1.0 );
}
