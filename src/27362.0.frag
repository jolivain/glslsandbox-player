precision mediump float;
uniform float time; // time
uniform vec2  resolution; // resolution

void main(void){
	float t = time;
	vec2 r = resolution;
	vec2 p = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
	vec3 destColor = vec3(0.0);
	for (float i = 0.0; i<5.0;i++){
		float j = i + 1.0;
		vec2 q =  p + vec2(cos(t * j), sin(t * j)) * 0.5;
		float l = 0.01 / abs(length(q)-0.2*i*abs(tan(t)));
		destColor +=  vec3(abs(tan(t))*l,abs(sin(t))*l,abs(cos(t))*l);
	}
	gl_FragColor = vec4(destColor,1.0);
}

