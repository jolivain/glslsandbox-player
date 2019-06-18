/*
 * Original shader from: https://www.shadertoy.com/view/wd2GDG
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
/*
Shader coded live on twitch (https://www.twitch.tv/nusan_fx)
You can lower the MARCH_STEPS if too slow

The shader was made using Bonzomatic.
You can find the original shader here: http://lezanu.fr/LiveCode/RainyBridge.glsl
*/

#define MARCH_STEPS 100
#define RAIN_STEPS 50
#define SHAD_STEP 30

//#define time iTime

float PI = acos(-1.0);

float sph(vec3 p, float r) {
  return length(p)-r;
}

float cyl(vec2 p, float r) {
  return length(p)-r;
}

float box(vec3 p, vec3 s) {
  vec3 ap = abs(p)-s;
  return length(max(vec3(0), ap)) + min(0.0, max(ap.x, max(ap.y,ap.z)));
}

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);
}

vec3 tunnel(vec3 p) {
  //return vec3(0.0);
  vec3 off = vec3(0.0);
  off.x += sin(p.z*0.2) + sin(p.z*0.137)*3.0;
  off.y += sin(p.z*0.5)*0.2 + p.z*0.3;
  return off;
}

float smin(float a, float b, float h) {
  float k = clamp((a-b)/h*0.5+0.5,0.0,1.0);
  return mix(a, b, k) - k*(1.0-k)*h;
}

float map(vec3 p) {

  float water = 10.0-p.y-p.z*0.3;

  p += tunnel(p);

  vec3 rp = p;
  float sizerepeat = 2.0;
  rp.z = (fract(rp.z/sizerepeat-0.5)-0.5)*sizerepeat;
  
  rp.yz *= rot(-rp.z*0.2);
  float bridge = box(rp + vec3(0,-1,0), vec3(1.0,0.2,2.0));

  
  vec3 rp4 = rp + vec3(0,-0.8,0);
  rp4.x += sin(p.z*8.0)*0.05;
  rp4.y += cos(p.z*7.0)*0.05;
  float size4 = 0.14;
  rp4.xz = (fract(rp4.xz/size4-0.5)-0.5)*size4;
  float bricks = box(rp4, vec3(0.05))-0.015;
  bricks = max(bricks, bridge - 0.05);

  bridge = smin(bridge, bricks, 0.09);


  rp.x = abs(rp.x) - 1.0;
  
  float bar = box(rp + vec3(0,-0.5,0), vec3(0.05,0.05,2.0));
  vec3 rp2 = rp;
  float size2 = 0.2;
  rp2.z = (fract(rp2.z/size2-0.5)-0.5)*size2;
  bar = min(bar, box(rp2 + vec3(0,-0.8,0), vec3(0.03,0.3,0.03)));

  bridge = min(bridge, bar);

  vec3 rp3 = p + vec3(1,0,1.0);
  float size3 = sizerepeat * 2.0;
  rp3.z = (fract(rp3.z/size3-0.5)-0.5)*size3;
  float def = sin(rp3.y*17.0+2.0)*0.5+0.5;
  def = sin(rp3.y*10.0 + def*3.0);
  def = smoothstep(0.0,1.0,def);
  def = smoothstep(0.0,1.0,def);
  float lsize = 0.05 + (def)*0.02;
  float lamp = max(cyl(rp3.xz + vec2(0,0), lsize), abs(rp3.y)-1.0);

  vec3 lpos = rp3 + vec3(0,1,0);
  float top = sph(lpos, 0.3);
  top = max(top, -sph(lpos-vec3(0,0.3,0), 0.5));

  lpos.y = max(abs(lpos.y)-0.1,0.0);
  //lamp = min(lamp, sph(lpos, 0.12));
  
  //lamp = min(lamp, top);
  lpos = abs(lpos)-0.1;
  lpos.xz *= rot(PI*0.25);
  //lamp = max(lamp, -box(lpos, vec3(0.05,0.2,0.05)));  
  bridge = min(bridge, lamp);

  bridge = min(bridge, water);

  return bridge;

}


float lighting(vec3 p) {

  p += tunnel(p);

  float sizerepeat = 2.0;
  vec3 rp3 = p + vec3(1,0,1.0);
  float size3 = sizerepeat * 2.0;
  rp3.z = (fract(rp3.z/size3-0.5)-0.5)*size3;

  vec3 lpos = rp3 + vec3(0,1,0);
  float top = sph(lpos, 0.3);
  return sph(lpos, 0.12);
}

vec3 norm(vec3 p) {
  vec2 off=vec2(0.01,0);
  return normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx)));
}

vec3 getlightdir(vec3 p) {
  vec2 off=vec2(0.01,0);
  return normalize(lighting(p)-vec3(lighting(p-off.xyy), lighting(p-off.yxy), lighting(p-off.yyx)));
}

float rnd(float t) {

  return fract(sin(t*745.523)*7894.552);

}

float rain(vec3 p) {

  p.y -= time*4.0;
  p.xy *= 60.0;
  
  p.y += rnd(floor(p.x))*80.0;
  
  return clamp(1.0-length(vec2(cos(p.x * PI), sin(p.y*0.1) - 1.7)), 0.0, 1.0);
}

