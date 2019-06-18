#ifdef GL_ES 
precision highp float;
#endif
//old stuff

#define phi .003
#define farplane 4.
//#define modulus //extend the farplane for this
//#define denoise
#define pi 4.*atan(1.)
#define sin45deg sqrt(2.)/2.

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

struct ray{
	vec3 o, p, d, c;
	float l;
};

struct light{
	vec3 p, d, c;
};
    
struct mat{
	vec3  dc, sc;
	float r, i;
};

struct env{
	vec3  l;
	float f;
};
    
float 	sphere(vec3 rp, vec3 sp, float r);
float   capsule( vec3 p, vec3 a, vec3 b, float r );
vec4    noise(in vec4 f);

float 	map(vec3 p);
vec3 	derivate(vec3 p);
ray 	trace(ray r);

vec3    shade(ray r, light l, mat m, env e, vec3 n);
float   fresnel(float i, float ndv);
float   geometry(float r, float ndl, float ndv, float hdn, float hdv, float hdl);
float   distribution(float r, float ndh);
float   shadow(vec3 p, vec3 d, float ndl);
float   occlusion(vec3 p, vec3 n);

vec3    harmonic(in vec4 n);

int material = 1;

void main( void ) {
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	uv      = uv * 2. - 1.;
	uv.x 	*= resolution.x/resolution.y;
	
	ray r;
	r.d = normalize(vec3(uv, 1.5));
    r.d.y+=.15;
    r.o = vec3(-.65, 1.1, -2.65);
	r.p = vec3(0.);
    r.c = vec3(0.0);
    
      
    float m = time*.1;//-(mouse.x-.5)*6.28;
    mat2 rot = mat2(cos(m), sin(m), -sin(m), cos(m));
    #ifdef modulus
       r.d.xz *= rot;
    #endif
    
	r = trace(r);

    vec3 n = derivate(r.p);
	
    env e;
    e.f = length(r.c);
    
	if(r.l < farplane){
		light l;
        l.p = vec3(16., 13., -3.);
		l.p.xz*=rot;
        
        l.c = vec3(.8, .8, .75);
		l.d	= normalize(l.p-r.p);
        
        e.l = harmonic(vec4(n, 1.))+e.f;
        r.c = e.f+e.l*.005;
        
        mat m;
        if(material == 0)
        {
            vec3 c0 = vec3(.85, .5, .4);
            vec3 c1 = vec3(.45, .5, .1);
            float b = clamp(.25+r.p.y*.125, 0., 1.);
            m.dc = mix(c0, c1, b);
            m.sc = vec3(.75);
            m.r = .65;
            m.i = 12.32;

        }
        else if(material == 1)
        {
            vec3 c0 = vec3(.4, .76, .51);
            vec3 c1 = vec3(.6, .8, .3);
            float b = clamp(1.-length(r.p)*.25, 0., 1.);
            m.dc = mix(c0, c1, b);
            m.sc = vec3(.75, .75, .85);
            m.r = .9132;
            m.i = 8.32;
        }
        else if(material == 2)
        {
            vec3 c0 = vec3(.24, .6, .2);
            vec3 c1 = vec3(.6, .8, .3);
            float b = clamp(1.-length(r.p)*.25, 0., 1.);
            m.dc = mix(c0, c1, b);
            m.sc = vec3(.75, .75, .85);
            m.r = .7132;
            m.i = 15.32;
        }
		
        r.c = shade(r, l, m, e, n);
        r.c += e.f * .95 * r.c;
	}else
    {
		r.p.xz *= rot;
        e.l = harmonic(vec4(normalize(r.p), 1.));
        r.c += e.l;
    }
	
	gl_FragColor = vec4(r.c, 1.);
}

float sphere(vec3 rp, vec3 sp, float r){
	return length(rp - sp)-r;		
}

float capsule( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	
	return length( pa - ba*h ) - r;
}

vec3 foldY(vec3 P, float n)
{
	float r = length(P.xz);
	float a = atan(P.z, P.x);
	float c = 3.14159265358979 / n;

	a = mod(a, 2.0 * c) - c; 

	P.x = r * cos(a);
	P.z = r * sin(a);

	return P;
}

// Optimized case for 4 repetitions
vec3 foldY4(vec3 p)
{
	p.xz = vec2(p.x + p.z, p.z - p.x) * sin45deg;
	p.xz = abs(p.x) > abs(p.z) ? p.xz * sign(p.x) : vec2(p.z,-p.x) * sign(p.z);
	return p;
}

