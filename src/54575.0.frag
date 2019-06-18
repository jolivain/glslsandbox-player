/*
 * Original shader from: https://www.shadertoy.com/view/Ms2SzV
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
const vec4 parms = vec4( 0.0, -1.0, 0.0, 2.25 );
const vec4 parms2 = vec4( 1, 10, -0.05, 1.0 );
const vec4 parms3 = vec4( 0.075, 0.1, 1, 1 );

const vec4 camctr = vec4( 0, -10, 0, 1 );
const vec4 campos = vec4( 7, 8, 9, 1 );

const float PI = 3.14159265358979;

const float NEAR_CLIP = 2.8;
const float FAR_CLIP = 30.0;

#define NUM_ITERATIONS 128
const float NUM_ITERATIONS_F = float(NUM_ITERATIONS);
const float TERM_DIST = 0.5;
const float STEP_MULT = 0.25;

const float ASPECT  = 2.35;
const float ASPECT0 = 16.0/9.0;


//nvidia hsv
float min_channel(vec3 v)
{
	float t = (v.x<v.y) ? v.x : v.y;
	t = (t<v.z) ? t : v.z;
	return t;
}

float max_channel(vec3 v)
{
	float t = (v.x>v.y) ? v.x : v.y;
	t = (t>v.z) ? t : v.z;
	return t;
}
vec3 rgb_to_hsv(vec3 RGB)
{
	vec3 HSV = vec3(0,0,0);
	float minVal = min_channel(RGB);
	float maxVal = max_channel(RGB);
	float delta = maxVal - minVal; //Delta RGB value 
	HSV.z = maxVal;
	// If gray, leave H & S at zero
	if (delta != 0.0) { 
		HSV.y = delta / maxVal;
		vec3 delRGB;
		delRGB = ( ( vec3(maxVal) - RGB ) / 6.0 + ( delta / 2.0 ) ) / delta;
		if      ( RGB.x == maxVal ) HSV.x = delRGB.z - delRGB.y;
		else if ( RGB.y == maxVal ) HSV.x = 1.0/3.0 + delRGB.x - delRGB.z;
		else if ( RGB.z == maxVal ) HSV.x = 2.0/3.0 + delRGB.y - delRGB.x;
		if ( HSV.x < 0.0 ) { HSV.x += 1.0; }
		if ( HSV.x > 1.0 ) { HSV.x -= 1.0; }
	}
	return (HSV);
}
vec3 hsv_to_rgb(vec3 HSV)
{
	vec3 RGB = HSV.zzz;
	if ( HSV.y != 0.0 ) {
		float var_h = HSV.x * 6.0;
		float var_i = floor(var_h); // Or ... var_i = floor( var_h )
		float var_1 = HSV.z * (1.0 - HSV.y);
		float var_2 = HSV.z * (1.0 - HSV.y * (var_h-var_i));
		float var_3 = HSV.z * (1.0 - HSV.y * (1.0-(var_h-var_i)));
		if      (var_i == 0.0) { RGB = vec3(HSV.z, var_3, var_1); }
		else if (var_i == 1.0) { RGB = vec3(var_2, HSV.z, var_1); }
		else if (var_i == 2.0) { RGB = vec3(var_1, HSV.z, var_3); }
		else if (var_i == 3.0) { RGB = vec3(var_1, var_2, HSV.z); }
		else if (var_i == 4.0) { RGB = vec3(var_3, var_1, HSV.z); }
		else                 { RGB = vec3(HSV.z, var_1, var_2); }
	}
	return (RGB);
}


// ============================================================
// most primitive distance-functions honestly stolen from http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

float sat( float t )
{
	return clamp( t, 0.0, 1.0 );
}
vec3 sat( vec3 t )
{
	return clamp( t, 0.0, 1.0 );
}


// ====
vec4 select( vec4 a, vec4 b ) {
	return (a.x<b.x) ? a : b;
}

// ====
vec2 rot2d( vec2 p, float a )
{
	vec2 sc = vec2(sin(a),cos(a));
	vec2 ret;
	ret.x = dot( p, sc.yx*vec2(1,-1) );
	ret.y = dot( p, sc.xy );
	return ret;
}

// ====
//note: local sphere, radius r
float sdSphere( vec3 p, float r ) {
	return length( p ) - r;
}

// ====
float sdPlane( vec3 p, vec3 pointonplane, vec3 norm )
{
	return dot( norm, p-pointonplane);
}

//note: [-1;1[
//note: honestly stolen from iq: https://www.shadertoy.com/view/Xsl3Dl
vec3 shash3( vec3 p )
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}


float mytrunc( float x, float num_levels )
{
	return floor(x*num_levels) / num_levels;
}
vec3 mytrunc( vec3 x, vec3 num_levels )
{
	return floor(x*num_levels) / num_levels;
}


vec2 sdHalfCircle( vec3 p )
{
	vec3 ofs = shash3( mytrunc( p, vec3(13)));
    vec3 h2 = shash3( mytrunc( p, vec3(32) + ofs ) );
    vec3 h3 = shash3( mytrunc( p, vec3(16) ) );
	p += 0.02  * h2;
	p += 0.01  * h3;

	const float spherer = 1.0;
	float ds = sdSphere( p, spherer );
	ds = max( ds, -sdSphere( p, 0.9 * spherer ));
	ds = max( ds,  p.x-0.1);  //cut sides
	ds = max( ds, -p.x-0.1); // -
	
    vec2 ret;
    ret.x = ds + parms2.z + 0.001*(iMouse.z>0.5 ? iMouse.x : 0.0 );
    ret.y = min( max(h3.x, h2.x ), max( ofs.x, h2.y ) );
    ret.y = step( 0.75, ret.y );
	return ret;
}

vec2 sel_min( vec2 a, vec2 b )
{
    return a.x < b.x ? a : b;
}

vec4 cylinder_radialrepeat( vec3 p, float r )
{
	vec2 d = vec2( FAR_CLIP, 0 );

	p *= parms2.w;
	{
		vec3 dp = p; //vec3( dp2d.x, p.y, dp2d.y );

		dp.zx = rot2d( dp.xz, 0.3*iTime );
		vec2 ds = sdHalfCircle( dp );

		dp.xy = rot2d( dp.xy, -0.7 * iTime );
		ds = sel_min ( ds, sdHalfCircle( dp.xyz*1.3 ) );

		dp.xz = rot2d( dp.xz, 1.1*iTime );
		ds = sel_min ( ds, sdHalfCircle( dp.xyz*1.8 ) );

		dp.xz = rot2d( dp.xz, -1.3*iTime );
		ds = sel_min ( ds, sdHalfCircle( dp.xyz*2.8 ) );

		d = sel_min( d, ds );
	}

	return vec4( d, vec2(0,0) );
}

// ============================================================

void init1( out vec3 cam_eye, out vec3 cam_lookat, out vec3 cam_up ) {
	cam_eye    = vec3( 10, 10, 10 );
	cam_lookat = vec3( 0, 0, 0 );
	cam_up     = normalize( vec3( 0.2, 1, 0 ) );
}

vec4 scene1( vec3 p )
{
	vec4 d = vec4( FAR_CLIP, 0.0, 0.0, -1.0 ); //note: background

	vec3 cyl_pos = vec3( 0, -10, 0 );
	float cyl_scl = 10.0;
	float cyl_r = 0.1;
	vec4 crr = cylinder_radialrepeat( (p-cyl_pos)/cyl_scl, cyl_r*0.5 );
	crr.x *= cyl_scl;

    return crr;
}

// ===
void init( out vec3 cam_eye, out vec3 cam_lookat, out vec3 cam_up )
{
	init1( cam_eye, cam_lookat, cam_up );
}

// ====
vec4 scene( vec3 p )
{
	return scene1( p );
}

// ====
//[0;1[
float nrand( vec2 n ) {
	return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

// ============================================================

vec4 raymarch( inout vec3 p, inout vec3 dir, out int out_steps )
{
    int iter = 0;
	vec4 d;
	float rdt = 0.0;
	for ( int i=0; i<NUM_ITERATIONS; i++ )
	{
        iter += 1;
		d = scene( p );

		if ( (d.x < 0.0 ) || (rdt > FAR_CLIP) ) {
			break;
		}
		else
		{
			float dt = 0.01 + STEP_MULT * d.x; //note: constant-multiply to compensate for distorted space, actual dist < dist - could use gradient-approximation instead? (see iq)
			p += dir * dt;
			rdt += dt;
		}
	}

	out_steps = iter;
	return d;

}

// ====
//note: way too big but only used for approx dir
const vec3 GRAD_EPS = vec3( 0.5, 0, 0 );

vec3 grad3( vec3 p, float d )
{
	return normalize( vec3( scene( p + GRAD_EPS.xyz ).x - d,
							scene( p + GRAD_EPS.zxy ).x - d,
							scene( p + GRAD_EPS.yzx ).x - d ) );
}
//note: more expensive version
vec3 grad6( vec3 p )
{
	return normalize( vec3( scene( p + GRAD_EPS.xyz ).x - scene( p - GRAD_EPS.xyz ).x,
							scene( p + GRAD_EPS.zxy ).x - scene( p - GRAD_EPS.zxy ).x,
							scene( p + GRAD_EPS.yzx ).x - scene( p - GRAD_EPS.yzx ).x ) );
}

// ====
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec3 cam_eye;
	vec3 cam_lookat;
	vec3 cam_up;

	init( cam_eye, cam_lookat, cam_up );

	cam_eye = campos.xyz;
	cam_lookat = camctr.xyz;


	vec3 negz = normalize( cam_lookat - cam_eye );
	vec3 u = cross( negz, cam_up );
	vec3 v = cross( u, negz );

    vec2 texcoord0 = fragCoord.xy / iResolution.xy - vec2(0.5);
	vec2 uv = texcoord0;

    u *= uv.x;
	v *= uv.y;

	float aspect = mix( ASPECT, ASPECT0, parms2.x );
	u *= aspect;

	const float dist = 1.0; //...also controls fov :p
	vec3 dir = dist * negz + u + v;
	dir = normalize( dir );

	vec3 p_org = cam_eye + NEAR_CLIP * dir;
	vec3 p = p_org;
	
	float rnd = nrand( texcoord0.xy + 0.01 * fract( iTime ) );

	
	//note: jitter startpos
	p -= 4.0*TERM_DIST * dir * rnd;

	int i;
	vec4 d = raymarch( p, dir, i );

    bool valid = d.x < 0.0;
    
	vec4 outcol = vec4( d.yyy, valid ? 1.0 : 0.0 );
	outcol.rgb = max( vec3(0), outcol.rgb );

    //vec3 n = grad3( p, d.x );
    //outcol.rgb *= 1.5 - vec3( dot(n,-dir) );

    outcol.rgb *= outcol.aaa;

    
	//note: iteration-glow
	float it_f = float(i) + 0.5 - rnd;
	float iterations = it_f / NUM_ITERATIONS_F;
	float glowits = parms2.y * pow(iterations,2.3);
	const vec3 gc0 = vec3(104,79,255)/255.0;
	vec3 glowcol = mix( 0.5*gc0, 2.0*gc0, parms.x );
	outcol.rgb += 3.0*glowits * glowcol;

	//note: vignette
	float vign = 1.5-length(texcoord0.xy*vec2(2.35,1));
	vign = pow(vign, 2.0);
	outcol.rgb *= vec3( sat(vign) );

    //note: vertical color-shift
    vec3 hsv = rgb_to_hsv( outcol.rgb );
    hsv.x -= 0.1 * pow(0.9-fragCoord.y / iResolution.y, 2.0);
    outcol.rgb = hsv_to_rgb( hsv );

    fragColor = outcol;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
