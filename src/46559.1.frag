/*
 * Original shader from: https://www.shadertoy.com/view/XlXXR7
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
//
//
// Spider by cedric voisin 2014
//
//

#define PI 3.14
#define maxH 1.5

struct leg {
	vec3 pHip, pKnee, pAnkle, pFoot;
	vec2 rp; // (cosp, sinp)
};
leg legs[8];

// perlin

float r(vec2 c){
	return fract(sin(dot(c ,vec2(12.9898,78.233))) * 43758.5453);
}

float pn (vec2 p){
	p/=2.;
    vec2 i = floor(p), w = fract(p), j = vec2(1.,0.);
    w = w*w*(3.-2.*w);
    return mix(mix(r(i), r(i+j), w.x), mix(r(i+j.yx), r(i+1.), w.x), w.y);
}

float an (vec2 p){
	const int n=7;
	float m = 0., f = 1.;
	for ( int i=0; i<n; i++ ){ m += pn(f*p)/f; f*=2.; }
	return m/(2.-pow(.5,float(n)));
}

// primitive (from iq's website)
float deC(vec3 p, vec3 a, vec3 b, float r){
	vec3 pa = p - a;
	vec3 ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

// leg
float deLeg(vec3 p){
	float sil = 1000.;
	for (int i=0;i<8;i++){
    	sil = min(sil, deC(p, legs[i].pHip, legs[i].pKnee, .03));
    	sil = min(sil, deC(p, legs[i].pKnee, legs[i].pAnkle, .02));
    	sil = min(sil, deC(p, legs[i].pAnkle, legs[i].pFoot, .01));
	}
	return sil;
}

vec3 norLeg(vec3 p){
	vec3 dp = vec3(.0001,0.,0.);
	vec3 n=normalize(vec3(deLeg(p+dp.xyy),deLeg(p+dp.yxy),deLeg(p+dp.yyx))); 
	return n;
}

float field(vec2 f){return maxH*pn(f);}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// global
	vec2 xy = -2.5 + 5.*fragCoord.xy / iResolution.xy;
	xy.y *= iResolution.y/iResolution.x;
	
	// time	
	float camTime = .03*iTime;
	float spiTime = (iTime+cos(.5*iTime)+cos(.4*iTime));
	
	// spider main
	vec3 pSpi, pAbdo;
	float rBody, rAbdo, rf;
	rBody = .2;
	pSpi = vec3(spiTime,0.,0.);;
	pSpi.z = .2+rBody+field(pSpi.xy);
		
	// sun
	vec3 pSun = pSpi+vec3(100.*sin(.2*camTime),100.*cos(.2*camTime),100.);
	
	// cam
	float xCam, yCam, zCam;
	vec3 pCam, nCam, uCam, rCam, pEye;
	xCam = pSpi.x + 5. * sin(6.*camTime);
	yCam = pSpi.y - 5. * cos(6.*camTime);
	zCam = max(7. + 2.*cos(camTime-5.), .2+field(vec2(xCam, yCam)) );
	//zCam = 4.;
	
	pEye = vec3(xCam, yCam, zCam);
	nCam = normalize(pSpi-pEye);
	rCam = normalize(vec3(nCam.y,-nCam.x,0.));
	uCam = cross(rCam,nCam);
	pCam = pEye + 5.*nCam;
	
	// spider parts
	// abdomen
	rAbdo = 1.7*rBody;
	vec3 oldPos = vec3(spiTime-.05,0.,0.);
	oldPos.z = .22+rBody+field(oldPos.xy);
	pAbdo = pSpi-(rBody+rAbdo)*normalize(pSpi - oldPos);
	
	// directions
	vec3 spiF, spiL, spiU;
	spiF = normalize(pSpi - pAbdo);
	spiL = normalize(vec3(-spiF.y,spiF.x,0.));
	spiU = cross(spiF, spiL);
	
	// eyes co(-pi/32), sin(-pi/32), sin(pi/5)
	vec3 pOcelli[2];
	pOcelli[0] = pSpi + .7*rBody*spiF + rBody*.1*spiL + rBody*.8*spiU;
	pOcelli[1] = pSpi + .7*rBody*spiF - rBody*.1*spiL + rBody*.8*spiU;
	
	//legs a=hip->knee, b=knee->ankle, c=ankle->foot
	rf = rBody + 1.35; // 1.35 = leg span
	float a=.9, b=1., f=.35;

	float rcosp, rsinp, cosa, dt, tf, tc, to, tPct, c;
	vec2 pf;
	vec3 base, up;
	
	//defined manually to get them out of the loop and avoid cos/sin calls
	legs[0].rp =  vec2(-.588,-.809); // vec2(cos(-PI/5.-3.*PI/6.),sin(-PI/5.-3.*PI/6.));
	legs[1].rp =  vec2(-.105,-.995); // vec2(cos(-PI/5.-2.*PI/6.),sin(-PI/5.-2.*PI/6.));
	legs[2].rp =  vec2(.407,-.914); // vec2(cos(-PI/5.-PI/6.),sin(-PI/5.-PI/6.));
	legs[3].rp =  vec2(.809, -.588); // vec2(cos(-PI/5.),sin(-PI/5.));
	legs[4].rp =  vec2(.809,.588); // vec2(cos(PI/5.),sin(PI/5.));
	legs[5].rp =  vec2(.407,.914); // vec2(cos(PI/5.+PI/6.),sin(PI/5.+PI/6.));
	legs[6].rp =  vec2(-.105,.995); // vec2(cos(PI/5.+2.*PI/6.),sin(PI/5.+2.*PI/6.));
	legs[7].rp =  vec2(-.588,.809); // vec2(cos(PI/5.+3.*PI/6.),sin(PI/5.+3.*PI/6.));
	
	for (int i=0;i<8;i++){
		
		// hip	
		legs[i].pHip = pSpi + rBody*legs[i].rp.x*spiF + rBody*legs[i].rp.y*spiL;

		// foot
		dt = mod(float (i),2.)*.5;
		tf = spiTime+dt+.3; // .3 = how much foot precedes body (tuning)
		tc = fract(tf);
		to = floor(tf);
		rcosp = rf*legs[i].rp.x;
		rsinp = rf*legs[i].rp.y;
		
		// cycle: .67s on the ground, .33s to catch up
		if (tc < .67){
			pf = vec2(to-dt+rcosp,rsinp);
			legs[i].pFoot = vec3(pf, field(pf));
		} else {
			tPct = (tc-.67)/.33;
			pf = vec2(to-dt+tPct*tc+rcosp,rsinp);
			legs[i].pFoot = vec3(pf, field(pf.xy)+2.5*tPct*(1.-tPct)); // parabola 2.5~step height
		}
		
		// ankle: cos(foot angle) ~ distance from the hip
		base = legs[i].pHip-legs[i].pFoot;
		up = normalize(cross(vec3(base.y,-base.x,0.),base));
		cosa = cos( 2.8*(1.-length(base)/(a+b+f)) ); // amax+base*(amin-amax)/(a+b+f), amin = 0, amax=2.8
		legs[i].pAnkle = legs[i].pFoot + cosa*f*normalize(base) + sqrt(1.-cosa*cosa)*f*up; 

		// knee	(triangle)
		base = legs[i].pAnkle - legs[i].pHip;
		up = normalize(cross(vec3(base.y,-base.x,0.),base));
		c = length(base);
		cosa = (a*a+c*c-b*b)/(2.*a*c);
		legs[i].pKnee = legs[i].pHip + cosa*a*normalize(base) + sqrt(1.-cosa*cosa)*a*up;
	}
	
	// virtual screen
	vec3 pStart = pCam+xy.x*rCam+xy.y*uCam;
	vec3 dir = normalize(pStart-pEye);
	
	// ray march
	int idI = 0; //Background 0, Terrain 1, Body 2, Abdo 3, Leg 4, eyes 5
	float eps = .001, fov = 30., de = fov, si = 10.*fov, shad = 1., s = 0., h = 1.;
	vec3 npi = -dir, pi = pEye, dp = vec3(.0001,0.,0.);
	float dpx, dpy;
	
	for (int i=0; i<150; i++){
			
		// body
		de = min(de, clamp(length(pi-pSpi)-rBody,eps,fov));
		if (de == eps) {si = s; idI = 2; break;}
		// abdomen
		de = min(de, clamp(length(pi-pAbdo)-rAbdo,eps,fov));
		if (de == eps) {si = s; idI = 3; break;}
		// eyes
		de = min(de, clamp(length(pi-pOcelli[0])-.1*rBody,eps,fov));
		if (de == eps) {si = s; idI = 5; break;}
		de = min(de, clamp(length(pi-pOcelli[1])-.1*rBody,eps,fov));
		if (de == eps) {si = s; idI = 5; break;}
		// legs	
		de = min(de, clamp(deLeg(pi),eps,fov));
		if (de == eps) {si = s; idI = 4; break;}
		// terrain
		h = pi.z - field(pi.xy);
		if (h<.01) {si = s; idI = 1; break;}
		
		s += min(de,.5*h);
		if (s > fov) break;
		pi = pEye + dir*s;

	}	
	
	// common colors
	vec3 col, co, li;
	vec3 colSky = vec3(.8,.7,.6);
	vec3 colSun = vec3 (1.,1.,.7);
	
	// illuminations
	if (idI == 0){ // background
		
		//base
		co = vec3(0.,0.,0.);
		float vGrad=clamp(1.5-fragCoord.y / iResolution.y,0.,1.);
		co += vGrad*colSky;
		
		// lightning
		li = vec3(0.,0.,0.);
		float sunGrad = 1.+dot(normalize(pSun-pEye), normalize(pi-pEye) );
		li += (1.+sunGrad)*colSun;
		
		col = co*li;
	}
	
	if (idI == 1){ // terrain
		dpx = maxH * (an(pi.xy+dp.xy)-an(pi.xy-dp.xy)) / (2.*dp.x);							  
		dpy = maxH * (an(pi.xy+dp.yx)-an(pi.xy-dp.yx)) / (2.*dp.x);
		npi = normalize( vec3(-dpx, -dpy, 1.) );	
		pi = pEye + dir*si;
		
		// base
		co = vec3(0.,0.,0.);
		vec3 colField = vec3(.62,.6,.6);
		co += colField;
		
		// occlusion
		float iOcc = npi.z;
		
		// spider occlusion
		float sOcc = smoothstep(0., .8, length(pi-.5*pSpi-.5*pAbdo)/rf );
		
		// lightning
		// spider shadows
		float sShad = 1., tShad = 1.;
		dir = normalize(pSun-pi);
		de = fov;
		vec3 ps = pi;
		s = 0.;
		for (int i=0; i<50; i++){
			tShad = 1.;
			// body
			de = min(de, clamp(length(ps-pSpi)-rBody,eps,fov));
			de = min(de, clamp(length(ps-pAbdo)-rAbdo,eps,fov));
			de = min(de, clamp(deLeg(ps),eps,fov));
			
			s += de;
			if (ps.z > pSpi.z+5.) break;
			ps = pi + dir*s;
			tShad = min(tShad, 60.*de/s);
			sShad *= tShad;
		}	
		
		float iDif = dot(npi,normalize(pSun-pi));

		li = vec3(0.,0.,0.);
		li += iDif*colSun;
		li *= sShad;
		li *= sOcc;
		li += .8*iOcc*colSky;
		
		col = co*li;
	}
	
	if (idI == 2){ // body
		npi = normalize(pi-pSpi);

		// base
		co = vec3(0.,0.,0.);
		vec3 colBase = vec3 (.9,.6,.2);
		co += colBase;
			
		// dark below
		co = mix(.4*colBase, co,smoothstep(-.4,1.,dot(npi,spiU)) );
		
		// occlusion
		float iOcc = .5 + .5*dot(npi,spiF);
		
		// lightning
		float iAmb = .5+.5*npi.z;
		float iDif = .5+.5*dot(npi,normalize(pSun-pi));
		
		li = vec3(0.,0.,0.);
		li += iDif*colSun;
		li += .2*iAmb*colSky;
		li *= iOcc;

		col = 2.*co*li;
	}
	
	if (idI == 3){ // abdomen
		vec3 piInA = vec3(dot(pi-pAbdo,spiF), dot(pi-pAbdo,spiL), dot(pi-pAbdo,spiU));
		npi = normalize(pi-pAbdo);

		// base
		co = vec3(0.,0.,0.);
		vec3 colBase = vec3 (.9,.5,.1);
		co += colBase;
		
		// decoration (black)
		float theta = acos(piInA.x/length(piInA));
		float phi = .2+abs(atan(piInA.y, piInA.z)); // abs for symmetry
		co *= 1.05-smoothstep(.5,.5,an(4.*vec2(theta, phi)));
		co = mix(.9*colBase, co,smoothstep(-.4,1.,dot(npi,spiU)) );
		
		// occlusion
		float iOcc = .5-.5*dot(npi,spiF);
		
		// lightning
		float iAmb = .5+.5*npi.z;
		float iDif = dot(npi,normalize(pSun-pi));
		
		li = vec3(0.,0.,0.);
		li += .07*iDif*colSun;
		li += .2*iAmb*colSky;
		li *= iOcc;

		col = 12.*co*li;
	}
	
	if (idI == 4){ // legs
		npi = norLeg(pi);
		
		// base
		co = vec3(0.,0.,0.);
		vec3 colBase = vec3 (.6,.4,.1);
		co += colBase;
			
		// black articulations
		float iArt = 2.*rf;
		for (int i=0;i<8;i++){
			iArt = min(iArt, length(pi-legs[i].pKnee));
			iArt = min(iArt, length(pi-legs[i].pAnkle));
		}
		co *= 10.*iArt*iArt*iArt;
		
		// occlusion
		float iOcc = length(pi-pSpi)/rf;	
		
		// lightning
		float iAmb = .5+.5*npi.z;
		float iDif = dot(npi,normalize(pSun-pi));
		
		li = vec3(0.,0.,0.);
		li += iDif*colSun;
		li += iAmb*colSky;
		li *= 2.*iOcc;

		col = co*li;
	}
	
	if (idI == 5){ // eyes
		col = vec3(0.,0.,0.);
	}
	
	// fog
	vec3 colFog = vec3(.5,.6,.7);
	float cFog = 1.-smoothstep(.3*fov, fov, length(dir*si))+smoothstep(fov, 1.1*fov,length(dir*si));
    col = mix(colFog, col, cFog );

	col = clamp(col,0.,1.);
	fragColor = vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
