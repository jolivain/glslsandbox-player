/*
 * Original shader from: https://www.shadertoy.com/view/XtdcWr
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
const vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)
#define textureLod(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
const float epsilon = 0.01;
const float pi = 3.14159265359;
const float halfpi = 1.57079632679;
const float twopi = 6.28318530718;
const vec3 color1 = vec3(0.25, 0.2, 0.2);
const vec3 color2 = vec3(1.0, 0.1, 0.1);
const vec3 color3 = vec3(1.0, 0.9, 0.9);
const vec3 lightColor = vec3(1.2, 1.1, 1.0);
const vec3 groundColor = vec3(0.3, 0.25, 0.2);
const vec3 backgroundColor = vec3(0.5, 0.5, 0.5);
const vec3 topColor = vec3(0.7, 0.8, 1.0);

#define LightDir normalize(vec3(1.0, 0.75, 1.0))

struct FingerParams
{
    vec4 a;
    vec4 b;
    vec4 c;
    vec4 d;
    vec4 e;
    vec4 quat;
    vec4 lengths;
}; 
 
mat2 rot(float a) 
{
    vec2 s = vec2(cos(a), sin(a));
	return mat2(s.y,s.x,-s.x,s.y);	
}

float saturate(float f)
{
    return clamp(f, 0.0, 1.0);
}

//Quatertion Formula taken from http://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec4 RotationToQuaternion(vec3 axis, float angle)
{
    axis = normalize(axis);
    float half_angle = angle * halfpi / 180.0;
    vec2 s = sin(vec2(half_angle, half_angle + halfpi));
    return vec4(axis * s.x, s.y);
}

vec3 Rotate(vec3 pos, vec4 quaternion)
{
    return pos + 2.0 * cross(quaternion.xyz, cross(quaternion.xyz, pos) + quaternion.w * pos);
}

//Distance Field function by iq :
//http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r1, float r2, float m)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - mix(r1, r2, clamp(length(pa) / m, 0.0, 1.0));
}

float box(vec3 pos, vec3 size)
{
	return length(max(abs(pos) - size, 0.0));
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

//taken from shane's desert canyon, originaly a modification of the smin function by iq
//https://www.shadertoy.com/view/Xs33Df
float smax(float a, float b, float s)
{   
    float h = clamp( 0.5 + 0.5*(a-b)/s, 0., 1.);
    return mix(b, a, h) + h*(1.0-h)*s;
}

float finger(vec3 pos, FingerParams fp)
{ 
    pos = Rotate(pos, fp.quat);
    
    float s1 = sdCapsule(pos, fp.a.xyz, fp.b.xyz, fp.a.w, fp.b.w, fp.lengths.x);
    float s2 = sdCapsule(pos, fp.b.xyz, fp.c.xyz, fp.b.w, fp.c.w, fp.lengths.y);
    float s3 = sdCapsule(pos, fp.c.xyz, fp.d.xyz, fp.c.w, fp.d.w, fp.lengths.z);
    float s4 = sdCapsule(pos, fp.d.xyz, fp.e.xyz, fp.d.w, fp.e.w, fp.lengths.w);
        
	return smin(smin(smin(s1, s2, 0.1), s3, 0.075), s4, 0.05);
}
  
/*
#define f1Curve 2.3
#define f1Length 1.1
#define f1Size 0.34 
#define f1A vec4(0.0, 0.0, 0.0, 0.1)
#define f1B vec4(f1A.xyz + normalize(vec3(0.0, 0.0, 1.0).xyz) * 3.0, 1.25 * f1Size)
#define f1C vec4(f1B.xyz + normalize(vec3(0.1, -0.2 * f1Curve, 1.0).xyz) * 0.8 * f1Length, 1.0 * f1Size)
#define f1D vec4(f1C.xyz + normalize(vec3(0.1, -0.5 * f1Curve, 1.0).xyz) * 0.75 * f1Length, 0.9 * f1Size)
#define f1E vec4(f1D.xyz + normalize(vec3(0.1, -1.25 * f1Curve, 1.0).xyz) * 0.7 * f1Length, 0.8 * f1Size)
#define f1Quat RotationToQuaternion(vec3(-1.0, -8.0, 5.0), 15.0) 
#define f1Lengths vec4(length(f1B - f1A), length(f1C - f1B), length(f1D - f1C), length(f1E - f1D))
*/

