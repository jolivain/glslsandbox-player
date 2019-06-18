// Ray Marching
// the.savage@hotmail.co.uk

// Some mods by @emackey: Pan and zoom with the mouse.

#ifdef GL_ES
precision highp float;
#endif // GL_ES

// Definitions

// #define CUBEFIELD
// #define SPONGE
// #define SIERPINSKI
// #define MANDELBULB
// #define MANDELBOX
 #define DODECAHEDRON
// #define KNOT
// #define QUATERNION

// #define OCCLUSION
#define SHADOW
// #define REFLECTION
// #define ANTIALIAS

#define MAX_STEPS	255
#define MAX_ITTERS	20
#define MAX_OCCLUSION	10
#define MAX_ALIAS	3

// Constants

const float PI=3.14159;
const float EPSILON=6e-7;
const float BAILOUT=4.0;

// Uniforms

uniform vec2 resolution;
uniform vec2 mouse;

uniform float time;

uniform vec2 surfaceSize;
varying vec2 surfacePosition;

// Would-be uniforms

vec3 u_vCamera=vec3(0.0001);
vec3 u_vObject=vec3(0.0);
vec3 u_vLight=vec3(-125.0);

mat3 u_mCamera=mat3(
	1.0,0.0,0.0,
	0.0,1.0,0.0,
	0.0,0.0,1.0);

mat3 u_mObject=mat3(
	1.0,0.0,0.0,
	0.0,1.0,0.0,
	0.0,0.0,1.0);

mat3 u_mLight=mat3(
	1.0,0.0,0.0,
	0.0,1.0,0.0,
	0.0,0.0,1.0);

float u_fPower=0.2;
vec3 u_vJulia=vec3(0.0);
vec3 u_vOffset=vec3(0.0);
vec3 u_vClamp=vec3(0.0);
float u_fBounds=120.0;

#define u_fDetail (0.0008 * resolution.y / (surfaceSize.y))
float u_fSmooth=0.5;
float u_fDither=0.0;
int u_nAlias=0;

const vec3 u_cAmbient=vec3(1.0,1.0,1.0);
const vec3 u_cDiffuse=vec3(0.0,0.6,0.7);
const vec3 u_cColour1=vec3(0.8,0.6,0.1);
const vec3 u_cColour2=vec3(0.3,0.2,0.3);
const vec3 u_cInnerGlow=vec3(1.0,0.0,0.0);
const vec3 u_cOuterGlow=vec3(0.0,0.0,0.0);
const vec3 u_cLight=vec3(1.0,0.9,0.7);
const vec3 u_cShadow=vec3(0.0,0.0,0.0);
const vec3 u_cBackground=vec3(0.6,0.8,0.7);

const float u_fAmbient=0.0;
const float u_fDiffuse=1.0;
const float u_fColour1=0.5;
const float u_fColour2=0.5;
const float u_fInnerGlow=0.0;
const float u_fOuterGlow=0.0;
const float u_fLight=0.3;
const float u_fShadow=0.5;
const float u_fBackground=1.0;

const int u_nColouring=4;

const float u_fOcclusion=3.0;
const float u_fEnhance=0.0;
const float u_fShininess=1.5;
const float u_fHardness=4.0;
const float u_fReflection=0.0;
const float u_fSoftShadow=10.0;
const float u_fBacklight=0.0;
const float u_fFog=0.0;
const float u_fFalloff=0.0;

const float fNormalDetail=1.0;
const float fShadowDetail=2.0;

const bool u_bBounds=false;

// Local data

#define u_fWidth resolution.x
#define u_fHeight resolution.y
#define u_fRatio (u_fWidth/u_fHeight)
#define u_fScale (1.0/min(u_fWidth,u_fHeight))

float fMinDist=100000.0;
float fOrbitTrap=0.0;

// Local functions

// rand
// Call to generate random number

float rand(const vec2 vSeed)
{
	const vec2 vR1=vec2(12.9898,78.233);
	const float fR1=43758.5453;

	return fract(sin(dot(vSeed,vR1))*fR1);
}

// rand3
// Call to generate random vector

