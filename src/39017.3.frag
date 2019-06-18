#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

/*
* License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
* Created by bal-khan
*/
// Converted by Batblaster

float 	t = 0.;
float	a = 0.; // angle used both for camera path and distance estimator

#define I_MAX		100
#define E			0.001

#define	CAM_PATH 0			// only interesting for the default shape
							// take 0 or 1

//#define	PULSE			// uncomment this line to get it pulsing

//#define	OUTSIDE			// let you see the outside of the shape
//#define	COUNTOURED		// see another rendering mode
//#define	CENTERED		// set the view in the middle
//#define	ALTERNATE_DE	// another shape
// #define	NO_MOUSTACHE	// only work with ALTERNATE_DE ENABLED
//#define	EXPERIMENTAL	// only work if ALTERNATE_DE is DISABLED
							// EXPERIMENTAL is beautiful with COUNTOURED enabled
#define	VIGNETTE_RENDER	// vignetting
#define		FWD_SPEED	-5.	// the speed at wich the tunnel travel

vec4	march(vec3 pos, vec3 dir);
vec3	camera(vec2 uv);
vec2	rot(vec2 p, vec2 ang);
void	rotate(inout vec2 v, float angle);

// blackbody by aiekick : https://www.shadertoy.com/view/lttXDn

// -------------blackbody----------------- //

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

// -------------blackbody----------------- //

void mainImage(out vec4 c_out, in vec2 f)
{
    t  = time;
    vec3	col = vec3(0., 0., 0.);
	vec2 R = resolution.xy,
          uv  = vec2(f-R/2.) / R.y;
	vec3	dir = camera(uv);
    vec3	pos = vec3(.0, .0, 20.0);

    #ifndef OUTSIDE
    pos.z = t*FWD_SPEED;
	#endif
    
    vec4	inter = (march(pos, dir));

    #ifndef COUNTOURED
    col.xyz = blackbody(inter.x*300./inter.w);
    #else
   	float countour = 5.*-inter.x;
    col.xyz = blackbody( inter.w*100. + countour);
	#endif
    #ifdef	VIGNETTE_RENDER
    col.xyz = blackbody( ( (1.1-length(uv)*1.1)*inter.x) *70. );
    #endif
    c_out =  vec4(col,1.0);
}    

float	de_0(vec3 p)
{
	float	mind = 1e5;
	vec3	pr = p *.35;

	rotate(pr.xy, (a) );

	pr.xy *= 2.;
	pr.xyz = fract(pr.xyz);
	pr -= .5;
    #ifndef ALTERNATE_DE
    mind = length(pr.yz)-.3252;
    #ifdef	EXPERIMENTAL
    mind += (length(-abs(pr.zz)+abs(pr.xy)) - .2);
    #endif
    mind = min(mind, (length(pr.xyz)-.432 ) );
    mind = min(mind, (length(pr.xy)-.32 ) );
	#else
     #ifndef NO_MOUSTACHE
    	mind = length(pr.yz+abs(pr.xx)*.2 )-.25;
     #else
    	mind = length(pr.yz )-.25;
     #endif
    #endif
    
	return (mind);
}

float	de_1(vec3 p) // cylinder
{
	float	mind = 1e5;
	vec3	pr = p;	
	vec2	q;
    
	q = vec2(length(pr.yx) - 4., pr.z );
    #ifdef PULSE
    q.y = rot(q.xy, vec2(-1.+sin(t*10.), 0.)).x;
	#else
    q.y = rot(q.xy, vec2(-1., 0.)).x;
    #endif
	mind = length(q) - 4.5;

	return mind;
}

// add 2 distances to constraint the de_0 to a cylinder
float	de_2(vec3 p)
{
    #ifndef OUTSIDE
    return (de_0(p)-de_1(p)/8.);
    #else
    return (de_0(p)+de_1(p)/8.);
    #endif
}

float	scene(vec3 p)
{
    float	mind = 1e5;
    a = (t*1.5) + 1.5*cos( .8*(p.y*.015+p.x*.015+p.z *.15)  + t);
    #ifdef	CAM_PATH
    vec2	rot = vec2( cos(a+1.57), sin(a+1.57) );
    #else
    vec2	rot = vec2( cos(t*.5), sin(t*.5) );
    #endif
    #ifndef CENTERED
	 #ifdef	CAM_PATH
      #if CAM_PATH == 0
		p.x += rot.x*2.+sin(t*4.)/2.;
		p.y += rot.y*2.+cos(t*4.)/2.;
      #elif CAM_PATH == 1
    	p.x += rot.x*2.+sin(t*2.);
		p.y += rot.y*2.+cos(t*2.);
      #endif
     #else
    	p.x += rot.x*4.;
		p.y += rot.y*4.;
 	 #endif
    #endif
    #ifdef OUTSIDE
    vec2	rot1 = vec2( .54, .84 );				// cos(1.), sin(1.)
    p.xz *= mat2(rot1.x, rot1.y, -rot1.y, rot1.x);
	#endif
	mind = de_2(p);
	
    return(mind);
}


vec4	march(vec3 pos, vec3 dir)
{
    vec2	dist = vec2(0.0, 0.0);
    vec3	p = vec3(0.0, 0.0, 0.0);
    vec4	s = vec4(0.0, 0.0, 0.0, 0.0);

    for (int i = -1; i < I_MAX; ++i)
    {
    	p = pos + dir * dist.y;
        dist.x = scene(p);
        dist.y += dist.x;
        if (dist.x < E || dist.y > 30.)
        {
            s.y = 1.;
            break;
        }
        s.x++;
    }
    s.w = dist.y;
    return (s);
}


// Utilities

void rotate(inout vec2 v, float angle)
{
	v = vec2(cos(angle)*v.x+sin(angle)*v.y,-sin(angle)*v.x+cos(angle)*v.y);
}

vec2	rot(vec2 p, vec2 ang)
{
	float	c = cos(ang.x);
    float	s = sin(ang.y);
    mat2	m = mat2(c, -s, s, c);
    
    return (p * m);
}

vec3	camera(vec2 uv)
{
    float		fov = 1.;
	vec3		forw  = vec3(0.0, 0.0, -1.0);
	vec3    	right = vec3(1.0, 0.0, 0.0);
	vec3    	up    = vec3(0.0, 1.0, 0.0);

    return (normalize((uv.x) * right + (uv.y) * up + fov * forw));
}

void main( void ) {

	mainImage(gl_FragColor,gl_FragCoord.xy);
}
