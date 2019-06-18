/*
 * Original shader from: https://www.shadertoy.com/view/Msc3z8
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
// Created by sebastien durand - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//-----------------------------------------------------

// Change this to improve quality - Rq only applied on edge
#define ANTIALIASING 5

// decomment this to see where antialiasing is applied
//#define SHOW_EDGES

#define RAY_STEP 48
//#define NOISE_SKIN

#define PI 3.14159279


bool WithChameleon;	    // for optim : true if the ray intersect the bounding sphere of the chameleon

float Anim = 0.;		// pos in animation
mat2 Rotanim = mat2(0.), Rotanim2 = mat2(0.), Rot3 = mat2(0.); // rotation matrix
float ca3, sa3;         // pre calculater sin and cos
float closest;			// min distance to chameleon on the ray (use for glow light) 

// ----------------------------------------------------

float hash( float n ) { return fract(sin(n)*43758.5453123); }


#ifdef NOISE_SKIN
// By Shane -----

// Tri-Planar blending function. Based on an old Nvidia tutorial.
vec3 tex3D( sampler2D tex, in vec3 p, in vec3 n ){
    n = max((abs(n) - 0.2)*7., 0.001); // n = max(abs(n), 0.001), etc.
    n /= (n.x + n.y + n.z );  
    
	return (texture(tex, p.yz)*n.x + texture(tex, p.zx)*n.y + texture(tex, p.xy)*n.z).xyz;
}

vec3 doBumpMap( sampler2D tex, in vec3 p, in vec3 nor, float bumpfactor){
    const float eps = 0.001;
    float ref = (tex3D(tex,  p , nor)).x;                 
    vec3 grad = vec3( (tex3D(tex, vec3(p.x-eps, p.y, p.z), nor).x)-ref,
                      (tex3D(tex, vec3(p.x, p.y-eps, p.z), nor).x)-ref,
                      (tex3D(tex, vec3(p.x, p.y, p.z-eps), nor).x)-ref )/eps;
             
    grad -= nor*dot(nor, grad);          
                      
    return normalize( nor + grad*bumpfactor );
}

#endif


// ----------------------------------------------------

bool intersectSphere(in vec3 ro, in vec3 rd, in vec3 c, in float r) {
    ro -= c;
	float b = dot(rd,ro), d = b*b - dot(ro,ro) + r*r;
	return (d>0. && -sqrt(d)-b > 0.);
}

// ----------------------------------------------------

float udRoundBox( vec3 p, vec3 b, float r ){
  	return length(max(abs(p)-b,0.))-r;
}

// capsule with bump in the middle -> use for arms and legs
vec2 sdCapsule( vec3 p, vec3 a, vec3 b, float r ) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1. );
    float dd = cos(3.14*h*2.5);  // Little adaptation
    return vec2(length(pa - ba*h) - r*(1.-.1*dd+.4*h), 30.-15.*dd); 
}

vec2 smin(in vec2 a, in vec2 b, in float k ) {
	float h = clamp( .5 + (b.x-a.x)/k, 0., 1. );
	return mix( b, a, h ) - k*h*(1.-h);
}

float smin(in float a, in float b, in float k ) {
	float h = clamp( .5 + (b-a)/k, 0., 1. );
	return mix(b, a, h) - k*h*(1.-h);
}

vec2 min2(in vec2 a, in vec2 b) {
	return a.x<b.x?a:b;
}

// ----------------------------------------------------

vec2 spiralTail(in vec3 p) {
    float a = atan(p.y,p.x)+.2*Anim;
	float r = length(p.xy);
    float lr = log(r);
    float th = 0.475-.25*r; // thickness according to distance
    float d = fract(.5*(a-lr*10.)/PI); //apply rotation and scaling.
	
    d = (0.5-abs(d-0.5))*2.*PI*r/10.;
  	d *= 1.1-1.1*lr;  // space fct of distance
   
    r+=.05*cos(a*60.); // radial bumps
    r+=(.2-.2*(smoothstep(0.,.08, abs(p.z))));

    return vec2(
        max(max(sqrt(d*d+p.z*p.z)-th*r, length(p.xy-vec2(.185,-.14))-1.05), -length(p.xy-vec2(.4,1.5))+.77),
        abs(30.*cos(10.*d)) + abs(20.*cos(a*10.)));
}

vec2 body(in vec3 p) {
    const float scale = 3.1;
    
    p.y=-p.y;
    p.x += 2.;
    p/=scale;
    
    float a = atan(p.y,p.x);
	float r = length(p.xy);
    float d = (.5*a-log(r))/PI; //apply rotation and scaling.
    float th = .4*(1.-smoothstep(.0,1.,abs(a+.35-Anim*.05)));    
 
    d = (1.-2.*abs(d-.5))*r*1.5;
    
   // r +=.005*cos(80.*d); // longitudinal bumps
    r+=.01*cos(a*200.); // radial bumps
    r-=.2*(smoothstep(0.,.1,abs(p.z)));
    
    float dis = sqrt(d*d+p.z*p.z)-th*r;
 	dis *= scale;
    dis = max(dis, length(p.xy-vec2(.86,-.07))-.7);
    return vec2(dis, abs(30.*cos(17.*d)) + abs(20.*cos(a*20.)));
}

vec2 head(in vec3 p) {
 //   p.yz *= Rotanim;  // small rotation of head 
   
   
    p.z = abs(p.z);
    
    p.y += .25+.03*Anim;
    p.x += .03+.03*Anim;
    p.xy *= Rotanim;

    vec3 pa1 = p, ba = vec3(1.,-.2,-.3);
    pa1.z = p.z-.22;
    
    float h = clamp(dot(pa1, ba), 0.0, 1.0 );
    pa1.x -= h;

    // Head
	float dh = length(pa1) - .8*(-.5+1.3*sqrt(abs(cos(1.5701+h*1.5701))))+.08*(1.+h)*smoothstep(0.,.2,abs(p.z));
    dh = max(-p.y-.2, dh); 
    dh += -.04+.04*(smoothstep(0.,.2,abs(p.z)));
    dh = min(dh, max(p.x-1.35,max(p.y+.3, length(p-vec3(1.-.035*Anim,.25,-.1))-.85)));
    dh += .01*cos(40.*h) -.06;
    
    // Eyes
    vec3 eye = vec3(-.2,-.0105,.15);
  	eye.zy *= Rotanim2;
    float de = max(length(p-vec3(.7,.26,.45))-.3, -(length(p-vec3(.7,.26,.45) - eye)-.13*clamp(Anim+.2,.7,1.1)));
    vec2 dee = min2(vec2(de,20.+1000.*abs(dot(p,eye))), vec2(length(p-vec3(.7,.26,.45))-.2, -102.));
  
    return smin(dee, vec2(dh*.8, 40.- abs(20.*cos(h*3.))) ,.06); 
}
    
vec2 support(vec3 p, vec2 c, float th) {
    p-=vec3(-2.5,-.7,0);
    float d1 = length(p-vec3(0,-6.5,0)) - 3.;          
    float d = length(max(abs(p-vec3(0,-2,.75))-vec3(.5,2.5,.1),0.))-.11;     
    p.xy *= Rot3; 
    d = min(d, max(length(max(abs(p)-vec3(4,3,.1),0.))-.1,
                  -length(max(abs(p)-vec3(3.5,2.5,.5),0.))+.1));
    return min2(vec2(d1,-105.),
        min2(vec2(d,-100.), 
                 vec2(length(max(abs(p-vec3(0,0,.2))-vec3(3.4,2.4,.01),0.))-.3, -103.)));
}


//----------------------------------------------------------------------

vec2 map(in vec3 pos) {
    // Ground
    vec2 res1 = vec2( pos.y+4.2, -101.0 );
    // Screen
	res1 = min2(support(pos+vec3(2.5,-0.56,0), vec2(.1,15.), 0.05), res1);
    
    if (WithChameleon) {
        // Tail + Body
        vec2 res = smin(spiralTail(pos.xyz-vec3(0,-.05-.05*Anim,0)), body( pos.xyz-vec3(-.49,1.5,0)),.1 ); 
        // Head
        res = smin(res, head(pos - vec3(-2.8,3.65,0)), .5);
        pos.z = abs(pos.z);
        // legs
        res = min2(res, min2(sdCapsule(pos, vec3(.23,-.1*Anim+1.3,.65), vec3(.75,-.1*Anim+.6,.05),.16),
                             sdCapsule(pos, vec3(.23,-.1*Anim+1.3,.65), vec3(-.35,1.35,.3),.16)));
        res = min2(res, vec2(length(pos-vec3(-.35,1.35,.1))- .33, 30.));   
        // arms 
        res = smin(res, min2(sdCapsule(pos, vec3(-.8+.06*Anim,2.5,.85),vec3(-1.25+.03*Anim,3.,.2), .16),
                             sdCapsule(pos, vec3(-.8+.06*Anim,2.5,.85), vec3(-1.25,2.1,.3),.16)),.15);
        res = min2(res, vec2(length(pos-vec3(-1.55,1.9,.1))- .3, 30.));
        
        if (res.x < closest) {
            closest = abs(res.x);
        }
        return min2(res, res1);
    }
    else {
        return res1;
    }
}


//----------------------------------------------------------------------
#define EDGE_WIDTH 0.15

vec2 castRay(in vec3 ro, in vec3 rd, in float maxd, inout float hmin) {
    closest = 9999.; // reset closest trap
	float precis = .0006, h = EDGE_WIDTH+precis, t = 2., m = -1.;
    hmin = 0.;
    for( int i=0; i<RAY_STEP; i++) {
        if( abs(h)<t*precis || t>maxd ) break;
        t += h;
	    vec2 res = map(ro+rd*t);
        if (h < EDGE_WIDTH && res.x > h + 0.001) {
			hmin = 10.0;
		}
        h = res.x;
	    m = res.y;
    }
    
	//if (hmin != h) hmin = 10.;
    if( t>maxd ) m = -200.0;
    return vec2( t, m );
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k) {
	float res = 1.0;
    float t = mint;
    for( int i=0; i<26; i++ ) {
		if( t>maxt ) break;
        float h = map( ro + rd*t ).x;
        res = min( res, k*h/t );
        t += h;
    }
    return clamp( res, 0., 1.);
}

// normal with kali edge finder
float Edge=0.;
vec3 calcNormal(vec3 p, vec3 rd, float t) { 
    float pitch = .2 * t / iResolution.x; 
	pitch = max( pitch, .015 );

	vec3 e = vec3(0.0,2.*pitch,0.0);
	float d1=map(p-e.yxx).x,d2=map(p+e.yxx).x;
	float d3=map(p-e.xyx).x,d4=map(p+e.xyx).x;
	float d5=map(p-e.xxy).x,d6=map(p+e.xxy).x;
	float d=map(p).x;
    
	Edge=abs(d-0.5*(d2+d1))+abs(d-0.5*(d4+d3))+abs(d-0.5*(d6+d5)); //edge finder
	Edge=min(1.,pow(Edge,.55)*15.);
    
    vec3 grad = vec3(d2-d1,d4-d3,d6-d5);
	return normalize(grad - max(.0,dot (grad,rd ))*rd);
}




float calcAO( in vec3 pos, in vec3 nor) {
	float totao = 0.0;
    float sca = 1.0;
    for( int aoi=0; aoi<5; aoi++ ) {
        float hr = 0.01 + 0.05*float(aoi);
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        totao += -(dd-hr)*sca;
        sca *= .75;
    }
    return clamp( 1.0 - 4.0*totao, 0.0, 1.0 );
}

vec3 mandelbrot(in vec2 uv, vec3 col) {
    uv.x += 1.5;
    uv.x = -uv.x;

    float a=.05*sqrt(abs(Anim)), ca = cos(a), sa = sin(a);
    mat2 rot = mat2(ca,-sa,sa,ca);
    uv *= rot;
	float kk=0., k = abs(.15+.01*Anim);
    uv *= mix(.02, 2., k);
	uv.x-=(1.-k)*1.8;
    vec2 z = vec2(0);
    vec3 c = vec3(0);
    for(int i=0;i<50;i++) {
        if(length(z) >= 4.0) break;
        z = vec2(z.x*z.x-z.y*z.y, 2.*z.y*z.x) + uv;
        if(length(z) >= 4.0) {
            kk = float(i)*.07;
            break; // does not works on some engines !
        }
    }
    return clamp(mix(vec3(.1,.1,.2), clamp(col*kk*kk,0.,1.), .6+.4*Anim),0.,1.);
}

vec3 screen(in vec2 uv, vec3 scrCol) {
    // tv effect with horizontal lines and color switch
    vec3 oricol = mandelbrot(vec2(uv.x,uv.y), scrCol);
    vec3 col;
	float colorShift = .2*cos(.5*iTime);
    col.r = mandelbrot(vec2(uv.x,uv.y+colorShift), scrCol).x;
    col.g = oricol.y;
    col.b = mandelbrot(vec2(uv.x,uv.y-colorShift), scrCol).z;
    
	uv *= Rot3;	
	col =(.5*scrCol+col)*(.5+.5*cos(iTime*5.))*cos(iTime*10.+40.*uv.y);  
    return col*col;
}

// clean lines on the ground
float isGridLine(vec2 p, vec2 v) {
    vec2 k = smoothstep(.1,.9,abs(mod(p+v*.5, v)-v*.5)/.08);
    return k.x * k.y;
}

vec3 render( in vec3 ro, in vec3 rd, inout float hmin) { 
    // Test bounding sphere (optim)
    WithChameleon = intersectSphere(ro,rd,vec3(-.5,1.65,0),3.15); //2.95);
    
    vec2 res = castRay(ro,rd,60.0, hmin);
    float distCham = abs(closest);
    
#ifdef SHOW_EDGES
     if( res.y>-150.)  {
           vec3 pos = ro + res.x*rd;
     	vec3 nor = calcNormal(pos, rd, res.x);
     }
    return vec3(1);
#else
    
    float t = res.x;
	float m = res.y;
    vec3 cscreen = vec3(sin(.1+1.1*iTime), cos(.1+1.1*iTime),.5);
    cscreen *= cscreen;
 
    vec3 col;
	float dt;
    float glow = 1.-smoothstep(Anim + cos(iTime),.9+1.15,2.2);
    glow *= step(.3, hash(iTime)); //floor(.01+10.5*iTime)));
    
    if( m>-150.)  { 
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos, rd, t);

        if( m>0. ) { // Chameleon
			col = vec3(.4) + .35*cscreen + .3*sin(1.57*.5*iTime + vec3(.05,.09,.1)*(m-1.) );
#ifdef NOISE_SKIN
            nor = doBumpMap(iChannel0, pos*.5, nor, 0.05);
#endif            
        } else if (m<-104.5) {  // bottom of screen
            col = vec3(.92);
            dt = dot(normalize(pos-vec3(-4,-4,0)), vec3(0,0,-1));
            col += (dt>0.) ? (.75*glow+.3)*dt*cscreen: vec3(0); 
        } else if (m<-102.5) {
           	if (pos.z<0.) { // screen
            	col = screen(pos.xy,cscreen);
                col += 20.*glow*col;
            } else { // back of screen
                col = vec3(.92);
            	distCham *= .25; // Hack for chameleon light on screen
            }
        } else if (m<-101.5) {
            col = .2+3.5*cscreen*glow;
            
        } else if(m<-100.5) {  // Ground
            float f = mod( floor(2.*pos.z) + floor(2.*pos.x), 2.0);
            col = 0.4 + 0.1*f*vec3(1.);
            col = .1+.9*col*isGridLine(pos.xz, vec2(2.));
            dt = dot(normalize(pos-vec3(-4,-4,0)), vec3(0,0,-1));
 			col += (dt>0.) ? (.75*glow+.3)*dt*cscreen: vec3(0);     
    		//col = clamp(col,0.,1.);
        } else {  // Screen
            col = vec3(.92);
            distCham *= .25; // Hack for chameleon light on screen
        }
		
        float ao = calcAO( pos, nor );

		vec3 lig = normalize( vec3(-0.6, 0.7, -0.5) );
		float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
        float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
        float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);

		float sh = 1.0;
		if( dif>0.02 ) { 
            WithChameleon = intersectSphere(pos,lig,vec3(-.5,1.65,0),2.95);
            sh = softshadow( pos, lig, 0.02, 13., 8.0 ); 
            dif *= sh; 
        }

		vec3 brdf = vec3(0.0);
		brdf += 1.80*amb*vec3(0.10,0.11,0.13)*ao;
        brdf += 1.80*bac*vec3(0.15,0.15,0.15)*ao;
        brdf += 0.8*dif*vec3(1.00,0.90,0.70)*ao;

		float pp = clamp( dot( reflect(rd,nor), lig ), 0.0, 1.0 );
		float spe = 1.2*sh*pow(pp,16.0);
		float fre = ao*pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );

		col = col*brdf*(.5+.5*sh) + vec3(.25)*col*spe + 0.2*fre*(0.5+0.5*col);
        
        float rimMatch =  1. - max( 0. , dot( nor , -rd ) );
        col += vec3((.1+cscreen*.1 )* pow( rimMatch, 10.));
	}

	col *= 2.5*exp( -0.01*t*t );
    float BloomFalloff = 15000.; //mix(1000.,5000., Anim);
 	col += .5*glow*cscreen/(1.+distCham*distCham*distCham*BloomFalloff);
    
	return vec3( clamp(col,0.0,1.0) );
#endif    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // animation
    float GlobalTime = iTime; // + .1*hash(iTime);
    
    Anim = clamp(5.6*cos(GlobalTime)*cos(4.*GlobalTime),-2.5,1.2);
    ca3 = cos(.275+.006*Anim); sa3 = sin(.275+.006*Anim);   
	Rot3 = mat2(ca3,-sa3,sa3,ca3);
    float a=.1+.05*Anim, ca = cos(a), sa = sin(a);
    Rotanim = mat2(ca,-sa,sa,ca);
    float b = mod(GlobalTime,12.)>10.?cos(8.*GlobalTime):.2*cos(4.*GlobalTime), cb = cos(b), sb = sin(b);
    Rotanim2 = mat2(cb,-sb,sb,cb);
    float time = 17. + /*14.5 +*/ GlobalTime;
    
    // mouse
    vec2 mo = iMouse.xy/iResolution.xy;
    
    // camera	
    float dist = 13.;
    vec3 ro = vec3( -0.5+dist*cos(0.1*time + 6.0*mo.x), 3.5 + 10.0*mo.y, 0.5 + dist*sin(0.1*time + 6.0*mo.x) );
    vec3 ta = vec3( -3.5, .5, 0. );

    // camera tx
    vec3 cw = normalize( ta-ro );
    vec3 cp = vec3( 0.0, 1.0, 0.0 );
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );

    // render
    vec3 colorSum = vec3(0);
    int nbSample = 0;
    
 #if (ANTIALIASING == 1)	
	int i=0;
