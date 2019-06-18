#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D tx;

void main( void ) {

	vec2 p = ( gl_FragCoord.xy / resolution.xy );
	p*=pow(abs(sin(time)),0.2);
	p*=100.0;
	vec3 c= vec3(0.0);
	c = vec3(1.0) * sin(p.x) + cos(p.x * sin(time) + p.y*cos(time) + sin(time)*50.0);
	c *= (0.0 - (p.y/100.0)*(sin(time*2.0) * 0.5 + 0.5));
	c = pow(c, vec3(1.0,0.5,1.1));
	c*=0.8;
	gl_FragColor = vec4( vec3( c ), 1.0 );

}
