// crowded cubes
// by FabriceNeyret2
// Adapted from https://www.shadertoy.com/view/MlSSRy by J.

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// using the base ray-marcher of Trisomie21: https://www.shadertoy.com/view/4tfGRB#

#define T time
#define r(v,t) v *= mat2( C = cos((t)*T), S = sin((t)*T), -S, C )

void main(void) {
    float C,S,r,x;
    vec4 p = vec4(gl_FragCoord.xy,0,1)/resolution.yyxy-.5, d; p.x-=.4; // init ray 
    r(p.xz,.13); r(p.yz,.2); r(p.xy,.1);   // camera rotations
    d = p;                                 // ray dir = ray0-vec3(0)
    p.z += 5.*T;
    gl_FragColor = vec4(0.);
    for (float i=1.; i>0.; i-=.01)  
    {
        vec4 u = floor(p/8.), t = mod(p, 8.)-4., M; // objects id + local frame
        r(t.xy,u.x); r(t.xz,u.y); r(t.yz,1.);    // objects rotations
   
        t = abs(t); M=max(t,t.yzxw);
        r = 1.2-cos(.2*T); 
        x = max(t.x,M.y)-r;
        if (sin(.1*T)>0.) x = max(x,(r-.1)-min(M.x,min(M.y,M.z)));
        if(x<.01)  // hit !
            { gl_FragColor = i*i*(1.+.2*t); break; } // color texture + black fog 

        p -= d*x;           // march ray
    }
    gl_FragColor.a = 1.;
}
