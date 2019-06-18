#ifdef GL_ES
precision mediump float;
#endif

float hash (float v) {
  return smoothstep(0.3, 0.8, abs(sin(v))) * 20.0;
}

uniform float time;
uniform vec2 resolution;

void main(void) {
    vec2 q = gl_FragCoord.xy / resolution.xy;
    vec2 p = -1.0 + 2.0 * q;		
    p.x *= resolution.x / resolution.y;	
	
    float v = p.x + cos(time + p.y);
    	
    vec3 col = vec3(0.2, 0.3, 0.4);
    vec3 c = vec3(0.0);	
    c += col / (abs(tan(hash(p.x) + cos(time + p.y)))); 
    c += col / (abs(tan(hash(p.y) + cos(time + p.x))));
    //c += col / (abs(tan(hash(p.x) + sin(time + p.y))));
    //c += col / (abs(tan(hash(p.y) + sin(time + p.x))));
    c /= 5.0;	
	
    gl_FragColor = vec4(c, 1.0);
}
