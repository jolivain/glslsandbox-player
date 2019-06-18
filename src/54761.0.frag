/*
 * Original shader from: https://www.shadertoy.com/view/lsKSRz
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
mat2 rot(float t)
{
    return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float go = 0.0;
float anim(float t)
{
    float gt = fract((iTime + go) * 0.125) * 10.0;
    float it = clamp(gt - t, 0.0, 1.0);
    it = smoothstep(0.0, 1.0, it);
    return it;
}

float face(vec3 p, float t)
{
    vec3 join = vec3(3.0, 0.0, 0.0);
    mat2 jr = rot((1.0-anim(t + 1.0)) * 1.57 * sign(p.x));
    
    vec2 bs = vec2(0.05, 1.0);
	vec3 bx = vec3(abs(p.x), p.y, p.z);
    bx.z -= (1.0 - anim(t)) * 10.0 * sign(p.x);
    bx -= join;
    bx.xz *= jr;
    bx.yz *= rot(anim(t+1.0) * 3.14);
    bx += join;
    float ho = anim(t + 2.0);
    bx.x += -2.0 - bs.x + ho;
    float d = udBox(bx, bs.xyy);
    vec3 ax = vec3(abs(p.x), p.y, p.z);
    ax.z -= (1.0 - anim(t)) * 10.0 * sign(p.x);
	ax.x -= anim(t + 3.0) * 10.0;
    
    ax.x += ho;
    vec3 rax = ax;
    rax -= join;
    rax.xz *= jr;
    rax += join;
    
    vec3 g = vec3(rax.x, rax.y, rax.z);
    vec3 end = vec3(2.0+0.1, 0.0, 0.0);    
    float aa = sdCapsule(g, end, join, 0.1);
    float aj = length(ax - join) - 0.25;
    vec3 ep = vec3(3.0, 0.0, 1.0 * sign(p.x));
    ax -= join;
    ax.yz *= rot(anim(t+2.0)*6.28*5.0);
    ax += join;
    float ab = sdCapsule(ax, join, ep, 0.1);
    float a = min(min(aa, ab), aj);
    
    return min(d, a);
}

float map(vec3 p)
{
	float fx = face(p, 0.0);
    float fy = face(p.zxy, 1.0);
    float fz = face(p.yzx, 2.0);
    return min(min(fx, fy), fz);
}

float trace(vec3 o, vec3 r)
{
    float t = 0.0;
    for (int i = 0; i < 32; ++i) {
        vec3 p = o + r * t;
        float d = map(p);
        t += d;
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 fc = vec3(0.0);
    float gt = 1000.0;
    
    for (int i = 0; i < 3; ++i) {
        float fi = float(i);
    
        go = fi * 12.0;
        
        vec3 r = normalize(vec3(uv, 1.0 - anim(5.0) * 0.5));
        r.xz *= rot(iTime);
        r.xy *= rot(1.57 * 0.5);

        vec3 o = vec3(0.0, 0.0, -5.0);
        o.xz *= rot(iTime);
        o.xy *= rot(1.57 * 0.5);

        float t = trace(o, r);

        float fog = 1.0 / (1.0 + t * t * 0.1);
        
        if (t < gt) {
            gt = t;
            fc = vec3(fog);
        }
    }
    
	fragColor = vec4(fc, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
