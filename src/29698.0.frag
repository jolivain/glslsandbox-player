// Originally created by Robert Schütze (http://glslsandbox.com/e#29611.0)

precision mediump float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

void main(){
	vec2 m = vec2(cos(time) * 0.3, sin(time) * 0.5) + 0.5;
	vec3 p = vec3((gl_FragCoord.xy)/(resolution.y),m.x);
 	for (int i = 0; i < 100; i++){
		p.xzy = vec3(1.2,0.999,0.9)*(abs((abs(p)/dot(p,p)-vec3(1.0,1.0,m.y*0.4))));
	}
	gl_FragColor = vec4(p, 1.0);
}
