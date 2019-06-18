/*
 * Original shader from: https://www.shadertoy.com/view/XdKyzD
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec3 iMouse = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Created by Mathieu Simon aka Ouid (2018)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// ref : https://www.shadertoy.com/view/4sfGzS (noise)
// ref : http://iquilezles.org/www/articles/palettes/palettes.htm (color)

//#define DEBUG

const float PI = 3.14159265359;

const float GOLDEN_RATIO = 1.6180339887498;

const float DEG_TO_RAD = 0.0174533;

const float MAX = 10000.0;

#define FOV 25.0

#define WITH_SHADOW 1
#define WITH_STEREO_NORMAL 0

#define PLANE(_Vec3Point,_Vec3Normal) pointAndNormToPlane ( ( vec4(_Vec3Point,1.0) ).xyz, ( vec4(normalize(_Vec3Normal),0.0) ).xyz )
#define CENTRIC_PLANE(_dist,_Vec3Normal) pointAndNormToPlane ( ( vec4(_dist*_Vec3Normal,1.0) ).xyz, ( vec4(normalize(_Vec3Normal),0.0) ).xyz )


//All planes (I'm using /* */ tricks to make new-line)
//Object(10+x) are used to detect plane and select color

#define COLOR_COUNT 12

#if 0
// tetrahedron

#define CENTER(_x,_y,_z) (((_x)+(_y)+(_z))/3.0)
#define P1 vec3(1.0,1.0,1.0)
#define P2 vec3(1.0,-1.0,-1.0)
#define P3 vec3(-1.0,1.0,-1.0)
#define P4 vec3(-1.0,-1.0,1.0)

#define FOREACH_PLANES(_Call) /*
*/	_Call(CENTRIC_PLANE(1.0,CENTER(P1,P2,P3)), Object(10))/*
*/	_Call(CENTRIC_PLANE(1.0,CENTER(P1,P3,P4)), Object(11))/*
*/	_Call(CENTRIC_PLANE(1.0,CENTER(P1,P2,P4)), Object(12))/*
*/	_Call(CENTRIC_PLANE(1.0,CENTER(P2,P3,P4)), Object(13))

#undef COLOR_COUNT
#define COLOR_COUNT 4
    
#elif 0
//cube

#define FOREACH_PLANES(_Call) /*
*/	_Call(CENTRIC_PLANE(1.0,vec3(1.0,0.0,0.0)), Object(10))/*
*/	_Call(CENTRIC_PLANE(1.0,vec3(-1.0,0.0,0.0)), Object(11))/*
*/	_Call(CENTRIC_PLANE(1.0,vec3(0.0,1.0,0.0)), Object(12))/*
*/	_Call(CENTRIC_PLANE(1.0,vec3(0.0,-1.0,0.0)), Object(13))/*
*/	_Call(CENTRIC_PLANE(1.0,vec3(0.0,0.0,1.0)), Object(14))/*
*/	_Call(CENTRIC_PLANE(1.0,vec3(0.0,0.0,-1.0)), Object(15))

#undef COLOR_COUNT
#define COLOR_COUNT 6

#elif 1 
//dodecahedron
    
const float GOLDEN_DIST = (GOLDEN_RATIO*GOLDEN_RATIO) / (GOLDEN_RATIO*GOLDEN_RATIO+2.0);
    
#define FOREACH_PLANES(_Call) /*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(GOLDEN_RATIO,1.0,0.0)), Object(10))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(-GOLDEN_RATIO,1.0,0.0)), Object(11))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(GOLDEN_RATIO,-1.0,0.0)), Object(12))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(-GOLDEN_RATIO,-1.0,0.0)), Object(13))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(0.0,GOLDEN_RATIO,1.0)), Object(14))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(0.0,-GOLDEN_RATIO,1.0)), Object(15))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(0.0,GOLDEN_RATIO,-1.0)), Object(16))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(0.0,-GOLDEN_RATIO,-1.0)), Object(17))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(1.0,0.0,GOLDEN_RATIO)), Object(18))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(1.0,0.0,-GOLDEN_RATIO)), Object(19))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(-1.0,0.0,GOLDEN_RATIO)), Object(20))/*
*/	_Call(CENTRIC_PLANE(GOLDEN_DIST,vec3(-1.0,0.0,-GOLDEN_RATIO)), Object(21))
    
#undef COLOR_COUNT
#define COLOR_COUNT 12
    
#endif
    
#define SPHERE_SIZE 1.0
#define SPHERE_OBJECT_RATIO 1.0

// structures (I love structures, sorry, C/C++ habits)

struct Ray
{
    vec3 p;			// start of the ray
    vec3 d;    		// direction of the ray, intersect functions need "normalized" dir
};

struct Camera
{ 
    mat4	matrix;	// this matrix can be "Left" or "Right" handed...just used to compute viewRay
};
    
