#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


mat2 rmat(in float t)
{
	float c = cos(t);
	float s = sin(t);
	return mat2(c, s, -s, c);
}


float bound(float x)
{
    return max(x, pow(2., -23.));
}

float fold(in float x)
{
    return bound(abs(fract(x)-.5));
}

vec3 fold(in vec3 p)
{
    return vec3(fold(p.x), fold(p.y), fold(p.z));
}

float tf(in vec3 p, in float f, in float a)
{
    float n = 0.;
    float q = 8.85;

    for(int i = 0; i < 6; i++)
    {
        vec3 tp     = p * f;
        tp          += fold(tp.zzy+fold(tp.yxx*-2.));
        float fl    = fold(tp.z*2.+fold(tp.x+fold(tp.y)))/.125-.05;
        n           = abs(a-n-fl*a);
        a           *= .125;
        f           *= q;
        q           -= .25;
    }
    return n;
}

float hash(vec2 uv)
{
    return fract(cos(uv.x+sin(uv.y))*12345.6789);
}

vec2 neighbor_offset(float i)
{
	float x = floor(i/3.);
	float y = mod(i, 3.);
	return vec2(x,y)-1.;
}

float voronoi (vec2 p) 
{
	vec2 g = floor(p);
	vec2 f = fract(p);
	float res = 1.;
	vec2 bb = vec2(0.);
	
	for(int i = 0; i < 9; i++) 
	{
		vec2 b 	= neighbor_offset(float(i));
		float h = distance(hash(g+b)+b, f);
		res 	= min(res, h);
	}
	return res;
}


float map(vec3 position)
{
	position	*= 1.75;

	float v 	= 0.;
	float f 	= .33;
	float a 	= .33;
	for(int i = 0; i < 4; i++)
	{
		v += voronoi(v + position.xz * f) * a;
		f *= 2.;
		a *= .5;
	}
	
	v = abs(.5-v);
	v += tf(position + vec3(sin(v), v, cos(v)), v, .125) * .0625;
	return position.y + v * 2.;
}


float shadow(vec3 p, vec3 d)
{
	const int iterations	= 8;
 	float e       		= .075;
	const float u		= .25;  		   
    	float s 		= 1.;         
    	for( int i=0; i < iterations; i++ )
    	{
    		float l = map(p + d * e);
		l 	= l < 0. ? l - l * .5 : l;
		
    		s 	= min(s, u*l/e);
    	    	e 	+= .00025;
    	}
	return clamp(s, 0.125, 1.);
}

float occlusion( in vec3 p, in vec3 n )
{
	
  	float occ = 0.0;
  	float sca = 1.;
  	for ( int i=0; i < 8; i++ )
  	{
  		float hr = 0.125 * sca * float(i);
    		float dd = map(n * hr + p);
    		occ += -(dd-hr)*sca;
    		sca *= 0.5;
  	}
  	return clamp( 1.0 - 3.0 * occ, 0.75, 1.0 );
}

vec3 derive(in vec3 position, in float range)
{
	vec2 offset     = vec2(0., range);
	vec3 normal     = vec3(0.);
	normal.x    	= map(position+offset.yxx)-map(position-offset.yxx);
	normal.y    	= map(position+offset.xyx)-map(position-offset.xyx);
	normal.z    	= map(position+offset.xxy)-map(position-offset.xxy);
	return normalize(normal);
}


void main( void ) 
{
	vec2 aspect		= resolution.xy/resolution.yy;
	
	vec2 uv 		= gl_FragCoord.xy/resolution.xy;
	uv 			= (uv - .5) * aspect;
	
	vec2 m			= (mouse-.5) * aspect;
	
	
	
	vec3 direction  	= normalize(vec3(uv, 1.));
	
	direction.xz 		*= rmat(mouse.x*6.28);
	direction.y 		+= (mouse.y-.5) * .5;
	vec3 origin		= vec3(0.);
	vec3 position		= origin;
	
	
	
	//raytrace
	float range		= 0.;
	float total_range	= 0.;
	float minimum_range	= .0001;
	float max_range		= 6.;
	float closest_range	= max_range;
	float edge		= 0.;
	for(int count = 0; count < 64; count++)
	{
		range 		= map(position);
		range 		= range < 0. ? range - range * .5 : range;
			
		
		range	 	*= .8;		//slow down ray
		minimum_range	*= 1.03;	//relax surface
		
		total_range	+= range;
		
		position 	= origin + direction * total_range;	
		
		if(closest_range > range)
		{
			edge += 1./64.;	
		}
		
		closest_range	= min(closest_range, abs(range));
		
		
		if(range < minimum_range || total_range > max_range)
		{
			break;	
		}
		
		
		
	}
	
	
	//shade
	vec3 background_color 	= vec3(.275, .275, .45) - uv.y * .5;
	vec3 material_color	= vec3(.8, .45, .25) * 1.5;
	
	vec3 color 		= background_color;
	if(total_range < max_range)
	{
		vec3 normal	 	= derive(position, minimum_range);
	
		vec3 light_position 	= vec3(2.,4., 3.);
		vec3 light_direction	= normalize(light_position-position);
		
		float light		= max(dot(normal, light_direction), 0.);
		
		
		color 			+= material_color * light;
		color 			+= max(material_color/total_range, .25);
		color			*= shadow(position, light_direction);
		color 			*= occlusion(position, normal);
		color 			-= 3. * edge * background_color;
	}
	else
	{
		color += material_color * edge;	
	}
		
	
	gl_FragColor 		= vec4(color, 1.);
}//sphinx
