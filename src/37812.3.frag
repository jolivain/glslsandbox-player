#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec2 rotz(in vec2 p, float ang) { return vec2(p.x*cos(ang)-p.y*sin(ang),p.x*sin(ang)+p.y*cos(ang)); }
void main( void ) {

	vec2 p = 2.0*( gl_FragCoord.xy / resolution.xy )-1.0; 
	p.x *= resolution.x/resolution.y; 	
	vec3 col = vec3(0); 

	p = rotz(p, time*0.5+atan(p.y,p.x)*5.0);
	p *= 1.1+sin(time*0.5); 
	
	for (int i = 0; i < 20; i++) {
		
		float dist = abs(p.y + sin(float(i)+time*0.1+3.0*p.x)) - 0.1;
		if (dist < 1.0) { col += (1.0-pow(abs(dist), 0.28))*vec3(0.8+0.2*sin(time),0.9+0.1*sin(time*1.1),1); }
		p *= 1.1; 
		p = rotz(p, 30.0);
	}
	col *= 0.15; 
	gl_FragColor = vec4(col, 1.0); 
}
