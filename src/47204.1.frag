/*
 * Original shader from: https://www.shadertoy.com/view/ldGGRc
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.;
vec3  iResolution = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define time iTime * 0.5
const float PI=3.14159265;
const float PIH = PI*0.5;
const int MAX_ITER = 110;
const float EPSILON = 0.00001;
vec3 lightDir = normalize(vec3(0, 1, 0.75)); 

float bgMatType = 0.0;
float EyesNoseAndMouthType = 1.0;
float BodyMatType = 2.0;
float PlaneMatType = 3.0;
float BoxMatType = 4.0;
float RibbonMatType = 5.0;

vec3 boxPos = vec3(0, 10, -18);
vec3 boxSize = vec3(8, 5, 5);

vec3 skyColor = vec3(0.8, 0.9, 1.0);
vec3 bodyColor = vec3(0.35,0.35,0.35);
vec3 planeColor = vec3(0.7,0.7,0.7);
vec3 eyesColor = vec3(0.0, 0.0, 0.0);
vec3 boxColor = vec3(0.7,0.0,0.0);
vec3 ribbonColor = vec3(0.7,0.7,0.0);

//#define SELF_SHADOW
#define CHEAP_AO

//---------------------------------------------
vec3 rotationCoord(vec3 n, float t)
{
 vec3 result;

   vec2 sc = vec2(sin(t), cos(t));
   mat3 rotate;

      rotate = mat3( sc.y,  0.0, -sc.x,
                     0.0,   1.0,  0.0,
                     sc.x,  0.0, sc.y);   

  result = n * rotate;
  return result;
}

//------------------------------------------
float sdPlane( vec3 p )
{
	return p.y;
}


//------------------------------------------
vec2 rot(vec2 p,float r)
{
  vec2 ret;
  ret.x=p.x*cos(r)-p.y*sin(r);
  ret.y=p.x*sin(r)+p.y*cos(r);
  return ret;
}

//------------------------------------------
vec2 rotsim(vec2 p,float s)
{
  vec2 ret=p;
  ret=rot(p,-PI/(s*2.0));
  ret=rot(p,floor(atan(ret.x,ret.y)/PI*s)*(PI/s));
  return ret;
}

//----------------------------------------------------
float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    float basic = 0.61;
    return max(q.z-h.y,max(q.x* basic +p.y*0.5,-p.y)-h.x*0.5);
}

//----------------------------------------------------
float dSphere(vec3 p, float r)
{
   return length(p) - r;
}

//----------------------------------------------------------------
vec3 InstantiateRotY(vec3 p, float inPiFrac)
{
	float rad		= mod(atan(p.x, p.z) +  PIH*inPiFrac, PI*inPiFrac) - PIH*inPiFrac;
	p.xz			= vec2(sin(rad), cos(rad)) * length(p.xz);
	return p;
}

//----------------------------------------------------------------
float tail(vec3 p)
{
    p.yz = rot(p.yz, PIH * 0.5);
    p = rotationCoord(p, -PIH*0.4);
	float hMax		= 40.0;
	float hScalePos	= clamp(p.y / hMax, 0.0, 1.0);
	float h			= abs(p.y-hMax*0.5)- hMax*0.5;
	
	p.x				+= sin(hScalePos * PI * 1.75) * hScalePos * hMax * 0.25;
    p.x				+= sin(hScalePos * PI * 4.0) * hMax * 0.05;
    p.z				+= sin(hScalePos * PI * 1.5) * hMax * 0.25;
    p.z				+= sin(hScalePos * PI * 3.0) * hMax * 0.1;
	
	// Y - axis rotate-instantiation
	p				= InstantiateRotY(p, 1.0/16.0);
		
	float wl		= mix(1.2, 0.2, hScalePos);
	return max(max(p.x-wl, p.z-wl), h);
}

float dSegment(vec3 pa, vec3 ba, float r)
{
    return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0))-r;
}

float dBox( vec3 p, vec3 b)
{
  	vec3 d = abs(p) - b;
  	return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}

//--------------------------------------------------Ð’ÐµÑ€Ñ‚ÑƒÑˆÐºÐ°
float ribbon(in vec3 p )
{
    p.xy = rot(p.xy, PIH);
 	p.yz=rotsim(p.yz,2.5);
 	return sdTriPrism( p, vec2(1.5, 3.5) );
}

//--------------------------------------------------
float smin( float a, float b, float k ) 
{
   float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
   return mix( b, a, h ) - k*h*(1.0-h);
}

//---------------------------------------------
vec2 minDistMat(vec2 curDist, vec2 dist)
{
   	if (dist.x < curDist.x) 
   	{
    	return dist;
   	}
   	return curDist;
}

//--------------------------------------------------
float mouse(in vec3 pos )
{
  	float d = 1.;
   	// Head
   	d = dSphere(pos * vec3(0.8, 1.3, 1.0), 10.);
    d = smin(d, dSphere(pos * vec3(0.7, 0.5, 0.8) + vec3(0., 0.58, 0.0), 6.), 2.0);
    
   	pos.y +=11.;
    // Body
   	d = smin(d, dSphere(pos * vec3(0.6, 0.5, 0.8), 6.), 1.0); 
    d = smin(d, dSphere(pos * vec3(0.7, 1.5, 0.7) + vec3(0., 6.58, 0.0), 8.), 10.0);
    
    pos.y +=5.;
    // Snout
   	d = smin(d, dSphere(pos * vec3(1.03, 1.08, -0.64) + vec3(0., -15.58, 4.5), 3.8), 3.);
    
    // Ears
   	vec3 p1 = pos;
   	p1.x = abs(p1.x);       
   	d = smin(d, dSphere(p1 * vec3(0.66, 0.5, 1.8) + vec3(-6, -15., 0), 5.), 1.5);
    d = max(d, -dSphere(p1 *vec3(1,0.7,2)+ vec3(-9, -22, -5.2), 5.2)); 
    
   	// Legs
   	d = smin(d, dSphere(p1 * vec3(1, 1, 0.4) + vec3(-5., 7.25, -1.0), 4.), 1.3);    
    
   	// Arms
   	d = smin(d, dSphere(p1 * vec3(1.95, 2.3, -0.8 ) + vec3(-20, -10.8, 5.5), 7.), 1.0); 
    
    // Tail
    d = smin(d, tail(pos + vec3(2.0,0.0, 6.0)),1.5);

  	return d;
  
}

//--------------------------------------------------
vec2 map(in vec3 p)
{
   	vec3 pos = p;
   	pos += vec3(0., 5., 35.);
   	pos = rotationCoord(pos, time);     
   	vec2 d = vec2(1.0, bgMatType);
   	
   	vec3 p1 = pos;
   	p1.x = abs(p1.x);
    p1 += vec3(-3.12, -1.62, -9.54);   
    
    // Eyes
   	vec2 eyes = vec2(dSphere(p1, 1.), EyesNoseAndMouthType);
   	d =  minDistMat(d,   eyes); 
    
	// Moustache
    d =  minDistMat(d,  vec2(dSegment( p1 + vec3(2.0, 2.2, -3.), vec3(7, 0, -1), 0.1),  EyesNoseAndMouthType)); 
    d =  minDistMat(d,  vec2(dSegment( p1 + vec3(2.0, 1.8, -3.), vec3(6.5, 1, -1), 0.1),  EyesNoseAndMouthType)); 
    d =  minDistMat(d,  vec2(dSegment( p1 + vec3(2.0, 2.7, -3.), vec3(6.5, -1, -1), 0.1),  EyesNoseAndMouthType));
    
    // Nose
   	d =  minDistMat(d,   vec2(dSphere(pos + vec3(0., 0.6, -12.5), 0.5) ,  EyesNoseAndMouthType));    

  	float toy = mouse(pos);
   	d =  minDistMat(d,   vec2(toy , BodyMatType));   
    
    // Box
    d = minDistMat(d, vec2(dBox(pos + boxPos, boxSize), BoxMatType));
    
    // Ribbon
    d = minDistMat(d, vec2(dBox(pos + boxPos, boxSize * vec3(1.05, 1.05, 0.3)), RibbonMatType));
    d = minDistMat(d, vec2(dBox(pos + boxPos, boxSize * vec3(0.2, 1.05, 1.05)), RibbonMatType));
    d = minDistMat(d, vec2(ribbon(pos + boxPos - vec3(0, boxSize.y + 0.5, 0)), RibbonMatType));
    
    // Plane
    d = minDistMat(d, vec2(sdPlane(pos + vec3(0,23.6,0)), PlaneMatType));
    
	return d; 
}

//------------------------------------------------- 
vec3 getNormal(in vec3 p)
{

   vec3 e = vec3( 0.1, 0., 0. );
   vec3 nor = vec3(
       map(p+e.xyy).x - map(p-e.xyy).x,
       map(p+e.yxy).x - map(p-e.yxy).x,
       map(p+e.yyx).x - map(p-e.yyx).x);
   return normalize(nor);  

}

//------------------------------------------
float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<10; i++ )
    {        
		float h = map( ro + rd*t ).x;
        res = min( res, 10.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<EPSILON || t>tmax ) break;
    }
    return clamp(res, 0.0, 1.0 );
}

//------------------------------------------
float calcAO( in vec3 pos, in vec3 nor )
{
#ifdef CHEAP_AO
    return mix(0.5, 1.0, clamp((nor.y + 1.0) * 0.5, 0.0, 1.0)); 
#else
    float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<10; i++ )
    {
    	float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 0.5*occ, 0.0, 1.0 );   
#endif
}


//------------------------------------------
vec3 illum(in vec3 pos, in vec3 ro, in vec3 rd ,in vec3 nor, in vec3 lig, in vec3 col, in float t, in float mat)
{
    // lighitng 
    vec3 ref = reflect( rd, nor );
    float occ = calcAO( pos, nor );    
    
	float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
    float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
    float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);
    float dom = smoothstep( -0.1, 0.1, ref.y );
    float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );
    float spe = pow(clamp( dot( ref, lig ), 0.0, 1.0 ),16.0);
        
#ifndef SELF_SHADOW
    if(mat == PlaneMatType) 
#endif
    	dif *= softshadow( pos, lig, 5.5, 75.0 );
    
    vec3 brdf = vec3(0.0);
    brdf += 1.0*dif*vec3(1,1,1);
    brdf += 0.15*spe*vec3(1,1,1)*dif;
    brdf += 0.30*amb*skyColor*occ;
    brdf += 0.10*dom*skyColor*occ;
    brdf += 1.0*bac*vec3(0.25,0.25,0.25)*occ;
    brdf += 1.0*fre*vec3(1.00,1.00,1.00)*occ;
    brdf += 0.02;
	col = col*brdf;
    
    return col;
}
//----------------------------------------------------------------------
vec3 getColor(inout vec3 ro, vec3 rd, vec2 t)
{
  	vec3 color = skyColor; 
 
   	float mat =  t.y;
   	if (mat > 0.0) 
   	{
        vec3 hitPos = ro + rd * t.x;
  		vec3 normal = normalize(getNormal(hitPos)); 
        
   		if (mat == BodyMatType) 
   		{
	    	color = bodyColor;
   		}
    	else if (mat == PlaneMatType) 
   		{
	    	color = planeColor;
   		}
   		else if (mat == EyesNoseAndMouthType) 
   		{
     		color = eyesColor; 
   		}
        else if (mat > PlaneMatType && mat < RibbonMatType) 
        {
            color = boxColor;
        }
        else 
        {
            color = ribbonColor;
        }
	    
    	color = illum(hitPos, ro, rd, normal, lightDir, color.rgb, t.x, mat);
    }
   
  	return color;
}

//-------------------------------------------------
vec2 render(in vec3 posOnRay, in vec3 rayDir)
{ 
    vec2 t = vec2(0.0, bgMatType);
    float maxDist = 100.;
    for(int i=0; i<MAX_ITER; ++i)
    {
        vec2 d = map(posOnRay + t.x*rayDir); 
        if (abs(d.x) < EPSILON || t.x > maxDist) 
            break;
        t.x += d.x;//max(d.x, MIN_STEP);
        t.y = d.y;
    }
    return t;
}
//------------------------------------------
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 pos     =  fragCoord.xy / iResolution.xy * 2. - 1.;
    pos.x *= iResolution.x / iResolution.y;  
       
    vec3 camP = vec3(0., 4., 30.);
    vec3 camUp = vec3(0. , 1., 0.);
    vec3 camDir = normalize(-camP);
    vec3 u = normalize(cross(camUp,camDir));
    vec3 v = cross(camDir,u);
    vec3 rayDir = normalize(2. * camDir + pos.x * u + pos.y * v);  
   	 
    vec2 t =  render(camP, rayDir);  
    vec3 color = getColor(camP, rayDir, t); 
    
    // gamma
	color = pow( clamp( color, 0.0, 1.0 ), vec3(0.45) );
    
    // vignetting
    pos*=0.35;
    float distSqr = dot(pos, pos);
	float vignette = 1.0 - distSqr;
    color *=  vignette;
    
    fragColor = vec4(color, 1.0);

}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
 
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
