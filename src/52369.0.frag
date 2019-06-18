/*
 * Original shader from: https://www.shadertoy.com/view/WsBGDm
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

// --------[ Original ShaderToy begins here ]---------- //
float eps = 0.0001;
const int steps = 32;
float minDist = 0.01;
float maxDist = 10.0;
float delta = 1.0;

float foldingLimit = 1.0;
const float minRadius =  0.5;
const float minRadius2 = minRadius*minRadius;

const float fixedRadius = 1.0;
const float fixedRadius2 = fixedRadius*fixedRadius;

const int Iterations = 5;
float Scale = 1.5;

void sphereFold(inout vec3 z, inout float dz) {
	float r2 = dot(z,z);
	if (r2<minRadius2) { 
		// linear inner scaling
		float temp = (fixedRadius2/minRadius2);
		z *= temp;
		dz*= temp;
	} else if (r2<fixedRadius2) { 
		// this is the actual sphere inversion
		float temp =(fixedRadius2/r2);
		z *= temp;
		dz*= temp;
	}
}

void boxFold(inout vec3 z, inout float dz) {
	z = clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

float mandelbox(vec3 z)
{
	vec3 offset = z;
	float dr = 1.0;
	for (int n = 0; n < Iterations; n++) {
		boxFold(z,dr);       
		sphereFold(z,dr);    
		z=Scale*z + offset;  
        dr = dr*abs(Scale)+1.0;
	}
	float r = length(z);
	return r/abs(dr);
}

float world(vec3 p){
  return mandelbox(p);
}
    
float trace(vec3 origin,vec3 direction){
    float distTraveled = minDist;
   
    for(int i=0;i<steps;i++){
   		vec3 point = origin + direction * distTraveled;
        float dist = world(point);
        if(dist<eps){
            return distTraveled;
        }
       	distTraveled += dist * delta;
       
    }
    return distTraveled;
}

float shadow(vec3 ro,vec3 rd,float mint,float maxt,float k)
{
    float res = 1.0;
    float ph = 1e20;
    float t=mint;
    for(int i = 0; i < steps; i++)
    {
        float h = world(ro + rd*t);
        if( h<0.001 )
            return 0.0;
        float y = h*h/(2.0*ph);
        float d = sqrt(h*h-y*y);
        res = min( res, k*d/max(0.0,t-y) );
        ph = h;
        t += h;
        if (t < maxt)
	    break ;
    }
    return res;
}

vec3 calcNormal(vec3 p) {   
    return normalize(vec3(
        world(vec3(p.x + eps, p.y, p.z)) - world(vec3(p.x - eps, p.y, p.z)),
        world(vec3(p.x, p.y + eps, p.z)) - world(vec3(p.x, p.y - eps, p.z)),
        world(vec3(p.x, p.y, p.z  + eps)) - world(vec3(p.x, p.y, p.z - eps))
    ));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    uv  = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    
    vec3 lookingTo = vec3(0.,0.,0.);
    float it = iTime / 10.;
    vec3 viewer = vec3(
        0.1+sin(it/2.5) * 1.,
        0.2+cos(it/3.0) * 1.,
        sin(it/3.5) * 1.
    );
    
    vec3 forward = normalize(lookingTo-viewer);
    vec3 rigth = cross(vec3(0.0,1.0,0.0),forward);
    vec3 up = cross(forward,rigth);
    
    vec3 direction = normalize(forward *2.0 + rigth * uv.x + up * uv.y);
    float dist = trace(viewer,direction); 
	vec3 color = vec3(0.0);    
	float fog = 1.0 / (1.0 + dist);
    color = vec3(fog);
	fragColor = vec4(color,1.0);

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
