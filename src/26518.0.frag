#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

	vec2 position = ( gl_FragCoord.xy / resolution.xy );

	float color = 0.0;
	
	for ( float i = 0.; i < 3. ; i += .05 )  position += 0.04, color += 10.0 + abs( i + position.y / position.x )+time/10.;

	gl_FragColor = vec4( vec3( color, 0.4, sin( color + time / 8.0 ) * 2.0 ), 1.0 );

}