struct Object
{
    int		id;		// just an id, to find material after all raycasts
};
    
struct RayResult
{
    float	t;		// distance from origin of the ray that cause the result
    Object	o;	// object intersected
};
    
struct Lighting
{
    vec3	ambient; 	// xyz = color
    vec2	shading;
};
    
struct Light
{
    vec3	p;		// pition of the light    
    vec4	spec;		// xyz = color, w = intensity
};
    
struct World
{
    float 	object_scale;
    mat4	object_trf;   	// matrix of the object
    mat4	object_trf_inv;
};
    
World world;

// util funcs

float maxPerElem ( in vec2 _v )
{
    return max(_v.x,_v.y);
}

float maxPerElem ( in vec3 _v )
{
    return max(_v.z,maxPerElem(_v.xy));
}

float maxPerElem ( in vec4 _v )
{
    return max(_v.w,maxPerElem(_v.xyz));
}

mat4 rotationX ( float _angle )
{
    mat4 mat;
    mat[0] = vec4(1.0,0.0,0.0,0.0);
    mat[1] = vec4(0.0,cos(_angle),sin(_angle),0.0);
    mat[2] = vec4(0.0,-sin(_angle),cos(_angle),0.0);
    mat[3] = vec4(0.0,0.0,0.0,1.0);    
    return mat;
}
mat4 rotationY ( float _angle )
{
    mat4 mat;
    mat[0] = vec4(cos(_angle),0.0,-sin(_angle),0.0);
    mat[1] = vec4(0.0,1.0,0.0,0.0);
    mat[2] = vec4(sin(_angle),0.0,cos(_angle),0.0);
    mat[3] = vec4(0.0,0.0,0.0,1.0);
    return mat;
}
mat4 rotationZ ( float _angle )
{
    mat4 mat;
    mat[0] = vec4(cos(_angle),sin(_angle),0.0,0.0);
    mat[1] = vec4(-sin(_angle),cos(_angle),0.0,0.0);
    mat[2] = vec4(0.0,0.0,1.0,0.0);
    mat[3] = vec4(0.0,0.0,0.0,1.0);
    return mat;
}

mat4 scale (vec3 _scale)
{
    mat4 mat;
    mat[0] = vec4(_scale.x,0.0,0.0,0.0);
    mat[1] = vec4(0.0,_scale.y,0.0,0.0);
    mat[2] = vec4(0.0,0.0,_scale.z,0.0);
    mat[3] = vec4(0.0,0.0,0.0,1.0);
    return mat;
}

mat4 translate (vec3 _translation)
{
    mat4 mat;
    mat[0] = vec4(1.0,0.0,0.0,0.0);
    mat[1] = vec4(0.0,1.0,0.0,0.0);
    mat[2] = vec4(0.0,0.0,1.0,0.0);
    mat[3] = vec4(_translation,1.0);
    return mat;
}

vec4 pointAndNormToPlane ( in vec3 _p, in vec3 _n )
{
    return vec4 ( _n, -dot(_p,_n) );
}

RayResult sdSphere(vec3 p, float r, Object o)
{
    return RayResult ( length(p) - r, o);
}

RayResult sdPlane(vec3 p, vec4 n, Object o)
{
    return RayResult ( dot(p,n.xyz) + n.w, o);
}


RayResult sdBox( vec3 p, vec3 b, Object o )
{
    vec3 d = abs(p) - b;
    return RayResult(min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)), o);
}

RayResult inv ( RayResult r )
{
    return RayResult(-r.t, r.o);
}

RayResult mul(RayResult r, float s)
{
    return RayResult(r.t * s, r.o);
}

RayResult add(RayResult r, float v)
{
    return RayResult(r.t + v, r.o);
}

RayResult opU( RayResult r1, RayResult r2 )
{
    if ( r1.t < r2.t )
        return RayResult(r1.t, r1.o);    
    else
        return RayResult(r2.t, r2.o);
}


RayResult opI( RayResult r1, RayResult r2 )
{
    if ( r1.t > r2.t )
        return RayResult(r1.t, r1.o);    
    else
        return RayResult(r2.t, r2.o);
}


RayResult opS( RayResult r1, RayResult r2 )
{
    return opI(r1, inv(r2));
}


RayResult opRepBox( vec3 p, vec3 bs, vec3 c, in Object o )
{
    vec3 q = mod(p,c)-0.5*c;
    return sdBox( q, bs, o );
}

/*RayResult main_object(vec3 p, float scale)
{
    vec3 p2 = p / scale;
    RayResult r = RayResult(-1.0, Object(-1));
    
	#define INTERSECT_PLANE_RANGE(_Plane,_PlaneId) r=opI(r, sdPlane ( p2, _Plane, _PlaneId ));
	FOREACH_PLANES(INTERSECT_PLANE_RANGE) 
        
    r = opS ( r, sdSphere(p2,1.15, Object(2)) );
        
    return mul(r, scale);
}*/

