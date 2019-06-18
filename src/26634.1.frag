#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D buf;

vec3 hsv(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main( void ) {

	float t = time * 2.;
	vec2 uv = ( gl_FragCoord.xy / resolution.xy );
	vec2 p = uv;
	p.x *= resolution.x/resolution.y;
	t += p.x + p.y * 2.;
	
	vec2 rm = vec2( cos(t), sin(t) );

	vec2 pb = mod( p, .1 ) - .05;
	
	pb = vec2( pb.x * rm.x + pb.y * rm.y, pb.x * rm.y - pb.y * rm.x );
	
	float thin = clamp(.05 + .1 * sin(t*.5), 0.003, .05);
	
	float f = smoothstep(thin,0., abs(.03-max(abs(pb.x), abs(pb.y))));
	
	gl_FragColor = vec4( hsv( f * vec3( fract(t*.5), 1.,1. ) ), 1. );// + texture2D( buf, uv ) * .5;
}
