#ifdef GL_ES
precision highp float;
#endif

//wip

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D renderbuffer;

#define PHI                  	.0005
#define EPSILON                 .00025

#define FOV                     1.5
#define FARPLANE                1.
#define ITERATIONS              256

#define PI                  	(4.*atan(1.))
#define TAU                 	(8.*atan(1.))

#define POSITION		vec3(0.,0.035,0.)
#define DIRECTION		normalize(vec3(vec2(cos(mouse.x*TAU), sin(mouse.x*TAU)), mouse.y - .75).xzy)
struct ray
{
    vec3 origin;
    vec3 position;
    vec3 direction;
    vec3 normal;
    float epsilon;
    float range;
    float steps;
};

struct light
{
    vec3 position;
    vec3 direction;
    vec3 color;
};

struct material
{
    vec3 color;
    float roughness;
    float refractive_index;
};

vec2	format(vec2 uv);

ray     view(in vec2 uv);
ray     emit(ray r);
float	map(in vec3 position);
vec3	derive( const in vec3 position , const in float epsilon);
vec3	shade(in ray r, in light l, in material m);

float 	distribution(in float r, in float ndh);
float 	geometry(in float i, in float ndl, in float ndv);
float 	fresnel(in float i, in float hdl);

float	shadow(in ray r, in light l);
float 	occlusion(vec3 p, vec3 n);

vec3	sphericalharmonic(vec3 n, in vec4 c[7]);
void	shcday(out vec4 c[7]);

vec3	flare(in ray r, in light l);

vec3	hsv(in float h, in float s, in float v);

float	hash(float x);
vec3	hash(vec3 v);

mat2	rmat(in float r);

vec3 g_position = vec3(0.);

//prevent angles from hitting zero
float bound(float angle)
{
    return max(angle, .00392156);
}

float witch(float x)
{
    return 1./(x*x+1.);
}

float witch(float x, float a)
{
    float w = (8.*pow(a, 3.))/(x*x+4.*a*a);
    return w;
}

//smoothly blend to min yalxe
float smoothmin(float x, float y, float w)
{
    return -(log(exp(w*-x)+exp(w*-y))/w);
}

float fold(in float x)
{
    return bound(abs(fract(x)-.5));
}

vec3 fold(in vec3 p)
{
    return vec3(fold(p.x), fold(p.y), fold(p.z));
}

float smooth(float x)
{
    return x*x*(3.-2.*x);
}


float value_noise(vec2 uv)
{
    const float k 	= 257.;
    vec4 l  		= vec4(floor(uv),fract(uv));
    float u 		= l.x + l.y * k;
    vec4 v  		= vec4(u, u+1.,u+k, u+k+1.);
    v       		= fract(fract(v*1.23456789)*9.18273645*v);
    l.zw    		= l.zw*l.zw*(3.-2.*l.zw);
    l.x     		= mix(v.x, v.y, l.z);
    l.y     		= mix(v.z, v.w, l.z);
    return mix(l.x, l.y, l.w);
}


float tf(in vec3 p, in float f, in float a)
{
    float n = value_noise(fract(p.xz*4.));
 
    float q = 4.5;


    for(int i = 0; i < 6; i++)
    {
        vec3 tp     = p * f;
        tp          += fold(tp.zzy*2.+fold(tp.yxx*-2.));
        float fl    = fold(tp.z+fold(tp.x+fold(tp.y)))/.175-.05;
        n           = abs(a-n-fl*a);
        a           *= .275;
        f           *= q;
        q           -= .125;
    }
    
    return n;
}


vec4 g_terrain  = vec4(0.);
//bool rock      = false;
bool water      = false;
bool error      = false;
float map(vec3 position)
{
    float result = FARPLANE;
    
    float noise	= value_noise(position.xz);
    
    float terrain_1 = tf(noise*.125+vec3(position.zy, position.x)*.125-.8, .05, 32.);
    float terrain_0 = tf(vec3(position.xy, position.z)*0.05+terrain_1*.00125, 1.25, 32.+terrain_1*.35);
    
    float terrain   = terrain_0 + terrain_0 + terrain_1 * .0125 ;
    result  = position.y - terrain * .00175 + .25;
    
    //global terrain for color etc
    g_terrain.x = terrain_1;
    g_terrain.y = terrain_0;

    g_terrain.w = terrain;
    
    //water
    float wt = position.y + sin(position.x+position.z)*.0125;
    wt = wt < position.y + .075 ? wt : position.y - .025;
    water = result < wt;

    result  = min(result, mix(result, wt, .95));
    
    return result;
}


