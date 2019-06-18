/*
 * Original shader from: https://www.shadertoy.com/view/WsXSzf
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
#define MARCH_STEPS 100

//#define time iTime
float PI = acos(-1.0);

float sph(vec3 p, float r) {
  return length(p) - r;
}

float cyl(vec2 p, float r) {
  return length(p) - r;
}

float box(vec3 p, vec3 r) {
  vec3 ap=abs(p)-r;
  return length(max(vec3(0), ap)) + min(0.0, max(ap.x,max(ap.y,ap.z)));
}

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);
}


float smin(float a, float b, float h) {
  float k=clamp((a-b)/h*0.5+0.5,0.0,1.0);
  return mix(a,b,k) - k*(1.0-k)*h;
}

float rnd(float t) {
  return fract(sin(t*784.523)*7894.5231);
}

float curve(float t, float d) {
  float g=t/d;
  return mix(rnd(floor(g)), rnd(floor(g)+1.0), pow(smoothstep(0.0,1.0,fract(g)), 10.0));
}

float clock(float t, float d) {
  float g=t/d;
  float fg = fract(g);
  //fg = pow(fg, 4.0);
  fg = smoothstep(0.0,1.0,fg);
  fg = smoothstep(0.0,1.0,fg);
  return (floor(g)+fg)*d;
}

float mat = 0.0;

float piece(vec3 fp) {
  vec3 bp = fp;

  vec4 p = vec4(fp, 1.0);
  float c = 10000.0;
  //float t2 = curve(time,1.4);
  for(int i=0;i<5; ++i) {
    //float t1 = sin(time*0.1)+sin(i) + 12.5;
    //float t2 = curve(time + i*0.1,1.4);
    float t2 = sin(clock(time + float(i)*0.12, 2.0) * 0.3);
    //float t1 = t2+sin(i) + 12.5;
    float t1 = t2 + 12.5;
    p.xz *= rot(t1);
    p.xyz-=0.2+float(i)*0.2;
    p *= 0.8;
    p.zy *= rot(t1*0.7);
    p.xyz=abs(p.xyz);
    p.xyz-=0.1+0.1*float(i);

    if(i==3) {
      c = min(c, cyl(p.xz, 0.12));
    }
  }

  p.xyz /= p.w;

  float b = box(p.xyz, vec3(0.5,0.03,5.0)) - 0.05;
  c = smin(c, sph(bp, 20.0), -12.0);
  if(b<c)mat=1.0;
  //return b;
  return min(b,c);
}

float map(vec3 p) {

  vec3 bp=p;

  for(int i=0; i<3; ++i) {

    p -= vec3(0.5,5.2,1.2)*0.2*float(i);
    p = abs(p);
  }
  mat = 0.0;

  float p1 = piece(p);

  //float p2 = p1-80.0;
  vec3 bsize = vec3(100.0,40.0,100.0);
  float p2 = box(bp, bsize);
  bp.xz*=rot(PI*0.25);
  p2 = max(p2,box(bp, bsize));

  if(p1>-p2)mat=2.0;
  
  return min(p1, -p2);
}

vec3 norm(vec3 p) {
  vec2 off=vec2(0.01,0);
  return normalize(vec3(map(p+off.xyy)-map(p-off.xyy), map(p+off.yxy)-map(p-off.yxy), map(p+off.yyx)-map(p-off.yyx)));
  //return normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx)));
}

void cam(inout vec3 p) {
  float t1 = time * 0.3 + curve(time, 1.7)*3.0;
  t1 *= 0.5;
  p.yz *= rot(sin(t1)*0.5);
  p.zx *= rot(sin(t1*1.2)*1.5 + PI*1.5);
}

vec3 getcol(vec3 r) {

  float bl = pow(r.x*0.5+0.5,5.0);
  return mix(vec3(0.5,0.6,0.7),vec3(3.0,1.3,0.2), bl);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 s = vec3(0,0,-33);
  vec3 r = normalize(vec3(-uv, 0.5 + 0.3 * curve(time, 1.3)));
  vec3 br = r;

  cam(s);
  cam(r);

  vec3 col = vec3(0);

  vec3 lpos = vec3(0);

  vec3 p = s;
  float prod=1.0;
  float dd=0.0;
  vec3 at = vec3(0.0);
  for(int i=0; i<MARCH_STEPS; ++i) {
    float d = map(p);
    if(d<0.001) {
      float curmat = mat;
      vec3 n=norm(p);
      vec3 l=normalize(lpos-p);
      float fog = 1.0-float(i)/float(MARCH_STEPS);
      float dfog = clamp(dd/50.0,0.0,1.0);
      float fresnel = pow(1.0-abs(dot(n,r)),2.0);
      vec3 h=normalize(l-r);
      float back = curmat==2.0?0.0:1.0;
      float gold = curmat==0.0?1.0:0.0;
      vec3 bcol  = getcol(r);
      float aodist = 0.2;
      float ao = 1.0;//clamp(map(p+n*aodist)/aodist, 0.0, 1.0);
      vec3 diff = mix(vec3(0.8,0.8,0.8), vec3(2.0,0.2,0.2), gold) * bcol * 2.;
      col += back * prod * max(0.0,dot(n,l)) * fog * (0.2 + pow(max(0.0,dot(n,h)), 5.0)*0.8) * diff * ao;
      col += back * prod * clamp(-n.y*0.7+0.3,0.0,1.0) * 0.3 * diff * ao;
      col += prod * fresnel*0.1 * bcol * ao;
      prod *= 0.2+fresnel*0.8;
      //prod *= 0.8+0.2*back;
      if(prod<0.03) break;
      r = reflect(r, n);
      d=0.01;
    }
    if(d>100.0) { break; }
    p+=r*d;
    dd+=d;
    at += prod * exp(-max(1.0,d)*0.7) * getcol(r);
  }

  col += at*0.02;

  col = 1.0-exp(-col*1.5);
  col = pow(col, vec3(1.5));
  
  col *= pow(clamp(1.5-length(uv),0.0,1.0),3.0);

  fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
