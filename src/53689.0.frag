/*
 * Original shader from: https://www.shadertoy.com/view/ltSGDh
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

// Emulate a black texture
#define texture(s, uv) vec4(0.)

// --------[ Original ShaderToy begins here ]---------- //
const float pi = 3.14159;

mat3 xrot(float t)
{
    return mat3(1.0, 0.0, 0.0,
                0.0, cos(t), -sin(t),
                0.0, sin(t), cos(t));
}

mat3 yrot(float t)
{
    return mat3(cos(t), 0.0, -sin(t),
                0.0, 1.0, 0.0,
                sin(t), 0.0, cos(t));
}

mat3 zrot(float t)
{
    return mat3(cos(t), -sin(t), 0.0,
                sin(t), cos(t), 0.0,
                0.0, 0.0, 1.0);
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float smin( float a, float b, float k )
{
    float res = exp( -k*a ) + exp( -k*b );
    return -log( res )/k;
}

float map(vec3 pos, float q)
{
    float so = q;
    float sr = atan(pos.z,pos.x);
    so += pos.y * 0.5;
    so += sin(pos.y*75.0+sr-iTime) * 0.005;
    so += sin(pos.y*125.0+sr-iTime*10.0) * 0.004;
    float ro = pos.y*10.0-iTime;
    pos.xz += vec2(cos(ro), sin(ro)) * 0.07;
	float d = sdCappedCylinder(pos, vec2(so, 10.0));
    float k = pos.y;
    return smin(d,k,10.0);
}

vec3 surfaceNormal(vec3 pos)
{
 	vec3 delta = vec3(0.01, 0.0, 0.0);
    vec3 normal;
    normal.x = map(pos + delta.xyz,0.0) - map(pos - delta.xyz,0.0);
    normal.y = map(pos + delta.yxz,0.0) - map(pos - delta.yxz,0.0);
    normal.z = map(pos + delta.zyx,0.0) - map(pos - delta.zyx,0.0);
    return normalize(normal);
}

float trace(vec3 o, vec3 r, float q)
{
	float t = 0.0;
    float ta = 0.0;
    for (int i = 0; i < 8; ++i) {
        float d = map(o + r * t, q);
        t += d * 1.0;
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 r = normalize(vec3(uv, 1.0));
    float tn = texture(iChannel0,vec2(iTime*0.1,0.0)).x;
    tn = tn * 2.0 - 1.0;
    r *= zrot(sin(tn)*0.2) * xrot(-pi*0.05+sin(tn)*0.1);
    
    vec3 o = vec3(0.0, 0.15, -0.5);
    
    float t = trace(o, r, 0.0);
    vec3 world = o + r * t;
    vec3 sn = surfaceNormal(world);
    
    vec3 vol = vec3(0.0);
    
    for (int i = 0; i < 3; ++i) {
        float rad = 0.2+float(1+i)/3.0;
        float tt = trace(o,r,rad);
        vec3 wa = o + r * tt;
        float atlu = atan(wa.x,wa.z) - tt * 4.0 + iTime;
        float atlv = acos(wa.y/length(wa)) + tt * 4.0;
        vec3 at = texture(iChannel0, vec2(atlu,atlv)).xxx;
        vol += at / 3.0;
    }
    
    float prod = max(dot(sn, -r), 0.0);
    
    float fd = map(world, 0.0);
    float fog = 1.0 / (1.0 + t * t * 0.1 + fd * 10.0);
    
    vec3 sky = vec3(148.0,123.0,120.0) / 255.0;
    
    vec3 fgf = vec3(210.0,180.0,140.0) / 255.0;
    vec3 fgb = vec3(139.0,69.0,19.0) / 255.0;
    vec3 fg = mix(fgb, fgf, prod);
    
    vec3 back = mix(fg, sky, 1.0-fog);
    
    vec3 mmb = mix(vol, back, 0.8);
    
    vec3 fc = mmb * vec3(1.0);
    
	fragColor = vec4(fc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
