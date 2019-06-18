/*
 * Original shader from: https://www.shadertoy.com/view/MslfWn
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

// --------[ Original ShaderToy begins here ]---------- //
const float	SMALL_VEIN_DISTANCE_MIN =  .005;
const float	SMALL_VEIN_DISTANCE_MAX = -.002;
const float	BASE_LEAF_THICKNESS=.2;
const float	SIDE_VEINS_THICKNESS=.5;
const float SIDE_VEINS_COUNT=12.;

const float PI=acos(-1.);//3.14159265358979;

#define saturate(a) clamp(a,0.,1.)

float h11(float n){return fract(sin(n)*43758.5453123);}
/*
float noise(in vec3 x){vec3 p=floor(x),f=fract(x);
 f=f*f*(3.-2.*f);
 float n=p.x+p.y*57.+113.*p.z;
 return mix(mix(mix(h11(n+  0.),h11(n+  1.),f.x),
                mix(h11(n+ 57.),h11(n+ 58.),f.x),f.y),
            mix(mix(h11(n+113.),h11(n+114.),f.x),
                mix(h11(n+170.),h11(n+171.),f.x),f.y),f.z);}
/*
vec3 noised(in vec2 x){
 vec2 p=floor(x),f=fract(x),u=f*f*(3.-2.*f);
 float n=p.x+p.y*57.,a=h11(n+ 0.),b=h11(n+ 1.),c=h11(n+57.),d=h11(n+58.);
 return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
  30.*f*f*(f*(f-2.0)+1.0)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));}
*/
float noise(in vec2 x){vec2 p=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 float n=p.x+p.y*57.;
 return mix(mix(h11(n+ 0.),h11(n+ 1.),f.x),
            mix(h11(n+57.),h11(n+58.),f.x),f.y);}
/*
float rmf(vec3 p){p+=PI;vec4 N;
 N.x=noise(p);p=p*2.02;N.y=noise(p);p=p*2.03;N.z=noise(p);p=p*2.01;N.w=noise(p);
 //N=abs(N-vec4(.5));
 float f=.5000*N.x;f+=.2500*N.y*N.x;f+=.1250*N.y*N.z;f+=.0625*N.z*N.w;return f;}//return f/.9375;}
*/
//float rmf2(vec3 p){return rmf(p)+.5*rmf(p*16.)+.25*rmf(p*256.);}
/*
float fbm(vec3 p){p+=PI;
 float f=.5*noise(p);p*=2.02;f+=.25*noise(p);p*=2.03;f+=.125*noise(p);p*=2.01;
 f+=.0625*noise(p);return f;}//return f/0.9375;}
*/
vec2 displace(vec2 p){p+=PI;
 vec2 f=.5000*noise(p)+vec2(0);p=p*2.02;
 f.x+=.25*noise(p);p*=2.03;f.x+=.125*noise(p);p*=2.01;f.x+=.0625*noise(p);
 p=p/8.+12358.3446;
 f.y+=.5*noise(p);p*=2.02;f.y+=.25*noise(p);p*=2.03;f.y+=.125*noise(p);p*=2.01;
 f.y+=.0625*noise(p);return f;}//return f/0.9375;}

//return y of polynomial
//#define tpoly t=r.x+t*(r.y-r.x)
//float Poly3(vec4 a,vec2 r,float t){tpoly;return a.x+t*(a.y+t*(a.z+t*a.w));}
//float Poly4(vec4 a,float b,vec2 r,float t){tpoly;return a.x+t*(a.y+t*(a.z+t*(a.w+t*b)));}

//smoothstep() alternatives. [r]Ranges [v]values
float SmoothSingleStep(vec2 r,vec2 v,float t){return mix(v.x,v.y,smoothstep(r.x,r.y,t));}
float SmoothDoubleStep( vec3 r,vec3 v,float t){
 return step(t  ,r.y)*mix(v.x,v.y,smoothstep(r.x,r.y,t))
       +step(r.y,t  )*mix(v.y,v.z,smoothstep(r.y,r.z,t));}
float SmoothTripleStep(vec4 r,vec4 v,float t){
 vec3 s = vec3(step(t,r.y),step(r.y,t),step(r.z,t));
 return s.x*mix(v.x,v.y,smoothstep(r.x,r.y,t))
       +s.y*(1.-s.z)*mix(v.y,v.z,smoothstep(r.y,r.z,t))
       +s.z*mix(v.z,v.w,smoothstep(r.z,r.w,t));}