vec3 rand3(const vec2 vSeed)
{
	const vec2 vR1=vec2(12.9898,78.233);
	const vec2 vR2=vec2(4.898,7.23);
	const vec2 vR3=vec2(0.23,1.111);

	const float fR1=43758.5453;
	const float fR2=23421.631;
	const float fR3=392820.23;

	return vec3(
		fract(sin(dot(vSeed,vR1))*fR1),
		fract(sin(dot(vSeed,vR2))*fR2),
		fract(sin(dot(vSeed,vR3))*fR3));
}

// deCubefield
// Call to get distance to cubefield

#ifdef CUBEFIELD
float deCubefield(vec3 vRay)
{
	vec3 v=abs(vRay-(floor(vRay)+u_vOffset))*u_vClamp;
	float r=max(max(v.x,v.y),v.z)-u_fPower;

	if(r<fMinDist) fMinDist=r;
	if(u_nColouring>0) fOrbitTrap=dot(v,v);

	return r;
}
#endif // CUBEFIELD

// deSponge
// Call to get distance to menger sponge

#ifdef SPONGE
float deSponge(vec3 vRay)
{
	int nSteps=int(u_fPower);

	vec3 c=(vRay*0.5)+0.5;
	vec3 v=abs(c-0.5)-0.5;

	float m=u_vClamp.x;
	float r=max(v.x,max(v.y,v.z));

	if(r<fMinDist) fMinDist=r;

	for(int n=1;n<6;n++)
	{
		if(n>nSteps) break;

		m*=u_vClamp.y;
		v=(0.5-abs(mod(c*m,u_vClamp.z)-1.5))+u_vOffset;
		r=max(r,min(max(v.x,v.z),min(max(v.x,v.y),max(v.y,v.z)))/m);

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=dot(v,v);
	}
	return r*2.0;
}
#endif // SPONGE

// deSierpinski
// Call to get distance to sierpinski gasket

#ifdef SIERPINSKI
float deSierpinski(vec3 vRay)
{
	vec3 a1=u_vOffset;
	vec3 a2=vec3(-a1.x,-a1.y,a1.z);
	vec3 a3=vec3(a1.x,-a1.y,-a1.z);
	vec3 a4=vec3(-a1.x,a1.y,-a1.z);

	vec3 v=vRay;
	vec3 c;

	float r;
	float d;

	int nStep=0;

	for(int n=1;n<=MAX_ITTERS;n++)
	{
		nStep=n-1;

		c=a1;
		r=length(v-a1);

		d=length(v-a2);
		if(d<r) {c=a2; r=d;}

		d=length(v-a3);
		if(d<r) {c=a3; r=d;}

		d=length(v-a4);
		if(d<r) {c=a4; r=d;}

		v=u_fPower*v-c*u_vClamp;
		r=length(v);

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=dot(v,v);
	}
	return length(v)*pow(u_fPower,float(-nStep));
}
#endif // SIERPINSKI

// deMandelbulb
// Call to get distance to mandelbulb

#ifdef MANDELBULB
float deMandelbulb(vec3 vRay)
{
	vec3 v=vRay;
	vec3 c=(u_vJulia!=vec3(0.0))?u_vJulia:v;

	float r=0.0;
	float d=1.0;

	for(int n=1;n<=MAX_ITTERS;n++)
	{
		r=length(v);

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=0.33*log(dot(v,v))+1.0;

		if(r>BAILOUT) break;

		float theta=acos(v.z/r);
		float phi=atan(v.y,v.x);
		d=pow(r,u_fPower-1.0)*u_fPower*d+1.0;

		float zr=pow(r,u_fPower);
		theta=theta*u_fPower;
		phi=phi*u_fPower;

		v=(vec3(sin(theta)*cos(phi),sin(phi)*sin(theta),cos(theta))*zr)+c;

		if(u_vClamp.x!=0.0) v.x=max(v.x,u_vClamp.x);
		if(u_vClamp.y!=0.0) v.y=max(v.y,u_vClamp.y);
		if(u_vClamp.z!=0.0) v.z=max(v.z,u_vClamp.z);

		v+=u_vOffset;
	}
	return 0.5*log(r)*r/d;
}
#endif // MANDELBULB

// deMandelbox
// Call to get distance to mandelbox

