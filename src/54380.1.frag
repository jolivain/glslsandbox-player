/*
 * Original shader from: https://www.shadertoy.com/view/tts3DM
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
//https://www.shadertoy.com/view/wtX3W7
// Chain Reaction by eiffie
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define tim time*2.0

#define pixelSize 2.0/size.y

#define REFLECTIONS
#define SHADOWS
//#define TEXTURECUBE
//#define CIRCLE_LINKS
#define TWISTS 4.5

// V2 added shadows and made it compile on my older machine by unrolling the code
//#define time iTime
#define size iResolution
#define TAO 6.2831853

const float aperture=0.1,shadowCone=0.5,reflectionCone=0.5,pdt=10.0/TAO,tdp=TAO/10.0;
const vec3 mcol=vec3(.6,1.6,2.0);

vec2 Rot2D(vec2 v,float a){return cos(a)*v+sin(a)*vec2(v.y,-v.x);}
//below is the dual of the above
vec4 Rot2D(vec4 v,vec2 a){return vec4(Rot2D(v.xy,a.y),Rot2D(v.zw,a.x));}

#define dd(a) dot(a,a)
//below is the dual of the above
#define ddd(a) vec2(dd(a.xy),dd(a.zw))

//so i tried to parallelized the Link() function of
//https://www.shadertoy.com/view/wtX3W7
//i suceeded, but the result does not look elegant in source code.
#ifdef CIRCLE_LINKS
 #define ass .0225
#else
 #define ass .02
#endif
vec2 Link(vec3 p, vec2 a
){vec4 q=vec4(0)
 ;vec4 f=Rot2D(p.xyxy,a)
 ;f.yw+=1.+sin(a.yx+tim)*.2
 ;q.xy=f.zw
 ;p.x=f.x //this started as origami foldAndCut , and ended up as used toilet paper.
 ;a=a*TWISTS+tim
 ;vec4 g=Rot2D(vec4(vec2(f.w,p.z),vec2(f.y,p.z)),a.yx)
#ifdef CIRCLE_LINKS  
 ;q.yz=g.xy
 ;p.yz=g.zw
 ;return vec2(dd(vec2(length(vec2(p.x,p.y))-ass,p.z))
             ,dd(vec2(length(q.xy)-ass,q.z)));}
#else
 ;f=vec4(p.x,g.z,q.x,g.x)//look at this crumbled piece of paper. its an oregami unicorn!
 ;return ddd(vec4(
     sqrt(ddd(max(abs(f)-vec2(.125,.025).xyxy,0.)))-.1 
     ,g.wy).xzyw);}
#endif 

float DE(in vec3 p
){vec2 i=vec2(.5,0)
 ;i=Link(p,(floor(atan(p.x,-p.y)*pdt+i)+i.yx)*tdp)
 ;return sqrt(min(i.y,i.x))-ass;}

/*
vec2 Link2(vec3 p, vec2 a
){vec3 q=vec3(0)
 ;vec4 f=p.xyxy
 ;f=Rot2D(f,a)
 ;f.yw+=1.+sin(a.yx+tim)*.2
 ;q.xy=f.zw
 ;p.x=f.x
 ;a=a*TWISTS+tim
 ;vec4 g=Rot2D(vec4(vec2(f.w,p.z),vec2(f.y,p.z)),a.yx)
 ;q.yz=g.xy
 ;p.yz=g.zw
#ifdef CIRCLE_LINKS  
 ;return vec2(dd(vec2(length(vec2(p.x,p.y))-ass,p.z))
             ,dd(vec2(length(q.xy)-ass,q.z)));}
#else
 ;p.xy=sqrt(ddd(max(abs(vec4(p.x,p.y,q.x,q.y))-vec2(.125,.025).xyxy,0.)))-.1
 ;return ddd(vec4(p.x,p.z,p.y,q.z));}
#endif 
*/