#define f1A vec4(0,0,0,0.1)
#define f1B vec4(0,0,3,0.425)
#define f1C vec4(0.07961927,-0.3662486,3.796193,0.34)
#define f1D vec4(0.1336378,-0.9874623,4.336379,0.306)
#define f1E vec4(0.1589203,-1.714333,4.589203,0.29)
#define f1Quat vec4(-0.01375867,-0.1100694,0.06879336,0.9914449)
#define f1Lengths vec4(3,0.88,0.8250002,0.7699998)

/*
#define f2Curve 2.0
#define f2Length 1.2
#define f2Size 0.375 
#define f2A vec4(vec3(0.0, 0.0, 0.0).xyz, 0.1)
#define f2B vec4(f2A.xyz + normalize(vec3(0.0, 0.0, 1.0).xyz) * 3.0, 1.25 * f2Size)
#define f2C vec4(f2B.xyz + normalize(vec3(0.0, -0.25 * f2Curve, 1.0).xyz) * 0.8 * f2Length, 1.0 * f2Size)
#define f2D vec4(f2C.xyz + normalize(vec3(0.0, -0.5 * f2Curve, 1.0).xyz) * 0.75 * f2Length, 0.9 * f2Size)
#define f2E vec4(f2D.xyz + normalize(vec3(0.0, -1.35 * f2Curve, 1.0).xyz) * 0.7 * f2Length, 0.7 * f2Size)
#define f2Quat RotationToQuaternion(vec3(-1.0, -8.0, 5.0), 3.0) 
#define f2Lengths vec4(length(f2B - f2A), length(f2C - f2B), length(f2D - f2C), length(f2E - f2D))
*/

#define f2A vec4(0,0,0,0.1)
#define f2B vec4(0,0,3,0.46875)
#define f2C vec4(0,-0.4651021,3.930204,0.375)
#define f2D vec4(0,-1.154531,4.619634,0.3375)
#define f2E vec4(0,-2.007883,4.93569,0.25)
#define f2Quat vec4(-0.002759293,-0.02207434,0.01379647,0.9996573)
#define f2Lengths vec4(3,1.04,0.9750001,0.91)

/*
#define f3Curve 2.1
#define f3Length 1.1
#define f3Size 0.33
#define f3A vec4(vec3(0.0, 0.0, 0.0).xyz, 0.1)
#define f3B vec4(f3A.xyz + normalize(vec3(0.0, 0.0, 1.0).xyz) * 3.0, 1.25 * f3Size)
#define f3C vec4(f3B.xyz + normalize(vec3(0.0, -0.25 * f3Curve, 1.0).xyz) * 0.8 * f3Length, 1.0 * f3Size)
#define f3D vec4(f3C.xyz + normalize(vec3(0.0, -0.5 * f3Curve, 1.0).xyz) * 0.75 * f3Length, 0.9 * f3Size)
#define f3E vec4(f3D.xyz + normalize(vec3(0.0, -1.25 * f3Curve, 1.0).xyz) * 0.7 * f3Length, 0.7 * f3Size)
#define f3Quat RotationToQuaternion(vec3(-1.0, -8.0, 5.0), -10.0) 
#define f3Lengths vec4(length(f3B - f3A), length(f3C - f3B), length(f3D - f3C), length(f3E - f3D))
*/

#define f3A vec4(0,0,0,0.1)
#define f3B vec4(0,0,3,0.4125)
#define f3C vec4(0,-0.4090538,3.77915,0.33)
#define f3D vec4(0,-1.006468,4.348116,0.297)
#define f3E vec4(0,-1.726023,4.622232,0.22)
#define f3Quat vec4(0.009187022,0.07349618,-0.04593511,0.9961947)
#define f3Lengths vec4(3,0.8800001,0.8250002,0.77)

