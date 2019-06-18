/*
 * Original shader from: https://www.shadertoy.com/view/WlX3RM
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
const float sphereSize = 1.0;
const vec3 lightDir = vec3(-0.577, 0.577, 0.577);

vec3 hsv2rgb(vec3 c)
{
  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
  vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
  return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}

vec3 rotate(vec3 p, float angle, vec3 axis)
{
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float r = 1.0 - c;
    mat3 m = mat3(
              a.x * a.x * r + c,  a.y * a.x * r + a.z * s,  a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,        a.y * a.y * r + c,  a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,  a.y * a.z * r - a.x * s,  a.z * a.z * r + c
    );
    return m * p;
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float box(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);
}

float torus(vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
	return length(q)-t.y;
}

float sub(float d1, float d2)
{
    return max(-d1, d2);
}

float distanceFunc(vec3 p)
{
    float d1 = box(rotate(p, iTime * 0.3, vec3(1.0, 0.5, 1.0)), vec3(0.5));
    float d2 = sphere(p, 0.65);
    float d3 = torus(rotate(p, iTime, vec3(1.0, 0.5, 0.0)), vec2(0.7, 0.2));
    float d4 = sub(d2, d1);
    
    int pair = int(floor(mod(iTime * 0.5, 4.0)));
    float a = smoothstep(0.2, 0.7, mod(iTime * 0.5, 1.0));
    
    if(pair == 0) return mix(d1, d2, a);
    if(pair == 1) return mix(d2, d3, a);
    if(pair == 2) return mix(d3, d4, a);
    else		  return mix(d4, d1, a);
}

vec3 getNormal(vec3 pos)
{
    float d = 0.0001;
    return normalize(vec3(
        distanceFunc(pos + vec3(  d, 0.0, 0.0)) - distanceFunc(pos + vec3( -d, 0.0, 0.0)),
        distanceFunc(pos + vec3(0.0,   d, 0.0)) - distanceFunc(pos + vec3(0.0,  -d, 0.0)),
        distanceFunc(pos + vec3(0.0, 0.0,   d)) - distanceFunc(pos + vec3(0.0, 0.0,  -d))));
}

float circle(vec2 pos)
{
    return length(pos);
}

float square(vec2 pos)
{
  vec2 a = pow(abs(pos), vec2(1.0));
  return pow(a.x + a.y, 1.0);
}

float heart(vec2 pos)
{
	pos = (pos - vec2(0.5, 0.48)) * vec2(2.1, -2.8);

	return pow(pos.x, 2.0) + pow(pos.y - sqrt(abs(pos.x)), 2.0);
}

float create2DShape(vec2 pos)
{
    pos = vec2(0.5) - pos;
    float s1 = circle(pos);
    float s2 = square(pos);
    float s3 = heart(pos + vec2(0.5));
    
    int pair = int(floor(mod(iTime, 3.0)));
    float a = smoothstep(0.2, 0.7, mod(iTime, 1.0));
    
    if(pair == 0) return mix(s1, s2, a);
    if(pair == 1) return mix(s2, s3, a);
    else		  return mix(s3, s1, a);
}

float createScreenTone(vec2 pos, float NdotL)
{
    float iNdotL = 1.0 - NdotL;
    iNdotL *= 0.5;
                
    pos = pos * 50.0 * iNdotL;
    pos.x += step(1.0, mod(pos.y, 2.0)) * 0.5;
    pos = fract(pos);

    float r = 0.7 * iNdotL;
    return smoothstep(r, r + 0.15, create2DShape(pos));
}

vec4 render(vec2 pos)
{
    vec3 cPos = vec3(0.0,  0.0,  1.25);
    vec3 cDir = vec3(0.0,  0.0, -1.0);
    vec3 cUp  = vec3(0.0,  1.0,  0.0);
    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.0;
    
    vec3 ray = normalize(cSide * pos.x + cUp * pos.y + cDir * targetDepth);
    
    float d = 0.0;
    float rLen = 0.0;
    vec3  rPos = cPos;
    for(int i = 0; i < 32; ++i)
    {
        d = distanceFunc(rPos);
        rLen += d;
        rPos = cPos + ray * rLen;
    }
    
    if(abs(d) < 0.001)
    {
        vec3 normal = getNormal(rPos);
        float nDotL = dot(lightDir + vec3(acos(cos(iTime * 0.7)), 0.0, 0.0), normal);
		nDotL = nDotL > 0.65 ? 1.0 
			: nDotL > 0.3 ? 0.5
			: 0.1;
        
		float tone = createScreenTone(pos, nDotL);
        vec3 hsv = vec3(abs(sin(iTime * 0.5)), 1.0, 0.7);
		vec3 color = mix(hsv2rgb(hsv), vec3(1.0), tone);
        
        return vec4(color, 1.0);
    }
    else
    {
        pos = pos + vec2(0.5);
        pos = fract(pos * 2.0);
        return vec4(vec4(0.3) - step(0.1, 0.4 * create2DShape(pos)));
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord.xy * 2.0 - iResolution.xy) 
        / min(iResolution.x, iResolution.y);

    vec4 color = vec4(0);
    const int iter = 3;
    for(int i = 1; i <= iter; ++i)
    {
        float fi = float(i);
        vec2 offset = (vec2(step(fi, 2.0), mod(fi, 2.0)) - 0.5) * 0.005;
        color += render(uv + offset);
    }

    color /= float(iter);
    fragColor = color;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
