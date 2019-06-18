/*
 * Original shader from: https://www.shadertoy.com/view/WsSGWG
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec4 date;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.141592654

mat2 rot(float x)
{
    return mat2(cos(x), sin(x), -sin(x), cos(x));
}

vec2 foldRotate(in vec2 p, in float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI * 2. / s;
    a = floor(a / n) * n;
    p *= rot(a);
    return p;
}

float sdRect( vec2 p, vec2 b )
{
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y),0.0) + length(max(d,0.0));
}

// TheGrid by dila
// https://www.shadertoy.com/view/llcXWr
float tex(vec2 p, float z)
{
    p = foldRotate(p, 8.0);
    vec2 q = (fract(p / 10.0) - 0.5) * 10.0;
    for (int i = 0; i < 3; ++i) {
        for(int j = 0; j < 2; j++) {
        	q = abs(q) - .25;
        	q *= rot(PI * .25);
        }
        q = abs(q) - vec2(1.0, 1.5);
        q *= rot(PI * .25 * z);
		q = foldRotate(q, 3.0);  
    }
	float d = sdRect(q, vec2(1., 1.));
    float f = 1.0 / (1.0 + abs(d));
    return smoothstep(.9, 1., f);
}

// The Drive Home by BigWings
// https://www.shadertoy.com/view/MdfBRX
float Bokeh(vec2 p, vec2 sp, float size, float mi, float blur)
{
    float d = length(p - sp);
    float c = smoothstep(size, size*(1.-blur), d);
    c *= mix(mi, 1., smoothstep(size*.8, size, d));
    return c;
}

vec2 hash( vec2 p ){
	p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
	return fract(sin(p)*43758.5453) * 2.0 - 1.0;
}

float dirt(vec2 uv, float n)
{
    vec2 p = fract(uv * n);
    vec2 st = (floor(uv * n) + 0.5) / n;
    vec2 rnd = hash(st);
    return Bokeh(p, vec2(0.5, 0.5) + vec2(0.2) * rnd, 0.05, abs(rnd.y * 0.4) + 0.3, 0.25 + rnd.x * rnd.y * 0.2);
}

float sm(float start, float end, float t, float smo)
{
    return smoothstep(start, start + smo, t) - smoothstep(end - smo, end, t);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    uv *= 2.0;
    
    vec3 col = vec3(0.0);
    #define N 6
    #define NN float(N)
    #define INTERVAL 3.0
    #define INTENSITY vec3((NN * INTERVAL - t) / (NN * INTERVAL))
    

    for(int i = 0; i < N; i++) {
        float t;
        float ii = float(N - i);
        t = ii * INTERVAL - mod(iTime - INTERVAL * 0.75, INTERVAL);
        col = mix(col, INTENSITY, dirt(uv * max(0.0, t) * 0.1 + vec2(0.2, -0.2) * iTime + ii, 3.5));
        
        t = ii * INTERVAL - mod(iTime + INTERVAL * 0.5, INTERVAL);
        col = mix(col, INTENSITY * vec3(0.7, 0.8, 1.0) * 1.3,tex(uv * max(0.0, t), 4.45));
        
        t = ii * INTERVAL - mod(iTime - INTERVAL * 0.25, INTERVAL);
        col = mix(col, INTENSITY * vec3(1.), dirt(uv * max(0.0, t) * 0.1 + vec2(-0.2, -0.2) * iTime + ii, 3.5));
        
        t = ii * INTERVAL - mod(iTime, INTERVAL);
    	float r = length(uv * 2.0 * max(0.0, t));
    	float rr = sm(-24.0, -0.0, (r - mod(iTime * 30.0, 90.0)), 10.0);
        col = mix(col, mix(INTENSITY * vec3(1.), INTENSITY * vec3(0.7, 0.5, 1.0) * 3.0, rr),tex(uv * 2.0 * max(0.0, t), 0.27 + (2.0 * rr)));

    }

	fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
