#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

uniform float time;
uniform vec2 resolution;

vec3 eye(float c){
	float r = exp2(-pow(c, 2.0)) * 0.9 + exp2(-pow((c + 3.0) * 2.0, 2.0)) * 0.3;
	float g = exp2(-pow((c + 1.0),2.0));
	float b = exp2(-pow((c + 2.145) * 1.1, 2.0));
	
	return vec3(r, g, b);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void main( void ) {

	vec2 position = gl_FragCoord.xy / resolution.xy;

	position -= vec2(0.5);
	position = rotate2d(cos(time)*PI)*position;
	position += vec2(0.5);
	position *= 1.;
	//position -= 1.5;
	vec3 color = vec3(0.0);
	     color = eye(position.x * 10.0 - 6.0);

	gl_FragColor = vec4(color, 1.0);

}
