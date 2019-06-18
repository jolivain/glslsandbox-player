/*
 * Original shader from: https://www.shadertoy.com/view/WdjXz1
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
You can lower the MARCH_STEPS or VOLUME_STEPS if too slow
The shader was made using Bonzomatic.
You can find the original shader here: http://lezanu.fr/LiveCode/SmokeScreen.glsl
*/

#define MARCH_STEPS 100
#define VOLUME_STEPS 50

//#define time iTime
float PI = acos(-1.0);

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);
}

float box(vec3 p, vec3 r) {
  vec3 ap=abs(p)-r;
  return length(max(vec3(0),ap)) + min(0.0, max(ap.x,max(ap.y,ap.z)));
}

float cyl(vec3 p, float r, float s) {
  return max(length(p.xy)-r,abs(p.z)-s);
}

float map(vec3 p) {
  
  float b1 = box(p, vec3(10,8,1));
  b1 = max(b1, -box(p-vec3(0,0,-1), vec3(9,7,1)));
  b1 = min(b1, -box(p+vec3(0,0,20), vec3(30,10,20)));
  
  vec3 ap=abs(p)-vec3(10,8,0);
  b1 = min(b1, abs(cyl(ap+vec3(-4,5,0), 1.2, 1.0))-0.2);
  
  return b1;
}

vec3 rnd(float t) {
  return fract(sin(t*78.65)*vec3(7893.854,5847.655,3874.951));
}

float rnd1(float t) {
  return fract(sin(t*943.522)*7983.221);
}

vec3 noise(vec2 p) {
  vec2 ip=floor(p);
  p=fract(p);
  p=smoothstep(0.0,1.0,p);
  p=smoothstep(0.0,1.0,p);
  p=smoothstep(0.0,1.0,p);
  vec2 st=vec2(7,133);
  vec2 val=dot(ip,st)+vec2(0,st.y);
  vec3 v1 = mix(rnd(val.x), rnd(val.x+st.x), p.x);
  vec3 v2 = mix(rnd(val.y), rnd(val.y+st.x), p.x);
  return mix(v1,v2,p.y);
}

float noise(vec3 p) {
  vec3 ip=floor(p);
  p=fract(p);
  p=smoothstep(0.0,1.0,p);
  vec3 st=vec3(7,133,381);
  vec4 val=dot(ip,st)+vec4(0,st.y,st.z,st.y+st.z);
  vec4 v1 = mix(fract(sin(val)*4985.655), fract(sin(val+st.x)*4985.655), p.x);
  vec2 v2 = mix(v1.xz,v1.yw, p.y);
  return mix(v2.x,v2.y,p.z);
}

vec3 moving(vec2 p, float t, float d) {
  float g=t/d;
  vec3 a=noise(p+rnd1(floor(g))*987.565);
  vec3 b=noise(p+rnd1(floor(g+1.0)*987.565));
  return mix(a,b,pow(smoothstep(0.0,1.0,fract(g)),10.0));
}


vec3 window(vec2 p) {
  
  p*=rot(time*0.3);
  p=abs(p)-0.8;
  p*=rot(time*0.4);
  p=abs(p)-0.5;
  
  vec3 f = moving(p, time, 0.5);
  
  f.xy *= rot(p.x);
  f.yz *= rot(p.y*2.2);
  
  f = vec3(0.2,0.5,8.0)*f.x;
  
  f += step(sin(length(p.xy)-time*3.0),0.5) * exp(-fract(time*0.5));
  f=clamp((f-0.7)*10.0,0.0,1.0);
  
  return f;
}

float curve(float t, float d) {
  float g=t/d;
  return mix(rnd1(floor(g)), rnd1(floor(g+1.0)), pow(smoothstep(0.0,1.0,fract(g)),10.0));
}

float masking(vec3 p) {
  vec2 ap=abs(p.xy)-vec2(10,8);
  float mask = step(max(ap.x,ap.y),-1.1);
  
  mask = max(mask, 5.0*step(length(ap+vec2(-4,5)),1.0));
  
  return mask;
}

vec3 volume(vec3 p) {
  vec2 p2 = p.xy*3.0/(-1.0+p.z*0.1-curve(time, 0.3)*10.0);
  vec2 sel = abs(p.xy)-vec2(10,8);
  float sel2 = max(sel.x,sel.y);
  p2 = mix(p2, floor(p.xy/10.0), step(0.0,sel2));
  vec3 val = window(p2);
  return val * masking(p);
}

