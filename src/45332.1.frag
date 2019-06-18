/*
 * Adapted from original shader: https://www.shadertoy.com/view/ldcyW4
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
const vec4 iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //
const float epsilon = 0.01;
const float pi = 3.14159265359;
const float halfpi = 1.57079632679;
const float twopi = 6.28318530718;

#define LIGHT normalize(vec3(1.0, 1.0, 0.0))

//Quatertion Formula taken from http://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec4 RotationToQuaternion(vec3 axis, float angle)
{
    float half_angle = angle * halfpi / 180.0;
    vec2 s = sin(vec2(half_angle, half_angle + halfpi));
    return vec4(axis * s.x, s.y);
}

vec3 Rotate(vec3 pos, vec3 axis, float angle)
{
    axis = normalize(axis);
	vec4 q = RotationToQuaternion(axis, angle);
    return pos + 2.0 * cross(q.xyz, cross(q.xyz, pos) + q.w * pos);
}

mat2 Rot(float a) 
{
    vec2 s = sin(vec2(a, a + pi/2.0));
    return mat2(s.y,s.x,-s.x,s.y);
}

//Distance Field function by iq :
//http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdSphere(vec3 p, float s)
{
  return length(p) - s;
}

float sdEllipsoid( in vec3 p, in vec3 r) 
{
    return (length(p/r ) - 1.) * min(min(r.x,r.y),r.z);
}

vec3 opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
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

float Claws(vec3 pos, vec3 size, vec4 angles)
{
    vec2 s = normalize(vec2(10.0, 1.0));
    float height = 5.0;
    vec3 a =  pos.y * angles.w + angles.xyz;
    float c1 = sdEllipsoid(Rotate(pos, vec3(0.0, 0.0, 1.0), a.x), size);
    float c2 = sdEllipsoid(Rotate(pos + vec3(0.0, 0.0, size.x), vec3(1.0, 0.0, 1.0), a.y), size);
    float c3 = sdEllipsoid(Rotate(pos - vec3(0.0, 0.0, size.x), vec3(-1.0, 0.0, 1.0), a.z), size);
    
    return max(min(min(c1, c2), c3), pos.y);
}

float Leg(vec3 pos, vec3 axis, float angle, vec3 size, vec4 angles)
{
    pos = Rotate(pos, axis, angle);
    float claw = Claws(pos + vec3(0.0, size.y*0.5, 0.0), vec3(0.075, 0.75, 0.075)*size.y, angles);
    float leg = sdEllipsoid(pos, size);
    return min(leg, claw);
}

float Teeth(vec3 pos)
{
    vec3 polarPos;
    polarPos.x = atan(pos.x, pos.y) / 3.14;
    polarPos.y = length(pos.xy)-0.12;
    polarPos.z = pos.z;
    
    vec3 p = opRep(polarPos, vec3(0.25, 7.0, 0.0));
    p.y = polarPos.y;
    p.z = pos.z;
    
    return sdEllipsoid(p, vec3(0.07, 0.05, 0.07));
}

float ZCylindricalDisplace(vec3 pos, vec2 size)
{
    vec2 uv;
    uv.x = (atan(pos.x, pos.y));
    uv.y = pos.z;
    float m = smoothstep(0.1, 1.0, length(pos.xy)) * smoothstep(-1.0, -0.75, cos(uv.x));
    
    return 0.5 * m;
}

vec3 TransformPosition(vec3 pos)
{
    pos.yz *= Rot((pos.z + 2.0)*sin(iTime*0.3)*0.2);
    pos.xy *= Rot(pos.z*sin(iTime*0.1)*0.25);
    pos.y -= 0.5 + sin(iTime*0.5)*0.2; 
    
    return pos;
}

float Tardigrade(vec3 pos)
{ 
	pos = TransformPosition(pos);
    float s = 0.01;
    
    //Body
    float bodyCenter = sdEllipsoid(Rotate(pos, vec3(1.0, 0.0, 0.0), 10.0), vec3(1.2,0.9,1.0));
    float bodyFront = sdEllipsoid(Rotate(pos + vec3(0.0, 0.1, 0.8), vec3(1.0, 0.0, 0.0), 20.0), vec3(1.0,0.7,0.9));
    float bodyFront2 = sdEllipsoid(Rotate(pos + vec3(0.0, 0.3, 1.5), vec3(1.0, 0.0, 0.0), 40.0), vec3(0.7,0.5,0.7));
    float bodyBack = sdEllipsoid(Rotate(pos + vec3(0.0, 0.0, -0.6), vec3(1.0, 0.0, 0.0), -10.0), vec3(1.0,0.75,1.0));
    float bodyBackHole = sdEllipsoid(pos + vec3(0.0, 0.2, -1.5), vec3(0.03,0.03,0.5));
    
    float body = smax(smin(smin(bodyCenter, smin(bodyFront, bodyFront2, s), s), bodyBack, s), -bodyBackHole, 0.15);
    body -= ZCylindricalDisplace(pos + vec3(0.0, 0.3, 0.0), vec2(0.05, 0.25)) * 0.15;
    
    //Mouth
    float mouth0 = sdSphere(pos + vec3(0.0, 0.7, 2.25), 0.15);
    float mouth1 = sdEllipsoid(pos + vec3(0.0, 0.6, 2.125), vec3(0.22,0.175,0.175));
    float mouth2 = sdEllipsoid(pos + vec3(0.0, 0.67, 2.25), vec3(0.125,0.1,0.2));
    float teeth0 = Teeth(Rotate(pos + vec3(0.0, 0.62, 2.15), vec3(1.0, 0.0, 0.0), 35.0));
     
    //Head
    float head = sdEllipsoid(Rotate(pos + vec3(0.0, 0.45, 1.9), vec3(1.0, 0.0, 0.0), 50.0), vec3(0.45,0.3,0.5));
    head = min(smax(smin(mouth1, smax(head, -mouth0, 0.3), s), -mouth0, 0.02), teeth0);
    
    vec3 symPos = vec3(-abs(pos.x), pos.y ,pos.z); 
    vec3 p;
    
    //Legs
    p = Rotate(symPos + vec3(0.75, 0.5, -1.15), vec3(1.0, 0.0, -1.0), 20.0);
    float leg0 = Leg(p, vec3(1.0, 0.0, 0.0), 0.0, vec3(0.2,0.5,0.25), vec4(20.0, -10.0, -10.0, 30.0));
    
    p = Rotate(symPos + vec3(1.0, 0.55, 0.0), vec3(1.0, 0.0, -1.0), 10.0);
    float leg1 = Leg(p, vec3(1.0, 0.0, 0.0), 0.0, vec3(0.3,0.6,0.35), vec4(25.0, -5.0, -10.0, 40.0));
    
    p = Rotate(symPos + vec3(0.9, 0.6, 1.0), vec3(1.0, 0.0, 1.0), -5.0);
    float leg2 = Leg(p, vec3(1.0, 0.0, 0.0), 0.0, vec3(0.2,0.5,0.25), vec4(15.0, -10.0, -5.0, 35.0));

    p = Rotate(symPos + vec3(0.55, 0.7, 1.7), vec3(1.0, 0.0, 0.0), -10.0);
    float leg3 = Leg(p, vec3(1.0, 0.0, 0.0), 0.0, vec3(0.15,0.3,0.15), vec4(15.0, -15.0, -15.0, 50.0));
    
    float legs = min(min(min(leg0, leg1), leg2), leg3);
    
    body = smin(body, legs, 0.05);

    float res = smin(body, head, s);
    
	return res;
}

vec3 RayMarch(vec3 rayDir, vec3 cameraOrigin)
{
    const int maxItter = 128;
	const float maxDist = 30.0;
    
    float totalDist = 0.0;
	vec3 pos = cameraOrigin;
	float dist = epsilon;
    float itter = 0.0;
    
    for(int i = 0; i < maxItter; i++)
	{
       	dist = Tardigrade(pos);
        itter += 1.0;
		totalDist += dist; 
		pos += dist * rayDir;
        
        if(dist < epsilon || totalDist > maxDist)
		{
			break;
		}
	}
    
    return vec3(dist, totalDist, itter/128.0);
}

float AO(vec3 pos, vec3 n)
{
	float res = 0.0;
    vec3 aopos = pos;
    
	for( int i=0; i<3; i++ )
	{   
        aopos = pos + n*0.2*float(i);
		float d = Tardigrade(aopos);
		res += d;
	}

	return clamp(res, 0.0, 1.0);   
}


//Camera Function by iq :
//https://www.shadertoy.com/view/Xds3zN
mat3 SetCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr), 0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

//Normal and Curvature Function by Nimitz;
//https://www.shadertoy.com/view/Xts3WM
vec4 NorCurv(in vec3 p)
{
    vec2 e = vec2(-epsilon, epsilon);   
    float t1 = Tardigrade(p + e.yxx), t2 = Tardigrade(p + e.xxy);
    float t3 = Tardigrade(p + e.xyx), t4 = Tardigrade(p + e.yyy);

    float curv = .25/e.y*(t1 + t2 + t3 + t4 - 4.0 * Tardigrade(p));
    return vec4(normalize(e.yxx*t1 + e.xxy*t2 + e.xyx*t3 + e.yyy*t4), curv);
}

vec3 Lighting(vec3 n, vec3 rayDir, vec3 reflectDir, vec3 pos)
{
    float diff = max(0.0, dot(LIGHT, n));
    float spec = pow(max(0.0, dot(reflectDir, LIGHT)), 10.0);
    float rim = (1.0 - max(0.0, dot(-n, rayDir)));

    return vec3(diff, spec, rim)*0.5; 
}

float TriplanarTexture(vec3 pos, vec3 n)
{
    return 0.0; 
}

float BackGround(vec3 rayDir)
{
   	float sun = smoothstep(1.0, 0.0, clamp(length(rayDir - LIGHT), 0.0, 1.0));
    
    return sun*0.5;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy/iResolution.xy;
    
    vec3 cameraOrigin = vec3(0.0, 0.0, 0.0);
    
    if(iMouse.z > 0.0)
    {
    	cameraOrigin.x = sin(iMouse.x*0.01) * 5.0;
    	cameraOrigin.y = iMouse.y*0.05 - 10.0;
    	cameraOrigin.z = cos(iMouse.x*0.01) * 5.0;  
    }
    else    
    {
        cameraOrigin.x = sin(iTime*0.25 + 2.0) * (6.0 + sin(iTime * 0.1));
    	cameraOrigin.y = sin(iTime*0.3) - 0.5;
    	cameraOrigin.z = cos(iTime*0.25 + 2.0) * (6.0 + sin(iTime * 0.15)); 
    }
    
	vec3 cameraTarget = vec3(0.0, 0.25, -1.0);
    
	vec2 screenPos = uv * 2.0 - 1.0;
    
	screenPos.x *= iResolution.x/iResolution.y;
    
    mat3 cam = SetCamera(cameraOrigin, cameraTarget, sin(iTime*0.15)*0.5);
    
    vec3 rayDir = cam*normalize(vec3(screenPos.xy,2.0));
    vec3 dist = RayMarch(rayDir, cameraOrigin);
    
    float res;
	float backGround = BackGround(rayDir);
    
	if(dist.x < epsilon)
    {
        vec3 pos = cameraOrigin + dist.y*rayDir;
        vec4 n = NorCurv(pos);
        float ao = AO(pos, n.xyz);
        vec3 r = reflect(rayDir, n.xyz);
		vec3 l = Lighting(n.xyz, rayDir, r, pos);
        
        float col = TriplanarTexture(pos, n.xyz);
        col *= n.w*0.5+0.5;
        col *= ao;
        col += ao * (l.x + l.y);
        col += l.z*0.75;
        col += BackGround(n.xyz)*0.25;

        res = col;
    }
    else
    {
        res = backGround; 
    }
    
    fragColor = vec4(vec3(res), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