/*
#define f4Curve 1.9
#define f4Length 0.9
#define f4Size 0.3
#define f4A vec4(vec3(0.2, -0.5, 0.4).xyz, 0.9)
#define f4B vec4(f4A.xyz + normalize(vec3(0.0, 0.0, 1.0).xyz) * 2.3, 1.25 * f4Size)
#define f4C vec4(f4B.xyz + normalize(vec3(-0.3, -0.25 * f4Curve, 1.0).xyz) * 0.8 * f4Length, 1.0 * f4Size)
#define f4D vec4(f4C.xyz + normalize(vec3(-0.3, -0.5 * f4Curve, 1.0).xyz) * 0.75 * f4Length, 0.9 * f4Size)
#define f4E vec4(f4D.xyz + normalize(vec3(-0.3, -1.0 * f4Curve, 1.0).xyz) * 0.7 * f4Length, 0.7 * f4Size)
#define f4Quat RotationToQuaternion(vec3(-0.2, -0.8, 1.0), -45.0) 
#define f4Lengths vec4(length(f4B - f4A), length(f4C - f4B), length(f4D - f4C), length(f4E - f4D))
*/

#define f4A vec4(0.2,-0.5,0.4,0.9)
#define f4B vec4(0.2,-0.5,2.7,0.375)
#define f4C vec4(0.01168381,-0.7981673,3.327721,0.3)
#define f4D vec4(-0.1317746,-1.252452,3.805915,0.27)
#define f4E vec4(-0.2189538,-1.804587,4.096512,0.2)
#define f4Quat vec4(0.05904933,0.2361973,-0.2952467,0.9238795)
#define f4Lengths vec4(2.3,0.7199999,0.675,0.63)

/*
#define f5Curve 2.2
#define f5Length 0.9
#define f5Size 0.4 
#define f5A vec4(vec3(-0.1, 0.0, 0.0).xyz, 1.25)
#define f5B vec4(f5A.xyz + normalize(vec3(0.0, 0.0, 1.0).xyz) * 1.0, 1.6 * f5Size)
#define f5C vec4(f5B.xyz + normalize(vec3(0.0, -0.25 * f5Curve, 1.0).xyz) * 0.8 * f5Length, 1.1 * f5Size)
#define f5D vec4(f5C.xyz + normalize(vec3(0.0, -0.5 * f5Curve, 1.0).xyz) * 0.75 * f5Length, 0.9 * f5Size)
#define f5E vec4(f5D.xyz + normalize(vec3(0.0, -1.0 * f5Curve, 1.0).xyz) * 0.7 * f5Length, 0.7 * f5Size)
#define f5Quat RotationToQuaternion(vec3(0.15, -1.0, 0.8), 150.0) 
#define f5Lengths vec4(length(f5B - f5A), length(f5C - f5B), length(f5D - f5C), length(f5E - f5D))
*/

#define f5A vec4(-0.1,0,0,1.25)
#define f5B vec4(-0.1,0,1,0.64)
#define f5C vec4(-0.1,-0.3469815,1.630875,0.44)
#define f5D vec4(-0.1,-0.846441,2.08493,0.36)
#define f5E vec4(-0.1,-1.419972,2.345625,0.28)
#define f5Quat vec4(0.112371,-0.7491399,0.5993119,0.2588191)
#define f5Lengths vec4(1,0.72,0.6750001,0.6299999)

#define quat0 vec4(0.7071068, 0.0, 0.0, 0.7071068) //RotationToQuaternion(vec3(1.0, 0.0, 0.0), 90.0)
#define quat1 vec4(0.3420202, 0.0, 0.0, 0.9396926) //RotationToQuaternion(vec3(1.0, 0.0, 0.0), 40.0)