float CircleOfConfusion(float t,float focalDistance){//calculates the radius of the circle of confusion at length t
 return max(abs(focalDistance-t)*aperture,pixelSize*(1.0+t));
}
mat3 lookat(vec3 fw,vec3 up){
 fw=normalize(fw);vec3 rt=normalize(cross(fw,up));return mat3(rt,cross(rt,fw),fw);
}
float linstep(float a, float b, float t){return clamp((t-a)/(b-a),0.,1.);}// i got this from knighty and/or darkbeam
//random seed and generator
float randSeed=0.0;
float randStep(){//a simple pseudo random number generator based on iq's hash
 return  (0.8+0.2*fract(sin(++randSeed)*4375.5453123));
}
#ifdef SHADOWS
float FuzzyShadow(vec3 ro, vec3 rd, float lightDist, float coneGrad, float rCoC){
 float t=0.0,d,s=1.0,r;
 ro+=rd*rCoC*2.0;
 for(int i=0;i<4;i++){
  r=rCoC+t*coneGrad;d=DE(ro+rd*t)+r*0.5;s*=linstep(-r,r,d);t+=abs(d)*randStep();
 }
 return clamp(s,0.0,1.0);
}
#endif
vec3 Background(vec3 rd,vec3 Llll){
#ifdef TEXTURECUBE
 return textureCube(iChannel0,rd).rgb;
#else
 float s=max(0.0,dot(rd,Llll));
 return vec3(.4,.5,.75)*(s+pow(s,10.0))+rd*0.05;
#endif
}
#ifdef REFLECTIONS
vec3 FuzzyReflection(vec3 ro, vec3 rd, float coneGrad, float rCoC,vec3 Llll){
 float t=0.0,d,r;
 ro+=rd*rCoC*2.0;
 vec4 col=vec4(0.0);
 for(int i=0;i<3;i++){//had to unroll this before to get it to compile correctly?!?!
  r=rCoC+t*coneGrad;d=DE(ro);
  if(d<r){
   vec2 v=vec2(r*0.1,0.0);//use normal deltas based on CoC radius
   vec3 N=normalize(vec3(DE(ro+v.xyy)-d,DE(ro+v.yxy)-d,DE(ro+v.yyx)-d));
   if(N!=N)N=-rd;
   vec3 scol=mcol*(0.1+Background(reflect(rd,N),Llll))*(0.75+0.5*dot(N,Llll));
   float alpha=(1.0-col.w)* linstep(-r,r,-d);
   col+=vec4(scol*alpha,alpha);
  }
  d=max(d,r*0.5)*randStep();ro+=d*rd;t+=d;
 }
 return col.rgb+Background(rd,Llll)*(1.0-clamp(col.w,0.0,1.0));
}
#endif
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
 randSeed=fract(cos((fragCoord.x+fragCoord.y*117.0+time*10.0)*473.7192451));
 vec3 ro=vec3(0,0,-2.75);
 vec3 rd=lookat(vec3(cos(tim)*0.2,-sin(tim)*.2,0.)-ro,vec3(0,1,0))*normalize(vec3((2.0*fragCoord.xy-size.xy)/size.y,2.0));
 float focalDistance=length(ro);
 vec3 Llll=normalize(vec3(0.5,0.6,0.4));
 vec4 col=vec4(0);//color accumulator
 float t=2.5;//distance traveled
 ro+=rd*t;//move close to object
 for(int i=0;i<15;i++){//march loop
  if(col.w>0.9 || t>4.0)continue;//bail if we hit a surface or go out of bounds
  float rCoC=CircleOfConfusion(t,focalDistance);//calc the radius of CoC
  float d=DE(ro);
  if(d<rCoC){//if we are inside add its contribution
   vec2 v=vec2(rCoC*.1,.0);//use normal deltas based on CoC radius
   vec3 N=normalize(vec3(-d+DE(ro+v.xyy),-d+DE(ro+v.yxy),-d+DE(ro+v.yyx)));
   if(N!=N)N=-rd;
   vec3 refl=reflect(rd,N);
   vec3 scol=mcol*(0.1+Background(refl,Llll));
#ifdef SHADOWS
   scol*=FuzzyShadow(ro,Llll,3.0,shadowCone,rCoC);
#else
   scol*=(0.75+0.5*dot(N,Llll));
#endif
#ifdef REFLECTIONS
   scol+=0.5*FuzzyReflection(ro,refl,reflectionCone,rCoC,Llll);
#endif
   float alpha=(1.0-col.w)*linstep(-rCoC,rCoC,-d);//calculate the mix like cloud density
   col+=vec4(scol*alpha,alpha);//blend in the new color 
  }
  d=max(d,pixelSize)*randStep();//add in noise to reduce banding and create fuzz
  ro+=d*rd;//march
  t+=d;
 }//mix in background color
 col.rgb=mix(Background(rd,Llll),col.rgb,clamp(col.w,0.0,1.0));

 fragColor=vec4(clamp(col.rgb,0.,1.),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
