precision lowp float;
uniform vec2 resolution;
void main(void) {
	float y = ( gl_FragCoord.y / resolution.y ) * 26.0;
	float x = ( gl_FragCoord.x / resolution.x ); 
	float b = fract( pow( 2.0, floor(y) ) + x );
	if(fract(y) >= 0.9) {
		b = 0.0;
	}
	gl_FragColor = vec4(b, b, b, 1.0 );
}
