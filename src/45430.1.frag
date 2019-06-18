#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define PI 3.14159265358979323846

#define u_resolution resolution
#define u_time time

float soc(vec3 p) {
    vec3 n = normalize(sign(p+1e6));
    return min(min(dot(p.xy, n.xy), dot(p.yz, n.yz)), dot(p.xz, n.xz));
}

mat2 r2d(float a) {
    float sa=sin(a);
    float ca=cos(a);
    return mat2(ca,sa,-sa,ca);
}

vec2 amod(vec2 p, float m) {
    float a=mod(atan(p.x,p.y), m)-m*.5;
    return vec2(cos(a), sin(a))*length(p);
}

float map(vec3 p) {
    // mat2 r = r2d(u_time);
    float d = 1.0;
    vec3 o=p;
    float a=mod(o.y+5.0+u_time, 20.0)-10.;
    a = abs(o.y);

    // p.yz *= r2d(sign(a)*u_time*.5);
    p.xz *= r2d(sign(a)*u_time*.2);

    p.xz = amod(p.xz, PI/4.);

    p.xz = max(abs(p.xz)-3.692, -1.296);
    // p.x = mod(p.x, 4.)-2.;
    // p.z = mod(p.z, 4.)-2.;
    p.y = mod(p.y+u_time, 10.)-5.;
    
    
    d = min(d, soc(max(abs(p)-0.172, 0.)));
    
    return d;
    return min(d, length(abs(o.xz*r2d(o.y-u_time*.6))-1.)*0.336);
    // return length(p)-0.5;
}

void main() {
    vec2 st = (gl_FragCoord.xy/u_resolution.xy)*2.-1.;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 ro=vec3(st, 5.000),
    	rd=normalize(vec3(st+vec2(0.), -0.944)),
	    // rd=vec3(st, -1.),
    	mp;
    float md;
	mp = ro;
    
    for (int i=0; i<50; i++) {
        md = map(mp);
        if (md <.001) break;
        mp += rd*md;
    }

    gl_FragColor = vec4(length(ro-mp)*0.020);
}
