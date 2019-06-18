#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 rand3(vec2 co){
	return vec3(rand(co),rand(co+vec2(213.,2151.)),rand(co+vec2(123124.,2323.)));
}

void main( void ) {
	vec2 p = ( gl_FragCoord.xy / resolution.xy) - 0.5;;
	p.x *= resolution.x/resolution.y;
	
	float speed = 1.0/length(p);
	float iSpeed = ceil(speed);
	iSpeed *= sign(mod(iSpeed,2.0) - 0.5);
	float angle = 3.0 * (atan(p.y,p.x) - 0.1 * time * iSpeed + 3.14159) / (2.0 * 3.1415);
	
	gl_FragColor = vec4(
		mix(vec3(0.0,0.9,0.4),
		    vec3(0.7,0.2,0.0),
		    mod(ceil(speed),2.0)
		 )*
	pow(length(p),0.4) * fract(angle), 1);
}
