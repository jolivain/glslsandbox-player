#ifdef GL_ES
precision highp float;
#endif

//relaxing spherical harmonic 
//feel free to fix the isosurface expression - not sure how to do the standard atomic model bulbs type view...

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define PI              (4.*atan(1.))
#define TAU             (8.*atan(1.))
#define ISQRT2          (1./sqrt(2.))
  
#define PHI              .00001
#define EPSILON          .00002
#define FARPLANE         64.
#define FOV              2.

#define VIEWPOINT        vec3(2.75, 2.75, 2.)
#define VIEWTARGET       vec3(-.35, .0, 0.)
  
#define LIGHTPOSITION    vec3(-8.5, 8., 8.423) * 32.

struct ray
{
    float e, i;
	vec3 o, d;
};

struct surface
{
    int id;
	vec3 p, n;
    vec4 c;
};
    
struct light
{
	vec3 p, c;
};

struct material
{
	vec3  dc, sc;
	float r, i, t;
};

	
	
//ray marching
ray      view(in vec2 uv);
float 	 map(in vec3 p);
vec3     derive(in vec3 p, in float e);
void 	 emit(inout ray r, inout surface s, const int n);

//distance functions
vec3	 sphericalharmonic(vec3 n);
float    sphere(vec3 p, float r);

//rotation matrices
mat2     rmat(float r);
mat3     rmat(vec3 r);

float map(vec3 p)
{   

	p.xz    *= rmat(time*.5);
	
 	vec2 d  = vec2(0., max(EPSILON, EPSILON+distance(VIEWPOINT,p)*2./resolution.x));
	
	vec3 nx = sphericalharmonic(p+d.yxx)-sphericalharmonic(p-d.yxx);
	vec3 ny = sphericalharmonic(p+d.xyx)-sphericalharmonic(p-d.xyx);
	vec3 nz = sphericalharmonic(p+d.xxy)-sphericalharmonic(p-d.xxy);
	vec3 n  = normalize(nx)*normalize(ny)*normalize(nz);
	
	float r = sphere(p, .5+length(n));	
	
	return r;
}

void main( void ) {
	vec2 uv    = gl_FragCoord.xy/resolution.xy;
    
	ray r      = view(uv);
	surface s  = surface(0, r.o, vec3(0.), vec4(0.));    
    
	light l    = light(vec3(0.), vec3(0.));
	l.c        = vec3(.9, .87, .85);
	l.p        = LIGHTPOSITION;
   
    	#ifdef LIGHTANIMATION
    	l.p.xz     *= rmat(TAU * mouse.x);
   	#endif
 
    	emit(r, s, 256);

  	vec3 a = vec3(.5) * uv.y * .25;

	vec3 c = a;
	if(s.id != 0)
	{    
		material m  = material(max(vec3(.25), normalize(s.p)), vec3(.5), .1, .1, 0.); 
	    	m.sc	    += m.dc * .25;
		
	        s.n         = derive(s.p, r.e);
        	vec3 ld	    = normalize(l.p-s.p);
		vec3 v      = VIEWPOINT-VIEWTARGET;
		vec3 h	    = normalize(ld+v); 

		float ndl   = max(0.0, dot(s.n, ld));

	        float hdn   = dot(h, s.n);
        	float d     = clamp(pow(hdn, 32.)*.6, 0., 1.);
		float f	    = cos(dot(s.n, v))*.15;
		
	        c           = ndl * m.dc * l.c + f ;
        	c           += d * l.c * m.sc;
	        c           += clamp(c, 0., 1.);
        
     	   	c = mix(c, a, clamp(.25+r.i, 0., 1.));

	}
	c 	+= (.5+c) * r.i+r.i*.25;
	
	gl_FragColor = vec4(c, 1.);
}//sphinx