float rnd(vec2 uv) {
  return fract(dot(sin(uv*vec2(798.655)+uv.yx*vec2(942.642)),vec2(9865.655)));
}

float fractal(vec3 p) {
  float n=noise(p) * 0.5;
  float t=time*1.8;
  p.y+=t*0.7;
  n += noise(p*2.0)*0.25;
  p.z+=t*0.5;
  n += noise(p*4.0)*0.125;
  p.x+=t*0.7;
  return n;
}

float cloud(vec3 p) {
  float n = fractal(p*0.5);
  n=clamp((n-0.3)*30.0,0.0,1.0);
  //n=pow(n, 3);
  return clamp(n*0.12+0.9,0.0,1.0);
}

void cam(inout vec3 p) {
  float t=time*0.3;
  p.yz*=rot(0.0+sin(t*0.3)*0.2);
  p.xz*=rot(sin(t)+0.25);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 s=vec3(0,0,-30);
  vec3 r=normalize(vec3(-uv, 0.7+curve(time, 1.5)*0.7));
  
  cam(s);
  cam(r);
  
  s.y += (curve(time,1.5)-0.5)*4.0;
  
  float rand = rnd(uv);
  
  vec3 col=vec3(0);
  
  vec2 off=vec2(0.01,0);
  
  
  vec3 backcol = vec3(0);
  for(int i=-3;i<3; ++i) {
    for(int j=-3;j<3; ++j) {  
      backcol += volume(vec3(i,j,0)*0.5);
    }
  }
  backcol /= 49.0;
  
  // First raymarching with distance field, to get first collision (and reflections)
  vec3 p=s;
  float dd=0.0;
  float prod = 1.0;
  vec3 ray = r;
  bool first = false;
  float limit=0.0;
  for(int i=0; i<MARCH_STEPS; ++i) {
    float d=map(p);
    if(d<0.001) {
  
      vec3 n=normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx)));
      float fog = 1.0-clamp(dd/100.0,0.0,1.0);
      
      vec3 l=normalize(vec3(0,0,-5)-p);
      float aodist=0.5;
      float ao=clamp(map(p+n*aodist)/aodist,0.0,1.0);
      float f=pow(1.0-abs(dot(ray,n)),1.0);
      float mas = 1.0-masking(p);
      
      vec3 diff=vec3(noise(p.yz*vec2(0.8,15)).x*0.5+noise(p.yz*vec2(0.8,15)*2.0).x*0.4)*2.0*vec3(0.8,0.7,0.2);
      diff=mix(diff, vec3(1), step(abs(p.x), 29.9));
      
      col += prod * diff*max(0.0, dot(n, l)) * 2.0 * fog * backcol * ao * (mas*0.7+0.3);
      col += prod * diff*volume(p) * fog;    
      
      float size = 2.0;
      vec3 mat1 = (fract(p/size+0.01)-0.5)*size;
      float mat=max(mat1.x,max(mat1.y,mat1.z));
      //col += mat*3;
      float mas2=step(7.9,p.y);
      if(mat*mas*mas2>size*0.48) break;

      prod *= f;
      if(!first) {first=true;limit=dd;}
      if(prod<0.1) break;
      ray = reflect(ray, n);
      d = 0.01;
      //break;
    }
    if(dd>100.0) { dd=100.0; break; }
    p+=ray*d;
    dd+=d;
  }
    
  // second raymarching with fixed step size
  const float maxdist=40.0;
  const int steps=VOLUME_STEPS;
  const float fstep = maxdist/float(steps);
  vec3 or=fstep*r;
  float prog = rand*fstep;
  vec3 vp=s+prog*r;
  vec3 val=vec3(0);
  float alpha = 1.0;
  for(int i=0; i<steps; ++i) {
    if(prog>limit) break;
    if(alpha<0.01) break;
    float fade = 1.0-clamp(-(vp.z)/20.0,0.0,1.0);
    alpha *= cloud(vp);
    val += alpha * volume(vp)*fade*fade;
    vp+=or;
    prog += fstep;
  }
  col *= (1.0-alpha*0.7);
  col += val*0.3*alpha;
    
    
  fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
