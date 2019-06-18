/*
 * Original shader from: https://www.shadertoy.com/view/tls3zX
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
You can lower the MARCH_STEPS if too slow
You can also try the color and shape options
The shader was made using Bonzomatic.
You can find the original shader here: http://lezanu.fr/LiveCode/JewelSurface.glsl
Inspired by https://www.shadertoy.com/view/ttl3R2
*/

#define MARCH_STEPS 100

#define COLOR_GEM 1
#define RED_GEM 0
#define CHROMATIC 0

#define SHAPE sphere
//#define SHAPE box
//#define SHAPE diamon
//#define SHAPE cylinder

//#define time iTime

mat2 rot(float a) {
  float ca=cos(a);
  float sa=sin(a);
  return mat2(ca,sa,-sa,ca);  
}

float rnd1(float t) {
  return fract(sin(t*724.355)*685.655);
}

float bx(vec3 p) {
  p=abs(p);
  return max(p.x,max(p.y,p.z));
}

float smin(float a, float b, float h) {
  float k=clamp((a-b)/h*.5+.5,0.,1.);
  return mix(a,b,k)-k*(1.-k)*h;
}

float mat=1.;
float id=0.;
float map(vec3 p) {
  
  vec3 bp=p;
  
  float s=5.;
  float mm=10000.;
  id=0.;
  for(int i=0; i<4; ++i) {
    
    float t=rnd1(float(i)+12.7)*75.842 + 122.845;
    //t += time*(.1+i*.05);
    p.xy *= rot(t);
    p.yz *= rot(t*.7);
    
    id += dot(sign(p), vec3(1.72,3.84,12.94)*(float(i)+1.));
    p=abs(p);
    
    float mp=min(p.x, min(p.y,p.z));
    mm=min(mm,mp);
    
    p-=s;
    
    s*=0.7;
  }
    
  
  float d = mm;
  
  float dist=0.6;
  vec3 rp=(fract(p/dist-.5)-.5)*dist;
  float d3 = length(rp);
  
  float sphere = length(bp)-20.;
  float box = bx(bp)-14.;
  float diamon = box;
  bp.xy *= rot(3.141592*.25);
  bp.xz *= rot(3.141592*.25);
  diamon = max(diamon, bx(bp)-12.);
  
  float cylinder = max(length(bp.xz)-14., length(bp.xy)-18.);
  //shape = smin(length(bp+7 * sin(time*.5))-12, length(bp-7)-12, 12);
  
  float shape = SHAPE;
    
  float d4 = length(vec2(d, shape));
  d = d4-0.17;
  
  d3 = length(vec2(d3, d4))-0.39;
  
  
  
  d = min(d,d3);
  
  
  float d2 = abs(shape) - min(mm-.2, 1.0) * .7;
  
  
  
  mat=(d<d2)?1.:0.;
  
  d=min(d, d2);
  
  //d*=0.7;
  
  return d;
}

float curve(float t, float d) {
  float g=t/d;
  return mix(rnd1(floor(g)), rnd1(floor(g)+1.), pow(smoothstep(0.,1.,fract(g)), 10.));
}

void cam(inout vec3 p) {
  float t=time*.15 + curve(time+97.4, 2.5*4.)*2.;
  p.yz *= rot(sin(t)*.5);
  p.xz *= rot(sin(t*1.3)*.9);
}

vec3 rnd(float t) {
  return fract(sin(t*vec3(423.745,384.912,542.877))*725.945);
}

vec3 sky(vec3 r) {
  
  vec3 col=vec3(0.3);
  
  float dist=0.3;
  vec2 amask=abs(fract(r.yz/dist-.5)-.5)*dist;
  float mask=clamp(((1.3-(max(amask.x,amask.y))*10.))*2.,0.,1.);
  
  col = mix(col, vec3(7), pow(max(0.,-r.y),12.));
  col = mix(col, vec3(7), pow(max(0.,-r.z),12.));
  col = mix(col, mask * vec3(10), pow(abs(r.x),10.));
  
  return col * 1.7;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);
  
  #if CHROMATIC
  float fsize=1.0;
  float fringe = fract(floor(gl_FragCoord.y/fsize)*fsize/3.);
  vec3 fcol = (1.-abs(fringe*3.-vec3(0,1,2)))*3.;
  #else
  float fringe = 0.;
  vec3 fcol = vec3(1.0);
  #endif
  
  //uv *= 2.0/(1.0+length(uv));

  float delay=2.5;
  float zoom=curve(time, delay);
  vec3 s=vec3((curve(time+12.75, delay)-.5)*13., (curve(time+37.15, delay)-.5)*12.,-27.-zoom*10.);
  vec3 r=normalize(vec3(-uv, 0.9 - zoom * 0.4));
  
  cam(s);
  cam(r);
  
  vec3 col=vec3(0);
  vec2 off=vec2(0.01,0);
  
  vec3 p=s;
  float side=1.;
  vec3 prevhit=s;
  vec3 prod=vec3(1);
  for(int i=0; i<MARCH_STEPS; ++i) {
    float d=map(p)*side;
    if(abs(d)<0.001) {
      
      float curmat=mat;
      float curid=id;
      
      vec3 n=normalize(map(p)-vec3(map(p-off.xyy), map(p-off.yxy), map(p-off.yyx))) * side;
              
      vec3 rn = reflect(r,n);
      
      float fre=pow(1.-abs(dot(n,r)), 2.);
      
      if(curmat<0.5) {
        #if RED_GEM
        vec3 diff=vec3(1,0,0.2);
        #elif COLOR_GEM
        vec3 diff=rnd(curid);
        diff=1.-step(diff, vec3(0.8));
        if(dot(diff,vec3(1))<0.2) diff=vec3(1);
        #else
        vec3 diff=vec3(1);
        #endif
        
        vec3 depth = exp(-distance(prevhit,p) / diff*0.04);
        
        col += diff * sky(rn) * fre * prod;
        
        float ior=1.2 - fringe*0.1;
        vec3 ref = refract(r,n, side<0.0? ior : 1.0/ior);
        if(dot(ref,ref)>0.1) {
          
          r=ref;
        } else {
          
          r=rn;
        }
        prod *= depth;
        prod *= 1.-fre;
        
        side = -side;
        p-=n*0.1;
      } else {
        r=rn;
        
        prod *= pow(fre,0.5);
        //prod *= pow(1-fre,10);
        //prod *= 0.0;
        p+=n*.1;
        //break;
      }
      
      d = 0.1;
      prevhit = p;
      //break;
    }
    if(d>50.) break;
    p+=r*d;
  }
  
  col *= fcol;
  
  col += sky(r)*prod;
  
  //col *= 1.2-length(uv);
  
  col *= pow(col, vec3(0.4545));
  
  col=clamp(col, 0.,1.);
  col *= 1.2-length(uv)*1.1;
    
  fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
