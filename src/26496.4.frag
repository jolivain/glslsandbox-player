// Mode 7!

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//#define SKY

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 rotate(vec2 vector, float angle)
{
	return vec2(vector.x * cos(angle) - vector.y * sin(angle), vector.x * sin(angle) + vector.y * cos(angle));
}

vec3 checkers(vec2 p)
{
	return vec3((sin(p.x * 20.0) * sin(p.y * 40.0)));
}

vec3 noise(vec2 p)
{
	return vec3(((snoise(p * 1.0) + snoise(p * 2.0) + snoise(p * 3.0) + snoise(p * 4.0) + snoise(p * 8.0)
		      + snoise(p * 12.0) + snoise(p * 20.0) + snoise(p * 30.0) + snoise(p * 40.0)) + 0.5) / 9.0);
}

vec3 sky(float x, float y)
{
	return vec3(1.0 - sin(y) * 0.5, 1.0 - sin(y) * 0.2, 1.0);
}

vec3 mode7(float horizon, float fov, vec2 pos, vec2 trans, float angle)
{
	return noise(rotate(vec2(pos.x / (pos.y - horizon), (pos.y - horizon - fov) / (pos.y - horizon)) + trans, angle)) * sqrt((pos.y - horizon) * (pos.y - horizon)) * 5.0;
}

void main()
{
	vec2 pos = (gl_FragCoord.xy / resolution.xy) - 0.5;
	#ifdef SKY
	if (pos.y < 0.1) {
		gl_FragColor = vec4(mode7(0.1, 0.3, pos, vec2(sin(time) / 2.0, time), 0.0), 1.0);
	} else {
		gl_FragColor = vec4(sky(pos.x, pos.y), 1.0);
	}
	#else
	gl_FragColor = vec4(mode7(0.1, 0.3, pos, vec2(sin(time) / 2.0, time), 0.0), 1.0);
	#endif
}
