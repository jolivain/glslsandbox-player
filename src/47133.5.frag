// work in progress, made by dr1ft
// only saving so i can show my friends :)

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

const float max_depth = 12.0;

vec2 waver(float x){
	return vec2(cos(x),sin(x))*0.15;
}

float checkerboard (vec2 offset, float depth){
	depth = mod(depth,max_depth)*3.0;
	vec2 position = (gl_FragCoord.xy / vec2(resolution.x) - vec2(0.5,0.25)) * vec2(depth) + offset;
	position += waver(depth*0.15+time*1.4);
	return clamp(sign((mod(position.x, 1.0) - 0.5) * (mod(position.y, 1.0) - 0.5)) / depth * 2.0,0.0,1.0);
}

void main( void ) {
	
	float color = 0.0;
	for (float i = 0.0; i < max_depth; i++){
		float n=checkerboard(vec2(0.25,0.75), i-time*1.0);
		if (n>color){
			color=n;
		}
	}
	color*=0.8;

	gl_FragColor = vec4(vec3(0.0,color,color),1.0);

}