#ifdef MANDELBOX
float deMandelbox(vec3 vRay)
{
	vec4 v=vec4(vRay,1.0);
	vec4 c=(u_vJulia!=vec3(0.0))?vec4(u_vJulia,1.0):v;

	vec3 vOffset=u_vOffset*2.0;
	vec3 vNegOffset=-u_vOffset;

	float m=u_vClamp.x*u_vClamp.x;
	float f=u_vClamp.y*m;

	vec4 sv=vec4(u_fPower,u_fPower,u_fPower,abs(u_fPower))/m;

	for(int n=1;n<=MAX_ITTERS;n++)
	{
		v.xyz=(clamp(v.xyz,vNegOffset,u_vOffset)*vOffset)-v.xyz;

		float r=dot(v.xyz,v.xyz);
		v=((v*clamp(max(f/r,m),0.0,1.0))*sv)+c;

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=log(dot(v.xyz,v.xyz))+1.0;
	}
	return (length(v.xyz)-abs(u_fPower-1.0))/v.w-pow(abs(u_fPower),float(1-MAX_ITTERS));
}
#endif // MANDELBOX

// deDodecahedron
// Call to get distance to docecahedron ifs

#ifdef DODECAHEDRON
float deDodecahedron(vec3 vRay)
{
	float fPhi=u_fPower;

	float n1=0.5/fPhi;
	float n2=1.0/sqrt(pow(fPhi*(1.0+fPhi),2.0)+pow(fPhi*fPhi-1.0,2.0)+pow(1.0+fPhi,2.0));

	vec3 p1=vec3(fPhi*n1,fPhi*fPhi*n1,n1);
	vec3 p2=vec3(fPhi*(1.0+fPhi)*n2,(fPhi*fPhi-1.0)*n2,(1.0+fPhi)*n2);

	vec3 v=vRay;

	float s1=sin(u_vJulia.x);
	float c1=cos(u_vJulia.x);

	float s2=sin(u_vJulia.y);
	float c2=cos(u_vJulia.y);

	float s3=sin(u_vJulia.z);
	float c3=cos(u_vJulia.z);

	mat3 rot=mat3(
		c1*c3+s1*s2*s3,c2*s3,c1*s2*s3-c3*s1,
		c3*s1*s2-c1*s3,c2*c3,s1*s3+c1*c3*s2,
		c2*s1,-s2,c1*c2);

	float t;
	float r=length(v);

	if(r<fMinDist) fMinDist=r;

	int nStep=0;

	for(int n=1;n<=MAX_ITTERS;n++)
	{
		nStep=n-1;

		if(r>BAILOUT) break;

		v=abs(v*rot)+u_vOffset;

		t=p1.y*v.x+p1.z*v.y-p1.x*v.z;
		if(t<0.0) v+=vec3(-2.0,-2.0,2.0)*t*p1.yzx;

		t=-p1.x*v.x+p1.y*v.y+p1.z*v.z;
		if(t<0.0) v+=vec3(2.0,-2.0,-2.0)*t*p1.xyz;

		t=p1.z*v.x-p1.x*v.y+p1.y*v.z;
		if(t<0.0) v+=vec3(-2.0,2.0,-2.0)*t*p1.zxy;

		t=-p2.x*v.x+p2.y*v.y+p2.z*v.z;
		if(t<0.0) v+=vec3(2.0,-2.0,-2.0)*t*p2.xyz;

		t=p2.z*v.x-p2.x*v.y+p2.y*v.z;
		if(t<0.0) v+=vec3(-2.0,2.0,-2.0)*t*p2.zxy;

		v=v*2.0-u_vClamp;
		r=length(v);

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=dot(v,v);
	}
	return (r-2.0)*pow(2.0,-float(nStep));
}
#endif // DODECAHEDRON

// deKnot
// Call to get distance to knot

#ifdef KNOT
float deKnot(vec3 p)
{
	int nSteps=int(u_fPower);

	float r=length(p.xz);
	float ang=atan(p.z,p.x);
	float y=p.y;
	float d=10000.0;

	for(int n=1;n<=MAX_ITTERS;n++)
	{
		if(n>nSteps) break;

		vec3 p=vec3(r,y,ang+2.0*PI*float(n-1));
		p.x-=u_vOffset.z;

		float ra=p.z*u_vClamp.x/u_vClamp.z;
		float raz=p.z*u_vClamp.y/u_vClamp.z;

		d=min(d,length(p.xy-vec2(u_vOffset.y*cos(ra)+u_vOffset.z,u_vOffset.y*sin(raz)+u_vOffset.z))-u_vOffset.x);

		if(d<fMinDist) fMinDist=d;
		if(n==u_nColouring) fOrbitTrap=dot(p,p);
	}
	return d;
}
#endif // KNOT

