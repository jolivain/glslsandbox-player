/*
 * Original shader from: https://www.shadertoy.com/view/XtlGDH
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
const vec3  iMouse = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
/*	kalizyl 
	
	(c) 2015, stefan berke (aGPL3)

	Another attempt on the kali set
	http://www.fractalforums.com/new-theories-and-research/very-simple-formula-for-fractal-patterns/

	Looks cool and frametime is not too bad -
	but still uses precission 0.1 for raymarching. (but see EIFFIE_MOD)
	Maybe saves some speed by not coloring the surface.
	
*/

// plot a 2d slice of the distance function
#define PLOT_2D			0
// enable eiffie's modification (https://www.shadertoy.com/view/XtlGRj)
#define EIFFIE_MOD		0


#define KALI_PARAM 		vec3(0.71)
#define LIGHT_COL 		vec3(1.0, 0.8, 0.4)

#if EIFFIE_MOD == 0
    #define FOG_DIST 		5.
    #define FOG_COL 		vec3(0.5, 0.7, 1.0)
    #define CYL_RADIUS 		0.07
    #define NUM_TRACE 		80
    #define MARCH_PRECISION	0.1
#else
    #define FOG_DIST 		2.
    #define FOG_COL 		(vec3(0.5, 0.7, 1.0)/3.)
    #define CYL_RADIUS 		0.009
    #define NUM_TRACE 		40
    #define MARCH_PRECISION	0.9
#endif

#if EIFFIE_MOD == 0
// standard kali set 
// modified to return distance to cylinders and spheres in 'kali-space'
vec2 scene_dist(in vec3 p)
{
	vec2 d = vec2(100.);
	for (int i=0; i<4; ++i)
	{
		p = abs(p) / dot(p, p) - KALI_PARAM;
        // distance to cylinder
		d.x = min(d.x, length(p.xz));	
        if (i < 3)
        {
            vec3 lightpos = vec3(0., 1.+sin(iTime+p.y+float(i)*1.3), 0.);
            // distance to sphere
        	d.y = min(d.y, length(p - lightpos));	
        }
	}
	return d - CYL_RADIUS;
}

#else

// eiffie's mod
vec2 scene_dist(in vec3 pos)
{
    // p.w will track how much we have stretched space
    vec4 p = vec4(pos, 1.);
	vec2 d = vec2(100.);
	for (int i=0; i<4; ++i)
	{
		p = abs(p) / dot(p.xyz, p.xyz) - vec4(KALI_PARAM, 0.);
		d.x = min(d.x, length(p.xz)/p.w); //now we are calcing unstretched distance
        if (i < 3)
        {
            vec3 lightpos = vec3(0., 1.+sin(iTime+p.y+float(i)*1.3), 0.);
            d.y = min(d.y, length(p.xyz - lightpos)/p.w);
        }
	}
	return d - CYL_RADIUS;
}

#endif

vec3 traceRay(in vec3 pos, in vec3 dir)
{
	vec3 p = pos;

	float t = 0., mlightd = 100.;
    
    vec2 d = scene_dist(pos);

	for (int i=0; i<NUM_TRACE; ++i)
	{	
		if (d.x < 0.001 || t >= FOG_DIST) 
			continue;

		p = pos + t * dir;
		vec2 d = scene_dist(p);

        // collect minimum distance to light
		mlightd = min(mlightd, d.y);

		t += d.x * MARCH_PRECISION;		
	}

    // only fog contribution
	vec3 col = FOG_COL * min(1., t/FOG_DIST);

    // plus light glow
    col += LIGHT_COL / (1. + 50.*max(0., mlightd));

	return col;
}

vec3 plot2d(in vec3 pos)
{
	vec2 d = scene_dist(pos);
    // inside?
    float ins = smoothstep(0.01,-0.01, d.x);
    vec3 col = vec3(d.x, ins, 0.);
    
    return col;
}

// camera path
vec3 path(float ti)
{
	float a = ti * 3.14159265 * 2.;

	return vec3(
				1.1 * sin(a),
				0.52 * sin(a*2.),
				1.1 * cos(a) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy * 2. - 1.;
	uv.x *= iResolution.x / iResolution.y;
	
    vec3 pos, dir;
    mat3 dirm = mat3(vec3(1.,0.,0.), vec3(0.,1.,0.), vec3(0.,0.,1.));
    
    if (iMouse.z < 0.5)
    {
        // camera time
        float ti = iTime / 19.;

        pos = path(ti);

        // camera orientation matrix
        vec3 look;

        // how much to look towards the center [0,1]
        float lookcenter = 0.45 + 0.45 * sin(ti*7.);
    	look = normalize(path(ti + 0.1) - pos);
		look = look + lookcenter * (normalize(-pos) - look);
        vec3 up = normalize(cross(vec3(0., 1., 0.), look));
        vec3 right = normalize(cross(look, up));
        //look = normalize(cross(up, right));
        dirm = mat3(right, up, look);

        dir = dirm * normalize(vec3(uv, 1.5));
    }
    else
    {
        vec2 m = iMouse.xy / iResolution.xy;
        pos = vec3(m.x*2.-1., 0., 3. * m.y);
        dir = normalize(vec3(uv, -1.));
    }
#if PLOT_2D == 0
	fragColor = vec4( traceRay(pos, dir), 1.);	
#else
    fragColor = vec4( plot2d(pos + dirm * vec3(uv,0.)), 1.);	
#endif
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
