#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

	vec2 p=(gl_FragCoord.xy/resolution.xy-0.5)*resolution.xy/resolution.y*10.0;
	float d=length(p);
	float r=acos(p.x/d)/3.141592654;
	r=p.y<0.0?1.0-r:r;
	float c=sin(d*1.0+r*6.28-time*7.0)*0.25+0.5;
	float c1=sin(d*10.0+r*6.28-time*7.0)*0.75+0.5;
	gl_FragColor = vec4( c*c1 );

}
