#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

	vec2 p = ( gl_FragCoord.xy / resolution.xy ) * 2.0 - 1.0;
	p.x*=resolution.x/resolution.y;
	p*=0.5;
	float c = 0.0;
	float v = 0.0;
	const float iter =15.0;
	for(float i =0.0;i<iter;i++)
	{
		v = smoothstep(0.0,1.0,sin(i*cos(p.x+time+v*2.0+p.y*sin(time)*v*6.0)) -sin(v-i*length(p*i)-time));
		c += v*(1.0/((i*0.666)+1.0));
	
	}
	c /= iter/6.0;
	gl_FragColor = vec4( pow(vec3( c*1.0), vec3(1.5,1.0,0.65)), 1.0 );

}
