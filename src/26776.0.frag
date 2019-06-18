#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D tx;
void main( void ) {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 p = ( uv ) * 2.0 - 1.0;
	p.x *= resolution.x / resolution.y;
	float strobe = .95 + .05* sin(time*100.);
	float fade = sin(time) * 2. + 2.;
	const float ITER = 100.0;
	float c = 0.0;	
	for(float i = 0.0; i < ITER; i++)
	{
		c += smoothstep(0.15, 0.0, length(p*vec2(sin(p.x*i+time*1.5), cos(p.y*i))));	
	}
	c/= ITER;
	c*= strobe * clamp( fade, .25, 1. );
	gl_FragColor = vec4( pow(vec3( c ), vec3(1.35,1.05,0.8))*5.0, 1.0 );
}