void main( void )
{
    vec2 uv         	= gl_FragCoord.xy/resolution.xy;
    
    //ray
    ray r           	= view(uv);
    r               	= emit(r);
    r.epsilon           = r.range *  EPSILON - length(uv-.5) * r.range * EPSILON;
    r.normal            = derive(r.position, r.epsilon);
    
    
    //create a light
    light l;
    l.position          = r.position-vec3(2., 4., 1.);
    //l.position.xy		*= rmat(time*.5);
    
    l.position.y	= abs(l.position.y);
    l.direction 	= normalize(l.position-r.position);
    l.color             = vec3(1., .95, .8) * 4.;
    
    
    //set materials
    material m;
    
    m.color             = hsv(g_terrain.w/g_terrain.z+g_position.y*8., .5, g_terrain.z*.0026);
    m.color             += hsv(g_position.y*.005-.9, .5, 1.);
    m.color             = pow(m.color,vec3(2.))+.25;
    m.color             = water ? m.color : (1.2-m.color*.1) + vec3(.125, .25, .125) * .65;

    m.roughness         = water ? .45 :  .25;
    m.refractive_index	= water ? .2 :  .9;
    
    vec4 result     	= vec4(0.);
    result.xyz          = shade(r, l, m);
//    result.xyz          += flare(r, l)*2.;
    result.w            = 1.;
    
    //vec4 buffer		= texture2D(renderbuffer, uv);
    
    gl_FragColor = result;
}// sphinx

vec3 shade(in ray r, in light l, in material m)
{
    //http://simonstechblog.blogspot.com/2011/12/microfacet-brdf.html
    //view and light vectors
    vec3 half_direction 		= normalize(r.position-l.position);         //direction halfway between view and light
    
    //exposure coefficients
    float light_exposure    	= max(dot(r.normal, l.direction), 0.);      //ndl
    float view_exposure     	= max(dot(r.normal, -r.direction), 0.);              //ndv
    float half_normal   		= dot(half_direction, r.normal);            //hdv
    
    //fog
    float distance_fog   		= clamp(r.range/FARPLANE, 0., 1.);
    float step_fog       		= clamp(r.steps/float(ITERATIONS), 0., 1.);
    
    //shadow and occlusion projections
    float shadows       		= shadow(r, l);
    float occlusions            	= occlusion(r.position, r.normal);
    
    //microfacet lighting components
    float d             		= distribution(m.roughness, half_normal);
    float g             		= geometry(m.roughness, light_exposure, view_exposure);
    float f             		= fresnel(m.refractive_index, light_exposure);
    float n             		= clamp(1. - fresnel(f, light_exposure), 0., 1.) * m.roughness;
    
    //bidrectional reflective distribution function
    float brdf              	= (g*d*f)/(view_exposure*light_exposure*4.);
    
    vec4 c[7];
    shcday(c);
    
  
    
    //ambient light
    vec3 ambient	    = sphericalharmonic(normalize(r.normal + (occlusions * .0125 - .0625)), c);
    ambient                 = clamp(mix(m.color*ambient, ambient, distance_fog), 0., 1.);
    
    vec3 diffuse	    = m.color * l.color * light_exposure * n;
    vec3 specular	    = mix(m.color, ambient, .25) * brdf;
    
    //compositing
    vec3 color              = vec3(.125 + light_exposure) * (1.-distance_fog) * diffuse + specular;// + ambient * occlusions;
    color                   *= min(.125, occlusions * shadows) + ambient * .25;
    color                   += (distance_fog) * step_fog + step_fog;
    color                   = error ? vec3(1., 0., 0.) : color;
	
    if(r.range == FARPLANE)
    {
        vec3 ambient		= 32. * sphericalharmonic(value_noise(r.position.xz*.5+r.position.y*1.)*r.position, c);
        vec3 color              = vec3(1.-distance_fog) * ambient * .9 + m.color * step_fog * shadows * occlusions + step_fog * m.color + step_fog;
        
        return color * 4.;
    }
    return color;
}//sphinx


float fresnel(in float i, in float ndl)
{
    return i + (1.-i) * pow(1.-ndl, 5.0);
}

float geometry(in float i, in float ndl, in float ndv)
{
    ndl             = max(ndl, 0.);
    ndv             = max(ndv, 0.);
    float k         = i * sqrt(2./PI);
    float ik        = 1. - k;
    return (ndl / (ndl * ik + k)) * ( ndv / (ndv * ik + k) );
}

float distribution(in float r, in float ndh)
{
    float m     = 2./(r*r) - 1.;
    return (m+r)*pow(ndh, m)*.5;
}

float shadow(in ray r, in light l)
{
    float mint	= .00125;
    float maxt	= 16.;
    float k 	= 4.;
    float sh	= 1.;
    float t		= mint;
    float h		= 0.;
    float m		= 0.;
    for (int i = 0; i < 16; i++)
    {
        if (t > maxt) break;
        h = map(r.position+l.direction*t);
        sh = min(sh, mint+k*h/t);
        t += h;
    }
    return clamp(sh, 0., 1.);
}

float occlusion( in vec3 p, in vec3 n )
{
    float occ = 0.0;
    float sca = .25;
    for ( int i=0; i < 8; i++ )
    {
        float hr = sca * float(i)/4.0;
        float dd = map(n * hr + p);
        occ += -(dd-hr)*sca;
        sca *= 0.99;
    }
    return clamp( 1.0 - 3.0 * occ, 0.0, 1.0 );
}

