#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
	float N = 30.;
	float invN = 1./N;
	vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mod(time,invN) / 3.0;
	vec2 cell = vec2(ivec2(invN*gl_FragCoord.xy));
	vec2 center = N*vec2(cell)+vec2(0.5*N,0.5*N);
	float d = distance(gl_FragCoord.xy, center);
	float c = 1.-smoothstep(0.4 * N, 0.45*N, d*.9);
	vec4 bg = vec4(.3,.1,.7,1.);
	float a0 = 0.5+0.5*sin(0.9*cell.x +time)*sin(cell.y + 5.*cos(0.4*time));
	float a1 = 0.5+0.5*sin(0.1*cell.y+10.*sin(cell.x)*time*0.2);
	
		
	float y = 0.5*(a0+a1);
	vec4 top_bw = vec4(y);
	vec4 top_c = vec4(a0,a1,0.,1.);
	float d2 = distance(resolution.xy*inversesqrt(-time), center);
	float s = smoothstep(-0.5*N, 3.*N,d2)-smoothstep(3.*N,6.*N,d2);
	s = step(8.*N,d2)-step(9.*N,d2) + 1. - step(0.5*N,d2);
	vec4 top = mix(0.5*top_bw, top_c, s*s);
	gl_FragColor = mix(bg,top,c);
	gl_FragColor *= (top_c,bg,s+c)/mod(y,time)-3.0;
}
