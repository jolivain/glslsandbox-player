// made by darkstalker
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define M_PI 3.14159265358979323846

#define calcRotationMat2(ang)  mat2(cos(ang), -sin(ang), sin(ang), cos(ang))

mat2 rotMatrix = calcRotationMat2(M_PI*0.25);

void main(void)
{
	vec2 screen_pos = gl_FragCoord.xy;
	vec2 mouse_pos = mouse*resolution;

	vec2 p = rotMatrix*screen_pos * 0.1;
	float value = clamp((cos(p.x) + cos(p.y)) * 10., .1, 1.);
	float light = 0.08 + clamp(1. - distance(screen_pos, mouse_pos) / 150., 0., 1.);

	gl_FragColor = vec4(vec3(value*light), 1.);
}
