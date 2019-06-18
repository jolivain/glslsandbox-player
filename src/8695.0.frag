// 00f404afdd835ac3af3602c8943738ea
// see notes in code; please annotate any changes (with source URLs if relevant.)
// http://glsl.heroku.com/e#5304.24
//
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float _MinStep = 0.05;

//////////////////////////////////////////////////////////////
// http://www.gamedev.net/topic/502913-fast-computed-noise/
// replaced costly cos with z^2. fullreset
vec4 random4 (const vec4 x) {
    vec4 z = mod(mod(x, vec4(5612.0)), vec4(3.1415927 * 2.0));
    return fract ((z*z) * vec4(56812.5453));
}
const float A = 1.0;
const float B = 57.0;
const float C = 113.0;
const vec3 ABC = vec3(A, B, C);
const vec4 A3 = vec4(0, B, C, C+B);
const vec4 A4 = vec4(A, A+B, C+A, C+A+B);
float cnoise4 (const in vec3 xx) {
    vec3 x = xx; // mod(xx + 32768.0, 65536.0); // ignore edge issue
    vec3 fx = fract(x);
    vec3 ix = x-fx;
    vec3 wx = fx*fx*(3.0-2.0*fx);
    float nn = dot(ix, ABC);

    vec4 N1 = nn + A3;
    vec4 N2 = nn + A4;
    vec4 R1 = random4(N1);
    vec4 R2 = random4(N2);
    vec4 R = mix(R1, R2, wx.x);
    float re = mix(mix(R.x, R.y, wx.y), mix(R.z, R.w, wx.y), wx.z);

    return 1.0 - 2.0 * re;
}

//////////////////////////////////////////////////////////////
// distance functions
// http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdSphere( vec3 p, float s ) { return length(p)-s; }
float udBox( vec3 p, vec3 b ) {  return length(max(abs(p)-b,0.0)); }
float udRoundBox( vec3 p, vec3 b, float r ) { return length(max(abs(p)-b,0.0))-r; }
float sdTorus( vec3 p, vec2 t ) { vec2 q = vec2(length(p.xz)-t.x,p.y);  return length(q)-t.y; }
vec3  opRep(vec3 p, vec3 r) { return mod(p,r)-0.5*r; }
vec3  opTx(vec3 p, mat4 m ) { return (m*vec4(p,1.0)).xyz; }

/////////////////////////////////////////////////////
// the rest

float fbm(vec3 p) {
    float f;
    f = 0.5000*cnoise4( p ); p = p*2.02;
    f += 0.2500*cnoise4( p ); p = p*2.03;
    f += 0.1250*cnoise4( p ); p = p*2.01;
    f += 0.0625*cnoise4( p ); 
  return f;
}

float scene(vec3 p) { 
  p.z -= 20.0;
  vec3 pw = vec3(0.,0.,10.);
  float pa = udBox(p+pw,vec3(100.,5,5.));
  float pb = udBox(p-pw,vec3(100.,5,5.));
  float d = min(pa,pb);
	
  pa = udBox(p+pw*2.,vec3(100.,80.,.2));
  pb = udBox(p-pw*2.,vec3(100.,80.,.2));
  d = min(d,min(pa,pb));

  vec3 c = opRep(p,vec3(20.,4.5,14.))-vec3(0.,0.,7.);
  pa = udBox(c+pw+vec3(0.,0.,-3.),vec3(1.5,25.,0.5));
  pa = min(pa,udBox(c+pw+vec3(0.,0.0,-3.),vec3(1.75,2.,0.75)));
  d = min(d,pa);
	
  return clamp(fbm(p*3.),0.,1.)*0.1+d;
}

vec4 color(float d) { 
  return mix(vec4(1.,1.,1.,0.5),vec4(0.,0.1,0.25,0.05),smoothstep(0.,0.125,d)); 
}

vec4 ray(vec3 pos, vec3 step) {
    vec4 sum = vec4(0.);
    vec4 col;
    float d;
#define RAY1  d = scene(pos); col = color(d); col.rgb *= col.a; sum += col*(1.0 - sum.a); pos += step*max(d,_MinStep);
#define RAY4  RAY1 RAY1 RAY1 RAY1
    RAY4 RAY4 RAY4 RAY4  
    return sum;
}

void main( void ) {
  vec3 e = vec3(tan(time*0.2)*10.,12.,0.); 
  vec3 p = vec3((gl_FragCoord.xy / resolution.xy) * 2. -1., 1.);
  p.x *= resolution.x/resolution.y;
  p = e + p;
  gl_FragColor = ray(p, normalize(p-e));
}
