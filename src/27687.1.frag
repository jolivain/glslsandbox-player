precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


float pi = 3.141592653589;


float ball1(vec2 p, float k) {
    vec2 r = vec2(p.x + cos(time * 0.8*k) * 0.3, p.y + sin(2.0*time * (k-3.0)) * 0.6);
 
//r *= vec2( sin(0.1*time), cos(0.3*time));
 
 
float rotCurve = 2.0*pi*sin(0.1*time) + (0.0) + 10.0*cos(time/400.0 + 0.02*((k-2.0))*sin(time)) + 10.0*sin(time/200.0-0.002*(-k+2.0)*sin(0.05*(6.0*k-1.0)*time));
 
mat2 rot = mat2(cos(rotCurve), -sin(rotCurve), sin(rotCurve), cos(rotCurve));
 
	
	mat3 rot3 = mat3(cos(rotCurve), -sin(rotCurve), 1.0, sin(rotCurve), cos(rotCurve), 1.0, 1.2*sin(2.0*k*time), 0.3*sin(1.0*time), 1.0);
	vec3 r3 = vec3(r, 1.0);
	
	
r = rot*r;
 
	r = (rot3*r3).xy;
	
 
    return smoothstep(0.0, 1.0, 0.08 / length(0.3*r-0.3*(k)+1.0));
}




float ball2(vec2 p, float k) {
	
	float time2  = time - 30.0;
	
    vec2 r = vec2(p.x + cos(time2 * 0.8*k) * 0.3, p.y + sin(2.0*time2 * (k-3.0)) * 0.6);
 
//r *= vec2( sin(0.1*time), cos(0.3*time));
 
 
float rotCurve = 2.0*pi*sin(0.1*time2) + (0.0) + 10.0*cos(time2/40.0 + 0.02*((k-2.0))*sin(6.0*cos(time2*0.3*sin(0.001*time2)))) + 10.0*sin(time2/200.0-0.002*(-k+2.0)*sin(0.05*(6.0*k-1.0)*time2));
 
mat2 rot = mat2(cos(rotCurve), -sin(rotCurve), sin(rotCurve), cos(rotCurve));
 
	
	mat3 rot3 = mat3(cos(rotCurve), -sin(rotCurve), 1.0, sin(rotCurve), cos(rotCurve), 1.0, 1.2*sin(2.0*k*time2), 0.3*sin(1.0*time2), 1.0);
	vec3 r3 = vec3(r, 1.0);
	
	
r = rot*r;
 
	r = (rot3*r3).xy;
	
 
    return smoothstep(0.0, 1.0, 0.08 / pow(length(0.5*r-0.7*(k)+1.0),0.8));
}



void main(void) {
    vec2 q = gl_FragCoord.xy / resolution.xy;
    vec2 p = -16.0 + 32.0 * q;
	
    p.x *= resolution.x / resolution.y;

	p.x -= 16.0;

	float col = 0.0;
    for (int i = 1; i <= 40; ++i) {
    col += ball1(p, 0.08*float((i*2-30)));
    }
 
    col *= 1.2;
    gl_FragColor = vec4(col*0.2, col * 0.1, col, 1.0);

	
	

	p.x += 25.0;
col = 0.0;
    for (int i = 1; i <= 60; ++i) {
    col += ball2(p, 0.07*float((i*2+10)));
    }
 
    col *= 0.7;
    gl_FragColor += vec4(col*1.0, col * 0.5, col*0.2, 1.0);

	
	
	
	
	
}