//Return an equivalent of smoothstep( 0, 1, t )but reversed along the y=x diagonal
// Not exactly the reciprocal of the s-curve since tangents are not infinite at the
//	0 & 1 boundaries but close enough! //[s]tangentstrength
float ReverseSCurve(float t, float s ){
//	const float TANGENT_STRENGTH = 4.0;	// You can increase the slope at edges at the risk of losing the S shape
 s=1./s;
 float b=1.- s,x=saturate(1.-abs(1.-2.*t));// 0 at t=0, 1 at t=0.5, then back to 0 at t=1
 float curve=abs((s/(b*x+s)-s)/b );// Some sort of 1/x but making sure we have 1 at x=0 and 0 at x=1
 return .5*mix(1.-curve,1.+curve,t);// Mix the 2 mirrored curves
}

float ReverseSmoothstep(float a,float b,float t,const float _TangentStrength){
 return ReverseSCurve(saturate((t-a)/(b-a)),_TangentStrength);}

// Gets the length of the leaf in the specified slanted direction knowing the current position
// Also returns the source of the leaf direction emanating from the center vein along given direction
float GetLeafLength(vec2 p,vec2 d,out vec2 c ){
 c=p-(p.x/d.x)*d;	
 //Source of the leaf in the provided direction
 //The y value is in [0,1] and can help us determine the height within the leaf
 //So we can use it to know that it's broad at base and thinning at the tip...
 //But we can also use it to know the size of side veins depending on their position on the leaf, etc.
 float Length=SmoothTripleStep(vec4(-.15,.02,.1,1.),vec4(0,0.38,.41,0),c.y); 
 Length*=1.+.03*sin(PI*SIDE_VEINS_COUNT*c.y)*SmoothDoubleStep(vec3(0,.2,1),vec3(.5,1,.5),c.y );
 return Length;}

float Grid(vec2 p, float a ){//[a]=attenuation
 p=vec2(fract(50.*p.x),fract(50.*p.y));
 vec2 c=1.-p;p*=p;
 return exp(-a*p.x)+exp(-a*c.x*c.x)
       +exp(-a*p.y)+exp(-a*c.y*c.y);}

//u=position [d]distance
vec2 SmallVeinsThickness(vec2 a,vec2 b,vec2 u,vec3 d){
 vec2 o=normalize(b-a);//orthogonal
 vec2 p=vec2(d.x,dot(u-a,o));
 float m=mix(.0,.1,2.*min(d.y,d.z)/(d.y+d.z));// Less displacement near the veins
 vec2 i=displace(30.*u );
 p+=m*(i-.4);//displace grid for organic look
 p-=.5*m*length(i)*vec2(o.y,-o.x);//displace along the vein direction
 float r=((Grid(p,100.)/3.+Grid(2.*p,50.)))*.5;
 //approximate distance to vein:
 return vec2(1.-.5*r,mix(SMALL_VEIN_DISTANCE_MIN,SMALL_VEIN_DISTANCE_MAX,r));}

vec2 SideVeins( vec2 _Pos, vec2 _Direction, float _IsLeft ){
 //get distance to the 2 closest veins
 float SecondClosestVein=0.;
 vec2 SecondClosestVeinPos=vec2(0,-.2);
 float ClosestVein=1e4;
 float ClosestDistanceAlongVein = 1e4;
 float ClosestLeafRatio = 0.0;
 vec2 ClosestVeinPos = vec2(0.0);
 for(int ii=0;ii<int(SIDE_VEINS_COUNT)+1;ii++){
  float	i=float(ii);
  //get base position and line direction
  vec2 Direction=normalize( _Direction + vec2( 0.0, 0.05 * i ) );
  vec2 VeinOrtho=vec2(-Direction.y, Direction.x );
  vec2 VeinBase=vec2(0,-.18+1.02 * pow( (i + 0.5 * _IsLeft)/SIDE_VEINS_COUNT, 1.2 ) );	// Source of the vein on the center vein. The pow is here just to pack a little more veins near the base
  float DistanceAlongVein = 1.05 * dot( _Pos - VeinBase, Direction );
  //get length of the leaf in that direction
  vec2 CenterSource;
  float LeafLength = GetLeafLength( _Pos, Direction, CenterSource );
  float LeafRatio = DistanceAlongVein / LeafLength;	// 0 at center, 1 at the edge
  //curved offset that varies with position along the vein to avoid stoopid straight veins
  float VeinOffset=.05*(ReverseSmoothstep(0.,1.,LeafRatio,4.)-.4);
  vec2 VeinPos=VeinBase+Direction*DistanceAlongVein + VeinOffset * VeinOrtho;
  // Fast measure of the distance to that vein		
  float Distance2Vein = abs(dot( _Pos - VeinPos, VeinOrtho ));
  if(Distance2Vein<ClosestVein){
   SecondClosestVein = ClosestVein;
   SecondClosestVeinPos = ClosestVeinPos;
   ClosestVein = Distance2Vein;
   ClosestDistanceAlongVein = DistanceAlongVein;
   ClosestVeinPos = VeinPos;
   ClosestLeafRatio = LeafRatio;
 }}
 //get its size based on distance from the center
 float	VeinSize = SmoothSingleStep( vec2( 0.0, 0.85 ), vec2( 0.008, 0.003 ), ClosestLeafRatio );
 VeinSize = max( 0.0, VeinSize - step( 1.1, ClosestLeafRatio ) );
 // Make it round
 float	VeinThickness = 3.0 * sqrt( 1.0 - min( 1.0, ClosestVein*ClosestVein / (VeinSize*VeinSize) ) );
 // What I'm doing here is computing a vein thickness with slower decay
 //	so I can subtract it with actual thickness to isolate the borders
 // This way I can increase leaf optical thickness near the veins...
 //	float	VeinThickness2 = 2.5 * exp( -0.9*ClosestVein*ClosestVein / (VeinSize*VeinSize) );
 //	float	OpticalThickness = 2.0 * (VeinThickness2 - VeinThickness);	// Negative inside the vein, positive outside with a burst nead the vein
 //
 //	OpticalThickness = mix( OPTTHICK_SIDE_VEINS,// * -OpticalThickness,
 //							mix( OPTTHICK_LEAF_MIN, OPTTHICK_LEAF_MAX, OpticalThickness ),
 //						    step( 0.0, OpticalThickness ) );	
 // Compute signed distance to vein
 float SignedDist2Vein=ClosestVein - VeinSize;
 // Add small veins pattern in between (a displaced grid really)
 vec2 SmallVeinsInfos=SmallVeinsThickness( ClosestVeinPos, SecondClosestVeinPos, _Pos, vec3( ClosestDistanceAlongVein, ClosestVein, SecondClosestVein ) );
 //	SignedDist2Vein = min( SignedDist2Vein, SmallVeinsInfos.y );
 return vec2( max( VeinThickness,SmallVeinsInfos.x),SignedDist2Vein);}