float ripple(vec3 p) {

  float t2 = time*5.0;

  float size3 = 0.2;
  vec3 rp3 = p + vec3(1,0,1.0);
  
  float id = dot(floor(rp3.xz/size3-0.5), vec2(7.52,5.48));
  rp3.xz = (fract(rp3.xz/size3-0.5)-0.5)*size3;
  

  float r = clamp(1.0-length(rp3.xz)*20.0, 0.0, 1.0);
  float looplen = 0.5;
  float off = rnd(id * 75.5238);
  float fl = 1.0-fract(time*looplen + off);
  fl = pow(fl,10.0);
  //float il = floor(time*looplen);
  float r2 = cos(r*10.0 + t2) * fl;


  return r2*r;

}

float ripples(vec3 p) {

  float r = 0.0;
  for(int i=0; i<5; ++i) {
    vec3 cur = p + vec3(rnd(float(i)), 0, rnd(float(i)+75.523));
    cur *= rnd(float(i)+12.71)*0.2+0.8;
    cur *= 3.0;
    r += ripple(cur);
  }
  return r;
}

vec3 ripplenorm(vec3 n, vec3 p) {

  vec2 off = vec2(0.01,0.0);

  vec3 rn = normalize(vec3(ripples(p+off.xyy)-ripples(p-off.xyy), 1.9, ripples(p+off.yyx)-ripples(p-off.yyx)));
  n.xz += rn.xz * (abs(n.y));
  //n.y *= rn.y;
  return n;
  
}

float rnd(vec2 uv) {
  return fract(dot( sin(uv*vec2(784.553) + uv.yx*vec2(546.124)), vec2(7845.523) ));
}

float curve(float t, float r, float p) {
  float g = t/r;
  return mix(step(rnd(floor(g)), p), step(rnd(floor(g)+1.0), p), fract(g));
}

float shadow(vec3 s, vec3 r, float maxdist, float rn) {
  float shad = 1.0;
  const int steps = SHAD_STEP;
  vec3 raystep = r*maxdist/float(steps);
  vec3 p = s + raystep*rn;
  for(int i=0; i<steps; ++i) {
    float d = map(p);
    if(d<0.01) {
      shad = 0.0;
      break;
    }
    p += raystep;
  }
  return shad;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 s = vec3(1,sin(time*0.3)*0.2,-3);
  vec3 t = vec3(0,0,0);
/*
  float t1 = fract(time*0.1);
  s.z += t1;
  t.z += t1;

  s -= tunnel(s);
  t -= tunnel(t);
  
  vec3 cz = normalize(t-s);
  vec3 cx = normalize(cross(cz, vec3(0,1,0)));
  vec3 cy = normalize(cross(cz, cx));
  vec3 r = normalize(uv.x*cx + uv.y*cy + cz * 0.7);
*/

  vec3 r = normalize(vec3(-uv,0.7));
  

  
  vec3 p = s;
  float dd=0.0;
  for(int i=0; i<MARCH_STEPS; ++i) {
    float d = map(p);
    if(d<0.001) {
      break;
    }
    if(dd>100.0) {
      dd=100.0;
      break;
    }
    p+=r*d;
    dd+=d;
  }

  vec3 col = vec3(0.0);
  vec3 n = norm(p);

  n = ripplenorm(n, p);


  float lightning = curve(time, 0.2, 0.1);
  //float idlightning = floor(time/0.4-0.5);
  float idlightning = 0.0;

  float fog = 1.0-pow(clamp(dd/50.0,0.0,1.0),0.2);
  vec3 lmoon = normalize(vec3(-8,-3,-3.0 + sin(idlightning)*3.0));

  float shad = shadow(p + n * 0.02, lmoon, 3.0, rnd(uv));

  col += lightning * 5.0 * max(0.0, dot(n, lmoon)) * fog * shad;

  vec3 l = -getlightdir(p);
  float ldist = lighting(p);

  vec3 h = normalize(l-r);

  //col += fract(length(light-p)*10.5);
  //vec3 l = normalize(light-p);
  //float ldist = dot(light-p, light-p);
  col += max(0.0, dot(n, l)) * fog * 10.0 * (0.4 + 2.0*pow(max(0.0, dot(n,h)),30.0) )/(ldist*ldist*ldist*ldist);

  float at = 0.0;
  vec3 raining = vec3(0.0);
  const int steps = RAIN_STEPS;
  float stepsize = 30.0 / float(steps);
  vec3 raystep = r * stepsize / r.z;
  //vec3 raypos = s + raystep;
  for(int i=0; i<steps; ++i) {
    vec3 raypos = s + raystep * (float(i)+1.0);
    float tot = length(raypos-s);

    if(tot>dd) break;
    float fog2 = 1.0-pow(clamp(tot/40.0,0.0,1.0),0.5);

    
    vec3 ldir = getlightdir(raypos);
    float l2dist = lighting(raypos);
    float curlight = 1.0/pow(l2dist,2.0);

    vec3 rainpos = raypos;
    rainpos.xy *= rot(sin(float(i)*0.2)*0.01 + sin(time)*0.009);
    rainpos.xy += rnd(float(i))*vec2(7.52,13.84);
    raining += rain(rainpos) * fog2 * (lightning*0.5 + pow(curlight,2.0));

    //vec3 ldir = light-raypos;
    at += 0.04*curlight * fog2;
    //raypos += raystep;    
  }
  col += at;
  col += raining;
/*
  col = vec3(rain(vec3(-uv,5)));
  col += rain(vec3(-uv*2.3,5)) * 0.5;
  col += rain(vec3(-uv*4.7,5)) * 0.25;
*/
  //col = ripplenorm(n, vec3(-uv.x,0.0,-uv.y)); 

  col = pow(col, vec3(0.4545));

  fragColor = vec4(col, 1);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