vec3 rotateZ(vec3 p, float a)
{
	float c = cos(a);
	float s = sin(a);

	return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

float tree(float a, float p, vec2 uv){
    float t;
	t = fract(uv.y*p) + .5;
	t *= a;
    return t;
}  

float cylinder(vec3 p, vec3 c, float h, float r)
{
    p -= c;

	return max(abs(p.y) - 0.5 * h, length(p.xz) - r);
}

float map(vec3 p)
{
     
    vec3  o = p; //origin
    vec3 np = p;
    
    #ifdef modulus
        o.xz    = mod(o.xz, 7.)-3.5;
    #endif
    np = vec3(p.x-p.z-.4, p.y, p.z-p.x+.015);
    float lp = length(16.*(p+p.x+p.z)-vec3(0., 13., 0.));
    
    vec4 n = noise(vec4(64512. + 16.*np, lp))*(1.+length(p)*.2);
  
    #ifdef denoise
        n = vec4(.5);
    #endif
    
    o +=  .05 * n.xyz * (2. - max(1., 5.-p.y));

//  vec2 m = mouse;
    vec2 m = vec2(.95, .65);
    
    float r = m.y;                                 //rotation
//  float r = sin45deg;
    
    float w = m.x*.2/length(o+vec3(0., .3+r, 0.)); //branch width

    float f = 1.;
    float a = (cos(2.*time+p.z+p.y-sin(p.x+time*.15)*.13*n.x)-.5)*.0051;
    float t = 999.;                                //tree
    for (int i = 0; i < 7; i++)
	{
        t = min(t, cylinder(o, vec3(0.0), r+1., w)/f);
		o = 1.5 * o + a;                            //length change across iterations
		f = 1.4 * f;                                //thickness change across iterations
		o = foldY4(o);                              //branching
        //o = foldY(o, abs(r/2.));
		o = rotateZ(o,r+a*.25);

		o.x -= -r;                                  //rotate
		o.y -= .5+r;                                //translate and rotate
    }
    
    t += .005;                                      //additioal thickness adjustment
	
    float l = length(o*vec3(4., 1., 9.)+a);           //leaves
	l *= .00785;
    
    material = t < l ? 0 : 1;
    
    t = min(t, l);
    float g = p.y+(n.w+n.z)*.05;
    p.xz = mod(o.xz*.025-p.xz+a*2.+p.y*.05, .05)-.025;
    g = min(g, cylinder(p, vec3(0.0), n.x*.325+n.w, .01-.01*n.x));
   
    t = min(t, g);
    /*
    c.x = fract(pow(b, floor(p.y*i))*p.x);
	c.y = mod(floor(pow(b, floor(p.y*i))*p.x),2.);
    c.x = c.y == 1. ? 1. - c.x : c.x;
    
	float ts = c.x * .5;    
    t0 = tree(c.x, .5, cp.xy);
    
    c.x = fract(pow(b, floor(p.y*i))*p.z);
	c.y = mod(floor(pow(b, floor(p.y*i))*p.z),2.);
    c.x = c.y == 1. ? 1. - c.x : c.x;
    */
    
    material = t < g ? material : 2;
   
    return min(t,g);
}

ray trace(ray r){
	float precis = phi;
    float h		 = precis*.2;
    float t		 = .01;
	float res	 = 32.;
	bool hit	 = false;
    float f      = .0;
	
    for( int i = 0; i < 128; i++ )
    {
      	if (!hit && t < farplane)
		{
            r.p = r.o + r.d * t;
			h = map(r.p);
			if (h < precis)
			{
				res = t;
				hit = true;
			}
			t += h * .8;
			precis *= 1.03;
            f += .01/abs(t-h); 
		}
    }
    r.c += f;
    r.l = res;
    return r;
}

vec3 derivate(vec3 p){
	vec3 n;
	vec2 d = vec2(0., .01);
	n.x = map(p+d.yxx)-map(p-d.yxx);
	n.y = map(p+d.xyx)-map(p-d.xyx);
	n.z = map(p+d.xxy)-map(p-d.xxy);
//    return n/.03;
    return normalize(n);
}

float smoothmin(float a, float b, float k)
{
	return -(log(exp(k*-a)+exp(k*-b))/k);
}

vec3 shade(ray r, light l, mat m, env e, vec3 n){
	float ll    = distance(r.p, l.p);

	m.r 		= clamp(m.r, 0.02,  1.);
	m.i 		= clamp(m.i, 1., 20.);    				
	
	vec3 v    =  normalize(r.o-r.p);
	vec3 h	  =  normalize(v + l.d); 

	float ndl = dot(n, l.d);
	float ndv = dot(n, v);

	float hdn = dot(h, n);
	float hdv = dot(h, v);
	float hdl = dot(h, l.d);

	float fr = fresnel(m.i, ndl);
	float g  = geometry(m.r, ndl, ndv, hdn, hdv, hdl);
	float ds = distribution(m.r, hdn);
	float nf = 1.-fr;

	ndl = max(ndl, 0.0);
	ndv = max(ndv, 0.0);
	float brdf =  fr * g * ds / (4. * ndl * ndv);

	float ss  	= shadow(r.p, l.d, ndl);
	float oc  	= occlusion(r.p, n);

	vec3 c; 
	c  = m.dc * e.l + ndl * nf * m.dc * l.c * oc;
	c += brdf * m.sc;
	c *= ss * l.c * oc;

	return c;
}

float fresnel(float i, float ndv)
{   
	i = (1.33 - i)/(1.33 + i);
	i *= i;
	return i + (1.-i) * pow(1.-max(ndv, 0.), 5.);
}

float geometry(float r, float ndl, float ndv, float hdn, float hdv, float hdl)
{
	//cook torrence
	//return min(min(2. * hdn * max(ndv, 0.) / hdv, 2. * hdn * max(ndl, 0.) / hdv), 1.);

	//schlick
	ndl = max(ndl, 0.);
	ndv = max(ndv, 0.);
	float k= r * sqrt(2./pi);
	float one_minus_k= 1. -k;
	return ( ndl / (ndl * one_minus_k + k) ) * ( ndv / (ndv * one_minus_k + k) );

	//walter
	//	float a= 1.0/ ( r * tan( acos(max(ndv, 0.0)) ) );
	//	float a_Sq= a * a;
	//	float a_term;
	//	if (a<1.6)
	//		a_term = (3.535 * a + 2.181 * a_Sq)/(1.0 + 2.276 * a + 2.577 * a_Sq);
	//	else
	//		a_term = 1.0;
	//		return  ( step(0.0, hdl/ndl) * a_term  ) * ( step(0.0, hdv/ndv) * a_term  ) ;

}

float distribution(float r, float ndh)
{  
	//blinn phong
	//	float m= 2./(r*r) - 2.;
	//	return (m+2.) * pow(max(ndh, 0.0), m) / tau;

	//beckman
    float m_Sq= r * r;
	float NdotH_Sq= max(ndh, 0.0);
	NdotH_Sq= NdotH_Sq * NdotH_Sq;
	return exp( (NdotH_Sq - 1.0)/(m_Sq*NdotH_Sq) )/ (3.14159265 * m_Sq * NdotH_Sq * NdotH_Sq);
}

vec3 harmonic(in vec4 n){ 	
  
	vec3 l1, l2, l3;
    
    vec4 c[7];
	c[0] = vec4(0.2, .47, .2, 0.25);
	c[1] = vec4(0.2, .33, .2, 0.25);
	c[2] = vec4(0.0,-.13, -.1,0.15);
	c[3] = vec4(0.1, -.1, 0.1, 0.0);
	c[4] = vec4(0.1,-0.1, 0.1, 0.0);
	c[5] = vec4(0.2, 0.2, 0.2, 0.0);
	c[6] = vec4(0.0, 0.0, 0.0, 0.0);
    
	l1.r = dot(c[0], n);
	l1.g = dot(c[1], n);
	l1.b = dot(c[2], n);
	
	vec4 m2 = n.xyzz * n.yzzx;
	l2.r = dot(c[3], m2);
	l2.g = dot(c[4], m2);
	l2.b = dot(c[5], m2);
	
	float m3 = n.x*n.x - n.y*n.y;
	l3 = c[6].xyz * m3;
    	
	vec3 sh = vec3(l1 + l2 + l3);
	
	return clamp(sh, 0., 1.);
}

#define odist 	.5		 //occlusion distrobution
#define obias 	.05		 //occlusion step bias
#define omin 	.2		 //occlusion minium 
#define oiter    5	

float occlusion(vec3 p, vec3 n)
{
    float d = odist;
	float oc = 0.0;
    for( int i=0; i<oiter; i++ )
    {
        float hr  = .01 + obias*float(i);
        vec3  op  = n * hr + p;
        float l   = map(op);
        oc 		 += -(l-hr)*d;
        d	   	 *= 0.75;
    }
    return clamp( 1. - 4.*oc, omin, 1. );
}

#define sblend	 5.	//penumbra blend
#define sproj	.25   //projecton factor
#define smax	.8     //shadow max
#define smin	.25   //shadow min
#define siter    16

float shadow(vec3 p, vec3 d, float ndl)
{
	float t = .15;
	float k = 32.;
	float s = .5+ndl;
    for( int i=0; i < siter; i++ )
    {
    	float u = map(p + d * t);
    	s = smoothmin(s, k * u / t, sblend);
        k -= .5;
        t += max(0.1, sproj);
    }
	return clamp(s,smin,1.0);
}



vec4 noise(in vec4 f)
{
    vec4 r = vec4(.0);
    vec4 s = vec4(1.);
    float a = 1.;
    
    const vec4 b = vec4(24.574, 18.343, 30.153, 40.121);
    const vec4 c = vec4(2.251, 3.124, 5.123, 4.241);
    
    const int it = 6;
    
    for ( int i = 0; i < it; i++ )
    {
        f += float(i);
        vec4 sa = (sin(f * b) + 1.0);
        vec4 sb = (sin(f * c) + 1.0);
        
        // Add up 'octaves'.
        r += sa * a;
        a *= 3.;
        
        // A variation of using dot(f, axis[i]), and variation of frequency (sort of like an octave), and addtional perturbation.
        f = (f.yxwz * 0.5) + (sb * 0.08);
	}

    // 'Normalize'.
    return r/1000.;
}
