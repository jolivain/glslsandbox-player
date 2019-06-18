/*
 * Original shader from: https://www.shadertoy.com/view/MlX3Wr
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
// Galvanize Tunnel
// From Alcatraz 8K intro Galvanize

// http://www.pouet.net/prod.php?which=63821
// https://www.youtube.com/watch?v=z5cFJryE_fc


// Jochen "Virgill" Feldkoetter

//*****************************************************


float blend =0.0; float scene = 35.;
float d = 0.0; float m = 0.0;
float kalitime = 0.0;
float depth = 0.0; 
float prec =0.002;
vec4 orbitTrap = vec4(0.0);


// Rotate
vec3 rotXaxis(vec3 p, float rad)
{
	float z2 = cos(rad) * p.z - sin(rad) * p.y;
	float y2 = sin(rad) * p.z + cos(rad) * p.y;
	p.z = z2; p.y = y2;
	return p;
}

vec3 rotYaxis(vec3 p, float rad) 
{
	float x2 = cos(rad) * p.x - sin(rad) * p.z;
	float z2 = sin(rad) * p.x + cos(rad) * p.z;
	p.x = x2; p.z = z2;
	return p;
}

vec3 rotZaxis(vec3 p, float rad) 
{
	float x2 = cos(rad) * p.x - sin(rad) * p.y;
	float y2 = sin(rad) * p.x + cos(rad) * p.y;
	p.x = x2; p.y = y2;
	return p;
}


// Rand
float rand1(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Polyomial smooth min (IQ)
float sminPoly( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}


// Length
float length2(vec2 p) 
{ 
  	return dot(p, p); 
}

// Worley effect 
float worley(vec2 p) 
{
	float d = 1.;
	for (int xo = -1; xo <= 1; ++xo)
	for (int yo = -1; yo <= 1; ++yo) 
    {
		vec2 tp = floor(p) + vec2(xo, yo);
		d = min(d, length2(p - tp - vec2(rand1(tp))));
	}
	return 3.*exp(-4.*abs(2.*d - 1.));
}

float fworley(vec2 p) 
{
	return sqrt(sqrt(sqrt(worley(p*32. + 4.3 + iTime*.250) * sqrt(worley(p * 64. + 5.3 + iTime * -.125)) * sqrt(sqrt(worley(p * -128. +7.3))))));
}





// Kalibox (Kali / Fractalforums.com)
float Kalibox(vec3 pos) 
{
	float Scale = 1.84;						
	int Iterations = 14;			
	int ColorIterations = 3;		
	float MinRad2 = 0.34;	
	vec3 Trans = vec3(0.076,-1.86,0.036);			
	vec3 Julia = vec3(-0.66,-1.2+(kalitime/80.),-0.66);	
	vec4 scale = vec4(Scale, Scale, Scale, abs(Scale)) / MinRad2;
	float absScalem1 = abs(Scale - 1.0);
	float AbsScaleRaisedTo1mIters = pow(abs(Scale), float(1-Iterations));
    vec4 p = vec4(pos,1), p0 = vec4(Julia,1); 
	for (int i=0; i<14; i++)
		{
			p.xyz=abs(p.xyz)+Trans;
			float r2 = dot(p.xyz, p.xyz);
			p *= clamp(max(MinRad2/r2, MinRad2), 0.0, 1.0); 
			p = p*scale + p0;
			if (i<ColorIterations) orbitTrap = min(orbitTrap, abs(vec4(p.xyz,r2)));
		}
	return (    (length(p.xyz) - absScalem1) / p.w - AbsScaleRaisedTo1mIters    );
}



// Plane
float sdPlane(in vec3 p) 
{
	return p.y+(0.025*sin(p.x*10.  +1.4*iTime  ))+(0.025*sin(p.z*12.3*cos(0.4-p.x)+  1.6*iTime  ))-0.05;
}

// Cylinder 
float sdCylinder( vec3 p, vec3 c )
{
	return length(p.xz-c.xy)-c.z;
}


// Map
float map(in vec3 p)
{
	orbitTrap = vec4(10.0);
	d = sdPlane(p);

	vec3 c = vec3(2.0, 8.0, 2.0);
	vec3 q = mod(p-vec3(1.0,0.1*iTime,1.0),c)-0.5*c;
	float kali = Kalibox(rotYaxis(q,0.04*iTime));
	m = max(kali,-sdCylinder(p,vec3(0.0,0.0,0.30+0.1*sin(iTime*0.2))) );

	d = sminPoly (m, d, 0.04); 
   return d;
}


// Normal Calculation
vec3 calcNormal(in vec3 p) 
{
    vec3 e = vec3(0.001, 0.0, 0.0);
    vec3 nor = vec3(map(p + e.xyy) - map(p - e.xyy),  map(p + e.yxy) - map(p - e.yxy),  map(p + e.yyx) - map(p - e.yyx));
    return normalize(nor);
}

// Cast
float castRay(in vec3 ro, in vec3 rd, in float maxt) 
{
    float precis = prec;
    float h = precis * 2.0;
    float t = depth;

    for(int i = 0; i < 122; i++) 
	{
        if(abs(h) < precis || t > maxt) break;
        orbitTrap = vec4(10.0);
		h = map(ro + rd * t);
        t += h;
	}
    return t;
}

// Softshadow (IQ)
float softshadow(in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k) 
{
    float sh = 1.0;
    float t = mint;
    float h = 0.0;
    for(int i = 0; i < 19; i++) 
	{
        if(t > maxt) continue;
		orbitTrap = vec4(10.0);
        h = map(ro + rd * t);
        sh = min(sh, k * h / t);
        t += h;
    }
    return sh;
}


// Orbit color
vec3 getColor()
{
	vec3 BaseColor = vec3(0.2,0.2,0.2);
	vec3 OrbitStrength = vec3(0.8, 0.8, 0.8);
	vec4 X = vec4(0.5, 0.6, 0.6, 0.2);
	vec4 Y = vec4(1.0, 0.5, 0.1, 0.7);
	vec4 Z = vec4(0.8, 0.7, 1.0, 0.3);
	vec4 R = vec4(0.7, 0.7, 0.5, 0.1);
    orbitTrap.w = sqrt(orbitTrap.w);
	vec3 orbitColor = X.xyz*X.w*orbitTrap.x + Y.xyz*Y.w*orbitTrap.y + Z.xyz*Z.w*orbitTrap.z + R.xyz*R.w*orbitTrap.w;
	vec3 color = mix(BaseColor,3.0*orbitColor,OrbitStrength);
	return color;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
{
    kalitime = iTime-15.0; 
 	blend=min(2.0*abs(sin((iTime+0.0)*3.1415/scene)),1.0); 
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
	p.x *= iResolution.x / iResolution.y;
	float theta = sin(iTime*0.03) * 3.14 * 2.0;
    float x = 3.0 * cos(theta);
    float z = 3.0 * sin(theta);
	vec3 ro; 


	ro = vec3(0.0, 8.0, 0.0001);  

	vec3 ta = vec3(0.0, 0.25, 0.0);
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(0.0, 1.0, 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
	vec3 rd = normalize(p.x * cu + p.y * cv + 7.5 * cw);

// Render:
    vec3 col = vec3(0.0);
    float t = castRay(ro, rd, 12.0);
	vec3 pos = ro + rd *t;
	vec3 nor = calcNormal(pos);
	vec3 lig;	
	lig = normalize(vec3(-0.4*sin(iTime*0.15), 1.0, 0.5));

	float dif = clamp(dot(lig, nor), 0.0, 1.0);
	float spec = pow(clamp(dot(reflect(rd, nor), lig), 0.0, 1.0), 16.0);
	float sh = softshadow(pos, lig, 0.02, 20.0, 7.0);
	vec3 color = getColor();
	col = ((0.8*dif+ spec) + 0.35*color);
	col = col*clamp(sh, 0.0, 1.0);


// Postprocessing
	float klang1=0.4;
	vec2 uv2=-0.3+2.*fragCoord.xy/iResolution.xy;
	col-=0.20*(1.-klang1)*rand1(uv2.xy*iTime);							
	col*=.9+0.20*(1.-klang1)*sin(10.*iTime+uv2.x*iResolution.x);	
	col*=.9+0.20*(1.-klang1)*sin(10.*iTime+uv2.y*iResolution.y);	
	float Scr=1.-dot(uv2,uv2)*0.15;
	vec2 uv3=fragCoord.xy/iResolution.xy;
	float worl = fworley(uv3 * iResolution.xy / 2100.);
	worl *= exp(-length2(abs(2.*uv3 - 1.))); 
	worl *= abs(1.-0.6*dot(2.*uv3-1.,2.*uv3-1.));
	col += vec3(0.40*worl,0.35*worl,0.25*worl);

// Border    
	float g2 = (blend/2.)+0.39;
	float g1 = ((1.-blend)/2.);
	if (uv3.y >=g2+0.11) col*=0.0;
	if (uv3.y >=g2+0.09) col*=0.4;
	if (uv3.y >=g2+0.07) {if (mod(uv3.x-0.06*iTime,0.18)<=0.16) col*=0.5;}
	if (uv3.y >=g2+0.05) {if (mod(uv3.x-0.04*iTime,0.12)<=0.10) col*=0.6;}
	if (uv3.y >=g2+0.03) {if (mod(uv3.x-0.02*iTime,0.08)<=0.06) col*=0.7;}
	if (uv3.y >=g2+0.01) {if (mod(uv3.x-0.01*iTime,0.04)<=0.02) col*=0.8;}
	if (uv3.y <=g1+0.10) {if (mod(uv3.x+0.01*iTime,0.04)<=0.02) col*=0.8;}
	if (uv3.y <=g1+0.08) {if (mod(uv3.x+0.02*iTime,0.08)<=0.06) col*=0.7;}
	if (uv3.y <=g1+0.06) {if (mod(uv3.x+0.04*iTime,0.12)<=0.10) col*=0.6;}
	if (uv3.y <=g1+0.04) {if (mod(uv3.x+0.06*iTime,0.18)<=0.16) col*=0.5;}
	if (uv3.y <=g1+0.02) col*=0.4;
	if (uv3.y <=g1+0.00) col*=0.0;
    
    
    fragColor = vec4(col*Scr,1.0)*blend;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
