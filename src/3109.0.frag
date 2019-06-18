#ifdef GL_ES
precision mediump float;
#endif

// Community flags

// Individual flags taken from other shaders 
//
// enhanced edition, best viewed at 1

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define WAVE

float kFlagCount = 18.0; // +1 to add new flag

vec3 Flag0( vec2 p )
{
	// http://glsl.heroku.com/e#2701.0
	vec3 c = vec3(1.0, 0.48, 0.15);
	if((p.y > 0.6 && p.y < 0.7) || (p.x > 0.7 && p.x < 0.76))  c = vec3(1.0, 0.9, 0.3);
	return c;
}

vec3 Flag1( vec2 p )
{
	// http://glsl.heroku.com/e#2703.0
	// Czech Republic
	vec3 c = vec3(1, 1, 1);
	if (-p.x + 1.0 > p.y) c = vec3(0, 0, 1);
	if (p.y < 0.5) {
		c = vec3(1, 0, 0);
		if (p.x < p.y) c = vec3(0, 0, 1);
	}		
	
	return c;
}

vec3 Flag2orig( vec2 p )
{
	// http://glsl.heroku.com/e#2724.0
	// Germany
	vec3 c = vec3(0.0);
	if(p.y < 0.333)
		c = vec3(1.0, 0.8, 0.0);
	else if(p.y > 0.333 && p.y < 0.666) 
		c = vec3(1.0, 0.0, 0.0);
	else
		c = vec3(0.0);
	return c;
}

vec3 Flag2enh( vec2 p)
{
	// "Germany"
	float r = -2.0*time;
	vec3 c = vec3(1.0);
	p -= 0.5;
	p.x *= resolution.x / resolution.y;
	p /= 0.43;
	if(length(p) >= 1.0)
		return vec3(1.,0.0,0.0);//changed this to pink, b/c wtf, you really had to add a swastika?
	p = vec2(p.x*cos(r)+p.y*sin(r), -p.x*sin(r)+p.y*cos(r))/0.67 /*should be r*/;	
	if(abs(p.x) > 1.0 || abs(p.y) > 1.0)
		return c;
	if(p.y < 0.0) p = vec2(-p.x, -p.y);
	if(p.x < 0.0) p = vec2(p.y, -p.x);
	if(p.y > 0.2 && p.y < 0.6 && p.x > 0.2)
		return c;
	return vec3(0.0);	
}

vec3 noise( vec3 p)
{
	return vec3(0.5 + 0.5 * fract(sin(dot(p.xyz, vec3(7.791,12.9898, 78.233)))* 43758.5453));
}
vec3 Flag2( vec2 p)
{
	//if(mod(time,2.0) >= 1.7)
	// 	return noise(vec3(time,p.xy));
	//if(mod(time,4.0) >= 2.0)
		return Flag2orig(p);
//	return Flag2enh(p);
	// no swastika
}

vec3 Flag3( vec2 p )
{
	// http://glsl.heroku.com/e#2727.0
	// Poland
	float gb = 1.0;
	if (p.y < 0.5)
		gb = 0.0;

	return vec3( 1.0, gb, gb);
}

vec3 Flag4( vec2 p )
{
	// http://glsl.heroku.com/e#2766.0
	// Japan
	p -= 0.5;
	p.y *= resolution.y / resolution.x;

	float col = clamp((length(p) - 0.12) * 1000.0, 0.0, 1.0);
	return vec3(1.0, col, col);
}

