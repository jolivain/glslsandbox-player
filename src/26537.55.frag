#ifdef GL_ES
precision mediump float;
#endif

#define RAD 5.
#define LOOKUP 5.
#define SPEED 2345.

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

bool shouldDraw(vec2 p) {
	return rand(p / resolution.xy) * SPEED < time;
}


bool border(vec2 p1, vec2 c) {
	if (!shouldDraw(c))
		return false;
	return abs(abs(p1.x - c.x) + abs(p1.y - c.y) - RAD) < 1.;
}

float find() {
	float x = gl_FragCoord.x;
	float y = gl_FragCoord.y;
	bool running = true;
	for (float i = -LOOKUP; i <= LOOKUP; ++i) {
		for (float j = -LOOKUP; j <= LOOKUP; ++j) {
			float cx = x + i;
			float cy = y + j;
			if (cx < 0. || cy < 0. || cx > resolution.x || cy > resolution.y)
				continue;
			if (border(vec2(x, y), vec2(cx, cy)))
				return 0.8;				

		}
	}
	return 0.;
}

void main( void ) {
	float color = find();
	gl_FragColor = vec4(0., 0., color, 1.);
}

/*
void main4( void ) {
	float color = 0.;	
	float x = gl_FragCoord.x;
	float y = gl_FragCoord.y;

	for (float i = -RAD; i < RAD; ++i) {
		for (float j = -RAD; j < RAD; ++j) {
			if (y + j < 0. || x + i < 0.)
				continue;
			if (!isCenter(vec2(x + i, y + j), vec2(0., 0.)))
				continue;
			if (border(vec2(x, y), vec2(x + i, y + j))) {
			    color = 1.;
			}
		}
	
	}
	
	gl_FragColor = vec4(color, 0., 0., 0.);
}


// Square

void main( void ) {
	float color = 0.;
	float x = gl_FragCoord.x;
	float y = gl_FragCoord.y;
	float cx = RAD;
	float cy = RAD;
	if (border(vec2(x, y), vec2(cx, cy)))
	    color = 1.;
	gl_FragColor = vec4(color, 0., 0., 0.);	
}
*/

