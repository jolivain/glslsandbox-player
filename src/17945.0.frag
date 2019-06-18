#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// srtuss, 2014
// Ported from www.shadertoy.com

#define PI 3.1415926535897932384626433832795

#define ITER 20

vec2 rotate(vec2 p, float a)
	{
	return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
	}

vec2 circuit(vec2 p)
	{
	p = fract(p);
	float r = 0.223;
	float v = 0.0, g = 0.0;
	float test = 0.0;
	r = fract(r * 9184.928);
	float cp, d;
	
	d = p.x;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.y;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.x - 1.0;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.y - 1.0;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 10000.0);
	
	for(int i = 0; i < ITER; i ++)
		{
		cp = 0.5 + (r - 0.5) * 0.9;
		d = p.x - cp;
		g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 160.0);
		if(d > 0.0)
			{
			r = fract(r * 4829.013);
			p.x = (p.x - cp) / (1.0 - cp);
			v += 1.0;
			test = r;
			}
		else
			{
			r = fract(r * 1239.528);
			p.x = p.x / cp;
			test = r;
			}
		p = p.yx;
		}
	v /= float(ITER);
	return vec2(v, g);
	}

float box(vec2 p, vec2 b, float r)
	{
	return length(max(abs(p) - b, 0.0)) -r ;
	}

float rand(float p)
	{
	return fract(sin(p * 591.32) * 43758.5357);
	}

float rand2(vec2 p)
	{
	return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5357);
	}

vec2 rand2(float p)
	{
	return fract(vec2(sin(p * 591.32), cos(p * 391.32)));
	}

vec3 sky(vec3 rd, float t)
	{
	float u = atan(rd.z, rd.x) / PI / 2.0;
	float v = rd.y / length(rd.xz);
	float fg = exp(-0.04 * abs(v));
	vec2 ca = circuit(vec2(u, (v - t * 3.0) * 0.03));
	vec2 cb = circuit(vec2(-u, (v - t * 4.0) * 0.06));
	float c = (ca.x - ca.y * 0.2) + cb.y * 0.7;
	vec3 glow = pow(vec3(c), vec3(0.9, 0.5, .3) * 2.0);
	vec2 cr = vec2(u, (v - t * 5.0) * 0.03);
	float crFr = fract(cr.y);
	float r = smoothstep(1.8, 0.82, abs(crFr * 2.0 - 1.0));
	float vo = 0.0, gl = 0.0;
	for(int i = 0; i < 6; i ++)
		{
		float id = float(i);
		vec2 off = rand2(id);
		vec2 pp = vec2(fract(cr.x * 5.0 + off.x + t * 8.0 * (0.5 + rand(id))) - 0.5, fract(cr.y * 12.0 + off.y * 0.2) - 0.5);
		float di = box(pp, vec2(0.2, 0.01), 0.02);
		vo += smoothstep(0.999, 1.0, 1.0 - di);
		gl += exp(max(di, 0.0) * -16.0);
		}
	vo = pow(vo * 0.4, 2.0);
	vec3 qds = vec3(1.0);
	vec3 col = mix(glow, qds, clamp(vo, 0.0, 1.0)) + vec3(0.05, 0.05, 0.05) * gl * 0.5;
	return col + (1.0 - fg);
	}

vec3 colorset(float v)
	{
	return pow(vec3(v), vec3(0.4, 0.4, 0.4) * 10.0);
	}



vec3 pixel(vec2 uv)
	{
	uv /= resolution.xy;
	uv = uv * 2.0 - 1.0;
	uv.x *= resolution.x / resolution.y;
	vec3 ro = vec3(0.0, 0.0, -0.0);
	vec3 rd = normalize(vec3(uv, 1.6));
	float t = time* 1.25;
	float down = PI / 2.0;
	rd.yz = rotate(rd.yz, 0.0);
	rd.xz = rotate(rd.xz, down);
	rd.xy = rotate(rd.xy, down);
	vec3 col = sky(rd, t);
	return pow(col, vec3(1.9)) * 1.3;
	}



void main()
	{
	vec2 uv = gl_FragCoord.xy;
	vec3 col;
	vec2 h = vec2(0.0, 0.0);
	col = pixel(uv);
	col += pixel(uv + h.xy);
	col += pixel(uv + h.yx);
	col += pixel(uv + h.xx);
	col /= 4.0;
	gl_FragColor = vec4(col, 1.0);
	gl_FragColor.b *= 0.36;
	gl_FragColor.g *= 0.36;
	gl_FragColor.r *= 0.1;
		
	}
