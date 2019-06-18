/*
 * Original shader from: https://www.shadertoy.com/view/MllBWS
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define sat(a) clamp(a, 0.0, 1.0)

vec2 dmin(vec2 a, vec2 b) {
    return a.x < b.x ? a : b;
}

float smoothmin(float a, float b, float k) {
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec2 rot(vec2 p, float a) {
    float s = sin(a);
    float c = cos(a);
    
    return mat2(c, s, -s, c)*p;
}

float cylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float segment(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a; 
    vec3 ba = b - a;
    
    float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
    
    return length(pa - ba*h) - r;
}

float straw(vec3 p) {
    p.x += 0.6;
    p.y -= 1.2;
    
    float s = cylinder(p, vec2(0.12 + 0.02*sin(100.0*p.y)*step(0.65, p.y), 0.8));
    
    p.y -= 0.97;
    p.x += 0.3;
	p.xy = rot(p.xy, -1.0);
    
    p.xy = rot(p.xy + vec2(0, 0.2), 0.2*sin(14.0*iTime)) - vec2(0, 0.2);
    float us = cylinder(p, vec2(0.12 + 0.02*sin(100.0*p.y)*step(0.15, -p.y), 0.4));
    us = max(us, -cylinder(p, vec2(0.09, 0.5)));
    s = min(s, us);
    
    return s;
}

float head(vec3 p) {
    p.y -= 1.0;
    
    float c = length(p) - 1.0;
    c = max(c, -(length(p) - 0.8));
    c = max(c, p.y - 0.3);
    
    p.x += 1.0;
    p.y += 0.3;
    
    float h = length(vec2(length(p.xy) - 0.5, p.z)) - 0.1;
    h = max(h, p.x - 0.4);
    
    h = smoothmin(h, c, 0.1);
    
    p.yz = rot(p.yz, sign(p.z)*0.3);
    float s = length((p - vec3(1.6, -0.37, 0))*vec3(1.6, 1.3, 0.7)) - 0.3;
    h = max(h, -s);
    
    return h;
}

float eyes(vec3 p) {
    vec3 op = p;
    
    p.y -= 1.07;
    p.x -= 0.65;
    
    p.y *= 0.7;
    p.z *= 0.7;
    
	p.z = abs(p.z) - 0.14;
    
    float e = length(p) - 0.4;
    e = max(e, p.y - 0.16);
    
    return max(e, -(length(op) - 0.8));
}

float innereyes(vec3 p) {    
    p.y -= 1.07;
    p.x -= 0.65;
    
    p.y *= 0.7;
    p.z *= 0.7;
    
    p.xy = rot(p.xy, 0.3);

    p.y *= 0.7;
    p -= vec3(0.3, -0.0, -0.0);
    
    p.z += 0.07*cos(10.0*iTime)*smoothstep(-0.2, 1.0, sin(iTime));
    p.z = abs(p.z) - 0.25;
    
    float e = length(p) - 0.15;
    return e;
}

float nose(vec3 p) {
    p.xy -= vec2(0.9, 0.6);
    return length(p*vec3(0.8, 1.2, 0.8)) - 0.1;
}

float torso(vec3 p) {
    vec3 q = p;
    
    p.xz *= 1.0 - 0.4*smoothstep(-1.1, 0.3, -p.y);
    float s = cylinder(p, vec2(0.45, 0.7));
    
    q.y += 0.4;
    s = min(s, max(length(q) - 0.83, q.y - 0.1));
    return s;
}

float legs(vec3 p) {
    p.z = -abs(p.z) + 0.4;
    
 
    float b = -0.1*cos(14.0*iTime);
    float l = segment(p + vec3(0, b, 0), 
                      vec3(0), 
                      vec3(0.1, -0.5, -0.3), 
                      0.17);
    
    l = min(l, segment(p + vec3(0, b, 0), 
                       vec3(0.1, -0.5, -0.3), 
                       vec3(-0.2, -1.0 + 1.2*b, 0), 0.17));
    
    p.yz = rot(p.yz, -0.4);
    return min(l, cylinder(p - vec3(0, 0.5 - b, 0), vec2(0.25, 0.5)));
}

float shoes(vec3 p) {
    p.y += 0.7;

    float b = -0.1*cos(14.0*iTime);
    p.z = -abs(p.z) + 0.4;

    vec3 heel = vec3(-0.2, 0.1-b, 0);
    vec3 toes = vec3(0.3, 0, -0.4);
    
    
    float sh = segment(p*vec3(0.8, 1.0, 0.8), heel, toes, 
                       0.25 + 0.14*smoothstep(0.0, 0.7, p.x));
    
    return sh;
}

float arms(vec3 p) {
    p.y -= 0.2;
    p.z = -abs(p.z) + 0.85;
    
    p.z -= 0.75;
    p.yz = rot(p.yz, -0.6*smoothstep(-1.0, 0.5, p.y));
    p.z += 0.75;
    float a = segment(p, vec3(0), vec3(0, -0.7, -0.3), 0.08);
    
    return a;
}

float hands(vec3 p) {
    p *= 0.9;
    p.y -= 0.4;
    p.z = -abs(p.z) + 1.07;
    
    float s = length((p - vec3(0, 0.1, 0))*vec3(1.2, 1.4, 1.2)) - 0.35;
    s = min(s, length((p - vec3(0, 0.4, 0))*vec3(1, 1.6, 1)) - 0.2);
    
    s = smoothmin(s, segment(p - vec3(0.0, 0.16, 0.17), 
                             vec3(0), 
                             vec3(-0.1, -0.2, 0.2), 0.08), 0.1);
    
    s = smoothmin(s, segment(p - vec3(0.0, 0.16, 0.17),
                             vec3(-0.1, -0.2, 0.2),
                             vec3(-0.1, -0.3, 0.1), 0.08), 0.01);
    
    p.z = -abs(p.z) + 0.12;
    p.z = -abs(p.z) + 0.05;
    
    p.x -= 0.1;
    p.y += 0.05;
    s = smoothmin(s, segment(p, vec3(0), vec3(0, -0.12, 0), 0.07), 0.1);
    s = smoothmin(s, segment(p, vec3(0, -0.12, 0), vec3(-0.2, -0.1, 0), 0.07), 0.02);
    return s;
}

#define SHOES 1.0
#define LEGS 2.0
#define HANDS 3.0
#define TORSO 4.0
#define HEAD  5.0
#define STRAW 6.0
#define EYES 7.0
#define INNEREYES 8.0
#define NOSE 9.0

vec2 de(vec3 p) {
    vec2 f = vec2(min(p.y + 1.0, p.x + 3.0), 0.0);
    vec2 sh = vec2(shoes(p), SHOES);
    
    p.y -= 0.2*cos(14.0*iTime);
	p.y -= 0.6;
    vec2 l = vec2(legs(p), LEGS);
    vec2 ds = vec2(hands(p), HANDS);
    p.y -= 1.35;
    
    vec2 t = vec2(smoothmin(torso(p), arms(p), 0.4), TORSO);
    
    p.y -= 0.6;
    vec2 h = vec2(head(p), HEAD);
    vec2 s = vec2(straw(p), STRAW);
    vec2 e = vec2(eyes(p), EYES);
    vec2 ie = vec2(innereyes(p), INNEREYES);
    vec2 m = vec2(nose(p), NOSE);
    
    vec2 ret = dmin(f, sh);
    ret = dmin(ret, dmin(l, t));
    ret = dmin(ret, dmin(h, s));
    ret = dmin(ret, e);
    ret = dmin(ret, ie);
    ret = dmin(ret, ds);
    ret = dmin(ret, m);
    
    return ret;
}

vec2 trace(vec3 o, vec3 d, float x) {
    float t = 0.0;
    float m = -1.0;
    
    for(int i = 0; i < 100; i++) {
        vec2 d = de(o + d*t);
        if(d.x < 0.001 || t >= x) break;
        t += d.x*0.85;
        m = d.y;
    }
    
    return vec2(t, t < x ? m : -1.0);
}

vec3 normal(vec3 p) {
    vec2 h = vec2(0.001, 0.0);
    vec3 n = vec3(
        de(p + h.xyy).x - de(p - h.xyy).x,
        de(p + h.yxy).x - de(p - h.yxy).x,
        de(p + h.yyx).x - de(p - h.yyx).x
    );
    return normalize(n);
}


float ao(vec3 p, vec3 n) {
    float o = 0.0, s = 0.005, w = 1.0;
    for(int i = 0; i < 15; i++) {
        float d = de(p + n*s).x;
        o += (s - d)*w;
        w *= 0.98;
        s += s/float(i + 1);
    }
    return 1.0 - sat(o);
}

mat3 camera(vec3 e, vec3 l) {
    vec3 w = normalize(l - e);
    vec3 u = normalize(cross(vec3(0, 1, 0), w));
    vec3 v = normalize(cross(w, u));
    
    return mat3(u, v, w);
}

vec3 materail(vec3 p, float m) {
    p.y -= 0.2*cos(14.0*iTime);
    
    if(m == 0.0) {
        return vec3(1.5);
    } else if(m == STRAW) {
        p.xy = rot(p.xy, -1.0*step(4.4, p.y));
    	vec3 m = vec3(1.5, 0, 0);
        m += vec3(0.5, 2.0, 2.0)*smoothstep(0.3, 0.8, abs(cos(10.0*p.y)));
        
        return m;
    } else if(m == TORSO) return vec3(0.1) + vec3(1, 0, 0)*step(-1.63, -p.y);
    else if(m == HANDS) return vec3(2.0);
    else if(m == EYES) return vec3(2.0);
    else if(m == INNEREYES) return vec3(0.1);
    else if(m == NOSE) return vec3(1.5, 0.1, 0.1);
    else if(m == SHOES) return vec3(1.09, 0.54, 0.14);
    else if(m == LEGS) {
        p.z = -abs(p.z) + 0.4;
        p.yz = rot(p.yz, -0.4);
        
        p.y -= 0.1*cos(14.0*iTime);;
        
        if(p.y > 0.52) return vec3(1.1, 0.1, 0.1);
        else return vec3(1);
	} else return vec3(1);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
    vec2 mo = iMouse.z == 0.0
        ? vec2(1.5, 1.0)
        : (-iResolution.xy + 4.0*iMouse.xy)/iResolution.y;
    
    float at = 0.5*iTime;
    
    vec3 ro = vec3(7.0*sin(mo.x), 1.0 + 2.0*mo.y, 7.0*cos(mo.x));
    vec3 rd = camera(ro, vec3(0, 2.5, 0))*normalize(vec3(p, 1.97));
    
    vec3 col = vec3(0);
    vec3 lig = normalize(vec3(0.8, 0.7, -0.6));
    
    vec2 t = trace(ro, rd, 50.0);
    if(t.x < 50.0) {
        vec3 pos = ro + rd*t.x;
        vec3 nor = normal(pos);
        vec3 ref = reflect(rd, nor);
        
        float occ = ao(pos, nor);
        float sha = step(15.0, trace(pos+nor*0.001, lig, 15.0).x);
        
        col += 0.5*occ;
        col += sat(dot(lig, nor))*occ*sha;
        col += pow(sat(1.0 + dot(rd, nor)), 2.0)*occ;
        col += 2.0*pow(sat(dot(lig, ref)), 20.0)*occ;
        
        col *= materail(pos, t.y);
    }
    
    col = mix(vec3(0), col, exp(-0.1*t.x));
    
    col = 1.0 - exp(-0.5*col);
    col = pow(col, vec3(1.0/2.2));
    
    fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
