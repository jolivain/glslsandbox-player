#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//more binary and gray code stuff - woo!

//mouse left  : binary
//mouse right : gray code

//red   > .5
//blue  < .5
//green = .5

//working out relationships in floating points w/o bitops
//anything below .5 is considered a 1.
//values above .5 shoot to infinity pretty quick (the red stuff)


//text display functions
float extract_bit(float n, float b);
float sprite(float n, vec2 s, vec2 p);
float digit(float n, vec2 s, vec2 p);
	
//characters 
float c_0 = 31599.;
float c_1 =  9362.;
float c_2 = 29671.;
float c_3 = 29391.;
float c_4 = 23497.;
float c_5 = 31183.;
float c_6 = 31215.;
float c_7 = 29257.;
float c_8 = 31727.;
float c_9 = 31695.;


void main( void ) 
{
	////
	//display formatting
	////
	vec2 uv 	= gl_FragCoord.xy/resolution.xy;
	vec2 scale	= vec2(64., 32.);
	vec2 offset	= vec2(-48., 0.);	
	vec2 position	= floor(uv * scale + offset);	
	
	
	
	////
	//code creation stuff
	//
	//anything resulting from the code function that's <= .5 counts as a 1, otherwise the position is a 0
	//just made this stuff up to draw the picture - seems to work - not sure why
	//really looks like it could be refactored (see: extract_bit below) but drawing them like this is nice too
	////
	
	float number 	= clamp(floor(position.y + clamp(mouse.y * 255., 0., 256. - scale.y)), 0., 255.);
	float exponent	= floor(position.x);	
	float f 	= mouse.x < .5 ? 1. : 2.; //this would prolly be a different whatever "f" is once this gets refactored
	f	 	= mouse.x < .0125 || mouse .x > .975? abs(fract(time*.0125)-.5)*2.+1. : f; //fun blinky lights
	float code 	= .5/(mod(number + pow(f, exponent) + f-2., pow(2., exponent + f))/pow(2., exponent)/f);
	
	code = floor(code*256.)/256.;
	
	
	
	////
	//everything beyond this is just display
	////
	float code_high    	= float(code > .5);
	float code_half     	= float(code == .5);
	float code_low     	= float(code < .5);
	float code_floor	= float(code <= .5);
	
		
	//setup text 
	vec2 sprite_scale	= vec2(3., 5.);		
	vec2 char_scale		= vec2(4., 8.);
	vec2 char_position 	= (vec2(uv.x, clamp(uv.y + floor(mouse.y * 192.), 0., 255.)) * scale + offset) * char_scale;
	char_position.y	 	= mod(char_position.y, char_scale.y) - 1.;

	
	//write base 10 digits
	vec2 decimal_value	= vec2(number, char_position.y);
	float decimal_digits 	= 0.;
	decimal_digits		+= digit(decimal_value.x/100., sprite_scale, char_position - vec2(-12., 0.));
	decimal_digits		+= digit( decimal_value.x/10., sprite_scale, char_position - vec2(-8., 0.));
	decimal_digits		+= digit(     decimal_value.x, sprite_scale, char_position - vec2( -4., 0.));
	
	
	//write binary digits
	char_position.x	 	= mod(char_position.x, char_scale.x);
	float code_bit_char	= code_floor == 0. ? c_0 : c_1;
	float code_digits	= sprite(code_bit_char, vec2(3., 5.), char_position);
	float code_digits_mask	= float(position.x > -1. && position.x < 8.);	
	
	
	//composite results
	vec4 result 		= vec4(0.,0.,0.,1.);
	result 			+= code_floor * .5;
	result			= mouse.x < .25 || mouse.x > .75 ? result * .5 + .5 * (vec4(code_high, code_half, code_low, 1.)) : result;
	result 			+= code_digits * .125;
	result 			*= code_digits_mask;
	result 			+= decimal_digits;
		

	gl_FragColor = result;
}//sphinx


float extract_bit(float n, float b)
{
	n = floor(n);
	b = floor(b);
	b = floor(n/pow(2.,b));
	return float(mod(b,2.) == 1.);
}


float sprite(float n, vec2 s, vec2 p)
{
	p = floor(p);
	float bounds = float(all(lessThan(p,s)) && all(greaterThanEqual(p,vec2(0,0))));
	return extract_bit(n,(2.0 - p.x) + 3.0 * p.y) * bounds;
}


float digit(float num, vec2 s, vec2 p)
{
	num = mod(floor(num),10.0);
	
	if(num == 0.0) return sprite(c_0, s, p);
	if(num == 1.0) return sprite(c_1, s, p);
	if(num == 2.0) return sprite(c_2, s, p);
	if(num == 3.0) return sprite(c_3, s, p);
	if(num == 4.0) return sprite(c_4, s, p);
	if(num == 5.0) return sprite(c_5, s, p);
	if(num == 6.0) return sprite(c_6, s, p);
	if(num == 7.0) return sprite(c_7, s, p);
	if(num == 8.0) return sprite(c_8, s, p);
	if(num == 9.0) return sprite(c_9, s, p);
	
	return 0.0;
}