vec3 hsv(in float h, in float s, in float v){
    return mix(vec3(1.),clamp((abs(fract(h+vec3(3.,2.,1.)/3.)*6.-3.)-1.),0.,1.),s)*v;
}

vec3 sphericalharmonic(vec3 n, in vec4 c[7])
{
    vec4 p = vec4(n, 1.);
    
    vec3 l1 = vec3(0.);
    l1.r = dot(c[0], p);
    l1.g = dot(c[1], p);
    l1.b = dot(c[2], p);
    
    vec4 m2 = p.xyzz * p.yzzx;
    vec3 l2 = vec3(0.);
    l2.r = dot(c[3], m2);
    l2.g = dot(c[4], m2);
    l2.b = dot(c[5], m2);
    
    float m3 = p.x*p.x - p.y*p.y;
    vec3 l3 = vec3(0.);
    l3 = c[6].xyz * m3;
    
    vec3 sh = vec3(l1 + l2 + l3);
    
    return clamp(sh, 0., 1.);
}

void shcday(out vec4 c[7])
{
    c[0] = vec4(0.0, 0.5, 0.0, 0.4);
    c[1] = vec4(0.0, 0.3, .05, .45);
    c[2] = vec4(0.0, 0.3, -.3, .85);
    c[3] = vec4(0.0, 0.2, 0.1, 0.0);
    c[4] = vec4(0.0, 0.2, 0.1, 0.0);
    c[5] = vec4(0.1, 0.1, 0.1, 0.0);
    c[6] = vec4(0.0, 0.0, 0.0, 0.0);
}

vec3 flare(in ray r, in light l)
{
    if(distance(r.origin, r.position)<distance(r.origin, l.position)-r.range*.125) return vec3(0.);
    vec3 position 	= r.origin + r.direction * clamp(dot(l.position - r.origin, r.direction), 0., 32.);//r.epsilon*FARPLANE);
    float range 	= length(position - l.position);
    return clamp(l.color * 0.0125/ (range * range), .0, 1.);
}

vec3 derive(const in vec3 position, const in float epsilon)
{
    vec2 offset = vec2(epsilon, -epsilon);
    vec4 simplex = vec4(0.);
    simplex.x = map(position + offset.xyy);
    simplex.y = map(position + offset.yyx);
    simplex.z = map(position + offset.yxy );
    simplex.w = map(position + offset.xxx);
    
    vec3 normal = offset.xyy * simplex.x + offset.yyx * simplex.y + offset.yxy * simplex.z + offset.xxx * simplex.w;
    return normalize(normal);
}

vec2 format(vec2 uv)
{
    uv = uv * 2. - 1.;
    uv.x *= resolution.x/resolution.y;
    return uv;
}

ray view(in vec2 uv)
{
    uv              = format(uv);
    
    vec3 w          = normalize(DIRECTION);
    vec3 u          = normalize(cross(w,vec3(0.,1.,0.)));
    vec3 v          = normalize(cross(u,w));
    
    ray r           = ray(vec3(0.), vec3(0.), vec3(0.), vec3(0.), 0., 0., 0.);
    r.origin        = POSITION;
    r.origin.xz      += time*.00001;

    float dist      = map(r.origin);
    r.origin.y	    = dist < 0. ? r.origin.y + abs(dist) : r.origin.y;
    
	
     g_position     = r.origin;	
	
    r.position      = r.origin;
    r.direction     = normalize(uv.x*u + uv.y*v + FOV*w);;
    r.range         = PHI;
    r.steps         = 0.;
    
    return r;
}

ray emit(ray r)
{
    float total_range   = 0.;
    float threshold     = PHI;
    float dither        = hash(r.position.y+r.direction.x+r.direction.y)*.125+.25;
    float function_sign = 1.;
    if(map(r.origin) < 0.0) function_sign = -1.0;
    for(int i = 0; i < ITERATIONS; i++)
    {
        r.steps += dither;
        if(total_range < FARPLANE)
        {
            if(abs(r.range) < threshold)
            {
                break;
            }
            
            threshold	*= 1.02;
            
            r.position	+= r.direction * r.range * .75;
            
            r.range		= map(r.position) * function_sign;
            
            if(r.range < 0.)
            {
                r.range -= threshold * 4.;
                threshold *= float(i);
//                error = true;
                break;
            }
            
            total_range += r.range;
        }
        else
        {
            break;
        }
    }
    
    if(r.range < threshold)
    {
        r.range = total_range;
    }
    else
    {
        r.range     = FARPLANE;
        r.position  = r.direction * FARPLANE;
    }
    
    return r;
}

//simple hash function - high bitwise entropy in the uv domain
float hash(float v)
{
    return fract(fract(v*9876.5432)*(v+v)*12345.678);
}

vec3 hash(vec3 v)	
{
    return vec3(hash(v.x), hash(v.y), hash(v.z));
}

mat2 rmat(in float r)
{
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}