ray view(in vec2 uv)
{ 
	float f = FOV;
	vec3  p = VIEWPOINT;
	vec3  t = VIEWTARGET;
     
	uv     = uv * 2. - 1.;
	uv.x   *= resolution.x/resolution.y;
    
	vec3 w = normalize(t-p);
	vec3 u = normalize(cross(w,vec3(0.,1.,0.)));
	vec3 v = normalize(cross(u,w));
	ray r  = ray(0., 0., vec3(0.), vec3(0.));
	r.e    = PHI;
	r.i    = 0.;
	r.o    = p;
	r.d    = normalize(uv.x*u + uv.y*v + f*w);
 
	return r;
}

void emit(inout ray r, inout surface s, const int n)
{
	float ephi  = PHI;
    	float e     = 0.;
    	float pe    = 0.;
    	vec3 psp    = r.o;
	
    	for(int i = 0; i < 256; i++)
    	{
    	  	if (e < FARPLANE && i < n)
		{
			psp   = s.p;
        	    
			if (r.e < ephi)
			{
	                	r.e  = distance(r.o, s.p);
        	        	r.i  = float(i)/float(n);
	        	        s.id = 1;
		              	break;
			}
           
        	    s.p   = r.o + r.d * e;
            
        	    r.e   = map(s.p);
	            ephi  *= 1.02;            
        	    e     += r.e * .8;
            
	            s.p   = r.e * pe < 0. ? mix(psp, s.p, -pe/(r.e-pe)) : s.p;
        	    pe    = r.e;
        	}
	        else
        	{
	            r.e  = distance(r.o, s.p);
        	    r.i  = float(i)/float(n);
	            s.id = 0;
        	    break;
	        }
	}
}

vec3 derive(in vec3 p, in float e)
{
	vec2 d = vec2(0., max(EPSILON, EPSILON+e*2./resolution.x));
	vec3 n = vec3(0.);
	n.x = map(p+d.yxx)-map(p-d.yxx);
	n.y = map(p+d.xyx)-map(p-d.xyx);
	n.z = map(p+d.xxy)-map(p-d.xxy);
	return normalize(n);
}

vec3 sphericalharmonic(vec3 n){ 
	
	//coefficients
	vec4 x1 = vec4(1., 0., 0., 0.);
	vec4 y1 = vec4(0., 1., 0., 0.);
	vec4 z1 = vec4(0., 0., 1., 0.);
	vec4 x2 = vec4(0.71);
	vec4 y2 = vec4(0.71);
	vec4 z2 = vec4(0.71);
	vec3 w  = vec3(.71);

	
	//some random animation thereof
	vec3 t = time * vec3(.1, .3, .5);
	
	x1.xyz *= rmat(t.xyz);
	y1.xyz *= rmat(t.xzy);
	z1.xyz *= rmat(t.zyx);
	w      *= rmat(t.yxz);
	vec3 l1;
	vec3 l2;
	vec3 l3;
	vec4 n4 = vec4(n, 1.);
	l1.r = dot(x1,n4);
	l1.g = dot(y1,n4);
	l1.b = dot(z1,n4);
	
	vec4 m2 = n.xyzz * n.yzzx;
	l2.r = dot(x2,m2);
	l2.g = dot(y2,m2);
	l2.b = dot(z2,m2);
	
	float m3 = n.x*n.x - n.y*n.y;
	l3 = w * m3;
    	
	vec3 sh = vec3(l1 + l2 + l3);
	
	return sh;
}

//primitives
float sphere(vec3 p, float r){
	return length(p)-r;		
}

//rotation matrices
mat2 rmat(float r)
{
	float c = cos(r);
	float s = sin(r);
	return mat2(c, s, -s, c);
}

mat3 rmat(vec3 r)
{
	vec3 a = vec3(cos(r.x)*cos(r.y),-sin(r.y),sin(r.x)*cos(r.y));
	
	float c = cos(r.z);
	float s = sin(r.z);
	vec3 as  = a*s;
	vec3 ac  = a*a*(1.- c);
	vec3 ad  = a.yzx*a.zxy*(1.-c);
	mat3 rot = mat3(
		c    + ac.x, 
        ad.z - as.z, 
        ad.y + as.y,
		ad.z + as.z, 
        c    + ac.y, 
        ad.x - as.x,
		ad.y - as.y, 
        ad.x + as.x, 
        c    + ac.z);

	return rot;	
}