vec3 Flag5( vec2 p )
{
	// http://glsl.heroku.com/e#2731.1
	// United Kingdom
	vec3 kRed = vec3( 204.0 / 255.0, 0.0, 0.0 );
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );
	vec3 kBlue = vec3( 0.0, 0.0, 102.0 / 255.0 );
	
	vec3 c = kBlue;

	p = p * 2.0 - 1.0;
	float d = -p.x * sign(p.y) + p.y * sign(p.x);
	
	if((abs(p.x) < (6.0/60.0)) || (abs(p.y) < (6.0/30.0)))
	{
		c = kRed;
	}
	else 
	if((abs(p.x) < (10.0/60.0)) || (abs(p.y) < (10.0/30.0)))
	{
		c = kWhite;
	}
	else 
	if( (d > 0.0)  && (d < 0.15))
	{
		c = kRed;
	}
	else
	if( (d > -0.15 * 3.0 / 2.0)  && (d < 0.15 * 3.0 /2.0))
	{
		c = kWhite;
	}
	
	return c;
}

vec3 Flag6( vec2 p )
{
	// http://glsl.heroku.com/e#2737.0
	// Serbia and Montenegro
	vec3 c = vec3(0.0);
	if(p.y < 0.3333333333333333333333)
		c = vec3(0.2, 0.2, 1.0);
	else if(p.y > 0.3333333333333333 && p.y < 0.666666666666666666666666) 
		c = vec3(1.0, 1.0, 1.0);
	else
		c = vec3(1.0, 0.2, 0.2);
	return c;
}

vec3 Flag7( vec2 p )
{
	// http://glsl.heroku.com/e#2739.0
	// Italy
	vec3 c = vec3(0.807, 0.168, 0.215);
	if(p.x < 0.333)
		c = vec3(0, 0.572, 0.274);
	else if(p.x > 0.333 && p.x < 0.666) 
		c = vec3(1.0, 1.0, 1.0);
	return c;
}

vec3 Flag8( vec2 p )
{
	// http://glsl.heroku.com/e#2740.0
	// Spain
	vec3 c = vec3(0.666, 0.082, 0.098);
	if(p.y > 0.25 && p.y < 0.75)
		c = vec3(0.945, 0.749, 0.0);
	return c;
}


vec3 Flag9( vec2 p )
{
	// http://glsl.heroku.com/e#2770.4
	// Hungary
	
	/*
	 * Author: Yours3!f
	 * Ripple effect taken from here (glsl.heroku.com/e#2757)
	 * This flag has proper colors (not just r = 1, b = 1)
	 */	
	vec3 red = vec3(206, 17, 38) / vec3(255);
	vec3 green = vec3(0, 135, 81) / vec3(255);
	
	vec3 c = vec3(1);
		
	if(p.y > 0.66)
		c.xyz = red;	
	else if(p.y < 0.33)
		c.xyz = green;
		
	return c;
}

vec3 Flag10( vec2 p )
{
	// http://glsl.heroku.com/e#2752.0
	// Greek Flag by Optimus
	// I am not sure about the color or dimensions but one can fork this
	
	//Added proper color, by Yours3!f
	vec3 blue = vec3(13, 94, 175) / vec3(255);
	vec3 white = vec3(1.0, 1.0, 1.0);
	vec3 finalcolor = vec3(0.0);

	float stripes = mod(p.y * 4.5, 1.0);
	vec3 stripecol = vec3(0.0);
	if (stripes < 0.5)
	{
		stripecol = blue;
	}
	else
	{
		stripecol = white;
	}

	vec3 crosscol = vec3(0.0);
	if (p.x < 0.4 && p.y > 0.444)
	{
		crosscol = blue;

		if (p.x > 0.15 && p.x < 0.25) crosscol = white;
		if (p.y > 0.666 && p.y < 0.778) crosscol = white;

		finalcolor = crosscol;
	}
	else
	{
		finalcolor = stripecol;
	}

	return finalcolor;
}

	
vec3 Flag11( vec2 p )
{
	// http://glsl.heroku.com/e#2758.0
	// France
	vec3 c = vec3(0.0);
	if(p.x < 0.3333333333333333333333)
		c = vec3(0.2, 0.2, 1.0);
	else if(p.x > 0.3333333333333333 && p.x < 0.666666666666666666666666) 
		c = vec3(1.0, 1.0, 1.0);
	else
		c = vec3(1.0, 0.2, 0.2);

	return c;
}

