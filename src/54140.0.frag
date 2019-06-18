/*
 * Original shader from: https://www.shadertoy.com/view/MlfczH
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//self 1: https://www.shadertoy.com/view/MlfczH
//scene5: https://www.shadertoy.com/view/4tscR8
//Optical-Circuit optical circuit scene 1 deconstruction b


/*

iMouse.x changes the glowing (somewhat planar) lines
iMouse.y changes the density of the black fractal

not my code, just deconstructing it:

www.pouet.net/prod.php?which=65125
https://www.youtube.com/watch?v=ISkIB4w6v6I

The [optical circuit demo] video source code once appeared on glslsandbox.com
... with very nondesctiptic labels, 
... only using single letter names for functions and vars..


It is fractal code golf overkill in [0..6] scenes.
This is a deconstruction of scene 1. , not the whole demo.
Un-used functions (only used in other scenes) are removed;
scene-specific branches are set to 1, or removed 
... (multiplying by *0. or adding -0 iterations)
... all changes are annotated.

This may run slightly faster due to removing all schene-specific branching
Most of that modifies iteration count (between scenes, which are static per shader)
The [smart re-use of schene specific branches and modifiers] is what makes this a 4k demo.
... at a cost of running slightly slower, by summing up scene-modifiers.
*/

//this loop with 20 iterations seems to have no change for scene1, but i may be wrong
//my guess is camera pathing???
//skips a lot of code, so it is disabled for performance.
//#define doScene1Loop

//move vehicles in traffic over time., is often barely noticable, may be skipped.
#define MoveVehicles

//number of itterations of the black fractal. 
//it is pretty space filling with some max(a,-b) for safe camera paths, 
//4 is a good compromise. +-2 look fine too.
#define Oiter 4

//number of iterations of the glowing lines fractal patterns
//more iterations make the lines more planar-space-filling, brighter
#define Giter 6

//#define scene 1
#define timeOffset 115.984024

#define dd(a) dot(a,a)
#define v0 float
#define v1 vec2
#define v2 vec3
#define v3 vec4
#define fra(u) (u-.5*iResolution.xy)*ViewZoom/iResolution.y
v0 mav(v1 a){return max(a.y,a.x);}
v0 mav(v2 a){return max(a.z,mav(a.xy));}
v0 mav(v3 a){return max(mav(a.zw),mav(a.xy));}
#define miv(a) -mav(-a)
float vsum(vec3 a){return dot(a,vec3(1));}//dot() is generally faster on a gpu than 2add()
 //return a.x+a.y+a.z;}

const float pi=acos(-1.);//3.14
const float t0=sqrt(.5);//0.707

//non const floats are not good style, will create warnings on some parsers.
float A=0.,D=0.,E=0.;
vec3 B=vec3(0.),C=vec3(0.);

//return a, rotated by b, originally called F()
vec3 rot(vec3 a,float b){float c=sin(b),d=cos(b);return mat3(d,-c,0,c,d,0,0,0, 1)*a;}

//fractal glowing planes
vec3 G(vec3 a, float b){a=fract(a*.2)*2.-1.;a.z=b;
 float m=iMouse.x/iResolution.x;
 //a-=iMouse.x/iResolution.x; //this fucks up the tesselation
 float c=50.;//brightness modifier
 for(int i=0;i<Giter;++i){//iteration cout is scene specific
  float d=clamp(dd(a),.05,.65);
  c*=d;
  a=abs(a)/d-1.31+m;
  a.xy=a.xy*mat2(1,1,-1,1)*t0-m;
 }return a*c;}

