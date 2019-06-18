#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//16 segment display

float dseg(vec2 p0,vec2 p1,vec2 uv)
{
	vec2 dir = normalize(p1 - p0);
	uv = (uv - p0) * mat2(dir.x, dir.y,-dir.y, dir.x);
	return distance(uv, clamp(uv, vec2(0), vec2(distance(p0, p1), 0)));   
}

bool bit(float n, float b)
{
	return mod(floor(n / exp2(floor(b))), 2.0) != 0.0;
}

float ddigit(float bits, vec2 uv)
{
	float d = 1e6;	

	float n = floor(bits);
	
	if(bits != 0.0)
	{
		d = bit(n,  0.0) ? min(d, dseg(vec2( 0.500,  0.063), vec2( 0.500,  0.937), uv)) : d;
		d = bit(n,  1.0) ? min(d, dseg(vec2( 0.438,  1.000), vec2( 0.063,  1.000), uv)) : d;
		d = bit(n,  2.0) ? min(d, dseg(vec2(-0.063,  1.000), vec2(-0.438,  1.000), uv)) : d;
		d = bit(n,  3.0) ? min(d, dseg(vec2(-0.500,  0.937), vec2(-0.500,  0.062), uv)) : d;
		d = bit(n,  4.0) ? min(d, dseg(vec2(-0.500, -0.063), vec2(-0.500, -0.938), uv)) : d;
		d = bit(n,  5.0) ? min(d, dseg(vec2(-0.438, -1.000), vec2(-0.063, -1.000), uv)) : d;
		d = bit(n,  6.0) ? min(d, dseg(vec2( 0.063, -1.000), vec2( 0.438, -1.000), uv)) : d;
		d = bit(n,  7.0) ? min(d, dseg(vec2( 0.500, -0.938), vec2( 0.500, -0.063), uv)) : d;
		d = bit(n,  8.0) ? min(d, dseg(vec2( 0.063,  0.000), vec2( 0.438, -0.000), uv)) : d;
		d = bit(n,  9.0) ? min(d, dseg(vec2( 0.063,  0.063), vec2( 0.438,  0.938), uv)) : d;
		d = bit(n, 10.0) ? min(d, dseg(vec2( 0.000,  0.063), vec2( 0.000,  0.937), uv)) : d;
		d = bit(n, 11.0) ? min(d, dseg(vec2(-0.063,  0.063), vec2(-0.438,  0.938), uv)) : d;
		d = bit(n, 12.0) ? min(d, dseg(vec2(-0.438,  0.000), vec2(-0.063, -0.000), uv)) : d;
		d = bit(n, 13.0) ? min(d, dseg(vec2(-0.063, -0.063), vec2(-0.438, -0.938), uv)) : d;
		d = bit(n, 14.0) ? min(d, dseg(vec2( 0.000, -0.938), vec2( 0.000, -0.063), uv)) : d;
		d = bit(n, 15.0) ? min(d, dseg(vec2( 0.063, -0.063), vec2( 0.438, -0.938), uv)) : d;
	}
	
	return d;
}

/*
Segment bit positions:

  __2__ __1__
 |\    |    /|
 | \   |   / |
 3  11 10 9  0
 |   \ | /   |
 |    \|/    |
  _12__ __8__
 |           |
 |    /|\    |
 4   / | \   7
 | 13 14  15 |
 | /   |   \ |
  __5__|__6__

15                 0
 |                 |
 0000 0000 0000 0000

example: letter A

   12    8 7  4 3210
    |    | |  | ||||
 0001 0001 1001 1111

 binary to hex -> 0x119F
 
 float c_a = float(0x119F)
*/

float c_a = float(0x119F);
float c_b = float(0x927E);
float c_c = float(0x007E);
float c_d = float(0x44E7);
float c_e = float(0x107E);
float c_f = float(0x101E);
float c_g = float(0x807E);
float c_h = float(0x1199);
float c_i = float(0x4466);
float c_j = float(0x4436);
float c_k = float(0x9218);
float c_l = float(0x0078);
float c_m = float(0x0A99);
float c_n = float(0x8899);
float c_o = float(0x00FF);
float c_p = float(0x111F);
float c_q = float(0x80FF);
float c_r = float(0x911F);
float c_s = float(0x8866);
float c_t = float(0x4406);
float c_u = float(0x00F9);
float c_v = float(0x2218);
float c_w = float(0xA099);
float c_x = float(0xAA00);
float c_y = float(0x4A00);
float c_z = float(0x2266);

const int NUM_CHARS = 12;

void main( void ) 
{
	vec2 aspect = resolution.xy / resolution.y;
	vec2 uv = ( gl_FragCoord.xy / resolution.y );
	uv -= aspect / 2.0;
	uv *= 8.0;
	
	float dist = 1e6;
	
	//Glitch fade-in animation
	float anim_time = clamp(time * 0.25, 0.0, 1.0) * 16.0;
	
	float ch[NUM_CHARS];
	
	ch[ 0] = mix(0.0, c_g, clamp(anim_time - 0.0, 0.0, 1.0));
	ch[ 1] = mix(0.0, c_l, clamp(anim_time - 1.0, 0.0, 1.0));
	ch[ 2] = mix(0.0, c_s, clamp(anim_time - 2.0, 0.0, 1.0));
	ch[ 3] = mix(0.0, c_l, clamp(anim_time - 3.0, 0.0, 1.0));
	ch[ 4] = 0.0;
	ch[ 5] = mix(0.0, c_s, clamp(anim_time - 4.0, 0.0, 1.0));
	ch[ 6] = mix(0.0, c_a, clamp(anim_time - 5.0, 0.0, 1.0));
	ch[ 7] = mix(0.0, c_n, clamp(anim_time - 6.0, 0.0, 1.0));
	ch[ 8] = mix(0.0, c_d, clamp(anim_time - 7.0, 0.0, 1.0));
	ch[ 9] = mix(0.0, c_b, clamp(anim_time - 8.0, 0.0, 1.0));
	ch[10] = mix(0.0, c_o, clamp(anim_time - 9.0, 0.0, 1.0));
	ch[11] = mix(0.0, c_x, clamp(anim_time -10.0, 0.0, 1.0));
	
	//Printing and spacing
	vec2 ch_size = vec2(1.0, 2.0);
	vec2 ch_space = ch_size + vec2(0.25,0.25);
	
	vec2 offs = vec2(-ch_space.x * 5.5,0.0);
	
	for(int i = 0;i < NUM_CHARS;i++)
	{
		dist = min(dist, ddigit(ch[i] , uv - offs)); 
		offs.x += ch_space.x;
	}
	
	//Shading
	vec3 color = vec3(0.0);
	
	color = mix(vec3(2.0,0.8,0.1), vec3(0.0,0.0,0.0), smoothstep(0.01, 0.05, dist) - (0.01 / dist));
	
	gl_FragColor = vec4(color, 1.0);

}
