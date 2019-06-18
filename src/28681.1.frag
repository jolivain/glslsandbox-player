#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


float rand(vec2 v){
	return fract(sin(dot(v.xy,vec2(33.9898,78.233))) * 43758.5453);
}
					
void main( void ) {

	vec2 gp = gl_FragCoord.xy;
	float c = 0.0;
	for(int i = 0; i < 10; i++){
		float fi = float(i);
		vec2 p = vec2(gp.x, gp.y);
		vec2 dir = normalize(-vec2(0.5, rand(vec2(fi, fi)) + 1.0));
		float l = 110.0 - rand(vec2(-fi, fi)) * 100.0;
		float m = l + rand(vec2(-fi, -fi)) * l;
		vec2 dl = -dir * l + m + vec2(20.0, 50.0);
		vec2 d = dir * (mod(time, 30.0) * 20.0 * l * ( 0.7 + 0.3 * rand(vec2(fi, -fi))) + fi);
		vec2 s = floor((p - d + m * 0.5) / dl);
		p -= s * dl + rand(s) * l - l * 0.5;
		l *= 0.5 + 0.5 * rand(s + fi * 1000.0);
		float a = clamp(dot(p - d, dir), -l, 0.0);
		c += max(0.0, (1.0 - distance(d + a * dir, p) * 0.5) * (a + l) * 0.01);
	}
	gl_FragColor = vec4( vec3( c ) * 0.5 + 0.25, 1.0 );

}