RayResult main_object(vec3 p, float scale)
{
    vec3 p2 = p / scale;
        
    //RayResult r =  sdSphere(p2, 1.0, Object(10));
    RayResult r =  sdBox(p2, vec3(0.7), Object(10));
    
    float box_size = 1.0 / 3.0; //0.05;
    
    RayResult box = opRepBox(p2, vec3(box_size*0.15), vec3(box_size), Object(10));
    
    r = opI ( r, box);
    
    //r = opS ( r,  sdSphere(p2, 1.0-box_size*0.25*sqrt(2.0), Object(10)));
    //r = opS ( r,  sdSphere(p2, 0.9, Object(10)));
    r = opS ( r,  sdBox(p2, vec3(0.5), Object(10)));    
        
    return mul(r, scale);
}



RayResult map(vec3 p, in Object _except)
{
    vec3 p2 = (world.object_trf_inv * vec4(p,1.0)).xyz;
    
    RayResult r = main_object(p2, world.object_scale);

	if ( _except.id != 2 )
    	r = opU ( r, sdPlane(p, vec4(0.0,1.0,0.0,0.0), Object(2)));
	
	return r;
}

RayResult map(vec3 p)
{
    return map(p, Object(-1));
}

// normal : copy from https://www.shadertoy.com/view/Xds3zN
vec3 normal( in vec3 pos )
{
    vec2 e = vec2(1.0,-1.0)*0.00001;
    return normalize( e.xyy*map( pos + e.xyy ).t + 
					  e.yyx*map( pos + e.yyx ).t + 
					  e.yxy*map( pos + e.yxy ).t + 
					  e.xxx*map( pos + e.xxx ).t );
}

RayResult intersect(in Ray ray, in Object _except, float _precis, float _max)
{
    RayResult r;
    float t=0.0;
    float tmax = _max;
    for ( int i=0; i<128; ++i )
    {
        float precis = _precis;
        
        RayResult curr = map(ray.p + t * ray.d, _except);
        
        if( curr.t<precis || t>tmax ) break;
                
        t += curr.t;
        r = curr;
    }
    
    if (t>tmax)
        return RayResult(-1.0,Object(-1));
    
    return RayResult(t, r.o);
}

// Stereographic projection

Ray stereographicRay ( in World _world, in vec3 _p )
{
    // x;y;z;0 on hyperplane w=0
    // on sphere of radius 1 => (2x/(R+1);2y/(R+1);2x/(R+1);R-1/R+1) where R = x²+y²+z²
    
    float R = dot(_p.xz,_p.xz);
    
    vec3 onSphere = vec3(2.0*_p.x,R-1.0,2.0*_p.z) / vec3(R+1.0);
    
    // STC : SphereToCube
    Ray raySTC;
    raySTC.p = _world.object_trf[3].xyz;
    raySTC.d =  normalize( onSphere - _world.object_trf[3].xyz );
    
    return raySTC;
}


// standard [image -> screen -> view -> world] funcs

vec2 imageToScreen ( in vec2 _uv )
{
    vec2 ratioUV = _uv.xy / iResolution.xy;
    vec2 ratio = 2.0*iResolution.xy/vec2(min(iResolution.x,iResolution.y));
    vec2 xy = (ratioUV*2.0-1.0)*ratio;
    return xy;
}

void screenToWorld ( in Camera _camera, in vec2 _screenp, float _z, out vec3 _p )
{
    _p = (_camera.matrix * vec4(_screenp,_z,1.0)).xyz;    
}

void screenToRay ( in Camera _camera, in vec2 _screenp, out Ray _ray )
{
    vec3 rayPoint;
    
    //fov is hardcoded here (distance of Z plane)
    screenToWorld ( _camera, _screenp, 1.0 / tan ( DEG_TO_RAD * FOV / 2.0), rayPoint );        
    
    _ray.p = _camera.matrix[3].xyz;
    _ray.d = normalize(rayPoint-_ray.p);
}

Camera cameraLookAt ( in vec3 _eye, in vec3 _lookAtp, in vec3 _up )
{
    Camera _camera;
    
    vec3 front = normalize(_lookAtp-_eye);    
    vec3 left = normalize(cross(front, _up));
    vec3 up = normalize(cross(left,front));
    _camera.matrix[0] = vec4(left,0.0);
    _camera.matrix[1] = vec4(up,0.0);
    _camera.matrix[2] = vec4(front,0.0);
    _camera.matrix[3] = vec4(_eye,1.0);
    
    return _camera;
}

// color funcs

