// Tunnel Beauty 4 by aiekick
// original : https://www.shadertoy.com/view/MtKGDD

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

mat3 RotZ(float a){return mat3(cos(a),-sin(a),0.,sin(a),cos(a),0.,0.,0.,1.);}

vec3 path(vec3 p)
{
	p *= RotZ(p.z * 0.1);
    p += sin(p.zxy * 0.5) * 0.5;
	p *= RotZ(p.z * 0.2);
   	return sin(p.zxy * 0.2) * 2.;
}

float df(vec3 p)
{
	p += path(p);
	p *= RotZ(p.z * 0.01);
	return mix(3.,2.5+3.5*sin(p.z*.5),abs(fract(atan(p.x, p.y)/3.14159*3.)-.5)) - length(p.xy);
}

vec3 nor( vec3 pos, float prec )
{
	vec3 eps = vec3( prec, 0., 0. );
	vec3 nor = vec3(
	    df(pos+eps.xyy) - df(pos-eps.xyy),
	    df(pos+eps.yxy) - df(pos-eps.yxy),
	    df(pos+eps.yyx) - df(pos-eps.yyx) );
	return normalize(nor);
}

// return color from temperature 
//http://www.physics.sfasu.edu/astro/color/blackbody.html
//http://www.vendian.org/mncharity/dir3/blackbody/
//http://www.vendian.org/mncharity/dir3/blackbody/UnstableURLs/bbr_color.html
vec3 blackbody(float Temp)
{
	vec3 col = vec3(255.);
    col.x = 56100000. * pow(Temp,(-3. / 2.)) + 148.;
   	col.y = 100.04 * log(Temp) - 623.6;
   	if (Temp > 6500.) col.y = 35200000. * pow(Temp,(-3. / 2.)) + 184.;
   	col.z = 194.18 * log(Temp) - 1448.6;
   	col = clamp(col, 0., 255.)/255.;
    if (Temp < 1000.) col *= Temp/1000.;
   	return col;
}

// get density of the df at surfPoint
// ratio between constant step and df value
float SubDensity(vec3 surfPoint, float prec, float ms) 
{
	vec3 n;
	float s = 0.;
    const int iter = 3;
	for (int i=0;i<iter;i++)
	{
		n = nor(surfPoint,prec); 
		surfPoint = surfPoint - n * ms; 
		s += df(surfPoint);
	}
	
	return 1.-s/(ms*float(iter)); // s < 0. => inside df
}

float SubDensity(vec3 p, float s) 
{
	vec3 n = nor(p,s); 							// precise normale at surf point
	return df(p - n * s)/s;						// ratio between df step and constant step
}

void main()
{
	vec2 g = gl_FragCoord.xy;
	vec2 si = resolution;
	
	vec2 uv = (g+g-si)/si.y;

	float time = time*0.5;
	
	vec3 ro = vec3(0,0, time*5.);
	ro -= path(ro);
	
	vec3 cv = ro + vec3(0,0,4); // cam view
	cv -= path(cv);
	
	vec3 lp = ro;	// light pos
	
	vec3 cu = normalize(vec3(0,1,0));
  	vec3 z = normalize(cv-ro);
    vec3 x = normalize(cross(cu,z));
  	vec3 y = cross(z,x);
  	vec3 rd = normalize(z + uv.x*x + uv.y*y);

	float s = 1., d = 0.;
	for (int i=0; i<150; i++) 
	{
		if (log(d*d/s/1e6)>0.) break; 
		d += (s = df(ro+rd*d))*0.2;
	}
	
	vec3 p = ro + rd * d;											// surface point
	vec3 ld = normalize(lp-p); 										// light dir
	vec3 n = nor(p, 0.1);											// normal at surface point
	vec3 refl = reflect(rd,n);										// reflected ray dir at surf point 
	float diff = clamp( dot( n, ld ), 0.0, 1.0 ); 					// diffuse
	float fre = pow( clamp( 1. + dot(n,rd),0.0,1.0), 4. ); 			// fresnel
	float spe = pow(clamp( dot( refl, ld ), 0.0, 1.0 ),16.);		// specular
	vec3 col = vec3(0.8,0.5,0.2);
	float sss = df(p - n*0.001)/0.01;								// quick sss 0.001 of subsurface
	
	float sb = SubDensity(p, 0.01, 0.01);							// deep subdensity from 0.01 to 0.1 (10 iterations)
	vec3 bb = clamp(blackbody(100. * sb),0.,1.);					// blackbody color
	float sss2 = 1.0 - SubDensity(p, 1.5); 							// one step sub density of df of 1.5 of subsurface
	
	vec3 a = (diff + fre + bb * sss * .8 + col * sss * .2) * 0.35 + spe;
    vec3 b = col * sss2;
    
	gl_FragColor.rgb = mix(a, b, .8-exp(-0.005*d*d));
	gl_FragColor.a = 1.;
}


