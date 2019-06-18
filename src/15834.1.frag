#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

int siBinar(int a,int b) {
	if (b < 0) return -1;
	if (a < 0) a += 16384;

	int result = 0;

	int produs = 1;

	
	for (int i = 0;i < 16;i++) {
		result += int(mod(float(a),2.0)*mod(float(b),2.0))*produs;

		produs *= 2;

		a /= 2;
		b /= 2;
	}

	return result;
}

void main( void ) {

	vec2 position = gl_FragCoord.xy-resolution*.5;
	float t = time*.1;
	//position += sin(position.yx*.1*sin(time*.5))*10.*.5;
	position *= mat2(cos(t),-sin(t),sin(t),cos(t));
	position.y *= 2./sqrt(3.);
	position.x -= position.y*.5;
	
	position *= pow(2.,1.-fract(time));
	
	float color = 0.0;

	int bin = siBinar(int(floor(position.x)),int(floor(position.y)));
	if (bin == 0) {
		color = 1.0;
	} else if (bin == 1) {
		color = 1.-fract(time);
	} 
	gl_FragColor = vec4( color,color,color, 1.0 );

}