#else
	for (int i=0;i<ANTIALIASING;i++) {
#endif
        float randPix = 0.; //hash(iTime); // Use frame rate to improve antialiasing ... not sure of result
		vec2 subPix = .4*vec2(cos(randPix+6.28*float(i)/float(ANTIALIASING)),
                              sin(randPix+6.28*float(i)/float(ANTIALIASING)));
		//vec3 ray = Ray(2.0,fragCoord.xy+subPix);
		vec2 q = (fragCoord.xy+subPix)/iResolution.xy;
		//vec2 q = (fragCoord.xy+.4*vec2(cos(6.28*float(i)/float(ANTIALIASING)),sin(6.28*float(i)/float(ANTIALIASING))))/iResolution.xy;
        vec2 p = -1.0+2.0*q;
        p.x *= iResolution.x/iResolution.y;
        vec3 rd = normalize( p.x*cu + p.y*cv + 2.5*cw );
        
        nbSample++;
        float hmin = 100.;
        colorSum += sqrt(render( ro, rd, hmin));
        
#ifdef SHOW_EDGES
 		colorSum = vec3(1);
        if (Edge>0.3) colorSum = vec3(.6);  
        if (hmin>0.5) colorSum = vec3(0,0,0);   
        break;
#endif
        
#if (ANTIALIASING > 1)
        // optim : use antialiasing only on objects edges //exit if far from objects
        if (Edge<0.3 && hmin<0.5 ) break;
	}
#endif
    
    fragColor = vec4(colorSum/float(nbSample), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  iMouse = vec3(mouse * resolution, 0.0);
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
