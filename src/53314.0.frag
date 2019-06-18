/*
 * Original shader from: https://www.shadertoy.com/view/wdsSWs
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
/*
Log-polar tiled cubes. The log-polar mapping is applied to the xz coordinates of
the 3D SDF. The remaining dimension is shrunk by a factor of length(xz). In this
way, the mapping becomes uniform and the SDF distortion is greatly reduced.
*/

#define AA 2
#define HEIGHT 0.25
#define M_PI 3.1415926535897932384626433832795
#define LONGSTEP (M_PI*4.)

float gTime = 0.;

/* 
The tiling switches between 3 different densities at regular time points. These
switches are not instant, but propagate like a shockwave from the origin. So at
any given time during the transitions, there are two different densities, and a
boundary position between the two. These are stored in globals, set in main()
and consumed in the sdf: 
*/
float gABPos = 0.;
float gDensA = 0.;
float gDensB = 0.;

// Modified from http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdCube( vec3 p, float b )
{
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

// Axis rotation taken from tdhooper. R(p.xz, a) rotates "x towards z".
void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

// spiked surface distance (h >= 0)
// https://www.shadertoy.com/view/3ssSR7
float sdSpike2D(vec2 p, float h)
{
	float d = p.y - (h*0.1)/(abs(p.x)+0.1);
	d = min(d, length(p - vec2(0, min(h, p.y))));
	float d2 = abs(p.x) - ((h*0.1)-0.1*p.y)/p.y;
	if (p.y<h && d>0.0)
		d = min(d, d2);
	return d;
}

/*
Tile space in a spiked log-polar grid.

- in `pin`: point with length(pin.xz) precomputed in pin.w
- out `density`: density of tiling
- out `cubsz`: size of cube
- returns: tiled point coordinates
*/
vec3 tile(in vec4 pin, out float density, out float cubsz)
{
	float r = pin.w;
	// switch densities in shockwaves
	density = mix(gDensA, gDensB, smoothstep(0., 0.1, r-gABPos));
	// log-polar transformation in xz; spike and proportional shrink in y
	vec3 p = vec3(
		log(r), 
		(pin.y-HEIGHT*0.1/(r+0.1))/r, 
		atan(pin.z, pin.x)
	);
	// scaling in the log-polar domain creates density
	p *= density;
	// rho-translation causes zooming
	p.x -= gTime*2.0;
	// make it a spiral by rotating the tiled plane
	pR(p.xz, 0.6435); // atan(3/4)
	// convert to single-tile coordinates
	p.xz = mod(p.xz, 2.0) - 1.0;
	// scale and rotate the individual cubes
	// using an oscillation that spreads from the center over time
	float osc = sin(sqrt(r)-gTime*0.25-1.0);
	float cubrot = smoothstep(0.5, 0.8, osc);
	cubsz = sin(p.x*0.1)*0.29 + 0.5;
	cubsz = mix(cubsz, 0.96, smoothstep(0.7, 1.0, abs(osc)));
	pR(p.xy, cubrot);
	return p;
}

float sdf(in vec3 pin)
{
	// tile the coordinates and get cube distance
	float r = length(pin.xz);
	float cubsz, density; // out
	vec3 tiled = tile(vec4(pin, r), density, cubsz);
	float ret = sdCube(tiled, cubsz);
	// adjust the distance based on how much scaling occured
	ret *= r/density;

	// avoid overstepping:
	// add hidden surface to bring rays into the right tiles
	float pkofs = r * cubsz / density;
	float pk = sdSpike2D(vec2(r, pin.y), HEIGHT) - pkofs;
	if (pk < 0.002) pk = ret;
	ret = min(ret, pk);
	// shorten steps near the peak
	float shorten = length(pin - vec3(0., 0.25, 0.));
	shorten = 1. + 1.5*(1.-smoothstep(0., 0.22, shorten));
	ret /= shorten;

	return ret;
}

// Color the faces of cubes, reusing the tiling function.
vec3 colr(in vec3 pin)
{
	float a = 0.26;
	float b = 0.65;
	float z = 0.19;
	float cubsz, density; // out
	vec3 p = tile(vec4(pin, length(pin.xz)), density, cubsz);
	if (p.x > abs(p.y) && p.x > abs(p.z)) return vec3(z,a,b);
	if (p.x < -abs(p.y) && p.x < -abs(p.z)) return vec3(z,b,a)*0.7;
	if (p.z > abs(p.x) && p.z > abs(p.y)) return vec3(z,a,a);
	if (p.z < -abs(p.x) && p.z < -abs(p.y)) return vec3(b*0.5,z,a);
	return vec3(b,b,a);
}

// Adapted from http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal(in vec3 pos)
{
	vec2 e = vec2(1.0,-1.0)*0.5773;
	const float eps = 0.0005;
	return normalize(
		e.xyy*sdf(pos + e.xyy*eps) + 
		e.yyx*sdf(pos + e.yyx*eps) + 
		e.yxy*sdf(pos + e.yxy*eps) + 
		e.xxx*sdf(pos + e.xxx*eps)
	);
}

float time2density(float x)
{
	float fullMod = fract(x/(LONGSTEP*3.))*3.;
	if (fullMod > 2.) return 45.;
	else if (fullMod > 1.) return 25.;
	else return 15.;
}

// Based on http://iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

	// automate the shockwave transitions between densities
	gTime = iTime+1.8;
	float ltime = gTime + M_PI*6.3;
	gABPos = smoothstep(0.45, 0.6, fract(ltime/LONGSTEP))*2.2-0.2;
	gDensA = floor(time2density(ltime))/M_PI;
	gDensB = floor(time2density(ltime-LONGSTEP))/M_PI;

	 // camera movement	
	float camera_y = pow(sin(gTime*0.2), 3.)*0.2+0.7;
	vec3 ro = vec3(0., camera_y, 1.);
	vec3 ta = vec3(0.0, 0.0, 0.0);
	// camera matrix
	vec3 ww = normalize(ta - ro);
	vec3 uu = normalize(cross(ww,vec3(0.0,1.0,0.0)));
	vec3 vv = normalize(cross(uu,ww));

	vec3 tot = vec3(0.0);
	
	#if AA>1
	for(int m=0; m<AA; m++)
	for(int n=0; n<AA; n++)
	{
		// pixel coordinates
		vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
		vec2 p = (-iResolution.xy + 2.0*(fragCoord+o))/iResolution.y;
		#else    
		vec2 p = (-iRes.xy + 2.0*fragCoord)/iRes.y;
		#endif

		// create view ray
		vec3 rd = normalize(p.x*uu + p.y*vv + 3.5*ww); // fov

		// raymarch
		const float tmax = 3.0;
		float t = 0.0;
		for(int i=0; i<256; i++)
		{
			vec3 pos = ro + t*rd;
			float h = sdf(pos);
			if( h<0.0001 || t>tmax ) break;
			t += h;
		}
	
		// shading/lighting	
		vec3 bg = vec3(0.1, 0.15, 0.2)*0.3;
		vec3 col = bg;
		if(t<tmax)
		{
			vec3 pos = ro + t*rd;
			vec3 nor = calcNormal(pos);
			float dif = clamp( dot(nor,vec3(0.57703)), 0.0, 1.0 );
			float amb = 0.5 + 0.5*dot(nor,vec3(0.0,1.0,0.0));
			col = colr(pos)*amb + colr(pos)*dif;
		}
		// fog
		col = mix(col, bg, smoothstep(2., 3., t));

		// gamma        
		col = sqrt(col);
		tot += col;
	#if AA>1
	}
	tot /= float(AA*AA);
	#endif

    // Output to screen
    fragColor = vec4(tot,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