vec2 distfunc(vec3 pos)
{ 
    vec3 rpos = pos;
    rpos += vec3(0.0, 2.0, 0.0);
	rpos = Rotate(rpos, quat0);
    
    float arm = sdCapsule(rpos * vec3(1.0, 1.2, 1.0), vec3(-0.2, 0.0, 0.0), vec3(0.0, 0.0, -3.5), 0.7, 1.5, 5.0);
    
    rpos = Rotate(rpos, quat1);
    
    vec3 p1 = rpos;
    vec3 p2 = rpos + vec3(0.4, -0.1, 0.0); 
    vec3 p3 = rpos + vec3(0.8, 0.0, 0.0);  
    vec3 p4 = rpos + vec3(1.0, 0.1, 0.0); 
    vec3 p5 = rpos + vec3(-0.3, 0.6, -0.7);
    
    FingerParams fingerParams1;
    fingerParams1.a = f1A;
    fingerParams1.b = f1B;
    fingerParams1.c = f1C;
    fingerParams1.d = f1D;
    fingerParams1.e = f1E;
    fingerParams1.quat = f1Quat;
    fingerParams1.lengths = f1Lengths;
        
    float f1 = finger(p1, fingerParams1);
    
    FingerParams fingerParams2;
    fingerParams2.a = f2A;
    fingerParams2.b = f2B;
    fingerParams2.c = f2C;
    fingerParams2.d = f2D;
    fingerParams2.e = f2E;
    fingerParams2.quat = f2Quat;
	fingerParams2.lengths = f2Lengths;
    
    float f2 = finger(p2, fingerParams2);
    
    FingerParams fingerParams3;
    fingerParams3.a = f3A;
    fingerParams3.b = f3B;
    fingerParams3.c = f3C;
    fingerParams3.d = f3D;
    fingerParams3.e = f3E;
    fingerParams3.quat = f3Quat;
	fingerParams3.lengths = f3Lengths;
    
    float f3 = finger(p3, fingerParams3);
        
    FingerParams fingerParams4;
    fingerParams4.a = f4A;
    fingerParams4.b = f4B;
    fingerParams4.c = f4C;
    fingerParams4.d = f4D;
    fingerParams4.e = f4E;
    fingerParams4.quat = f4Quat;
    fingerParams4.lengths = f4Lengths;
    
    float f4 = finger(p4, fingerParams4);
    
    FingerParams fingerParams5;
    fingerParams5.a = f5A;
    fingerParams5.b = f5B;
    fingerParams5.c = f5C;
    fingerParams5.d = f5D;
    fingerParams5.e = f5E;
    fingerParams5.quat = f5Quat;
    fingerParams5.lengths = f5Lengths;
    
    float f5 = finger(p5, fingerParams5);
    
    float fingers = min(min(min(f1, f2), f3), f4);
    
    vec3 mainPos = rpos * vec3(1.0, 1.4, 1.0);
    float main = sdCapsule(mainPos, vec3(0.0, 0.0, 0.0), vec3(0.15, -0.5, 2.25), 0.5, 1.0, 2.25);
    main = smin(main, sdCapsule(mainPos, vec3(-0.5, 0.0, 1.0), vec3(-1.0, -0.25, 2.25), 0.5, 1.0, 2.5), 0.5);
    main = smin(main, sdSphere(rpos + vec3(-0.2, 0.7, -0.3), 0.7), 0.1);
    
    float hand = smin(smin(smin(main, fingers, 0.2), f5, 0.9), arm, 0.5);
    
    float d = textureLod(iChannel2, (pos.xy - pos.z*0.2) * vec2(0.2, 0.1) + vec2(0.1, 0.0), 0.0).x;
    hand += d * 0.135;
    
    float sphere = sdSphere(pos + vec3(0.45, -1.35, 0.0), 2.0);
    
    float pedestal = box(pos + vec3(0.0, 12.0, 0.0), vec3(3.0, 6.0, 3.0));
    pedestal = min(pedestal, box(pos + vec3(0.0, 12.5, 0.0), vec3(4.0, 6.0, 4.0)));
    
    return vec2(smin(min(hand, sphere), pedestal, 0.5), sphere);
}

