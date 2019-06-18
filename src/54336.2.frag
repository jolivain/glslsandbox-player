#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float PI = 3.14159265;
const float PI2 = PI * 2.0;
const float PI_2 = PI * 0.5;

float angle(vec2 v) {
	float a = acos(v.x/length(v));
	if (v.y < 0.0) a = PI2 - a;
	return a;
}

vec2 rotate(vec2 v, vec2 dir) {
	float av = angle(v);
	float ad = angle(dir) + PI_2;
	float a = av - ad;
	float len = length(v);
	v.x = len * cos(a);
	v.y = len * sin(a);
	return v;
}

bool inArrow(vec2 size, vec2 pos, float scale, vec2 dir) {
	//size /= scale;
	pos = rotate(pos, dir);
	bool isTail = pos.y > 0.0 && abs(pos.x) < size.x * 0.5 && abs(pos.y) < size.y;
	bool isHead = pos.y < 0.0 && size.x-abs(pos.x) > abs(pos.y);
	return isTail || isHead;
}

void main( void ) {

	vec2 origin = vec2(0.0, 0.0);
	float size = abs(mouse.x - 0.5) * 110.0 * (sin(time) * 1.1);
	
	vec4 fragColor = vec4( 0.2, 0.2, 0.2, 1.0 );
	
	if (inArrow(vec2(100.0, 50.0), gl_FragCoord.xy - resolution.xy * 0.5, mouse.x, normalize(mouse*2.0- 1.0))) fragColor = vec4(0.0, 0.4, 1.0, 1.0);

	gl_FragColor = fragColor;

}