// deQuaternion
// Call to get distance to quaternion

#ifdef QUATERNION
float deQuaternion(vec3 vRay)
{
	vec4 c=vec4(u_vJulia,u_fPower);

	vec4 v=vec4(vRay,0.0);
	vec4 d=vec4(1.0,0.0,0.0,0.0);

	for(int n=1;n<MAX_ITTERS;n++)
	{
		d=2.0*vec4(v.x*d.x-dot(v.xzw,d.yzw),v.x*d.yzw+d.x*v.yzw+cross(v.yzw,d.yzw));
		v=vec4(v.x*v.x-dot(v.yzw,v.yzw),vec3(2.0*v.x*v.yzw))+c;

		float r=dot(v,v);

		if(r<fMinDist) fMinDist=r;
		if(n==u_nColouring) fOrbitTrap=r;

		if(r>10.0) break;
	}
	float r=length(v);
	return 0.5*r*log(r)/length(d);
}
#endif // QUATERNION

// rayDistance
// Call to estimate distance to object

float rayDistance(vec3 vRay)
{
	// adjust for rotation
	vRay*=u_mObject;

	// what estimator?
	#ifdef CUBEFIELD
	return deCubefield(vRay);
	#endif // CUBEFIELD

	#ifdef SPONGE
	return deSponge(vRay);
	#endif // SPONGE

	#ifdef SIERPINSKI
	return deSierpinski(vRay);
	#endif // SIERPINSKI

	#ifdef MANDELBULB
	return deMandelbulb(vRay);
	#endif // MANDELBULB

	#ifdef MANDELBOX
	return deMandelbox(vRay);
	#endif // MANDELBOX

	#ifdef DODECAHEDRON
	return deDodecahedron(vRay);
	#endif // DODECAHEDRON

	#ifdef KNOT
	return deKnot(vRay);
	#endif // KNOT

	#ifdef QUATERNION
	return deQuaternion(vRay);
	#endif // QUATERNION

	return 0.0;
}

// rayIntersec
// Call to get bounding intersection distances

bool rayIntersec(vec3 vRay,vec3 vDir,out float fMin,out float fMax)
{
	// find discriminant
	float fRdt=dot(vRay,vDir);
	float fRdr=dot(vRay,vRay)-u_fBounds;

	float fDisc=(fRdt*fRdt)-fRdr;

	// ray missed bounds?
	if(fDisc<=0.0) return false;

	// find intersection distances
	fDisc=sqrt(fDisc);
	fRdt=-fRdt;

	// may start inside sphere
	fMin=max(0.0,fRdt-fDisc);
	fMax=fRdt+fDisc;

	return true;
}

// rayNormal
// Call to get surface normal

vec3 rayNormal(vec3 vRay,float fEps)
{
	vec2 e=vec2(fEps,0.0);

	return normalize(vec3(
		rayDistance(vRay+e.xyy)-rayDistance(vRay-e.xyy),
		rayDistance(vRay+e.yxy)-rayDistance(vRay-e.yxy),
		rayDistance(vRay+e.yyx)-rayDistance(vRay-e.yyx)));
}

// rayOcclusion
// Call to find occlusion for surface point

float rayOcclusion(vec3 vRay,vec3 vDir,float fEps)
{
	float fOcclusion=1.0;

	#ifdef OCCLUSION
	float fLen=fEps*fShadowDetail;
	float fStep=1.0/u_fOcclusion;

	for(int n=0;n<MAX_OCCLUSION;n++)
	{
		if(n>=int(u_fOcclusion)) break;

		float fDist=rayDistance(vRay+vDir*fLen);
		fOcclusion*=1.0-max(0.0,(fLen-fDist)*fStep/fLen);

		fLen+=fEps*u_fEnhance;
	}
	#endif // OCCLUSION

	return 1.0-fOcclusion;
}

// rayShadow
// Call to march ray to light

