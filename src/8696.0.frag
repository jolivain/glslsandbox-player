precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const int maxiter = 90;
const int maxiter_sqr = maxiter*maxiter;

void main( void ) {
	vec3 dir = normalize(vec3((gl_FragCoord.xy-resolution*.5)/resolution.x,1.));
	float a = time * 0.4;
	vec3 pos = vec3(time*0.04,tan(time*0.5)*0.03,-20.0);
	vec3 color = vec3(0);
	
	
	
	for (int i = 0; i < maxiter; i++) {
		vec3 p = pos;		
		p = abs(fract(p) - 0.5);
		p *= p;
		vec3 field = sqrt(p+p.yzx*p.zzy)-0.015;		
		
		vec3 f2 = field;
		vec3 rep = vec3(1.0);
		float f = min(min(min(f2.x,f2.y),f2.z), length(mod(pos-vec3(0.5,0.5,0.2),rep)-0.5*rep)-0.15);
		pos += dir*f;
		color += float(maxiter-i)/(f2+1e-5);
	}
	vec3 color3 = vec3(-1./(1.+color*(.5/float(maxiter_sqr))));
	color3 *= color3;
	gl_FragColor = vec4(vec3(color3.r+color3.g+color3.b),1.);
}