vec2 LeafThickness(vec2 p){// Tweak pos so Y=0 is at the base and 1 at the tip
 p=vec2(.16,.16)*(p+vec2(0,2.5));// Actual world base is at (0,-3) and tip at (0,4)
 float IsLeft=step( p.x, 0.0 );
 p.x=abs(p.x);
 float VeinSize=.0004 * ReverseSmoothstep(1.,-.2,p.y,10.);// Central vein
 VeinSize=VeinSize*mix(1.,.1,saturate(1.5*p.y));
 VeinSize=p.y<-.2||p.y>0.97 ?0.:VeinSize;
 float CentralVein=sqrt(1.-min(1.,p.x*p.x/VeinSize));// Make it round
 float r=max(0.,CentralVein);
 float sd2v=p.x-sqrt(VeinSize);//Compute signed distance to vein
 // Add side veins
 vec2 Direction=normalize(vec2(1,mix(.2,.5,p.y)));
 vec2 CenterSource=vec2(0);
 float ass=GetLeafLength(p,Direction,CenterSource);//modifies CenterSource(), not too good style
 float sr=(dot(p-CenterSource,Direction))/ass;
 float lt=SmoothSingleStep(vec2(.9,1),vec2(1,0),sr);//Attenuate leaf with distance
 float svt=SmoothSingleStep(vec2(.9,1),vec2(1,0),sr);//Attenuate side veins with distance
 vec2 svi=SideVeins(p,Direction,IsLeft);
 sd2v=min(sd2v,svi.y);
 return vec2(max(r,BASE_LEAF_THICKNESS*(1.5*lt+svt*svi.x)),sd2v);}

//[p].xy [n]PlaneNormal [l]VectorToTight [v]viewVector
vec3 ComputeLighting(vec2 p,vec3 n,vec3 l){
 p=LeafThickness(p);//leaf thickness
 vec3 d=10.*vec3(1);//diffuse
 d*=saturate(-dot(l,n));//clamp
 float r;
 if(p.y>=.0)r=mix(20.,80.,exp(-20.0*p.y));
 else       r=mix(20.,30.,p.x*saturate(-p.y/.01));
 vec3 Transmittance=vec3(.3,.2,.8)*r/PI;
 Transmittance=exp(-Transmittance*p.x);	
 return vec3(d*Transmittance);}//;step(1e-3,p.x));}

vec3 ComputeLighting(vec2 p,vec3 n){return ComputeLighting(p,n,vec3(0,0,-1));}
vec3 ComputeLighting(vec2 p){return ComputeLighting(p,vec3(0,0,1));}

#define ddabcb(a,b,c) dot(a,b)/dot(c,b)

void mainImage(out vec4 fragColor,in vec2 U){vec2 u=U.xy/iResolution.xy;
 u=vec2(u.y,u.x);//quater rotation
 u-=.5;//center
 u*=vec2(.65,.92);//scale
 vec3 Leaf=ComputeLighting((u*8.));
 Leaf=sqrt(Leaf*.1);
 fragColor=vec4(Leaf,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