float rayShadow(vec3 vRay,vec3 vDir,vec3 vLight,float fLight,float fEps)
{
	float fShadow=1.0;

	#ifdef SHADOW
	float fLen=fEps*fShadowDetail;

	for(int n=0;n<MAX_STEPS;n++)
	{
		if(fLen>=fLight) break;

		float fDist=rayDistance(vRay+(vLight*fLen));
		if(fDist<fEps) return 1.0;

		if(u_fSoftShadow!=0.0)
			fShadow=min(fShadow,u_fSoftShadow*(fDist/fLen));

		fLen+=fDist;
	}
	#endif // SHADOW

	return 1.0-fShadow;
}

// raySun
// Call to calc sun intensity

vec3 raySun(const vec3 vDir,const vec3 vLight)
{
	if(u_fLight>0.0)
		return u_cLight*(1.0-clamp(abs(acos(dot(vDir,vLight)/length(vLight)))/u_fLight,0.0,1.0));

	return vec3(0.0);
}

// rayBackground
// Call to calc background colour

vec3 rayBackground(const vec3 vDir)
{
	// generate background
	if(u_fBackground>0.0)
		return mix(vec3(0.0),u_cBackground,clamp(abs(vDir.y)*u_fBackground,0.0,1.0));

	return u_cBackground;
}

// rayColour
// Call to calc ray colour

vec3 rayColour(vec3 vRay,vec3 vDir,vec3 vHit,vec3 vNormal,vec3 vLight,float fLen,int nStep,float fEps,float fDist)
{
	// step back some
	vHit-=vDir*(fEps*fShadowDetail);

	// show hit points?
	if(u_fDiffuse<0.0)
		return vec3(0.5)+(normalize(vHit)*abs(u_fDiffuse));

	// diffuse colour
	vec3 colour=u_cDiffuse*u_fDiffuse;

	// add orbit trap colouring
	if(u_nColouring>0)
		colour=mix(colour,mix(u_cColour1,u_cColour2,fMinDist*u_fColour1),fOrbitTrap*u_fColour2);

	// ambient light
	colour+=u_cAmbient*u_fAmbient;

	// get light info
	vec3 vToLight=vLight-vHit;
	vec3 vHalf=normalize(vToLight);

	float fLight=length(vToLight);
	float fProd=dot(vNormal,vHalf);

	// in shadow?
	float fShadow=0.0;

	if(u_fShadow!=0.0)
	{
		if(fProd>0.0)
		{
			fShadow=rayShadow(vHit,vDir,vHalf,fLight,fEps);
			if(u_fSoftShadow==0.0 && fShadow>0.0) fShadow=1.0;
		}
		else fShadow=1.0;
	}

	// add phong?
	if(u_fHardness!=0.0 && u_fShininess!=0.0 && fProd>0.0)
		colour+=vec3(pow(max(fProd,0.0),u_fHardness)*u_fShininess)*(1.0-fShadow);

	// add backlighting?
	if(u_fBacklight!=0.0 && fProd<=0.0)
		colour*=abs(fProd)*u_fBacklight;

	// add light attenuation?
	//if(u_fAttenuation!=0.0)
	//	colour*=1.0-((fLight*fLight)*u_fAttenuation);

	// add shadow?
	if(fShadow!=0.0)
		colour=mix(colour,u_cShadow,fShadow*u_fShadow);

	// add ambient occlusion
	if(u_fOcclusion!=0.0)
	{
		float fOcclusion=(u_fEnhance==0.0)?
			(float(nStep)/float(MAX_STEPS))*u_fOcclusion:
			rayOcclusion(vHit,vNormal,u_fEnhance);

		colour=mix(colour,vec3(0.0),clamp(fOcclusion,0.0,1.0));
	}

	// add inner glow
	if(u_fInnerGlow!=0.0)
		colour=mix(colour,u_cInnerGlow,(float(nStep)/float(MAX_STEPS))*u_fInnerGlow);

	// add fog
	if(u_fFog!=0.0)
		colour=mix(u_cBackground,colour,exp(-pow(fLen*exp(u_fFalloff),2.0))*u_fFog);

	return colour;
}

// rayMarch
// Call to march ray into scene