vec3 Flag12( vec2 p )
{
	// http://glsl.heroku.com/e#2772.4
	//  Denmark!
	//  by @dennishjorth
	//
	//  orlogsflag by @neoneye
	//
	//  Please! Set the precision to 0.5!
	//  otherwise it hurts your eyes...	
	
	vec3 kRed = vec3( 255.0 / 255.0, 0.0, 0.0 );
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );
		
	vec3 c;
	p = p * 2.0 - 1.0;
	if(abs(p.y) < (1.0 - (1.0 - p.x) * 1.2)) {
		c = vec3(0, 0.26, 0);
	} else 
	if((abs(p.x+0.3) < (6.0/60.0)) || (abs(p.y) < (6.0/30.0)))
	{
		c = kWhite;
	}
	else
	{
		c = kRed;
	}
	return c;
}

vec3 Flag13( vec2 p )
{
	// England
	vec3 kRed = vec3( 204.0 / 255.0, 0.0, 0.0 );
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );
	
	vec3 c = kWhite;

	p = p * 2.0 - 1.0;	
	if((abs(p.x) < (6.0/60.0)) || (abs(p.y) < (6.0/30.0)))
	{
		c = kRed;
	}
	
	return c;
}

vec3 Flag14( vec2 p )
{
	// Russia
	vec3 c = vec3(0.0);
	if(p.y > 0.666)
		c = vec3(1.0);
	else if(p.y < 0.666 && p.y > 0.333) 
		c = vec3(0.0, 0.0, 1.0);
	else
		c = vec3(1.0, 0.0, 0.0);
	return c;
}

vec2 rotate(vec2 point, float rads) {
	float cs = cos(rads);
	float sn = sin(rads);
	return point * mat2(cs, -sn, sn, cs);
}

int star(vec2 p) {
	p -= vec2(0.5, 0.5);
	p = p.yx;
	p.x = -p.x;
	p.x -= 0.04;
	
	int i = (length(p) > 0.4) ? 1 : 0;

	vec2 p0 = rotate(p, radians(36.0));
	vec2 p1 = rotate(p, radians(108.0));
	vec2 p2 = rotate(p, radians(180.0));
	vec2 p3 = rotate(p, radians(252.0));
	vec2 p4 = rotate(p, radians(324.0));
	
	int j = 0;
	
	float v = 0.13;
	if(p0.x > v) j++;
	if(p1.x > v) j++;
	if(p2.x > v) j++;
	if(p3.x > v) j++;
	if(p4.x > v) j++;

	return (j < 2 && i < 1) ? 1 : 0;
}

vec3 Flag15( vec2 p )
{
	// "American2084", by @neoneye
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );
	vec3 kRed = vec3( 204.0 / 255.0, 0.0, 0.0 );
	vec3 kBlue = vec3( 0.0, 0.0, 250.0 / 255.0 );

	vec3 c = kBlue;
	if(p.x > 0.5 || p.y < 0.4) {
		vec2 b = p;
		b.y = (b.y - 0.4) / 0.6;
		b.y *= 3.8;
		b = mod(b, 1.0);
		c = (b.y > 0.5) ? kRed : kWhite;
	} else {
		vec2 a = p;
		a.x *= 20.0;
		a.y *= 8.0;
		a = mod(a, 1.0);
		if(star(a) > 0) {
			c = kWhite;
		}
	}
	return c;
}

vec3 Flag16( vec2 p )
{
	// Unknown country, by @neoneye
	vec3 kGreen = vec3( 0.0, 204.0 / 255.0, 0.0 );
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );

	vec3 c = vec3(0.0);
	
	if(star(p) > 0) {
		c = kWhite;
	} else {
		if(p.x < 0.5) {
			c = kGreen;
		}
	}
	return c;
}


