#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//=================================================================================================
// http://lgdv.cs.fau.de/uploads/publications/spherical_fibonacci_mapping_opt.pdf
//=================================================================================================
const float PI  = 3.14159265359;
const float PHI = 1.61803398875;

float myround( float x ) { return floor(x+0.5); }

vec2 inverseSF( vec3 p, float n ) 
{
    float m = 1.0 - 1.0/n;
    
    float phi = min(atan(p.y, p.x), PI), cosTheta = p.z;
    
    float k  = max(2.0, floor( log(n * PI * sqrt(5.0) * (1.0 - cosTheta*cosTheta))/ log(PHI+1.0)));
    float Fk = pow(PHI, k)/sqrt(5.0);
    vec2  F  = vec2( myround(Fk), myround(Fk * PHI) ); // k, k+1

    vec2 ka = 2.0*F/n;
    vec2 kb = 2.0*PI*( fract((F+1.0)*PHI) - (PHI-1.0) );    
    
    mat2 iB = mat2( ka.y, -ka.x, kb.y, -kb.x ) / (ka.y*kb.x - ka.x*kb.y);
    
    vec2 c = floor( iB * vec2(phi, cosTheta - m));
    float d = 8.0;
    float j = 0.0;
    for( int s=0; s<4; s++ ) 
    {
        vec2 uv = vec2( float(s-2*(s/2)), float(s/2) );
        
        float i = dot(F, uv + c); // all quantities are ingeters (can take a round() for extra safety)
        
        float phi = 2.0*PI*fract(i*PHI);
        float cosTheta = m - 2.0*i/n;
        float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
        
        vec3 q = vec3( cos(phi)*sinTheta, sin(phi)*sinTheta, cosTheta );
        float squaredDistance = dot(q-p, q-p);
        if (squaredDistance < d) 
        {
            d = squaredDistance;
            j = i;
        }
    }
    return vec2( j, sqrt(d) );
}


mat2 rmat(float r)
{
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}


float sphere(vec3 p, float r)
{
	return length(p)-r;	
}


float map(vec3 position)
{	
	return sphere(position, 1.);
}


vec3 derivative(in vec3 p)
{
	vec2 offset 	= vec2(0., .0005);

	vec3 derivative 	= vec3(0.);
	derivative.x 	= map(p+offset.yxx)-map(p-offset.yxx);
	derivative.y 	= map(p+offset.xyx)-map(p-offset.xyx);
	derivative.z 	= map(p+offset.xxy)-map(p-offset.xxy);
	
	return derivative;
}


float lattice(vec3 position)
{
	position.xz 		*= rmat(time*.125);
	
	vec3 gradient 		= derivative(position);
	vec3 normal 		= normalize(gradient);

	float scale		= floor(512.*abs(cos(time*.1)));
	
	vec2 spiral	 	= inverseSF(normal, scale);

	float point_index	= spiral.x; 				//integer index - starting at the pole and counting out - each next point is the next closest - white hilight
	float distance_to_point = spiral.y;				//distance to nearest point (looks like scales / voronoii)
	float dots		= float(distance_to_point < .0125);
	
	float inner_bound	=  sphere(position, 1.475);
	float outer_bound	=  sphere(position, 1.5);
	
	return max(-inner_bound, max(outer_bound, distance_to_point-.025));
}


vec3 lattice_derivative(in vec3 p)
{
	vec2 offset 	= vec2(0., .0005);

	vec3 derivative 	= vec3(0.);
	derivative.x 	= lattice(p+offset.yxx)-lattice(p-offset.yxx);
	derivative.y 	= lattice(p+offset.xyx)-lattice(p-offset.xyx);
	derivative.z 	= lattice(p+offset.xxy)-lattice(p-offset.xxy);
	
	return derivative;
}


void main( void ) 
{
	vec2 uv 			= gl_FragCoord.xy/resolution.xy;
	vec2 aspect		= resolution/min(resolution.x, resolution.y);
	
	vec2 p			= (uv    * 2. - 1.) * aspect;
	vec2 m			= (mouse * 2. - 1.) * aspect;

	vec3 target		= vec3(0.);
	vec3 origin		= vec3(0., 0., -3.);
	
	vec3 position		= origin;

	vec3 w        		= normalize(target-origin);
	vec3 u          		= normalize(cross(w,vec3(0.,1.,0.)));
	vec3 v          		= normalize(cross(u,w));
	
	float fov		= 1.6;

	vec3 direction     	= normalize(-p.x * u + p.y * v + fov * w);
		
	float bound		= 32.;
	float surface_distance	= bound;
	float ray_length		= 0.;

	for(int i = 0; i < 64; i++)
	{
		if(bound >= surface_distance && surface_distance > 0.001)
		{
			surface_distance 	= lattice(position);
			ray_length 		+= surface_distance;
			position 		= origin + direction * ray_length;	
		}
	}
	
	bool intersection	= surface_distance < 0.001;
	
	float depth 		= (sqrt(3.)/ray_length);
	
	vec3 gradient 		= lattice_derivative(position);
	vec3 normal		= normalize(gradient);
	
	
	vec3 light_position	= vec3(2., 4., -13.);
	vec3 light_direction	= normalize(light_position-position);
	
	float incident_light	= max(dot(normal, light_direction), 0.);
		
	
	vec4 result		= vec4(1.);
	result.xyz		*= depth * incident_light;
	
	
	gl_FragColor		= result;
}//sphinx + props to abductee for inverse spherical fibonacci
