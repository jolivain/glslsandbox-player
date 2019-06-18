#ifdef GL_ES
precision mediump float;
#endif

//almost

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define LEVELS 5

vec3 	barycentric(vec2 uv, float scale);
vec2 	cartesian(vec3 uvw, float scale);

vec2 	face_index(vec2 face, float power);
float 	face_address(vec2 face, float power);
float 	print_face_address(float address, vec2 position);
float 	print_face_index(vec2 index, vec2 position);

//lifted from http://glslsandbox.com/e#27090.0
float 	extract_bit(float n, float b);
float 	sprite(float n, vec2 p);
float 	digit(float n, vec2 p);	

void main( void ) 
{
	vec2 uv		= gl_FragCoord.xy/resolution.xy;
	

	float text	= 0.;
	float hilight 	= 0.;
	float address	= 0.;
	float grid	= 0.;
	vec2 face	= vec2(0.);
	float levels	= float(LEVELS);	

	for(int i = 0; i < LEVELS; i++)
	{
		float level		= float(i);
		float power		= pow(2., level);
		
		vec3 uvw		= barycentric(uv, power);
		vec3 m_uvw		= barycentric(mouse, power);

		vec2 uv_face		= cartesian(floor(uvw), power);
		vec2 m_face		= cartesian(floor(m_uvw), power);
	
		bool mouse_over		= uv_face == m_face;
	
		float width		= .00125*power/2.;
		grid			+= float(fract(uvw.x) < width || fract(uvw.y) < width || fract(uvw.z) < width) * 1./levels;
	
		
		vec2 uv_index		= face_index(uv_face, power);
		float uv_address	= face_address(uv_face, power);
		
		vec2 m_index		= face_index(m_face, power);
		float m_address		= face_address(m_face, power);
		
		
		vec2 position		= vec2(0.);
		
		text *= 0.;
		if(mouse_over)
		{
			position 	= floor(gl_FragCoord.xy-m_face*resolution);
			//text	 	*= 0.;	
			
			text 		-= print_face_index(m_index, position);
			
			hilight		+= 1./levels;
		}
		else
		{
			position	= floor(gl_FragCoord.xy-uv_face*resolution);
			position.x	-= 10.;
			position.y	+= level;
	
			text 		+= print_face_address(uv_address, position);	
		}
	
	
		//if(floor(gl_FragCoord.x) == floor(m_address*power+power * 3.))
		if(floor(gl_FragCoord.y) <= floor(m_address*power) && floor(levels-gl_FragCoord.x/16.) == floor(level))	
		//if(floor(gl_FragCoord.xy) == floor(m_index*power))	
		{
			address 	= 0.;
			address 	+= 1.;
			address		-= float(mod(floor(gl_FragCoord.y), power)==0.);
		}
		
		
		face			+= uv_face/levels;
	}
	
	vec4 result 	= vec4(0.);
	result.xy	+= face;
	result.z	+= hilight;
	result 		+= address	* .25;
	result		+= text 	* .25;
	result 		-= grid 	* .25;
	gl_FragColor 	= result;
} // sphinx 

vec3 barycentric(vec2 uv, float scale)
{
	uv 		*= scale;		
	uv.x 		*= 1.5;	
	uv.y		/= 2.;
	
	vec3 uvw	= vec3(0.);
	uvw.y		=  uv.x - uv.y;
	uvw.z		=    uv.y * 2.;
	uvw.x		=-(uv.x + uv.y);
	
	vec3 index	= floor(uvw);
	bool parity 	= mod(index.x, 2.) == 0. ^^ mod(index.y, 2.) == 0. ^^ mod(index.z, 2.) == 0.;
	uvw 		= parity ? 1.-uvw.yzx : uvw;
	
	return	uvw;
}

vec2 cartesian(vec3 uvw, float scale)
{
	vec3 index	= floor(uvw);
	bool parity 	= mod(index.x, 2.) == 0. ^^ mod(index.y, 2.) == 0. ^^ mod(index.z, 2.) == 0.;
	uvw 		= parity ? 1.-uvw.zxy : uvw;
	
	uvw.yx 		-= uvw.z;

	vec2 uv 	= vec2(0.);		
	uv.x 		=  uvw.y - uvw.x;
	uv.y		= -uvw.y - uvw.x;	
	uv		/= 3.;
	uv 		/= scale;
	
	return uv;
}


vec2 face_index(vec2 face, float power)
{
	vec2 index	= vec2(0.);
	index.x		= floor(face.x * power * 3.);
	index.y		= floor(face.y * power);
	
	return index;
}

float face_address(vec2 face, float power)
{
	vec2 index	= face_index(face, power); 
	return index.x + index.y * power * 3. + index.y;
}

float print_face_address(float address, vec2 position)
{	
	float offset	= 4.;
	
	float text	= 0.;
	for(int i = 0; i < 3; i++)
	{
		float place	= pow(10., float(i));
		
		text	 	+= digit(address/place, position + vec2(8., 0.));
		
		position.x 	+= offset;
	}
	return text;
}

float print_face_index(vec2 index, vec2 position)
{
	float offset	= 4.;

	float text	= 0.;
	for(int i = 0; i < 2; i++)
	{
		float place	= pow(10., float(i));
			
		text		+= digit(index.x/place, position + vec2(6., 0.));
		text		+= digit(index.y/place, position + vec2(-6., 0.));
		
		position.x 	+= offset;
	}
	
	return text;
}

float extract_bit(float n, float b)
{
	n = floor(n);
	b = floor(b);
	b = floor(n/pow(2.,b));
	return float(mod(b,2.) == 1.);
}

float sprite(float n, vec2 p)
{
	p = floor(p);
	float bounds = float(all(lessThan(p, vec2(3., 5.))) && all(greaterThanEqual(p,vec2(0,0))));
	return extract_bit(n, (2. - p.x) + 3. * p.y) * bounds;
}

float digit(float n, vec2 p)
{
	n = mod(floor(n), 10.0);
	if(n == 0.) return sprite(31599., p);
	else if(n == 1.) return sprite( 9362., p);
	else if(n == 2.) return sprite(29671., p);
	else if(n == 3.) return sprite(29391., p);
	else if(n == 4.) return sprite(23497., p);
	else if(n == 5.) return sprite(31183., p);
	else if(n == 6.) return sprite(31215., p);
	else if(n == 7.) return sprite(29257., p);
	else if(n == 8.) return sprite(31727., p);
	else if(n == 9.) return sprite(31695., p);
	else return 0.0;
}