vec3 Flag17( vec2 p )
{
	vec3 c = vec3(0.0); // add new flag code here
	return c;
}

vec3 Flag18( vec2 p )
{
	// Canada
	vec3 kRed = vec3( 1.0, 0.0, 0.0 );
	vec3 kWhite = vec3( 1.0, 1.0, 1.0 );

	vec3 c = vec3(0.0);
	
	if(star(p) > 0) {
		c = kWhite;
	} else {
		if(p.x < 0.5) {
			c = kRed;
		}
	}
	return c;
}
vec3 GetFlagCol(vec2 p, float index)
{	
	index = mod(index, kFlagCount);
	
	if(index < 0.5) {
		return Flag0(p);
	}
	else if(index < 1.5) {
		return Flag1(p);
	}
	else if(index < 2.5) {
		return Flag2(p);
	}
	else if(index < 3.5) {
		return Flag3(p);
	} 
	else if(index < 4.5) {
		return Flag4(p);
	}
	else if(index < 5.5) {
		return Flag5(p);
	}
	else if(index < 6.5) {
		return Flag6(p);
	}
	else if(index < 7.5) {
		return Flag7(p);
	}
	else if(index < 8.5) {
		return Flag8(p);
	}
	else if(index < 9.5) {
		return Flag9(p);
	}
	else if(index < 10.5) {
		return Flag10(p);
	}
	else if(index < 11.5) {
		return Flag11(p);
	}
	else if(index < 12.5) {
		return Flag12(p);
	}
	else if(index < 13.5) {
		return Flag13(p);
	}
	else if(index < 14.5) {
		return Flag14(p);
	}
	else if(index < 15.5) {
		return Flag15(p);
	}
	else if(index < 16.5) {
		return Flag16(p);
	}
	else if(index < 17.5) {
		return Flag17(p);
	}
	else if(index < 18.5) {
		return Flag18(p);
	}
	
	return     vec3(0.0);
}

void main( void )
{
	vec2 p = gl_FragCoord.xy / resolution.xy;
	
	// apply movement
	vec2 p2 = p * 8.0;            
	p2.y += time * 0.15;
	

	float shade = 1.0;
	
	#ifdef WAVE
	float nx =0.0;
	
	float k_freq = 100.0;
	float k_x_movement = 0.025;
	float k_y_movement = 0.05;
	float k_scroll_speed = 4.0;
	
	float mag = 1.0;
	float freq = 1.0;
	float scroll_speed = 1.0;
	for(int i=0; i<3; i++)
	{
		// move more near the right
		float movement_amount = fract(p2.x);
		if(movement_amount > 0.9) movement_amount = 0.0;                          
	       
		// wibble                             
		float f = (p.x) * freq * k_freq - time * scroll_speed * k_scroll_speed;
		float dx = cos( f ) * mag * movement_amount;
		float dy = (sin( f ) ) * mag * movement_amount;
	       
		p2.x += dx * k_x_movement;
		p2.y += dy * k_y_movement;
	       
		// accumulate dx movement for shading
		nx += dx;
	       
		freq *= 2.0;
		mag *= 0.2;
		scroll_speed *= 2.5;
	}
	
	shade = clamp(0.8 - nx * 0.2, 0.0, 1.0);
	#endif // WAVE

	float index = floor(p2.x) + floor(p2.y) * 5.0;
	vec2 vFlagCoord = fract(p2) * 1.25;
	
	// default background
	vec3 vCol = vec3(0.0, 0.2, 0.0);
		
	// get flag col
	if((vFlagCoord.x <= 1.0) && (vFlagCoord.y <= 1.0))
	{
		vCol = GetFlagCol( vFlagCoord, index ) * shade;                
	}
	
	//vCol = GetFlagCol( p, kFlagCount ); // uncomment to show flag full screen
	
	gl_FragColor = vec4( vCol, 1.0 );
}
