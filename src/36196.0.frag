#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float line( float p) {
	float v1 = smoothstep(0.45, 0.5, fract(p));
	float v2 = 1.0 - smoothstep(0.5, 0.55, fract(p));
	return ( v1 + v2 ) - 1.0;
}

float thickline( float p) {
	float v1 = smoothstep(0.0, 0.2, p);
	float v2 = 1.0 - smoothstep(0.0, 0.9, p);
	return ( v1 + v2 ) - 1.0;
}

void main() {

	float t = time;
	float x = gl_FragCoord.x / resolution.x;
	float y = gl_FragCoord.y / resolution.y;
	float px = x * 10.0;
	float py = y * 5.0;

	float vx = line( px );
	float vy = line( py );

	float gleam = thickline( fract( t - ( x / -0.3 ) - ( y / -0.3 ) ) );
    	vec4 color = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(0.0, 0.25, 0.0, 1.0), vx + vy);
    	vec4 color2 = mix(vec4(0.0, 0.0, 0.0, 1.0), color, gleam );
	
	float l = step(mod(t, 2.1), 1220.6);
        gl_FragColor = color + color2 * l;
}

