/*
 * Original shader from: https://www.shadertoy.com/view/4lGcz1
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //

const float PI = 3.1415926;

vec3 rgb2hsv(vec3 hsv)
{
	vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(vec3(hsv.x) + t.xyz) * 6.0 - vec3(t.w));
	return hsv.z * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), hsv.y);
}

mat2 rotate(float a)
{
	float s = sin(a);
	float c = cos(a);
	return mat2(
		c, -s,
		s, c
	);
}

float rand(vec4 co)
{
    return fract(sin(dot(co, vec4(12.9898, 78.233, 15.2358, 29.23851))) * 43758.5453);
}

float groundDist(vec3 pos)
{
	pos.y += sin(pos.z * 0.2 + pos.x + iTime * 10.0) * 0.5;
	pos.x = mod(pos.x, 4.0) - 2.0;
	return length(pos.yx);
}

float particleDist(vec3 pos)
{
    pos += cross(sin(pos * 0.05 + iTime), cos(pos * 0.05 + iTime)) * 3.0;
    pos.z += iTime * 200.0;
    vec3 id = floor(pos / 16.0);
    pos = mod(pos, 16.0) - 8.0;
    pos += vec3(rand(vec4(id, 0.0)), rand(vec4(id, 1.0)), rand(vec4(id, 2.0))) * 10.0 - 5.0;
	return max(length(pos.yx), abs(pos.z) - 2.0);
}

float skyDist(vec3 pos)
{
	pos.z += iTime * 50.0;
    vec3 id = floor(pos / 50.0);
    
    vec3 t = iTime * vec3(0.0125, 0.25, 0.5);
    vec3 a = vec3(rand(vec4(id, floor(t.x))), rand(vec4(id + 10.0, floor(t.y))), rand(vec4(id + 20.0, floor(t.z))));
    vec3 b = vec3(rand(vec4(id, floor(t.x + 1.0))), rand(vec4(id + 10.0, floor(t.y + 1.0))), rand(vec4(id + 20.0, floor(t.z + 1.0))));
    vec3 c = mix(a, b, pow(fract(t), vec3(1.0 / 4.0)));
    
    float s = sign(mod(id.x + id.y + id.z + 0.5, 2.0) - 1.0);
    vec3 u = iTime / 3.0 + vec3(1.0, 2.0, 3.0) / 3.0;
    vec3 d = floor(u);
    vec3 e = floor(u + 1.0);
    vec3 f = mix(d, e, pow(fract(u), vec3(1.0 / 8.0)));
    
	pos = mod(pos, 50.0) - 25.0;
	for (int i = 0; i < 3; ++i)
	{
	    pos.yz = rotate(f.x * PI / 2.0 * s) * pos.yz;
	    pos.xz = rotate(f.y * PI / 2.0 * s) * pos.xz;
	    pos.xy = rotate(f.z * PI / 2.0 * s) * pos.xy;
		pos = abs(pos);
		pos -= (c * 12.0);
		pos *= 2.0;
		if (pos.x > pos.z) pos.xz = pos.zx;
		if (pos.y > pos.z) pos.yz = pos.zy;
		if (pos.x < pos.y) pos.xy = pos.yx;
	}
	return length(pos.xz) / 8.0;
}

float dist(vec3 pos)
{
	float d = 3.402823466E+38;
	d = min(d, groundDist(pos));
	d = min(d, skyDist(pos));
	return d;
}

vec3 calcNormal(vec3 pos)
{
	vec2 ep = vec2(0.001, 0.0);
	return normalize(vec3(
		dist(pos + ep.xyy) - dist(pos - ep.xyy),
		dist(pos + ep.yxy) - dist(pos - ep.yxy),
		dist(pos + ep.yyx) - dist(pos - ep.yyx)
	));
}

vec3 calcColor(vec3 pos)
{
	return rgb2hsv(vec3(pos.x * 0.04 + iTime, 1, 1));
}

vec3 march(vec3 pos, vec3 dir)
{
    vec3 color = vec3(0.0, 0.0, 0.0);
	for (int i = 0; i < 32; ++i)
	{
		float d = dist(pos);
		pos += dir * d * 0.9;
		color += max(vec3(0.0), 0.02 / d * calcColor(pos));
	}
	
	return color;
}

vec3 marchParticle(vec3 pos, vec3 dir)
{
    vec3 color = vec3(0.0, 0.0, 0.0);
	for (int i = 0; i < 32; ++i)
	{
		float d = particleDist(pos);
		pos += dir * d * 0.9;
		color += max(vec3(0.0), 0.005 / d * vec3(1.0, 1.0, 1.0));
	}
	
	return color;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
	
	vec3 pos = vec3(0, 0.0, -10);
	vec3 dir = normalize(vec3(p, 1.0));
	dir.yz = rotate(-0.5) * dir.yz;
	pos.yz = rotate(-0.5) * pos.yz;
	dir.xz = rotate(sin(iTime) * 0.3) * dir.xz;
	pos.xz = rotate(sin(iTime) * 0.3) * pos.xz;
	dir.xy = rotate(0.1 + sin(iTime * 0.7) * 0.1) * dir.xy;
	pos.xy = rotate(0.1 + sin(iTime * 0.7) * 0.1) * pos.xy;
	
	vec3 color = vec3(0, 0, 0) * length(p.xy) * sin(iTime * 10.0);
	
	color += march(pos, dir);
	color += marchParticle(pos, dir);
	
	fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
