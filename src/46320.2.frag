/*
 * Original shader from: https://www.shadertoy.com/view/4sKcDy
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
#define MAXDIST 1150.
#define GIFLENGTH 1.570795
#define COL vec3(0.)

struct Ray {
	vec3 ro;
    vec3 rd;
};

    vec2 map(vec3 pos);

    
// Functions by iq
// --------------------------------------------------
    
float opU( float d1, float d2 )
{
    return min(d1,d2);
}

vec2 opU( vec2 d1, vec2 d2 )
{
    return d1.x < d2.x ? d1 : d2;
}

float opS( float d1, float d2 )
{
    return max(-d1,d2);
}


float smin( float a, float b, float k ){
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}


float sdCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xy),p.z)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec3 calcNormal(vec3 pos) 
{
	vec3 eps = vec3(0.001, 0.0, 0.0);
                          
    return normalize(
        vec3(map(pos + eps).x - map(pos - eps).x,
             map(pos + eps.yxz).x - map(pos - eps.yxz).x,
             map(pos + eps.yzx).x - map(pos - eps.yzx).x ) 
    );
}

float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i = 0; i < 5; i++ )
    {
        float hr = 0.05*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= .95;
    }
    return clamp( 1.0 - 2.0*occ, 0.0, 1.0 );    
}

// --------------------------------------------------


vec2 map(vec3 pos) {
    
    float l = length(pos);
	float sf = .5;
	const int layers = 7;
	vec3 dir = vec3(0.,1.,0.);
    vec2 dist = vec2(1e20,0.);
   
    pos.xy += vec2(sin(pos.z*3.14159*2.), cos(pos.z*3.14159*2.))*0.025;
    
    for (int i = layers+1; i > 0; i--)
    {
        // The normalized modulated time based on progress toward the GIFLENGTH define based on the current layer
        float t = 1.-smoothstep(0.,1.,mod(iTime/float(layers) + (float(i)/float(layers))*GIFLENGTH, GIFLENGTH)/GIFLENGTH);
 
        // The scale of the current cylinder
        float s = pow(sf,1.+t*float(layers+1));
        float radius = s;
       
        // Create a position that is offset
        vec3 p = pos - dir*s;

        // Repeat the z axis, dividing the space into cells relative to the current layer
        p.z = mod(pos.z-s*2., s*4.) - s*2.;
        
        // Reduce the gap between the cylinders when it's rly small or rly big
		s += s*smoothstep(0.65, 1., 1.-t)*1.5;
        s += s*smoothstep(0.45, 0.25, 1.-t)*2.;
        
        radius += cos(pos.z*3.14159*2.+iTime*4.+t)*0.0025;
			
        float tunnelDist = sdCylinder(p, vec2(radius, s));
        tunnelDist = opS(tunnelDist, sdCylinder(p, vec2(radius*1.1,s*0.9)));
        dist = opU(dist, vec2(tunnelDist, 1.-t));
    }
    
    return dist;
}

vec2 march(Ray ray) 
{
    const int steps = 45;
    const float prec = 0.001;
    vec2 res = vec2(0.);
    
    for (int i = 0; i < steps; i++) 
    {        
        vec2 s = map(ray.ro + ray.rd * res.x);
        
        if (res.x > MAXDIST || s.x < prec) 
        {
        	break;    
        }
        
        res.x += s.x;
        res.y = s.y;
        
    }
   
    return res;
}

vec3 render(Ray ray) 
{
    vec3 col = COL;
	vec2 res = march(ray);
   
    if (res.x > MAXDIST) 
    {
        return col;
    }
    
    vec3 pos = ray.ro+res.x*ray.rd;
    vec3 rd = normalize(ray.ro-pos);
    vec3 nor = calcNormal(pos);
    
    // Color the surface based on what layer the ray intersects with
    col = 1.-vec3(calcAO(pos, nor))*clamp(0.,1.,res.y);
    col = mix(col, COL, clamp( res.x*0.5, 0., 1.));
   	return col;
}
mat3 camera(in vec3 ro, in vec3 rd, float rot) 
{
	vec3 forward = normalize(rd - ro);
    vec3 worldUp = vec3(sin(rot), cos(rot), 0.0);
    vec3 x = normalize(cross(forward, worldUp));
    vec3 y = normalize(cross(x, forward));
    return mat3(x, y, forward);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    vec3 camPos = vec3(0.,.15+sin(iTime*4.)*0.01, .22+cos(iTime*4.)*0.01);
    vec3 camDir = camPos+vec3(0. + cos(iTime*4.)*0.01, -0.45 + sin(iTime*4.)*0.015, -1. );
    mat3 cam = camera(camPos, camDir, 0.);
    
    vec3 rayDir = cam * normalize( vec3(uv, 1.5 ));
    
    Ray ray;
    ray.ro = camPos;
    ray.rd = rayDir;
    
    vec3 col = render(ray);
    
	fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