vec4 rayMarch(vec3 rayDir, vec3 cameraOrigin)
{
    const int maxItter = 100;
	const float maxDist = 30.0;
    
    float totalDist = 0.0;
	vec3 pos = cameraOrigin;
	vec2 dist = vec2(epsilon, 1.0);
    float accum = 0.0;
    
    for(int i = 0; i < maxItter; i++)
	{
       	dist = distfunc(pos);
        
		totalDist += dist.x; 
		pos += dist.x * rayDir;
        accum += smoothstep(2.0, 0.0, dist.y);
        
        if(dist.x < epsilon || totalDist > maxDist)
		{
			break;
		}
	}
    
    return vec4(dist.x, totalDist, saturate(accum / 100.0), dist.y);
}

//Original From https://www.shadertoy.com/view/Xds3zN
float AO(vec3 pos, vec3 n)
{
	float res = 0.0;
    
	for( int i=1; i<4; i++ )
	{
		vec3 aopos = pos + n*0.15*float(i);
		float d = distfunc(aopos).x;
		res += d;
	}

	return clamp(res, 0.0, 1.0);   
}

//Original From https://www.shadertoy.com/view/Xds3zN
mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

//Original From https://www.shadertoy.com/view/Xds3zN
float softshadow(vec3 pos, vec3 lDir)
{
	float res = 1.0;
    float t = 0.25;
    
    for( int i=0; i<8; i++ )
    {
		float h = distfunc( pos + lDir*t ).x;
        res = min( res, 2.0*h/t );
        t += clamp( h, 0.02, 1.0 );
        if( h<0.001 || t>5.0 ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

//Original From https://www.shadertoy.com/view/Xds3zN
vec3 calculateNormals(vec3 pos)
{
	vec2 eps = vec2(0.0, epsilon);
	vec3 n = normalize(vec3(
	distfunc(pos + eps.yxx).x - distfunc(pos - eps.yxx).x,
	distfunc(pos + eps.xyx).x - distfunc(pos - eps.xyx).x,
	distfunc(pos + eps.xxy).x - distfunc(pos - eps.xxy).x));
	return n;
}

vec3 lighting(vec3 n, vec3 rayDir, vec3 reflectDir, vec3 pos, vec3 lDir)
{
    float diff = max(0.0, dot(lDir, n));
    float spec = pow(max(0.0, dot(reflectDir, lDir)), 50.0);
    float rim = (1.0 - max(0.0, dot(-n, rayDir)));

    return vec3(diff, spec, rim); 
}

vec3 triPlanar(vec3 pos, vec3 norm, sampler2D tex)
{
    norm = abs(norm);
    vec3 t1 = texture(tex, pos.yz).xyz * norm.x;
    vec3 t2 = texture(tex, pos.zx).xyz * norm.y;
    vec3 t3 = texture(tex, pos.xy).xyz * norm.z;
    
    return t1 + t2 + t3;
}

vec3 background(vec3 rayDir, vec3 sun)
{
    vec3 r = rayDir;
    r.xz *= 0.1;
    r.y *= 0.025;
    float t1 = texture(iChannel2, vec2(abs(atan(r.x, r.z)) + iTime * 0.01, r.y)).x;
    r *= 2.0;
    float t2 = texture(iChannel2, vec2(abs(atan(r.x, r.z)) - iTime * 0.025, r.y) + t1 * 0.1).x;
    r *= 2.0;
    float t3 = texture(iChannel2, vec2(abs(atan(r.x, r.z)) + iTime * 0.05, r.y) + t2 * 0.1).x;
    
    float t = (t1 + t2 + t3) / 3.0;
        
    vec2 m = smoothstep(vec2(-0.5, 0.0), vec2(0.0, 0.75), rayDir.yy);
    return mix(mix(groundColor, backgroundColor + t, m.x), topColor, m.y) + sun;
}

vec3 ambiant(vec3 rayDir, vec3 sun)
{
    vec2 m = smoothstep(vec2(-0.5, 0.0), vec2(0.0, 0.75), rayDir.yy);
    return mix(mix(groundColor, backgroundColor, m.x), topColor, m.y) + sun;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy/iResolution.xy;
    
    vec2 m;
    
    if(iMouse.w > 0.0)
    {
        m = iMouse.xy / iResolution.xy;
        m.x *= 720.0;
    	m.y = (m.y * 2.0 - 1.0) * -50.0;
    }
    else
    {
        m.x = iTime * 20.0;
        m.y = sin(iTime * 0.5) * 20.0;
    }
        
    vec3 cameraOrigin = vec3(0.0, -2.0, 14.0);
    cameraOrigin = Rotate(cameraOrigin, RotationToQuaternion(vec3(0.0, 1.0, 0.0), m.x));
    vec3 v = Rotate(vec3(1.0, 0.0, 0.0), RotationToQuaternion(vec3(0.0, 1.0, 0.0), m.x));
    cameraOrigin = Rotate(cameraOrigin, RotationToQuaternion(v, m.y));
        
	vec3 cameraTarget = vec3(0.0, -2.0, 0.0);
    
	vec2 screenPos = uv * 2.0 - 1.0;
    
	screenPos.x *= iResolution.x/iResolution.y;
    
    mat3 cam = setCamera(cameraOrigin, cameraTarget, 0.0);
    
    vec3 rayDir = cam*normalize(vec3(screenPos.xy, 2.0));
    vec4 dist = rayMarch(rayDir, cameraOrigin);
             
    vec3 light = normalize(Rotate(LightDir, RotationToQuaternion(vec3(0.0, 1.0, 0.0), iTime * -50.0))); 
    vec3 sun = (1.0 - clamp(length(rayDir - light)*0.5, 0.0, 1.0)) * lightColor * 0.25;
    
    vec3 bg = background(rayDir, sun);
    vec3 res;

	if(dist.x < epsilon)
    {
        vec3 pos = cameraOrigin + dist.y*rayDir;
        vec3 n = calculateNormals(pos);
        vec3 t = vec3(0.0); /* triPlanar(pos*0.2, n.xyz, iChannel1) */;
        float tm = (t.x + t.y + t.z)/3.0; 
        float tr = smoothstep(0.7, 1.0, tm) + 0.25 * tm;
        
        n = normalize(n + (tm - 0.5) * 0.5);
        
        vec3 mask;
        mask.x = 1.0 - saturate(dist.w*3.0);
        mask.yz = smoothstep(vec2(-6.1, -14.0), vec2(-5.8, -5.0), pos.yy);
        
        vec3 r = reflect(rayDir, n.xyz);
		vec3 l = lighting(n.xyz, rayDir, r, pos, light);
        vec3 refl = texture(iChannel0, r).xyz;
        
        float shadow = softshadow(pos, light);
        l.xy *= shadow;
        l.y *= tr;
        refl *= tr;
        
        float ao = AO(pos, n.xyz);
        ao = saturate(ao + l.x + mask.x*0.5);
        
        vec3 alb = mix(color1, color2, mask.x);
        alb *= 0.5 + 0.5 * tm;
        alb = mix(color3 * tm, alb, mask.y);
        
        vec3 amb = ambiant(n, sun) * ao;
        vec3 col = alb * amb;
        
        col += alb * l.x * lightColor; //Diffuse
		col += (smoothstep(0.3, 0.9, l.z) * (alb*0.75 + 0.25) + l.z * 0.25) * mask.y * amb; //Rim Light
        col += (mix(refl*0.75, refl, mask.x) + l.y) * ao * (0.5 + l.z); //Reflection
        
        vec2 v = vec2(0.25, 0.5) + vec2(0.75, 0.5) * smoothstep(vec2(0.0, 0.0), vec2(0.1 ,0.3), l.zz);
        col *= mix(1.0, mix(v.x, v.y, mask.x), mask.y);
        
        res = mix(bg, vec3(col), mask.z);
    }
    else
    {
        res = bg; 
    }
    
    res += saturate(dist.z - 0.05) * color2 * 2.0;
	fragColor = vec4(res, 1.0) * smoothstep(3.0, 0.0, length(screenPos));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
