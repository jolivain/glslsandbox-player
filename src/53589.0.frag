/*
 * Original shader from: https://www.shadertoy.com/view/3dSXD1
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
/*
Shader coded live on twitch (https://www.twitch.tv/nusan_fx)
You can lower the MARCH_STEPS and SHADOW_STEPS if too slow
The shader was made using Bonzomatic.
You can find the original shader here: http://lezanu.fr/LiveCode/PaperCity.glsl
Inspired by https://www.shadertoy.com/view/tsjGRG
*/

#define MARCH_STEPS 60
#define SHADOW_STEPS 10

//#define time iTime
float PI=acos(-1.0);

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);
}

float box(vec3 p, vec3 s) {
  vec3 ap=abs(p)-s;
  //return length(max(vec3(0),ap)) + min(0, max(ap.x,max(ap.y,ap.z)));
  return max(ap.x,max(ap.y,ap.z));
}

float tri(vec3 p, vec3 s) {
  p.y=-p.y;
  p.xz=abs(p.xz);
  return max(max(-p.y-s.y, dot(p.xy,vec2(0.7))-s.x), p.z-s.z);
}

float cone(vec3 p, float a, float b) {
  return max(length(p.xz)-p.y*a, p.y-b);
}

vec3 rep(vec3 p, vec3 s) {
  return (fract(p/s+0.5)-0.5)*s;
}

vec2 rep(vec2 p, vec2 s) {
  return (fract(p/s+0.5)-0.5)*s;
}

float rep(float p, float s) {
  return (fract(p/s+0.5)-0.5)*s;
}

float house(vec3 p, float s) {
  float t=tri(p+vec3(0,3,0)*s, vec3(1,1,3.5)*s);
  t = min(t, box(p, vec3(2,2,3)*s));
  return t;
}

float minitower(vec3 p) {
  p.y+=5.0;
  vec3 p2 = p;
  if(abs(p2.x)<abs(p2.z)) p2.xz=p2.zx;
  float t = min(house(p+vec3(0,3,0),0.5), house(p2, 1.0));
  t = min(t, house(p-vec3(0,5,0),1.5));
  return t;
}

float tower(vec3 p) {
  p.y+=15.0;
  vec3 p2 = p;
  if(abs(p2.x)<abs(p2.z)) p2.xz=p2.zx;
  float t = min(house(p+vec3(0,3,0),0.5), house(p2, 1.0));
  t = min(t, house(p-vec3(0,5,0),1.5));
  p2.x -= sign(p2.x)*5.0;
  p2.x = abs(p2.x);
  p2.z = abs(p2.z);
  t = min(t, house(p2.zyx-vec3(2,8,2),0.3));  
  t = min(t, house(p2-vec3(0,12,0),1.5));
  return t;
}

float wall(vec3 p) {
  
  p.x -= cos(p.z*0.1)*2.0;
  p.x -= sin(p.z*0.03)*3.0;
  
  vec3 rp=p;
  rp.z = rep(rp.z, 5.0);
  float w = box(rp+vec3(0,1,0), vec3(2,1,50));
  rp.x = abs(rp.x)-2.0;
  float m = box(rp-vec3(0,2,0), vec3(0.25,5,1.6));
  return min(w, m);
  
}

float field(vec3 p) {
  vec3 p2 = p;
  if(abs(p2.x)<abs(p2.z)) p2.xz=p2.zx;
  
  float tmp = box(p2, vec3(5,5,5));
  float f = max(abs(tmp-4.0), -p.y-2.0);
  f=min(f, box(p, vec3(7,0.5,7)));
  
  vec3 p3 = p;
  p3.xz=rep(p3.xz, vec2(2.5));
  
  float a = box(p3, vec3(0.2,2,0.2));
  a = min(a, cone(p3+vec3(0,4,0), 0.3,3.0));
  f=min(f, max(a,tmp-3.8));
  
  return f;
}

float village(vec3 p) {
  vec3 p2=p;
  p2.xz = abs(p2.xz);
  float w = wall(p);
  p2.xz -= 23.0;
  float t=tower(p2);
  vec3 p3 = p;
  p3.z = p3.z-4.5*sign(p.x);
  p3.x = abs(p3.x)-25.0;
  float f=field(p3);
  
  float res = t;
  res = min(res, w);
  res = min(res, f);
  
 /*
  p2.xz*=rot(0.3);
  res = min(res, house(p2+vec3(13,0,0), 1));
  p2.xz*=rot(0.6);
  res = min(res, house(p2+vec3(18,1,-2.5), 1.5));
  */
  p.z = p.z+10.0*sign(p.x);
  p.x = -abs(p.x);
  res = min(res, minitower(p+vec3(29,1,0)));
  
  return res;
}

