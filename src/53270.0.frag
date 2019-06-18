/*
 * Original shader from: https://www.shadertoy.com/view/wdfSWf
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
/*
Shader coded live on twitch (https://www.twitch.tv/nusan_fx)
You can lower the MARCH_STEPS if too slow
The shader was made using Bonzomatic.
You can find the original shader here: http://lezanu.fr/LiveCode/AttackFlower.glsl

This is a voxel rendering technique (3D DDA I think), mainly found from IQ's https://www.shadertoy.com/view/4dfGzs
*/

#define MARCH_STEPS 300
#define STOP_MOTION 0
#define TEST_RAYMARCH 0

//#define time iTime
float PI = acos(-1.0);

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);
}

float smin(float a,float b, float h) {
  float k=clamp((a-b)/h*0.5+0.5,0.0,1.0);
  return mix(a,b,k) - k * (1.0-k) * h;
}

float noise(vec3 p) {
  vec3 ip = floor(p);
  p=fract(p);
  //p=smoothstep(0,1,p);
  vec3 st = vec3(7,193,385);
  vec4 val = dot(ip,st) + vec4(0,st.y,st.z,st.y+st.z);
  vec4 v = mix(fract(sin(val)*7845.558), fract(sin(val+st.x)*7845.558), p.x);
  vec2 v2 = mix(v.xz,v.yw, p.y);
  return mix(v2.x,v2.y, p.z);
}


float rnd(float t) {
  return fract(sin(t*784.535)*5384.669);
}

float rnd(vec3 p) {
  return fract(dot(sin(p*vec3(784.535,584.653,387.627)),vec3(5384.669)));
}

vec2 moda(vec2 p, float rep, float off) {
  vec2 inter = vec2(atan(p.y,p.x), length(p.xy));
  inter.x /= (2.0*PI);
  //inter.x = (fract(inter.x*rep+0.5)-0.5)/rep;
  inter.x = (fract(inter.x*rep+0.5)-0.5)/rep;
  inter.x *= 2.0*PI;
  return vec2(cos(inter.x),sin(inter.x))*inter.y;
}

float mapid = 0.0;
float map(vec3 p) {

#if STOP_MOTION
  float framy = 0.15;
  float t2 = floor(time/framy)*framy;
#else
  float t2 = time;
#endif

  vec3 pe = p;
  pe.xz = moda(pe.xz, 12.0, 0.0);
  //
  pe.x -= 20.0;
  float ps =6.0+clamp(pe.x*10.0,0.0,10.0);
  float tmp = pe.x;
  float anim = clamp((sin(t2*0.2)-0.5)*2.0,0.0,1.0);
  pe.xy *= rot(0.5 + (tmp*0.1*(1.0+sin(t2*0.1)) + fract(t2*0.2)*2.0*PI)*anim);
  pe.x = (fract(pe.x/ps+0.1)-0.5)*ps;
  pe.y += tmp*0.2;
  //pe.xy *= rot(0.5 + tmp*0.5);
  float s = length((pe)*vec3(5,0.5,1))-5.0;
  s = smin(s, length(p)-60.0, -30.0);
  s = min(s, length((p-vec3(0,8,0))*vec3(0.3,1,0.3))-8.0);

  float f = noise(p*0.1)-0.5;
  float f2 = (noise(p*0.2)-0.4);
  f += f2;
  f = max(f, -5.0-p.y + 30.0 - min(30.0,length(p.xz)*0.7));

  vec3 rp = p;
  float dur = 0.1;
  float stime = floor(t2/dur)*dur;
  rp.xz *= rot(sin(rp.y*0.1 + t2*0.5)*0.5);
  rp.zy *= rot(sin(rp.x*0.3)*0.3);
  float size = 60.0-clamp(length(p.xz)*0.8-30.0,0.0,50.0);
  rp.xz = (fract(rp.xz/size)-0.5)*size;
  float c = length(rp.xz)-3.0;
  c = smin(c, -30.0-p.y, -20.0);

  float first = min(f,c);
  float f3 = (noise(p*vec3(0.1,0.8,0.1)*0.5)-0.4);
  float clouds = max(f3+0.2, +30.0+p.y);
  first = min(first, clouds);

  mapid = (s<first)?1.0:0.0;

  return min(s, first);
}


float curve(float t, float d) {
  float g=t/d;
  return mix(rnd(floor(g)), rnd(floor(g)+1.0), pow(smoothstep(0.0,1.0,fract(g)), 5.0));
}