/*
#ifdef doScene1Loop
//sub of X
vec3 Z(float t){return vec3(0,-sin(t*.6),t*1.6+.5)+sin(t*.01*vec3(11, 23, 19))*vec3(.135,.25,.25);}
//sub of Y a and t are always thr same, this looks like i can optimize it, a lot
float X(vec3 a, float t, float b){float c=fract(t+b),e=t-c;
 vec3 f=Z(e)*vec3(0,1,1)+sin(vec3(0,23,37)*e),
 g=normalize(sin(vec3(0,17,23)*e))*8.,
 h=f+g+vec3(sin(e*53.)*.15,0,0),
 j=f-g+vec3(sin(e*73.)*.15,0,0),
 k=mix(h,j,c-.15),
 l=mix(h,j,c+.15);//i smell a lot of symmetry potential for optimization
 t=dot(a-k,l-k)/dd(l-k);//i smell distance to line segment
 return length((t<0.?k:t>1.?l:k+t*(l-k))-a);}//i smell a lot of BIsymmetry potential for optimization
//sub of Y, internally modifies a, while Y keeps usig an unmodified a.
vec3 I(vec3 a){a.z=a.z-A*1.5;float b=A*.5+floor(a.z);
 return rot(vec3(a.x,a.y+sin(b),fract(a.z)-.5),pi-cos(b));}
//only used once in mainImage, within a loop that seems to have no visual effect for scene 1

vec4 Y(vec3 a,float b,float t) {
 vec3 c=I(a)*20.,
 d=vec3(length(c+vec3(-.35,.57,2)),length(c+vec3(-.35,-.57, 2)),length(c+vec3(.7,0,2))),
 e=V(.2,d,b),
 f=vec3(X(a,t,0.),X(a,t,.3),X(a,t,.6)),g=V(.001,f,b);
 return vec4(
  vsum(e)*vec3(30,75,150)*(E+1.)+vsum(g)*vec3(1.,.1,.2)*5000.
  ,min(miv(d)*.05, miv(f)));}
#endif
*/

//L M N O define thedark fractal shape, O is a fractal, L M N are a "strange hash"
//L is sub of M and N
float L(vec3 a){vec3 b=abs(fract(a + vec3(0,.5,0))-.5),c=abs(fract(a+.5)-.5);
 return .033-min(max(b.x-.46, b.y),.08-max(c.x, c.y));}
//M is sub of N
float M(vec3 a) {vec3 b=abs(fract(a*4.+.5)-.5)*.25;
 return max(max(max(b.x,b.y),b.z)-.08,max(L(a)-.01,.012-length(fract(a*25.)-.5)*.04));}
//M is sub of O
float N(vec3 a){
 return min(min(min(M(a),M(a.zyx)),M(a.zxy)),min(min(L(a),L(a.zyx)),L(a.zxy)));}
//iterations of the black fractal
//o is used once by T()
float O(vec3 a){vec4 b=vec4((fract(a*.2+.5)-.5)*4.,1.);
 for(int i=0;i<Oiter;++i){
  b.xyz = clamp(b.xyz,-1.,1.)*2.-b.xyz;
  b*=clamp(max(.21/dd(b.xyz),.21),.0,1.)*-15.7;
 }a=b.xyz/b.w*5.;return max(length(a)-1.,N(a))*.25;}
//used 5* in mainImage T is a very schene specific function; 
//return distance of [a] to a fractal.
float T(vec3 a){
 float m=iMouse.y/iResolution.y;
 vec3 b=a*(20.);//for scene 1, b modifies placement of "lines of vehicles"
 #ifdef MoveVehicles
  b.y+=A*5.*(fract(dot(floor(b),vec3(1,0,1))*pi)-.5);//animate lines of vehicles
 #endif
 vec3 c=rot((fract(b.zxy)-.5)*.05,A*8.*(fract(dot(floor(b),vec3(pi)))-.5)),//defines vehicles
 e=abs(fract(a+vec3(.5,.5,0))-.5);//defines vehicles
 a=rot(a,A*.025*(fract((a.z * 2.-fract(a.z*2.))*.437)-.5));//defines black fractal
 float d=mav(abs(fract(a*2.)-.5)*.5);//for scene1, K is 100 absorbed into T, here
 return min(//this line is the only line that includes "O()"
  max(min(max(d+(m*.35-.12)-.201,O(a)),.299-d),length(a)-20.),
  max(max(e.x,e.z)-.05,min(max(length(c)-.006,L(c*10.)*.1-.0002),.04)));}

//V and W modify color accumulator of the last loop (mostly increasing brightness)
//sub of W and I
vec3 V(float a,vec3 b,float c){a*=c;return 1./((1.+2.*b/a+b*b/(a*a))*c+.0001);}
//only used twice in mainImage, a and b and c are the same both times.
vec3 W(vec3 a,float b,float c,float d){
 vec3 e=(V(.01,abs(a),d)*2.+V(.05,vec3(length(a.yz),length(a.zx),length(a.xy)),d)*5.)
  *(sin(A*vec3(2.1,1.3,1.7)+b*10.)+1.);
 return(e*7.+e.yzx*1.5+e.zxy*1.5)*max(1.-c*200./d,0.)/d*float(100-30);}//is scene specific

