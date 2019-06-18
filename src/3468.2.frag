//@ME
//Maschendrahtzaun

#ifdef GL_ES
precision lowp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec2 reyboard;

const float PI = 3.1415926535;
const float TWOPI = PI*2.0;

vec2 rotate(vec2 point, float rads) {
	float cs = cos(rads);
	float sn = sin(rads);
	return point * mat2(cs, -sn, sn, cs);
}

float unsin(float t)
{
	return sin(t)*0.5+0.5;
}

float curve( float x)
{
	return smoothstep( 0.0, 3., unsin(x*TWOPI) + cos(x*PI) ) - unsin(x*TWOPI);
}

float thing(vec2 pos) 
{
	float offset = 0.;
	float row = floor((pos.y-1.)/2.);
	if (mod(row, 2.0) <= 1.0)
		offset = curve(unsin(pos.x)*sin(time));
	float a = curve(pos.x + curve(unsin(pos.y)*sin(-time)));
	float b = curve(pos.y - offset);
	float c = distance(a, b);
	return a + b + c;
}

void main(void) 
{
	vec2 position = ( gl_FragCoord.xy / resolution );
	vec2 world = position * 14.0 - 7.;
	world.x *= resolution.x / resolution.y;
	world = rotate(world, radians(45.));
	float dist = 2.0*thing(world);

	gl_FragColor = vec4( dist, dist, dist, 1.0 );
}