float map(vec3 p) {
  
  float t1=sin(length(p.xz)*0.009);
  float s=12.0;
  for(int i=0; i<6; ++i) {
    p.xz=abs(p.xz)-s;
    p.xz *= rot(0.55+t1+float(i)*0.34);
    s /= 0.85;
  }
  p.x+=3.0;
  
  return min(village(p), -p.y);
}

float getao(vec3 p, vec3 n, float dist) {
  return clamp(map(p+n*dist)/dist, 0.0, 1.0);
}

float noise(vec2 p) {
  vec2 ip=floor(p);
  p=smoothstep(0.0,1.0,fract(p));
  vec2 st=vec2(67,137);
  vec2 v=dot(ip,st)+vec2(0,st.y);
  vec2 val=mix(fract(sin(v)*9875.565), fract(sin(v+st.x)*9875.565), p.x);
  return mix(val.x,val.y,p.y);
}

float fractal(vec2 p) {
  float d=0.5;
  float v=0.0;
  for(int i=0; i<5; ++i) {
    v+=noise(p/d)*d;
    d *= 0.5;
  }
  return v;
}

vec3 sky(vec3 r, vec3 l) {
  float v=pow(max(dot(r,l),0.0),3.0);
  
  vec2 sphereuv = vec2(abs(atan(r.z,r.x))+time*0.03,atan(r.y,length(r.xz)));
  
  float skyn = fractal(sphereuv*vec2(5,10));
  float skyn2 = fractal(sphereuv*vec2(5,10)*0.3-vec2(time*0.06,0));
  skyn2=smoothstep(0.3,0.7,skyn2);
  
  vec3 blue = mix(vec3(0.5,0.5,0.8), vec3(0.0), skyn2*skyn);
  
  return mix(blue*0.2, vec3(1,0.7,0.4)*(skyn2*0.8+0.2), v);
}

vec3 sky2(vec3 r, vec3 l) {
  float v=pow(max(dot(r,l),0.0),3.0);
  
  vec3 blue = vec3(0.5,0.5,0.8);
  
  return mix(blue*0.2, vec3(1,0.7,0.4), v);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  float t2=time+10.0;
  vec3 s=vec3(0,0,-100);
  s.yz *= rot(sin(t2*0.3)*0.2+0.5);
  s.xz *= rot(t2*0.2);
  vec3 t=vec3(0,30,60);
  t.yz *= rot(sin(t2)*0.3-0.2);
  t.xz *= rot(t2*0.32);
  vec3 cz=normalize(t-s);
  vec3 cx=normalize(cross(cz,vec3(0,1,0)));
  vec3 cy=normalize(cross(cz,cx));
  //vec3 r=normalize(vec3(-uv, 0.7));
  vec3 r=normalize(uv.x*cx+uv.y*cy+cz*0.7);
  
  
  
  vec3 p=s;
  float dd=0.0;
  for(int i=0; i<MARCH_STEPS; ++i) {
    float d=map(p);
    if(abs(d)<0.001) break;
    if(dd>500.0) {dd=500.0; break;}
    p+=d*r*0.8;
    dd+=d;
  }
  
  float fog = 1.0-clamp(dd/500.0,0.0,1.0);
  
  vec3 col=vec3(0);
  vec2 off=vec2(0.01,0);
  vec3 n=normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx)));
  
  float ao = (getao(p, n, 12.0) * 0.5 + 0.5) * (getao(p, n, 2.0) * 0.3 + 0.7) * (getao(p, n, 0.5) * 0.8 + 0.2);
  
  vec3 l=normalize(vec3(-1,-2,-2.5));
  float f = pow(1.0-abs(dot(n,r)), 3.0);
  
  float shad = 1.0;
  vec3 sp = p + n * 0.5 - r * 0.2;
  for(int i=0; i<SHADOW_STEPS; ++i) {
    float d=map(sp);
    if(d<0.2) { shad = 0.0; break; }
    sp+=d*l*3.0;
  }
  
  col += max(0.0,dot(n,l)) * fog * vec3(1,0.7,0.4) * 1.5 * mix(0.0, ao*0.5+0.5, shad);
  col += (-n.y*0.5+0.5) * ao * fog * vec3(0.5,0.5,0.8) * 0.5;
  col += sky2(reflect(r,n), l)*f*10.0*fog * (0.5+0.5*shad);
    
  col += sky(r, l) * pow(dd*0.01,1.4);
  
  //col = vec3(shad);
  
  col = 1.0-exp(-col*2.5);
  col = pow(col, vec3(2.3));
  col = pow(col, vec3(0.4545));
  
  //col = vec3(skyn);
  
  fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
