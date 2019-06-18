/*
 * Original shader from: https://www.shadertoy.com/view/wdjXDw
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

Another flower, possibly inspired by John Edmark's sculptures.

The code is inefficient (so much that I disabled AA by default), and lacks
documentation. If you want to check out code and understand the log-spherical
mapping that's used here, look at "Recursive Lotus" instead:
https://www.shadertoy.com/view/3d2Szm

Change the AA to 2 or 3 if your graphics card can handle it!

*/

#define AA 1
#define ITER 60
#define M_PI 3.1415926535897932384626433832795

float fov = 0.;
float cam_ty = 0.;
float cam_incl = 0.;
float ctrl = 0.;
float cam_azi = 0.;
vec3 cam_pos = vec3(0.);
float timein = 0.;
vec2 AAradius = vec2(0.);
float azrep = M_PI/6.;
float rrep = 2.;
float cam_dist = 2.25;

// Axis rotation taken from tdhooper. R(p.xz, a) rotates "x towards z".
void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

// Modified from http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}
float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float opUsmin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

// From https://www.osar.fr/notes/logspherical/
vec3 logspherical(in vec3 p)
{
	return vec3(
		log(length(p)),
		acos(p.z / length(p)),
		atan(p.y, p.x)
	);
}

float kk(float x) {
	return x>1.?x:exp(x-1.)+0.;
}

float sphFlower(in vec3 p, in float eradius)
{
	p.y -= p.x*M_PI/5.; // azimuth transform
	p.y = fract(p.y/azrep+0.5*azrep)*azrep-0.5*azrep; // azimuth rep
	float unsquish = (1.+1./(M_PI-p.z));
	p.y /= sqrt(unsquish);
	
	p.x = fract((p.x)*rrep+0.25)/rrep-0.25; // radius rep
	p.z -= 1.6+0.25*eradius; // inclination transform
	
	// stem
	float ret = sdCylinder(p.xzy-vec3(-0.03,1.,0.), vec2(0.02, 1.));
	
	// rotate for petal and cap stem
	float sub = -p.z;
	pR(p.yz, 0.6);
	pR(p.xz, 0.4);
	ret = max(ret, -p.x+0.07+sub*0.3);
	
	// petal
	ret = opUsmin(ret, sdBox(p, vec3(-0.3, 0.04, 0.04))-0.32, 0.1);
	return ret;
	
}

float sdf(in vec3 p)
{
	p *= 1. - 0.02*kk(length(p));
	
	p.xzy = logspherical(p.xzy);
	float eradius = exp(p.x-0.25);
	p.x -= timein;
	
	float sd = sphFlower(p, eradius);
	p.x += 0.25;
	sd = min(sd, sphFlower(p, eradius));
	
	sd *= eradius;
	return sd;
}

float iqhash( float n )
{
	return fract(sin(n)*43758.5453);
}

