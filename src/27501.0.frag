#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main(){
	vec2 uv = (gl_FragCoord.xy / resolution - 0.5) * vec2(resolution.x/resolution.y,1);
	vec3 ray = normalize(vec3(uv,0.07));
	float speed = 0.7;
	vec3 p = vec3(cos(time*speed),sin(time*speed),fract(speed * time));
	for(float i = 0.0; i < 100.0; i++){
		float d = .2 * distance(fract(2.0 * p),vec3(0.6));
		if(d < 0.015){
			gl_FragColor = vec4(float(i)/50.0);
			return;
		}
		p+= ray * d;
	}
	gl_FragColor = vec4(1);
}