vec3 computeMaterial ( in World _world, in Ray _ray, in RayResult _rayResult )
{
    vec3 _material;
    
    if ( _rayResult.o.id == 1 )
    {
        _material = vec3(1.0);
    }
    else if ( _rayResult.o.id == 2 )
    {
        _material = vec3(0.5);
    }
    else if ( _rayResult.o.id >= 10  )
    {
        float ratio = mod(float(_rayResult.o.id-9)+5.0,float(COLOR_COUNT)) / float(COLOR_COUNT);
        vec3 a = vec3(0.28,0.5,0.5)*1.3;
        vec3 b = vec3(0.5,0.2,0.5);
        vec3 c = vec3(1.0,1.0,0.0);        
        vec3 d = vec3(0.5,0.3, 0.25);
        
        //http://iquilezles.org/www/articles/palettes/palettes.htm
        _material = a+b*cos(2.0*3.141592*(c*ratio+d));
        
        vec3 pos = _ray.p + _rayResult.t * _ray.d;
        _material = (world.object_trf_inv * vec4(normal(pos), 0.0)).xyz * 0.5 + vec3(0.5);

    }
    else   
    {
        _material = vec3(0.0);
    }
    
    return _material;
}

// softShadow : copy from https://www.shadertoy.com/view/Xds3zN
float calcSoftshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ )
    {
		float h = map( ro + rd*t ).t;
        res = min( res, 2.0*h/t );
        t += clamp( h, 0.001, 0.05 );
        if( h<0.0001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

// AO : copy from https://www.shadertoy.com/view/Xds3zN
float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).t;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

mat4 inverse(mat4 m)
{
    return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// setup world, cam & light

    mat4 rot = rotationZ ( iTime*1.278914) * rotationY(iTime) * rotationX(iTime*0.332567);
    mat4 inverseRot = rotationX(-iTime*0.332567) * rotationY(-iTime) * rotationZ ( -iTime*1.278914) ;
    
    world.object_scale = 0.5;
    world.object_trf = translate (vec3(0.0,0.5,0.0)) * rot;
    world.object_trf_inv = inverse(world.object_trf);
    
    vec2 eye = vec2(0.0);
    
#ifndef DEBUG
    eye = iMouse.xy/iResolution.xy;
#endif
    
    Camera cam = cameraLookAt ( vec3(2.5-5.0*(eye.x),2.0+5.0*(eye.y),2.5), vec3(0.0,0.5,0.0), vec3(0.0,1.0,0.0) );
    
    // compute raytrace
    vec2 xy = imageToScreen ( fragCoord );    
        
    Ray ray;
    
    screenToRay ( cam, xy, ray );
    
    RayResult res = intersect ( ray, Object(-1), 0.0001, 100.0 );
    
    vec3 pos = ray.p + ray.d * res.t;
	vec3 nor = normal( pos );
	vec3 ref = reflect( ray.d, nor );
     
    vec3 col = computeMaterial ( world, ray, res );   
    
    // if plane => stereographicProj to obtain color
    if ( res.o.id == 2 )
    {
        Ray stRay = stereographicRay ( world, pos );
        RayResult stInter = intersect(stRay, Object(2), 0.0001, 1.0);
            
        vec3 stereoCol = computeMaterial ( world, stRay, stInter );
        
        col = stereoCol * stInter.t;
    }
        
    // lighting : copy from https://www.shadertoy.com/view/Xds3zN
    float occ = 1.0; //calcAO( pos, nor );
    vec3  lig = normalize( vec3(-0.4, 0.7, -0.6) );
    vec3  hal = normalize( lig-ray.d );
    float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
    float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
    float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);
    float dom = smoothstep( -0.1, 0.1, ref.y );
    float fre = pow( clamp(1.0+dot(nor,ray.d),0.0,1.0), 2.0 );

    dif *= calcSoftshadow( pos, lig, 0.02, 10.0 );
    dom *= calcSoftshadow( pos, ref, 0.02, 10.0 );

    float spe = pow( clamp( dot( nor, hal ), 0.0, 1.0 ),16.0)*
        dif *
        (0.04 + 0.96*pow( clamp(1.0+dot(hal,ray.d),0.0,1.0), 5.0 ));

    vec3 lin = vec3(0.0);
    lin += 1.30*dif*vec3(1.00,0.80,0.65);
    lin += 0.40*amb*vec3(0.60,0.80,1.00)*occ;
    lin += 0.50*dom*vec3(0.60,0.80,1.00)*occ;
    lin += 0.50*bac*vec3(0.35,0.35,0.35)*occ;
    lin += 0.25*fre*vec3(1.00,1.00,1.00)*occ;
    col = col*lin;
    col += 10.00*spe*vec3(1.00,0.90,0.70);

    col = col; //mix( col, vec3(0.,0.0,.0), 1.0-exp( -0.0002*res.t*res.t*res.t ) );

    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  iMouse = vec3(mouse * resolution, 0.0);

  mainImage(gl_FragColor, gl_FragCoord.xy);
}
