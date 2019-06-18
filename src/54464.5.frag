// Shmup Shader
// by Katsuomi Kobayashi (@korinVR)
// http://framesynthesis.com/

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define SCREEN_W 0.7
#define SCROLL_SPEED 0.1

#define BLINK_INTERVAL 0.06
float blink = 0.;

vec2 p = vec2(0.);

vec2 myfighter_pos = vec2(0.);

highp float rand(vec2 co){
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

float linear_map(float value, float s0, float s1, float d0, float d1)
{
	return d0 + (value - s0) * (d1 - d0) / (s1 - s0);
}

void set_myfighter_pos()
{
	float n = floor(time * 2.0);
	float t = fract(time * 2.0);

	float x0 = linear_map(rand(vec2(n, 0)), 0.0, 1.0, -0.3, 0.3);
	float x1 = linear_map(rand(vec2(n + 1.0, 0)), 0.0, 1.0, -0.3, 0.3);
	float y0 = linear_map(rand(vec2(0, n)), 0.0, 1.0, -0.4, -0.1);
	float y1 = linear_map(rand(vec2(0, n + 1.0)), 0.0, 1.0, -0.4, -0.1);

	float x = linear_map(t, 0.0, 1.0, x0, x1);
	float y = linear_map(t, 0.0, 1.0, y0, y1);

	myfighter_pos.x = x;
	myfighter_pos.y = y;
}

vec3 background()
{
	float interval = 0.1;
	float thick = 0.005;
	vec3 color = vec3(0.0, 0.2, 0.4);

	if (mod(p.y + time * SCROLL_SPEED, interval) < thick || mod(p.x, interval) < thick) {
		return color;
	}
	return vec3(0);
}

vec2 get_boss_pos(float offset)
{
	float x = sin(time - offset) * 0.2;

	return vec2(x, 0.35);
}

vec3 bullet(vec2 v, float t)
{
	vec2 pos = get_boss_pos(t) + v * t;

	if (length(p - pos) < 0.006) {
		return vec3(1);
	}
	if (length(p - pos) < 0.01) {
		return vec3(1, 0.4, 0.3);
	}
	return vec3(0);
}

vec3 myfighter(vec2 pos)
{
	float radius = 0.03;

	float dx = pos.x - p.x;
	float dy = pos.y - p.y;

	int px = int(floor(abs(dx) / 0.02));
	int py = int(floor(dy / 0.02));

	bool pixel = false;

	if (px == 0) {
		if (py >= -1 && py <= 1) {
			pixel = true;
		}
	}
	if (px == 1) {
		if (py >= 1 && py <= 2) {
			pixel = true;
		}
	}

	if (pixel) {
		return vec3(1, 1, 1);
	}
	return vec3(0);
}

float get_laser_hit_y()
{
	if (abs(myfighter_pos.x - get_boss_pos(0.0).x) < 0.09) {
		return 0.3;
	}
	return 2.0;
}

vec3 laser(vec2 pos)
{
	vec2 boss_pos = get_boss_pos(0.0);

	float a = 0.003 + blink * 0.004;

	float d;

	if (p.y > myfighter_pos.y && p.y < get_laser_hit_y()) {
		d = abs(p.x - pos.x);
	} else {
		d = length(p - pos);
	}
	float n = a / (d * 3.0);

	return vec3(2, 2, 5) * n;
}

vec3 laser_hit_effect()
{
	vec2 pos = vec2(myfighter_pos.x, get_laser_hit_y());

	float a = 0.02 + blink * 0.02;

	float d = length(p - pos);
	float n = a / (d * 5.0);

	return vec3(2, 2, 5) * n;
}

vec3 boss()
{
	vec2 pos = get_boss_pos(0.0);

	bool pixel = false;

	float dx = pos.x - p.x;
	float dy = pos.y - p.y;

	int px = int(floor(abs(dx) / 0.02));
	int py = int(floor(dy / 0.02));

	if (px >= -5 && px <= 5) {
		if (py >= -5 && py <= 3) {
			if (rand(vec2(px, py)) > 0.5) {
				pixel = true;
			}
		}
	}

	if (pixel) {
		if (abs(myfighter_pos.x - pos.x) < 0.08 && blink > 0.5) {
			return vec3(1);
		}
		return vec3(1, 0.5, 0);
	}
	return vec3(0);
}

void main(void)
{
	blink = mod(time, BLINK_INTERVAL) / BLINK_INTERVAL;

	p = (gl_FragCoord.xy - resolution * 0.5) / resolution.y;

	if (abs(p.x) > SCREEN_W / 2.0) {
		discard;
	}

	set_myfighter_pos();

	vec3 c = background();

	c += boss();

	for (int i = -4; i <= 2; i++) {
		float t = fract(time * 0.5 + float(i) * 0.03);
		vec2 v = normalize(vec2(float(i) * 0.1, -1.0));
		c += bullet(v, t);
	}

	for (int i = -2; i <= 4; i++) {
		float t = fract(time * 0.5 + 0.5 + float(i) * -0.03);
		vec2 v = normalize(vec2(float(i) * 0.1, -1.0));
		c += bullet(v, t);
	}

	c += myfighter(myfighter_pos);
	c += laser(myfighter_pos);
	c += laser_hit_effect();

	gl_FragColor = vec4(c, 1);
}

