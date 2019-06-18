/*
 * Original shader from: https://www.shadertoy.com/view/4dGyzR
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
/* greetings to shadertoy friends everywhere! */
/* no textures were harmed in the making of this shader */

mat2 rot(float x) {
    return mat2(cos(x), sin(x), -sin(x), cos(x));
}

float map(vec3 p) {
	vec3 q = abs(p);
    float c = 0.9;
    float d = max(q.x, max(q.y, q.z)) - 1.0;
    d = max(d, c - max(q.y, q.z));
    d = max(d, c - max(q.x, q.z));
    d = max(d, c - max(q.x, q.y));
    return d;
}

float trace(vec3 o, vec3 r) {
    float t = 0.0;
    for (int i = 0; i < 16; ++i) {
        t += map(o + r * t);
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 fc = vec3(0.0);
    float m = 1.0;
    
    for (int n = 0; n < 5; ++n) {
        vec3 po = vec3(0.0, 0.0, iTime * 0.5);
        vec3 pr = normalize(vec3(uv, 1.0));
        
        pr.xz *= rot(sin(iTime * 0.25) * 0.25);

        float td = 0.75 + float(n);
        
        float pt = 0.0;
        for (int i = 0; i < 16; ++i) {
            vec3 mp = po + pr * pt;
            pt += td - length(mp.xy);
        }

        vec3 pw = po + pr * pt;
        
        pw.xy /= td;

        float tc = 5.0;
        
        pw.xy *= rot(iTime * 0.125 * (mod(floor(pw.z / tc) + float(n), 2.0) * 2.0 - 1.0));
        
        pw.z = (fract(pw.z / tc) - 0.5) * tc;

        vec3 st = vec3(atan(pw.y, pw.x) / 3.141592, length(pw), 1.0);

        st.x = abs(st.x) - 0.5;
        st.y -= 0.5;

        st.xy *= 1.0 + float(n) * 0.125;

        for (int i = 0; i < 8; ++i) {
            st.xy = abs(st.xy) - 0.5;
            st.xy *= rot(3.141592 * 0.25);
            st *= 1.1;
        }

        st.xy /= st.z;

        vec3 r = normalize(vec3(st.xy, 1.0));
        vec3 o = vec3(0.0, 0.0, -4.0 - float(n));
        
        float t = trace(o, r);
        vec3 w = o + r * t;
        float fd = map(w);

        float f = 1.0 / (1.0 + pt * pt * 0.1 + fd * 100.0);
        
        float tb = 1.0 / (1.0 + t * t * 0.1);
        vec3 tex = mix(vec3(1.0, 0.25, 0.25), vec3(0.5, 1.0, 0.5), tb);
        fc += tex * f * m;
        m *= max(sign(fd - 0.1), 0.0);
    }

    fragColor = vec4(fc, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
