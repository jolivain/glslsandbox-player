#ifdef GL_ES
precision highp float;
#endif

float pi = 3.14159265;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;

void main( void ) {

	vec2 p = ( gl_FragCoord.xy / resolution.xy ) * 2.0 - 1.0;

	float a = atan( p.y, p.x );
	float r = sqrt( dot( p, p ) );

	vec2 uv = vec2( 0, 0 );
	uv.x = mod( mouse.x * cos( a ) / r + time * 0.05, 1.0 );
	uv.y = mod( mouse.y * sin( a ) / r + time * 0.06, 1.0 );
	
	float amount = sin( time * 0.5 ) * 0.01;

	vec4 color0 = texture2D( backbuffer, uv );
	vec4 color1 = texture2D( backbuffer, uv + vec2( 0.0, - amount ) );
	vec4 color2 = texture2D( backbuffer, uv + vec2( 0.0, amount ) );
	vec4 color3 = texture2D( backbuffer, uv + vec2( amount, 0.0 ) );
	vec4 color4 = texture2D( backbuffer, uv + vec2( - amount, 0.0 ) );

	gl_FragColor = ( ( color0 + color1 + color2 + color3 + color4 ) / 8.0 ) + pow( 1.0 - r, 3.0 );

	float border = 0.95;

	if ( p.x < - border || p.x > border || p.y < - border || p.y > border ) {

		gl_FragColor = vec4( p.x + p.y );

	}

}