vec3 castRay(in vec3 ro, in vec3 rd)
{
	float rmul = iqhash(rd.x*0.1+rd.y*10.+rd.z*100.+fract(timein))*0.05;
	ro += rd * rmul*2.;
	float tmin = 0.2;
	float tmax = 30.0;
	
	float t = tmin;
	float m = -1.0;
	float i2;
	
	for(int i=0; i<ITER; i++)
	{
		i2 = float(i);
	    float precis = 0.0004*t;
		vec3 pos = ro+rd*t;
	    vec2 res = vec2(sdf(pos), 53.);
		if(res.x<precis || t>tmax) break;
		t += res.x*(0.8+rmul);
	    m = res.y;
	}

	if( t>tmax ) {
		i2 = float(ITER);
		m=-1.0;
	}
	vec3 pt = ro+rd*t;
	return vec3(t, m, i2);
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

void getray(in vec2 pos, out vec3 ro, out vec3 rd)
{
	//pos = pos*-1.333+0.677;
	vec3 ta = vec3(0., cam_ty, 0.);
	ro = cam_pos;
	vec3 ww = normalize(ta - ro);
	vec3 uu = normalize(cross(ww,vec3(0.0,1.0,0.0)));
	vec3 vv = normalize(cross(uu,ww));
	rd = normalize(pos.x*uu + pos.y*vv + fov*ww);
}

vec3 render(in vec3 ro, in vec3 rd, in vec2 scrpos)
{
	vec3 bg = vec3(0.7, 0.9, 1.0) +rd.y*0.8;
	vec3 col = bg;
	vec3 res = castRay(ro,rd);
	float t = res.x;
	float m = res.y;
	vec3 pos = ro + t*rd;

	vec3 ipt = vec3(0.);
	
	if( m>-0.5 )
	{
		vec3 nor = calcNormal( pos );
		
		// material        
		col = 0.45 + 0.35*sin( vec3(0.05,0.08,0.10)*(m-1.0) );

		// lighting        
		vec3  lig = normalize( vec3(-0.4, 0.7, -0.6) );
		float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
		float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
		float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);
		float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );

		vec3 lin = vec3(0.0);
		lin += 1.30*dif*vec3(1.00,0.80,0.55);
		lin += 0.40*amb*vec3(0.40,0.60,1.00);
		lin += 0.50*bac*vec3(0.25,0.25,0.25);
		lin += 0.25*fre*vec3(1.00,1.00,1.00);
		col = col*lin;
	}

	float fogf = pos.y<0. ? -(pos.y * pos.y * 3.): 0.;
	col = mix( col, bg, 1.0-exp( -0.006*t*t + fogf) );
	
	vec3 inice = vec3(res.z/float(ITER));
	inice *= inice;
	inice = mix( inice, vec3(1.), 1.0-exp( -0.0002*t*t*t ) );
	col = col*(inice)*1.2 + bg*(inice)*0.4;

	//return inice;
	return vec3( clamp(col,0.0,1.0) );
}
	
float gain(float x, float k) 
{
	float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
	return (x<0.5)?a:1.0-a;
}

vec3 gain(vec3 v, float k)
{
	return vec3(
		gain(v.x, k),
		gain(v.y, k),
		gain(v.z, k)
	);
}

vec3 pillow(in vec3 col, in vec2 uv)
{
	uv -= 0.5;
	float mpow = 5.;
	float d = pow(pow(abs(uv.x),mpow)+pow(abs(uv.y),mpow),1./mpow);
	d = smoothstep(0., 1., d*2.-0.64);
	return mix(col, vec3(0.), d);
}

// Based on http://iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
	timein = iTime*0.08*1.8+4.;
	ctrl = iTime*0.1+0.1;

	float t2 = ctrl * M_PI + 0.3;
	vec3 shot1 = vec3(0.75, -0.7, cos(t2)*0.3+1.1);
	vec3 shot2 = vec3(0.75, -0.7, cos(t2)*0.25+2.4);
	vec3 shot3 = vec3(cos(t2)*0.392+0.952, -3.0, 0.1);
	vec3 shot = shot3;
	if (mod(ctrl, 3.) <= 2.) shot = shot2;
	if (mod(ctrl, 3.) <= 1.) shot = shot1;
	fov = shot.x;
	cam_ty = shot.y;
	cam_incl = shot.z;


	cam_azi = M_PI * timein / (1.5 * 5.) + 0.12;
	cam_pos = vec3(
		cam_dist*sin(cam_incl)*cos(cam_azi), 
		cam_dist*cos(cam_incl),
		cam_dist*sin(cam_incl)*sin(cam_azi) );

	AAradius  = vec2(1.) / iResolution.xy;
	vec3 tot = vec3(0.);

	// centered ratio-corrected UV
	vec2 cUV = uv-vec2(0.5);
	cUV.x *= iResolution.x/iResolution.y;
	
	#if AA > 1
	for( int m=0; m<AA; m++ )
	for( int n=0; n<AA; n++ )
	{    	
		// pixel coordinates
		vec2 ofs = AAradius*(vec2(float(m),float(n)) / float(AA) - 0.5);
		vec2 pos = cUV+ofs;
	#else    
		vec2 pos = cUV;
	#endif
		vec3 ro, rd;
		getray(pos, ro, rd);
		
		vec3 col = render(ro, rd, pos);
		tot += col;
	#if AA>1
	}
	tot /= float(AA*AA);
	#endif
	tot = pow(tot, vec3(0.4545));
	tot = gain(tot, 1.5);
	tot = pillow(tot, uv);
	tot *= 1.-pow(cos(ctrl*M_PI*2.)*0.5+0.5, 200.);

    // Output to screen
    fragColor = vec4(tot, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