#define tswap h=j;j=k;k=l
//#define resolution iResolution
void mainImage(out vec4 O, in vec2 Uuu){
 {//this  seems to have been an Initiation procedure, as it sets global vars.
  A=iTime+timeOffset;
  vec2 glVertex=Uuu.xy/iResolution.xy*2.-1.;
  //a,b,d are very scene specific (and c depends on b)
  vec3 a=normalize(sin(A*.001*vec3(21,11,17)))*20.1,
  b=normalize(sin(A*.001*vec3(26,106,62))-a*.05),
  c=normalize(cross(b,sin(A*.001*vec3(31,17,29))));
  float d=A*float(1);
  /*
  #ifdef doScene1Loop
  for(int i=0;i<20;++i){//i notice no changes when skipping this on scene1
   float t=A-float(i)*.1;
   vec4 y=Y(Z(t),25.,t);
   //here an d+=... modifier is scene specific, is +=0. for scene1
  }
  #endif
  */
  //set globals:
  vec3 e=normalize(vec3(sin(vec2(.53,.47)*d)*4.+sin(vec2(.91, 1.1) * d)*2.+sin(vec2(2.3,1.7)* d),200)),
  f=normalize(cross(e,vec3(sin(d),50,0)));
  B=a;
  C=mat3(c,cross(c,b),b)*(f*glVertex.x*1.78+cross(f,e)*glVertex.y+e*1.4);
  D=fract(sin(vsum(C)*99.317*pi)*85.081*pi);
  E=fract(sin(A      *99.317*pi)*85.081*pi);
 }
 vec3 a=normalize(C),c=vec3(1),e=B,f= a,g=e,b=g*.0,s=vec3(1,-1,-1)*.0005;
 vec4 l=vec4(B,1),k=l*.0,j=k,h=j;
 int m=1;
 float t=0.,o=1.,p=1.,q=D*.01+.99,n;
 //raymarching loop:
 for(int i=0;i<64;++i){//iteration steps depend on z, but scene 1 has no summands here.
  g=e+f*t;
  float d=T(g);
  if(d<(t*5.+1.)*.0001){
   vec3 u=normalize(T(g+s)*s+T(g+s.yyx)*s.yyx+T(g+s.yxy)*s.yxy+T(g+s.xxx)*s.xxx);//normal
   float r=pow(abs(1.-abs(dot(u,f))),5.)*.9+.1;
   o+=t*p;
   p=p*5./r;
   e=g+u*.0001;
   f=reflect(f, u);
   t=.0;
   float v=dd(u);
   if(v<.9||1.1<v||v!=v)u=vec3(0);
   if(m<4){tswap;l=vec4(g,max(floor(o),1.)+clamp(r,.001,.999));++m;
  }}
  else t=min(t+d*q,100.);
 }
 if(m<4){tswap;l=vec4(g,o+t*p);++m;}{
  int a=m;for(int i=0;i<4;++i)if(a<4){tswap;++a;}}//simple sorting?
 e=h.xyz;
 f=normalize(j.xyz-h.xyz);
 n=length(j.xyz-h.xyz);
 t=.0;
 q=D*.1+.9;//q is scene specific
 o=1.;
 p=.0;
 //this loop pushes fog away by adding more "glow"
 //looks like a reflection and illumination loop. 
 //fun part is that light sources scattered dots in lines in planar areas.
 for(int i=0;i<64;++i){//iteration steps are cene specific, scene 1 has no summands here.
  if(t>n){
   if(m<3)break;
   tswap;--m;
   e=h.xyz;
   f=normalize(j.xyz-h.xyz);
   n=length(j.xyz-h.xyz);
   t=0.;
   if(n<.0001)break;
   float r=fract(h.w);
   o=h.w-r;
   p=(floor(j.w)-o)/n;
   c*=mix(vec3(.17,.15,.12),vec3(1),r);
  }
  g=e+f*t;
  //next 5 lines are scene specific
  float u=abs(fract(g.z)-.5);//this line 100 absorbs U(), for scene1
  g-=vec3(0,0,vec2(sign(fract(g.z)-.5)))*u;
  float v=sin(A*.05+g.z)*.5,w=u*q+.001;
  vec3 x=G(g,v);
  c*=pow(.7,w);
  t+=w;
  b+=(W(x,v,u,o+p*t    )    +W(x,v,u,o+p*t+50.))*c*w;
 }
 //this line is also scene specific
 O=vec4(pow(b,vec3(.45)),1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
