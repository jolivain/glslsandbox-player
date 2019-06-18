#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {
	float pi = 3.14159265;
	float zoom=0.25;
	const float N=26.0;
	vec2 position = zoom*( gl_FragCoord.xy - resolution.xy/2.0 );
	
	float angle = 0.0;
	float intensity = 0.0;

	float speed = 0.02;
	for (float i=0.0; i <N;i++)
	{
		angle = speed*time*i*pi/6.0;
		vec2 direction = vec2(cos(angle),sin(angle));
		intensity = intensity + cos(dot(position,direction));
	}

	gl_FragColor = vec4( vec3( intensity ), 1.0 );
}
