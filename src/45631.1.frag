/*
 * Original shader from: https://www.shadertoy.com/view/Xt2XDh
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
const vec3 iMouse = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//Raymarch settings

#define MIN_DIST 0.004
#define MAX_DIST 16.0
#define MAX_STEPS 48
#define STEP_MULT 1.0
#define NORMAL_OFFS 0.02

//Scene settings
#define HAZE_COLOR vec3(0.0, 0.1, 0.2)

//Show the number of steps taken by each ray, (green ~= 0, red ~= MAXSTEPS)
//#define SHOW_RAY_COST

//if the current distance is far from an object, use an approximate distance.
//Boosts the framerate from ~30fps to 60fps in fullscreen on my machine.
#define APPROX_FAR_DIST

float pi = atan(1.0) * 4.0;
float tau = atan(1.0) * 8.0;

struct MarchResult
{
    vec3 position;
    vec3 normal;
    float dist;
    float steps;
};

//Returns a rotation matrix for the given angles around the X,Y,Z axes.
mat3 Rotate(vec3 angles)
{
    vec3 c = cos(angles);
    vec3 s = sin(angles);
    
    mat3 rotX = mat3( 1.0, 0.0, 0.0, 0.0,c.x,s.x, 0.0,-s.x, c.x);
    mat3 rotY = mat3( c.y, 0.0,-s.y, 0.0,1.0,0.0, s.y, 0.0, c.y);
    mat3 rotZ = mat3( c.z, s.z, 0.0,-s.z,c.z,0.0, 0.0, 0.0, 1.0);

    return rotX * rotY * rotZ;
}

//==== Distance field operators/functions by iq. ====
float opU( float d1, float d2 )
{
    return min(d1,d2);
}

float opS( float d1, float d2 )
{
    return max(-d1, d2);
}

float opI( float d1, float d2 )
{
    return max(d1,d2);
}

//polynomial smooth minimum
float opSU( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec3 opAngRep( vec3 p, float a )
{
	vec2 polar = vec2(atan(p.y, p.x), length(p.xy));
    polar.x = mod(polar.x + a / 2.0, a) - a / 2.0;
    
    return vec3(polar.y * vec2(cos(polar.x),sin(polar.x)), p.z);
}

float sdSphere( vec3 p, float s )
{
  return length(p) - s;
}

float sdPlane( vec3 p, vec4 n )
{
  return dot(p, normalize(n.xyz)) + n.w;
}

float sdCylinder( vec3 p, vec2 s)
{
    return max(abs(p.z) - s.y / 2.0,length(p.xy) - s.x);
}

float sdPole( vec3 p, float s)
{
    return length(p.xy) - s;
}

float sdBox( vec3 p, vec3 s )
{
    p = abs(p) - s / 2.0;
    return max(max(p.x,p.y),p.z);
}
//===================================================

//16 tooth gear
float dfGear16(vec3 p)
{
    float gear = sdCylinder(p , vec2(1.0,0.35));
    
    //Teeth
    vec3 rep = opAngRep(p, tau / 16.0);
    
    float tooth = opI(sdCylinder(rep - vec3(1.0,0.4,0), vec2(0.5,0.25)), sdCylinder(rep - vec3(1.0,-0.4,0), vec2(0.5,0.25)));
    tooth = opS(-sdCylinder(p,vec2(1.2,2.0)), tooth);
    
    gear = opU(gear, tooth);
    
    //Inner ring
    gear = opS(sdCylinder(p , vec2(0.8,0.5)), gear);
    
    gear = opU(gear, sdCylinder(p , vec2(0.3,0.35)));
    
    //Spokes
    vec3 rep2 = opAngRep(p, tau / 6.0);
    
    gear = opSU(gear, sdBox(rep2, vec3(1.5,0.2,0.1)),0.1);
    
    return gear;
}

//simplified 16 tooth gear (for border area)
float dfGear16s(vec3 p)
{  
    vec3 rep = opAngRep(p, tau / 16.0);
    
    float tooth = opI(sdCylinder(rep - vec3(1.0,0.4,0), vec2(0.5,0.25)), sdCylinder(rep - vec3(1.0,-0.4,0), vec2(0.5,0.25)));
    tooth = opS(-sdCylinder(p,vec2(1.2,2.0)), tooth);
    
    return tooth;
}

mat3 rot1 = mat3(0);
mat3 rot2 = mat3(0);

//Distance to the scene
float Scene(vec3 p)
{
    float d = -sdSphere(p, MAX_DIST);
    
    d = opU(d, sdPlane(p , vec4(0,0,-1,2)));
    
    vec3 pr = mod(p + 1.1, vec3(2.2)) - 1.1;
    
    //Checkerboard based gear rotation direction
    float di = step(0.0,cos(pi*p.x/2.2) * cos(pi*p.y/2.2));
    
    mat3 r1;
    mat3 r2;
    
    if(di > 0.0)
    {
    	r1 = rot1;
        r2 = rot2;
    }
    else
    {
    	r1 = rot2;
        r2 = rot1;
    }
    
    #ifdef APPROX_FAR_DIST
    if(sdCylinder(pr , vec2(1.5,0.45)) < 0.0)
    {
        //Center gear
        d = opU(d, dfGear16((pr - vec3( 0.0, 0.0, 0.0)) * r1));

        //Border gears
        d = opU(d, dfGear16s((pr - vec3(-2.2, 0.0, 0.0)) * r2));
        d = opU(d, dfGear16s((pr - vec3( 2.2, 0.0, 0.0)) * r2));
        d = opU(d, dfGear16s((pr - vec3( 0.0,-2.2, 0.0)) * r2));
        d = opU(d, dfGear16s((pr - vec3( 0.0, 2.2, 0.0)) * r2));
    }
    else
    {
    	d = opU(d, sdCylinder(pr , vec2(1.25,0.35)));
    }
    
    #else   
    //Center gear
    d = opU(d, dfGear16((pr - vec3( 0.0, 0.0, 0.0)) * r1));

    //Border gears
    d = opU(d, dfGear16s((pr - vec3(-2.2, 0.0, 0.0)) * r2));
    d = opU(d, dfGear16s((pr - vec3( 2.2, 0.0, 0.0)) * r2));
    d = opU(d, dfGear16s((pr - vec3( 0.0,-2.2, 0.0)) * r2));
    d = opU(d, dfGear16s((pr - vec3( 0.0, 2.2, 0.0)) * r2));   
    #endif
    
    
        //Shafts and supports
    d = opU(d, sdPole(pr, 0.15));
    d = opU(d, sdPole(pr.zxy - vec3(0.5,0.0,0.0), 0.15));
    d = opU(d, sdPole(pr.zyx - vec3(0.5,0.0,0.0), 0.15));
    d = opU(d, sdCylinder(pr - vec3(0,0,0.5), vec2(0.25,0.4)));
    
	return d;
}


//Surface normal at the current position
vec3 Normal(vec3 p)
{
    vec3 off = vec3(NORMAL_OFFS, 0, 0);
    return normalize
    ( 
        vec3
        (
            Scene(p + off.xyz) - Scene(p - off.xyz),
            Scene(p + off.zxy) - Scene(p - off.zxy),
            Scene(p + off.yzx) - Scene(p - off.yzx)
        )
    );
}

//Raymarch the scene with the given ray
MarchResult MarchRay(vec3 orig,vec3 dir)
{
    float steps = 0.0;
    float dist = 0.0;
    
    for(int i = 0;i < MAX_STEPS;i++)
    {
        float sceneDist = Scene(orig + dir * dist);
        
        dist += sceneDist * STEP_MULT;
        
        steps++;
        
        if(abs(sceneDist) < MIN_DIST)
        {
            break;
        }
    }
    
    MarchResult result;
    
    result.position = orig + dir * dist;
    result.normal = Normal(result.position);
    result.dist = dist;
    result.steps = steps;
    
    return result;
}

//Scene texturing/shading
vec3 Shade(MarchResult hit, vec3 direction, vec3 camera)
{
    vec3 color = vec3(0.7);
    
    //Lighting
    float ambient = 0.1;
    float diffuse = 0.4 * -dot(hit.normal, direction);
    float specular = 1.0 * max(0.0, -dot(direction, reflect(direction, hit.normal)));
    
    color *= vec3(ambient + diffuse + pow(specular, 8.0));
	
    //Fog / haze
    float sky = smoothstep(MAX_DIST - 1.0, 0.0, length(hit.position));
    float haze = 1.0 - (hit.steps / float(MAX_STEPS));
    
    vec3 skycol = mix(HAZE_COLOR, vec3(0), clamp(-hit.position.z * 0.2, 0.0, 1.0));
    
    color = mix(skycol, color, sky * haze);
    
    return color;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 res = iResolution.xy / iResolution.y;
	vec2 uv = fragCoord.xy / iResolution.y;
    
    rot1 = Rotate(vec3(0,0,iTime));
    rot2 = Rotate(vec3(0,0,-iTime - tau/32.0));
    
    //Camera stuff   
    vec3 angles = vec3(0);
    
    if(iMouse.z < 1.0)
    {
        angles.y = tau * (1.5 / 8.0);
        angles.x = iTime *-0.2;
    }
    else
    {    
    	angles = vec3((iMouse.xy / iResolution.xy) * pi, 0);
        angles.xy *= vec2(2.0, 1.0);
    }
    
    angles.y = clamp(angles.y, 0.0, tau / 4.0);
    
    mat3 rotate = Rotate(angles.yzx);
    
    vec3 orig = vec3(0, 0,-3) * rotate;
    orig -= vec3(0, 0, 0);
    
    vec3 dir = normalize(vec3(uv - res / 2.0, 0.5)) * rotate;
    
    //Ray marching
    MarchResult hit = MarchRay(orig, dir);
    
    //Shading
    vec3 color = Shade(hit, dir, orig);
    
    #ifdef SHOW_RAY_COST
    color = mix(vec3(0,1,0), vec3(1,0,0), hit.steps / float(MAX_STEPS));
    #endif
    
	fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