vec3 rayMarch(vec3 vRay,vec3 vDir,out vec3 vHit,out vec3 vNormal)
{
	// reset for reflection
	fMinDist=10000.0;
	fOrbitTrap=0.0;

	// setup marching
	float fMin;
	float fMax;

	float fDist=0.0;
	float fLen=0.0;
	float fEps=EPSILON;

	bool bHit=false;
	bool bInside=false;

	int nStep=0;

	// get bounding intersection
	if(rayIntersec(vRay,vDir,fMin,fMax))
	{
		float fFactor=u_fScale*u_fDetail;

		bInside=true;

		// start at intersection
		fLen=fMin;

		// dither start point?
		if(u_fDither!=0.0)
			fLen+=u_fDither*rand(vDir.xy);

		// march ray into scene
		for(int n=0;n<MAX_STEPS;n++)
		{
			nStep=n;

			// how far from object?
			vHit=u_vCamera+(vDir*fLen);
			fDist=rayDistance(vHit)*u_fSmooth;

			// step to object
			fLen+=fDist;

			// out of bounds?
			if(fLen>fMax || fLen<fMin)
				break;

			// ray hit object?
			if(fDist<fEps)
			{
				bHit=true;
				break;
			}

			// adjust eps for distance
			fEps=fLen*fFactor;
		}
	}

	// get light position
	vec3 vLight=u_vLight*u_mLight;
	vec3 cColour;

	// hit object?
	if(bHit)
	{
		// get surface normal
		vNormal=rayNormal(vHit-((fNormalDetail*fEps)*vDir),fEps);

		// show normals?
		if(u_fAmbient<0.0) cColour=vec3(0.5)+(vNormal*abs(u_fAmbient));
		else cColour=rayColour(vRay,vDir,vHit,vNormal,vLight,fLen,nStep,fEps,fDist);
	}
	else
	{
		// get back colour
		cColour=rayBackground(vDir)+raySun(vDir,vLight);

		// add outer glow?
		if(u_fOuterGlow>0.0)
		{
			float fGlow=clamp((float(nStep)/float(MAX_STEPS))*u_fOuterGlow,0.0,1.0);
			cColour=mix(cColour,u_cOuterGlow,fGlow);
		}

		// signal for reflection
		vHit=vec3(0.0);
	}

	// missed bounding?
	if(u_bBounds && !bInside) cColour.r+=6.0;

	return cColour;
}

// rayColour
// Call to get colour for point

vec3 rayColour(const vec2 vPoint)
{
	// get ray direction
	vec3 vDir=normalize(vec3(vPoint,1.0)*u_mCamera);

	// march ray into scene
	vec3 vHit;
	vec3 vNormal;

	vec3 cColour=rayMarch(u_vCamera,vDir,vHit,vNormal);

	#ifdef REFLECTION
	// add reflection?
	if(u_fReflection>0.0 && vHit!=vec3(0.0))
	{
		// march to reflection
		vec3 vReflect=normalize(vDir-2.0*dot(vNormal,vDir)*vNormal);
		cColour+=rayMarch(u_vCamera,vReflect,vHit,vNormal)*u_fReflection;
	}
	#endif // REFLECTION

	return clamp(cColour,0.0,1.0);
}

// rayAntiAlias
// Call to get anti alias colour for point

vec3 rayAntiAlias(const vec2 vPoint)
{
	#ifdef ANTIALIAS
	vec2 v=vPoint;

	float fScale=float(u_nAlias+1);
	float fStep=u_fScale/fScale;

	vec3 cColour=vec3(0.0);

	for(int y=0;y<MAX_ALIAS;y++)
	{
		if(y>u_nAlias) break;

		for(int x=0;x<MAX_ALIAS;x++)
		{
			if(x>u_nAlias) break;

			cColour+=rayColour(v);
			v.x+=fStep;
		}
		v.y+=fStep;
	}
	return cColour/pow(fScale,2.0);
	#else  // ANTIALIAS
	return rayColour(vPoint);
	#endif // ANTIALIAS
}

// rotate
// Call to add rotation matrix

mat3 rotate(float fAngle,float x,float y,float z,mat3 m)
{
	float a00=m[0].x,a01=m[0].y,a02=m[0].z,
		a10=m[1].x,a11=m[1].y,a12=m[1].z,
		a20=m[2].x,a21=m[2].y,a22=m[2].z;

	float fTheta=radians(fAngle);

	float s=sin(fTheta);
	float c=cos(fTheta);

	float t=1.0-c;

	float b00=x*x*t+c,b01=y*x*t+z*s,b02=z*x*t-y*s,
		b10=x*y*t-z*s,b11=y*y*t+c,b12=z*y*t+x*s,
		b20=x*z*t+y*s,b21=y*z*t-x*s,b22=z*z*t+c;

	return mat3(
		a00*b00+a10*b01+a20*b02,a01*b00+a11*b01+a21*b02,a02*b00+a12*b01+a22*b02,
		a00*b10+a10*b11+a20*b12,a01*b10+a11*b11+a21*b12,a02*b10+a12*b11+a22*b12,
		a00*b20+a10*b21+a20*b22,a01*b20+a11*b21+a21*b22,a02*b20+a12*b21+a22*b22);
}

