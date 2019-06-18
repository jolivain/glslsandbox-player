/*
 * Original shader from: https://www.shadertoy.com/view/3tSGWz
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
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
// Happy Cactus - Del - 27/05/2019

#define PI 3.1415926
void doCamera( out vec3 camPos, out vec3 camTar, in float time, in vec2 mouse )
{
    vec2 mouse2 = vec2(0.0);
    
    mouse2.y = 0.25;
    mouse2.x = sin(time*0.75)*0.05;
    if (iMouse.z > 0.5)
    {
        mouse2 = mouse;
        mouse2.y -= 0.1;
    }
    float an = 10.0*mouse2.x;
	camPos = vec3(7.5*sin(an),0.0+mouse2.y*8.0,7.5*cos(an));
    camTar = vec3(0.0,0.0,0.0);
}
    
//------------------------------------------------------------------------
// Modelling 
//------------------------------------------------------------------------

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdEllipsoid(const in  vec3 p, const in vec3 r)
{
  return (length(p / r) - 1.0) * min(min(r.x, r.y), r.z);
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float dot2( in vec2 v )
{
    return dot(v,v);
}

float sdCappedCone( in vec3 p, in float h, in float r1, in float r2 )
{
    vec2 q = vec2( length(p.xz), p.y );
    vec2 k1 = vec2(r2,h);
    vec2 k2 = vec2(r2-r1,2.0*h);
    vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

mat2 rot( float th ){ vec2 a = sin(vec2(1.5707963, 0) + th); return mat2(a, -a.y, a.x); }

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec2 opUnionRound(const in vec2 a, const in vec2 b, const in float r)
{
    vec2 res = vec2(smin(a.x,b.x,r),(a.x<b.x) ? a.y : b.y);
    return res;
}

vec2 opS( vec2 d1, vec2 d2 )
{ 
    return (-d1.x>d2.x) ? vec2(-d1.x, d1.y): d2;
}

// model
vec2 pot(vec2 res, vec3 p)
{
    float rimh = 0.2;
    float poth = 1.2;
    // rim
   	float d2 = sdCappedCylinder(p+vec3(0.0,rimh,0.0),vec2(2.1,rimh));
	res = opUnionRound(res,vec2(d2,3.0),0.04);    
    // pot
   	float d3 = sdCappedCone(p+vec3(0.0,poth,0.0), poth, 1.8,2.1);
	res = opUnionRound(res,vec2(d3,3.0),0.3);    
    return res;
}

vec2 doModel( vec3 p )
{
    p-=vec3(0.0,0.7,0.0);
    
    float d1 = sdEllipsoid(p,vec3(1.3,2.6,1.3));
    
	float a = atan(p.x/p.z);
    float m = (2.6-abs(p.y))*0.65;
	d1+=abs(sin(a*8.0)*(0.05*m));

    vec2 res = vec2(d1,2.0);
        
    // mouth
    vec3 q = p;
    q.x = abs(q.x);
    q.yz *= rot(-pow(q.x, 2.8));
    q.z -= 1.25;
    vec2 mouth1 = vec2(sdCapsule(q, vec3(0.35, 0.0, 0.0), vec3(-0.35, 0.0, 0.0), .025)-0.115, 4.0);

    float b2 = step(fract(iTime*0.1), 0.9);
    if (b2<=0.0)
        mouth1.x = sdSphere(q,0.25);
    
    res = opS(mouth1,res);
        
	// eyes    
    float blink = step(sin(iTime * 2.8 + cos(iTime * 2.0) * 2.0), 0.98);
    p.x = abs(p.x);
    float d2 = sdSphere(p+vec3(-0.3,-1.0,-1.2),0.1);
    res = opUnionRound(res,vec2(d2,blink>0.0 ? 5.0:2.0),0.25);
	res = pot(res,p+vec3(0.0,1.1,0.0));
    return res;
}


//------------------------------------------------------------------------
// Material 
//
// Defines the material (colors, shading, pattern, texturing) of the model
// at every point based on its position and normal.
//------------------------------------------------------------------------
// c = colour index (added by del for some materials)
// c.a == specular val fudged in...
vec4 doMaterial( in vec3 pos, in vec3 nor,float c )
{
    if (c<=1.0)
    {
        // checker floor
        float f = mod( floor(2.0*pos.z) + floor(2.0*pos.x), 2.0);
        vec4 col = 0.1 + 0.3*f*vec4(0.2,1.0,0.2,0.0);
	    return col;
    }
    else if (c<=2.0)
    {
        return vec4(0.03,0.2,0.05,0.5);		// cactus
    }
    else if (c<=3.0)
    {
		return vec4(0.2, 0.06, 0.03,1.0);	// pot
    }
    else if (c<=4.0)
    {
		return vec4(0.1, 0.08, 0.03, 0.8);	// mouth
    }

	return vec4(0.03, 0.03, 0.15,2.0);	// eyes
}

//------------------------------------------------------------------------
// Lighting
//------------------------------------------------------------------------
float calcSoftshadow( in vec3 ro, in vec3 rd );

vec3 doLighting( in vec3 pos, in vec3 nor, in vec3 rd, in float dis, in vec4 mat )
{
    
    vec3 lin = vec3(0.0);

    // key light
    //-----------------------------
    vec3  lig = normalize(vec3(0.7,0.875,0.89));		// dir
    float dif = max(dot(nor,lig),0.0);
    float sha = 0.0;
    if( dif>0.01 )
        sha=calcSoftshadow( pos+0.01*nor, lig );
    lin += dif*vec3(4.00,4.00,4.00)*sha;

	float spec = pow(dif, 160.0) *mat.a;
    
    // ambient light
    //-----------------------------
    lin += vec3(0.50,0.50,0.50);
    
    // surface-light interacion
    //-----------------------------
    vec3 col = mat.xyz*lin;
    col+=spec;
    
    // fog    
    //-----------------------------
	col *= exp(-0.002*dis*dis);

    return col;
}

vec2 calcIntersection( in vec3 ro, in vec3 rd )
{
	const float maxd = 20.0;           // max trace distance
	const float precis = 0.001;        // precission of the intersection
    float h = precis*2.0;
    float t = 0.0;
	//float res = -1.0;
    vec2 res = vec2(-1.0,0.0);
    float c = 0.0;
    
    for( int i=0; i<150; i++ )
    {
        if( h<precis||t>maxd ) break;
        vec2 res2 = doModel( ro+rd*t );
	    h = res2.x;
        c = res2.y;
        
        t += h*0.85;
    }

    if( t<maxd )
    {
        res.x = t;
        res.y = c;
    }
    return res;
}

vec3 calcNormal( in vec3 pos )
{
    const float eps = 0.002;             // precision of the normal computation

    const vec3 v1 = vec3( 1.0,-1.0,-1.0);
    const vec3 v2 = vec3(-1.0,-1.0, 1.0);
    const vec3 v3 = vec3(-1.0, 1.0,-1.0);
    const vec3 v4 = vec3( 1.0, 1.0, 1.0);

	return normalize( v1*doModel( pos + v1*eps ).x + 
					  v2*doModel( pos + v2*eps ).x + 
					  v3*doModel( pos + v3*eps ).x + 
					  v4*doModel( pos + v4*eps ).x );
}

float calcSoftshadow( in vec3 ro, in vec3 rd )
{
    float res = 1.0;
    float t = 0.0005;                 // selfintersection avoidance distance
	float h = 1.0;
    for( int i=0; i<40; i++ )         // 40 is the max numnber of raymarching steps
    {
        h = doModel(ro + rd*t).x;
        res = min( res, 64.0*h/t );   // 64 is the hardness of the shadows
		t += clamp( h, 0.02, 2.0 );   // limit the max and min stepping distances
    }
    return clamp(res,0.0,1.0);
}

mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

vec3 background(vec2 pos)
{
    pos.x = abs(pos.x);
    float d = length(pos*pos);
    pos+=vec2(0.5);
	float vv = pos.y*pos.y;
	vv+=sin(exp(1.0-pos.x));
	float v = sin(sin(pos.x*16.0)+(vv+iTime*.1) * 42.0)+0.95;
    v*=0.5-d*d;
    
	return vec3( v*1.8,0.1+v*0.95, 0.2+v*0.35);    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;
    vec2 m = iMouse.xy/iResolution.xy;

    // camera movement
    vec3 ro, ta;
    doCamera( ro, ta, iTime, m );

    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, sin(iTime)*0.25 );
    
	// create view ray
	vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length

    //-----------------------------------------------------
	// render
    //-----------------------------------------------------
  	//vec3 col = mix( vec3(0.2, 0.2, 0.5), vec3(0.5, 0.7, 1.0), fragCoord.y / iResolution.y );
    vec3 col = background((fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y);

	// raymarch
    vec2 res = calcIntersection( ro, rd ); 
    float t = res.x;
    if( t>-0.5 )
    {
        // geometry
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);

        // materials
        vec4 mat = doMaterial( pos, nor, res.y );

        col = doLighting( pos, nor, rd, t, mat );
	}

	//-----------------------------------------------------
	// postprocessing
    //-----------------------------------------------------
    // gamma
	col = pow( clamp(col,0.0,1.0), vec3(0.4545) );
	   
    fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
