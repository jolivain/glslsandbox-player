#ifdef GL_ES
precision mediump float;
#endif
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// @fernozzle

const vec4 WHITE = vec4(1.);
const vec4 BLACK = vec4(vec3(0.), 1.);

const int SHADOW_SAMPLES = 3;
const float SHADOW_SIZE = 0.02;
const float SHADOW_STRENGTH = 0.97;
const float CURSOR_SCALE = 1.0;

vec4 cursor(vec2 m, vec2 p, vec4 c);
bool cursorOutline(vec2 p);
bool cursorInterior(vec2 p);
bool withinShadowBounds(vec2 p);


void main( void ) {
	vec2 p = -1.0 + 2.0 * ((gl_FragCoord.xy) / resolution.xy);
	p.x *= (resolution.x / resolution.y);
	vec2 m = -1.0 + 2.0 * mouse.xy;
	m.x *= (resolution.x / resolution.y);
	
	vec4 background = vec4(gl_FragCoord.xy / resolution.xy, 0.4, 1.0);
	gl_FragColor = cursor(m, p, background);
}

vec4 cursor(vec2 m, vec2 p, vec4 c){
	vec2 relativeP = p - m;
	relativeP /= CURSOR_SCALE;
	if(cursorInterior(relativeP)){
		return vec4(vec3(1.), 1.);
	}else if(cursorOutline(relativeP)){
		return vec4(vec3(0.), 1.);
	}else{
		if(withinShadowBounds(relativeP)){
			for(int x = 0; x < SHADOW_SAMPLES; x++){
				for(int y = 0; y < SHADOW_SAMPLES; y++){
					vec2 sampleOffset = vec2(float(SHADOW_SAMPLES/2 - x) * SHADOW_SIZE, float(y) * SHADOW_SIZE);
					if(cursorOutline(relativeP + vec2(0., 0.03) + sampleOffset)){
						c *= SHADOW_STRENGTH;
					}
				}
			}
		}
		return c;
	}
}

bool cursorOutline(vec2 p){
	bool belowPoint = (p.x > 0.) && (p.x < -p.y);
	bool belowBottom = (p.x > p.y + 0.43) && (p.y < -0.3);
	bool tail = (p.x > -0.5*p.y - 0.08) && (p.x < -0.5*p.y + 0.03)
			&& (p.x > 2.*p.y + 0.4) && (p.x < 2.*p.y + 1.1);
	return belowPoint && !belowBottom || tail;
}
bool cursorInterior(vec2 p){
	bool belowPoint = (p.x > 0.025) && (p.x < -p.y - 0.04);
	bool belowBottom = (p.x > p.y + 0.39) && (p.y < -0.275);
	bool tail = (p.x > -0.5*p.y - 0.05) && (p.x < -0.5*p.y + 0.00)
			&& (p.x > 2.*p.y + 0.4) && (p.x < 2.*p.y + 1.03);
	return belowPoint && !belowBottom || tail;
}
bool withinShadowBounds(vec2 p){
	float leftBound = -float(SHADOW_SAMPLES / 2) * SHADOW_SIZE;
	float rightBound = float(SHADOW_SAMPLES / 2) * SHADOW_SIZE + 0.3;
	float topBound = 0.;
	float bottomBound = -float(SHADOW_SAMPLES - 1) * SHADOW_SIZE-0.5;
	return (p.x > leftBound) && (p.x < rightBound) && (p.y < topBound) && (p.y > bottomBound);
}
