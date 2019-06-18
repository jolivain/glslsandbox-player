/*
 * Original shader from: https://www.shadertoy.com/view/MdVBRy
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Created by Stephane Cuillerdier - @Aiekick/2018
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Tuned via NoodlesPlate

mat3 getRotXMat(float a){return mat3(1.,0.,0.,0.,cos(a),-sin(a),0.,sin(a),cos(a));}
mat3 getRotYMat(float a){return mat3(cos(a),0.,sin(a),0.,1.,0.,-sin(a),0.,cos(a));}
mat3 getRotZMat(float a){return mat3(cos(a),-sin(a),0.,sin(a),cos(a),0.,0.,0.,1.);}

mat3 m1 = mat3(0.);
mat3 m2 = mat3(0.);

vec2 path(float t)
{
	return vec2(cos(t*0.08 + cos(t*0.1)*2.), sin(t*0.12 + sin(t*0.05)*2.5)) * 4.;
}

float pattern(vec3 p)
{
	p = abs(fract(p*.3) - 0.5);
	return length( max(abs(p.x), abs(p.y)) - p.z);
}

vec4 map(vec3 p)
{
    vec2 pa = path(p.z); 
	
    p.xy -= pa;
	
    float a = pa.x * pa.y * 0.1;
	p.xy *= mat2(cos(a),-sin(a),sin(a),cos(a));
    
    float d0 = min(pattern(p*m1), pattern(p*m2));
    float d1 = min(pattern(p*3.*m1), pattern(p*2.*m2));
    
   	float dist0 = dot(vec3(1)-clamp(d0,0.,1.),vec3(1));
	float dist1 = dot(vec3(1)-clamp(d1,0.,1.),vec3(d0));
    
	float dist = mix(dist0, dist1, 0.75);
	
    //return vec4(1.47 - length(p.xy) - dist, vec3(step(dist,0.1))); // tunnel
	return vec4(1.47 - abs(cos(p.x*0.3)*p.y) - dist, vec3(step(dist,0.1))); // planes
}

vec3 nor( vec3 pos, float k )
{
	vec3 eps = vec3( k, 0., 0. );
	vec3 nor = vec3(
	    map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	    map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	    map(pos+eps.yyx).x - map(pos-eps.yyx).x );
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
    const int iter = 8;
	for (int i=0;i<iter;i++)
	{
		n = nor(surfPoint,prec); 
		surfPoint = surfPoint - n * ms; 
		s += map(surfPoint).x;
	}
	
	return 1.-s/(ms*float(iter)); // s < 0. => inside df
}

float SubDensity(vec3 p, float s) 
{
	vec3 n = nor(p,s); 							// precise normale at surf point
	return map(p - n * s).x;						// ratio between df step and constant step
}

// from shane sahders
// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: http://http.developer.nvidia.com/GPUGems3/gpugems3_ch01.html
vec3 tex3D( sampler2D tex, in vec3 p, in vec3 n ){
   
    n = max((abs(n) - .2)*7., .001);
    n /= (n.x + n.y + n.z );  
    
	p = (texture(tex, p.yz)*n.x + texture(tex, p.zx)*n.y + texture(tex, p.xy)*n.z).xyz;
    
    return p*p;
}

// from shane sahders
// Texture bump mapping. Four tri-planar lookups, or 12 texture lookups in total. I tried to 
// make it as concise as possible. Whether that translates to speed, or not, I couldn't say.
vec3 doBumpMap( sampler2D tx, in vec3 p, in vec3 n, float bf){
   
    const vec2 e = vec2(0.001, 0);
    
    // Three gradient vectors rolled into a matrix, constructed with offset greyscale texture values.    
    mat3 m = mat3( tex3D(tx, p - e.xyy, n), tex3D(tx, p - e.yxy, n), tex3D(tx, p - e.yyx, n));
    
    vec3 g = vec3(0.299, 0.587, 0.114)*m; // Converting to greyscale.
    g = (g - dot(tex3D(tx,  p , n), vec3(0.299, 0.587, 0.114)) )/e.x; g -= n*dot(n, g);
                      
    return normalize( n + g*bf ); // Bumped normal. "bf" - bump factor.
    
}

vec4 shade(vec3 ro, vec3 rd, float d, vec3 lp)
{
	vec3 p = ro + rd * d;											// surface point
	float sb = SubDensity(p, 0.01, 0.1);							// deep subdensity (10 iterations)
	vec3 bb = blackbody(100.*sb+100.);								// bb
	vec3 ld = normalize(lp-p); 										// light dir
	vec3 n = nor(p, .01);											// normal at surface point
	//n = doBumpMap(iChannel0, -p*0.5, n, 0.015);
	vec3 refl = reflect(rd,n);										// reflected ray dir at surf point 
	float amb = 0.08; 												// ambiance factor
	float diff = clamp( dot( n, ld ), 0.0, 1.0 ); 					// diffuse
	float fre = pow( clamp( 1. + dot(n,rd),0.0,1.0), 16. ); 			// fresnel
	float spe = pow(clamp( dot( refl, ld ), 0.0, 1.0 ),25.);		// specular
	float sss = 1. - SubDensity(p*0.1, 0.1) * 0.5; 							// one step sub density of df
	return vec4(
        (diff + fre + bb.x * sss) * amb + diff * 0.5, 
        (diff + fre + bb * sb + sss * 0.3) * amb + spe * 0.6 - diff * sss * 0.05	
    );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec4 f = vec4(0);
    
    vec2 g = fragCoord.xy;
    vec2 si = iResolution.xy;
    
    mat3 mx = getRotXMat(-7.);
	mat3 my = getRotYMat(-5.);
	mat3 mz = getRotZMat(-3.);
	
    m1 = mx * my * mz;
    m2 = m1*m1;
	
    float time = iTime * 5.;
    // for avoid artifacts due to float precision over 400 secs
    //time = mod(iTime * 5., 400.); 
    
    vec3 camUp=vec3(0,1,0);//Change camere up vector here
  	vec3 camView=vec3(0,0,time + .1); //Change camere view here
	camView.xy += path(camView.z);
    
  	vec2 uv = (g+g-si)/si.y;
    
    vec3 ro = vec3(0,0,time);
	ro.xy += path(ro.z);
    
    vec3 lp = vec3(path(ro.z + 3.),ro.z + 3.);
    
	vec2 fov = vec2(0.75,0.9);
  	vec3 rov = normalize(camView-ro);
    vec3 u = normalize(cross(camUp,rov));
  	vec3 v = cross(rov,u);
  	vec3 rd = normalize(rov + uv.x*u*fov.x + uv.y*v*fov.y);
    
    float s = 1.;
    float d = 0.;
    for(int i=0;i<80;i++)
    {      
        if (d*d/s>1e5) break;
        d += s = map(ro+rd*d).x * .6;
    }
	
    vec3 p = ro+rd*d;
    vec3 n = nor(p, 0.1);
        
    f = shade(ro, rd, d, lp);
	
	f = f.zyww + f.x*0.2;

    f = mix( f, vec4(0.8), 1.0-exp( -0.01*d*d ) );
        
   	fragColor = sqrt(f*f*f*1.5);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
