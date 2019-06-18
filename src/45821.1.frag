/*
 * Original shader from: https://www.shadertoy.com/view/MddcWs
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
mat2 rot(float x) {
    return mat2(cos(x), sin(x), -sin(x), cos(x));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

vec2 map(vec3 p, float k) {
    float m = 0.0;
	vec3 q = abs(p);
    float d = max(q.x, max(q.y, q.z)) - 1.0;
    float c = 0.9;
    d = max(d, c - max(q.y, q.z));
    d = max(d, c - max(q.x, q.z));
    d = max(d, c - max(q.x, q.y));
    q.x = abs(q.x - 1.5);
    float u = max(q.x, q.y) - 0.25;
    if (u < d) {
        d = u;
        m = 1.0;
    }
    return vec2(d, m);
}

float trace(vec3 o, vec3 r, float k) {
    float t = 0.0;
    for (int i = 0; i < 16; ++i) {
        t += map(o + r * t, k).x;
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 fc = vec3(0.0);
    float fct = 1000.0;
    
    const int n = 4;
    for (int i = 0; i < n; ++i) {
        float fi = float(i) / float(n);
        float fb = 1.0;
        float tc = iTime * 0.25;
        float ft = (1.0 - fract(tc + fi)) * fb;
        
        vec3 pr = normalize(vec3(uv, 1.0));
        vec3 po = vec3(0.0, 0.0, -0.5);
        
        float pt = (ft - po.z) / pr.z;
        vec3 pw = po + pr * pt;
        float ps = 1.0 - pw.z / fb;
        
        vec2 st = pw.xy;

        float rd = mod(float(i), 2.0) * 2.0 - 1.0;
        st *= rot(float(i) * 3.141592 * 0.5 + iTime * 0.25);
        
        float ts = pow(ps, 4.0);
        float se = max(abs(st.x) - ts, 0.0);
        st.x += sign(-st.x) * ts;// * vec2(1.0, rd);
        float sm = sign(se);
        float sd = 1.0 / (1.0 + se * 50.0);
        
        vec3 r = normalize(vec3(st, 1.0));
        vec3 o = vec3(0.0, 0.0, -5.0);
        
        r.yz *= rot(fi + iTime);
        o.yz *= rot(fi + iTime);

        float t = trace(o, r, fi);
        vec3 w = o + r * t;
        vec2 fd = map(w, fi);

        float sa = 1.0 / (1.0 + pt * pt * 0.1);
        float ss = 1.0 / (1.0 + t * t * 0.01 + fd.x * 100.0);
        float pb = ps * (1.0 - ps) * 4.0;

        if (pt < fct && sm > 0.0) {
            vec3 ca = vec3(0.0, 0.0, 1.0);
            vec3 cb = vec3(1.0, 0.0, 0.0);
        	fc = mix(ca, cb, fd.y);
            fc = mix(vec3(1.0), fc, ss);
        	fc = mix(fc, vec3(0.75), sd) * sa;
            fc *= 1.0 - pow(1.0 - ps, 4.0);
            fct = pt;
        }
    }

    fragColor = vec4(fc, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