// main
// Shader program entry point

void main(void)
{
	#ifdef CUBEFIELD
	u_fPower=0.2;
	u_vOffset=vec3(0.5,0.5,0.5);
	u_vClamp=vec3(1.0,1.0,1.0);
	u_vLight=vec3(0.0,0.0,0.0);
	#endif // CUBEFIELD

	#ifdef SPONGE
	u_fPower=3.0;
	u_vClamp=vec3(1.0,3.0,3.0);
	u_fBounds=5.0;
	u_vCamera.z-=3.2;
	#endif // SPONGE

	#ifdef SIERPINSKI
	u_fPower=2.0;
	u_vOffset=vec3(1.0,1.0,1.0);
	u_vClamp=vec3(1.0,1.0,1.0);
	u_fBounds=5.0;
	u_fSmooth=0.5;
	u_vCamera.z-=3.2;
	#endif // SIERPINSKI

	#ifdef MANDELBULB
	u_fPower=8.0;
	u_fBounds=5.0;
	u_vCamera.z-=2.5;
	#endif // MANDELBULB

	#ifdef MANDELBOX
	u_fPower=-1.77;
	u_vOffset=vec3(1.0,1.0,1.0);
	u_vClamp=vec3(0.5,1.0,0.0);
	u_fBounds=25.0;
	u_fDetail=0.1;
	u_vCamera.z-=6.5;
	#endif // MANDELBOX

	#ifdef DODECAHEDRON
	u_fPower=1.61803399;
	u_vClamp=vec3(1.0,1.0,1.0);
	u_fBounds=10.0;
	u_vCamera.z-=3.5;
	#endif // DODECAHEDRON

	#ifdef KNOT
	u_fPower=3.0;
	u_vOffset=vec3(0.07,0.29,0.43);
	u_vClamp=vec3(-2.0,-4.0,3.0);
	u_fBounds=10.0;
	u_fSmooth=0.5;
	u_vCamera.z-=3.5;
	#endif // KNOT

	#ifdef QUATERNION
	u_fPower=0.16;
	u_vJulia=vec3(0.18,0.88,0.24);
	u_fBounds=10.0;
	u_fSmooth=0.5;
	u_vCamera.z-=3.5;
	#endif // QUATERNION

	u_vCamera.z *= surfaceSize.y * 0.5 + 0.4;
	
	vec2 centerPosition = (0.5 - ( gl_FragCoord.xy / resolution )) * surfaceSize + surfacePosition;
	u_mObject=rotate(centerPosition.y*-120.0+15.0,1.0,0.0,0.0,u_mObject);
	u_mObject=rotate(centerPosition.x*120.0+10.0,0.0,1.0,0.0,u_mObject);
	u_mObject=rotate(time*2.0,0.0,0.0,1.0,u_mObject);
	
	u_mLight=rotate(mouse.y*-100.0,1.0,0.0,0.0,u_mLight);
	u_mLight=rotate(mouse.x*100.0-20.0,0.0,1.0,0.0,u_mLight);

//	float n=sin(time);
//	float m=abs(n); //mod(n,1.0);

//	u_fPower=mod(abs(n),1.0);//-(1.5+m);
//	u_vJulia=vec3(m,m,m);
//	u_vOffset=vec3(m,m,m);
//	u_vClamp=vec3(m,m,m);

	// get ray point
	vec2 vPoint=vec2(
		((gl_FragCoord.x/u_fWidth)-0.5)*u_fRatio,
		(gl_FragCoord.y/u_fHeight)-0.5);

	// get ray colour
	vec3 cColour=(u_nAlias>0)?
		rayAntiAlias(vPoint):
		rayColour(vPoint);

	// set fragment colour
	gl_FragColor=vec4(cColour,1.0);
}

