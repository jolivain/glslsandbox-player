/*
 * Original shader from: https://www.shadertoy.com/view/ttX3D7
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// --------[ Original ShaderToy begins here ]---------- //
// SoC with DEL by eiffie (adding Distance Estimated Light to the Sphere of Confusion renderer)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//#define time iTime
//#define size iResolution
#define size resolution

float pixelSize=0.,focalDistance=0.,aperture=0.,fudgeFactor=0.78,shadowCone=0.5;

bool bColoring=false;
vec3 mcol=vec3(0.);
mat2 rmx=mat2(0.);
const vec4 p0=vec4(0.0,0.0,4.0,1.0);
const vec3 rc=vec3(2.633,0.033,2.133);
vec2 DE(in vec3 z0){//amazing box by tglad
 vec4 z = vec4(z0,1.0);float r2=10.0;
 for (int n = 0; n < 3; n++) {
  z.xzy=clamp(z.xyz, -1.0, 1.0) *2.0-z.xyz;
  z*=2.0/clamp(dot(z.xyz,z.xyz),0.1,1.0);
  z+=p0;
  if(n==1)r2=length(z.xyz)/z.w;//distance to light
  z.xy=z.xy*rmx;
 }
 if(bColoring)mcol+=vec3(0.7,0.6,0.4)+z.xyz*0.2;
 z.xyz=max(abs(z.xyz)-rc,vec3(0.0));
 return vec2((length(z.xyz)-0.1)/z.w,r2);//returns distance to surface and light
}

float CircleOfConfusion(float t){//calculates the radius of the circle of confusion at length t
 return max(abs(focalDistance-t)*aperture,pixelSize*(1.0+t));
}
mat3 lookat(vec3 fw,vec3 up){
 fw=normalize(fw);vec3 rt=normalize(cross(fw,normalize(up)));return mat3(rt,cross(rt,fw),fw);
}
float linstep(float a, float b, float t){return clamp((t-a)/(b-a),0.,1.);}// i got this from knighty and/or darkbeam
//random seed and generator
vec2 randv2;
float rand2(){// implementation derived from one found at: lumina.sourceforge.net/Tutorials/Noise.html
 randv2+=vec2(1.0,1.0);
 return fract(sin(dot(randv2 ,vec2(12.9898,78.233))) * 43758.5453);
}

float FuzzyShadow(vec3 ro, vec3 rd, float lightDist, float coneGrad, float rCoC){
 float t=0.01,d=1.0,s=1.0;
 for(int i=0;i<4;i++){
  if(t>lightDist)continue;
  float r=rCoC+t*coneGrad;//radius of cone
  d=DE(ro+rd*t).x+r*0.66;
  s*=linstep(-r,r,d);
  t+=abs(d)*(0.8+0.2*rand2());
 }
 return clamp(s,0.0,1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
 randv2=fract(cos((fragCoord.xy+fragCoord.yx*vec2(100.0,100.0))+vec2(time)*10.0)*1000.0);
 pixelSize=1.0/size.y;
 float tim=time*0.25;//camera, lighting and object setup
 float ct=cos(tim),st=sin(tim);
 rmx=mat2(ct,-st,st,ct);
 float z=cos(tim*0.3)*5.0;
 vec3 ro=vec3(vec2(ct,st)*(abs(z)+0.1)*(1.0+sin(tim*0.1)),z);
 focalDistance=min(length(ro)+0.001,1.0);
 aperture=0.007*focalDistance;
 vec3 rd=lookat(-ro,vec3(0.0,1.0,0.0)-sin(ro)*0.1)*normalize(vec3((2.0*fragCoord.xy-size.xy)/size.y,2.0));
 vec3 lightColor=vec3(1.0,0.5,0.25);
 vec4 col=vec4(0.0);//color accumulator, .w=alpha
 float t=0.0,mld=100.0;//distance traveled, minimum light distance
 for(int i=1;i<72;i++){//march loop
  if(col.w>0.9 || t>15.0)break;//bail if we hit a surface or go out of bounds
  float rCoC=CircleOfConfusion(t);//calc the radius of CoC
  vec2 D=DE(ro);
  float d=D.x+0.33*rCoC;
  float lightDist=D.y;//the distance estimate to light
  mld=min(mld,lightDist);//the minimum light distance along the march
  if(d<rCoC){//if we are inside the sphere of confusion add its contribution
   vec3 p=ro-rd*abs(d-rCoC);//back up to border of SoC
   mcol=vec3(0.0);//clear the color trap
   bColoring=true;//collecting color samples with normal deltas
   vec2 v=vec2(rCoC*0.5,0.0);//use normal deltas based on CoC radius
   vec3 N=normalize(vec3(-DE(p-v.xyy).x+DE(p+v.xyy).x,-DE(p-v.yxy).x+DE(p+v.yxy).x,-DE(p-v.yyx).x+DE(p+v.yyx).x));
   bColoring=false;
   if(N!=N)N=-rd;//if no gradient assume facing us
   v=vec2(lightDist,0.0);//now find the closest light's general direction
   vec3 L=-normalize(vec3(-DE(p-v.xyy).y+DE(p+v.xyy).y,-DE(p-v.yxy).y+DE(p+v.yxy).y,-DE(p-v.yyx).y+DE(p+v.yyx).y));
   float lightStrength=1.0/(1.0+lightDist*lightDist*20.0);
   vec3 scol=mcol*0.2*(0.2+0.4*(1.0+dot(N,L)))*lightStrength;//average material color * diffuse lighting * attenuation
   scol+=pow(max(0.0,dot(reflect(rd,N),L)),8.0)*lightColor;//specular lighting
   scol*=FuzzyShadow(p,L,lightDist*0.5,shadowCone,rCoC);//now stop the shadow march at light distance
   col.rgb+=lightColor/(0.5+mld*mld*5000.0)*(1.0-col.w);//add a bloom around the light
   mld=100.0;//clear the minimum light distance for the march
   float alpha=fudgeFactor*(1.0-col.w)*linstep(-rCoC,rCoC,-d);//calculate the mix like cloud density
   col=vec4(col.rgb+scol*alpha,clamp(col.w+alpha,0.0,1.0));//blend in the new color 
  }//move the minimum of the object and light distance
  d=abs(fudgeFactor*min(d,lightDist+0.33*rCoC)*(0.8+0.2*rand2()));//add in noise to reduce banding and create fuzz
  ro+=d*rd;//march
  t+=d;
 }//mix in background color
 vec3 scol=lightColor/(0.5+mld*mld*5000.0);//add one last light bloom
 col.rgb+=scol*(1.0-col.w);

 fragColor = vec4(clamp(col.rgb,0.0,1.0),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
