#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float noise(vec2 pos) {
	return fract(sin(dot(pos, vec2(12.9898 - time,78.233 + time))) * 43758.5453);
}

void main( void ) {

	vec2 normalPos = gl_FragCoord.xy / resolution.xy;
	float pos = (gl_FragCoord.y / resolution.y);
        float mouse_dist = length(vec2((normalPos.x) * (resolution.x / resolution.y) , normalPos.y));
	float distortion = clamp(1.0 - (mouse_dist + 0.1) * 3.0, 0.0, 1.0);
	
	pos -= (distortion * distortion) * 0.1;
	
	float c = sin(pos * 400.0) * 0.4 + 0.4;
	
	
	c = pow(c, 0.2);
	c *= 0.2;
	
	float band_pos = fract(time * 0.1) * 3.0 - 1.0;
	c += clamp( (1.0 - abs(band_pos - pos) * 10.0), 0.0, 1.0) * 0.1;
	
	c += distortion * 0.08;
	// noise
	c += (noise(gl_FragCoord.xy) - 0.5) * (0.09);

	
	gl_FragColor = vec4( 0.0, c, 0.0, 1.0 );
}