void cam(inout vec3 p) {

  p.yz *= rot(0.3 + sin(time*0.3)*0.17);
  p.xz *= rot(time*0.2 + curve(time, 5.2)*2.0);
}

float getao(vec3 p, vec3 n, float dist) {
  return clamp(map(p+n*dist)/dist,0.0,1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 s = vec3(0,0,-50.0 - curve(time, 2.3)*10.0);
  vec3 r = normalize(vec3(-uv, 0.5+0.3*curve(time, 1.3)));

  cam(s);
  cam(r);

#if TEST_RAYMARCH
  // Classic raymarching for test
  vec3 p = s;
  for(int i=0; i<150; ++i) {
    float d = map(p);
    if(d<0.001) break;
    p+=r*d*0.5;
    //p+=r*1;
  }
  vec2 off=vec2(0.01,0.0);
  vec3 n = normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx)));
  vec3 id = vec3(1);
  float t = length(p-s);
  float fog = 1.0-pow(clamp(t/200.0,0.0,1.0), 2.0);
#else

  // Voxel stepping: 3D DDA

  vec3 p = floor(s);
  vec3 ri = 1.0/r;
  vec3 rs = sign(r);
  // find next 3 inner plane
  vec3 offset = 0.5 + rs * 0.5;
  // position of the next voxel
  vec3 nextplane = p + offset;
  // intersect with it
  // this is the distance to the next voxel plane of the 3 axis
  vec3 dist = (nextplane - s) * ri;

  vec3 nearestaxis = vec3(0.0);
  const int steps = MARCH_STEPS;
  for(int i=0; i<steps; ++i) {

    // break if the voxel is inside the surface
    float curdist = map(p);
    if(curdist<0.0) break;

    // this will select an axis as the next one (1,0,0) or (0,1,0) or (0,0,1)
    // it's depending on the smallest distance to the next plane
    nearestaxis = step(dist.xyz, dist.yzx) * step(dist.xyz, dist.zxy);

    // compute distance to the next voxel
    dist += nearestaxis * rs * ri;

    // step one around the selected axis
    p += nearestaxis * rs;
  }

  // the center of the intersected voxel
  vec3 id = p;
  
  // Get the 3 outer planes of the voxel
  vec3 voxelpos = p + 1.0 - offset;
  // Get the distance to the 3 planes
  vec3 intersection = (voxelpos - s) * ri;
  // Get the final distance, the biggest of the 3 planes
  float t = max(intersection.x, max(intersection.y, intersection.z));

  float maxdist = float(steps) / sqrt(3.0);

  t = min(t, maxdist);

  // final pixel intersection position
  p = s + t*r;

  float fog = 1.0-pow(clamp(t/maxdist,0.0,1.0), 2.0);
  
  // Compute the normal
  vec3 n = (p-id-0.5)*2.0;
  n = pow(abs(n),vec3(8.0)) * sign(n);
  n = normalize(n);

#endif

  vec3 l = normalize(vec3(-1,-3,-2));
  float f = pow(1.0-abs(dot(n,r)), 5.0);

  vec3 base = mix(vec3(0.3), vec3(1,1,0.5), step(noise(id*0.3),0.5));
  base = mix(base, vec3(0.5,1.0,0.5), step(id.y,-4.0));
  base = mix(base, vec3(1.0,0.2,0.2)*1.0, mapid);
  float clselect = step(id.y,-29.0) * (1.0-mapid);
  if(clselect>0.5) n=-n;
  base = mix(base, vec3(0.5,0.5,1.0)*100.0, clselect);

  vec3 diff = base*(rnd(id) * 0.5+0.5);

  vec3 col = vec3(0);
  //col += (dot(n,l)*0.5+0.5);
  
  float ao = (getao(p,n,10.0) * 0.9+0.1) * (getao(p,n,3.0)*0.5+0.5);

  col += diff * (dot(n,l)*0.5+0.5)*min(1.0,30.0*fog/t);
  col += diff * f * fog;

  col *= vec3(5.0*ao);
  
  col += exp(t*0.06) * 0.0005 * vec3(0.5,0.6,1.0);


  col *= pow(max(0.0,1.1-length(uv*vec2(0.8,1.7))),1.5);

  col = pow(col, vec3(0.4545));

  //col = vec3(noise(vec3(uv*50,time)));

  fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
