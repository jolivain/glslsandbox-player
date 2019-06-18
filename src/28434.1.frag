// Adapted from http://glslsandbox.com/e#28067.0
// By J. 2015-10-23
//
// SixteenSegmentDisplayV3.glsl               2015-10-05
// 16 Segment Display Example v4
// rearranged source code by I.G.P.
// Do you know further optimizations ?  
//
// change neon colors by moving around with your mouse!

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const vec2 ch_size  = vec2(0.8, 0.8);              // character size
const vec2 ch_space = ch_size + vec2(0.4, 0.6);    // character distance  
const vec2 ch_start = vec2 (ch_space.x * -11.,4.); // start position
      vec2 ch_pos   = vec2 (0.0, 0.0);             // character position
      vec3 ch_color = vec3 (0.6, 1.7, 0.8);        // character color
const vec3 bg_color = vec3 (0.0, 0.0, 0.0);        // background color

vec2 uv = vec2(0.);    // current position

#define REPEAT_SIGN false

/*========== 16 segment display ==============

Segment bit positions:

  __2__ __1__         any bit adds one segment
 |\    |    /|     
 | \   |   / |     bit:   15 12 11 8 7654 3210              
 3  11 10 9  0             |  | |  | |||| ||||              
 |   \ | /   |    binary:  0000 0000 0000 0000           
 |    \|/    |                                          
  _12__ __8__         example: letter A                 
 |           |                                          
 |    /|\    |            15 12 11 8 7654 3210              
 4   / | \   7             |  | |  | |||| ||||              
 | 13 14  15 |             0001 0001 1001 1111              
 | /   |   \ |                                          
  __5__|__6__          binary to hex -> 0x119F          

*/

#define n0 ddigit(0x22FF);
#define n1 ddigit(0x0281);
#define n2 ddigit(0x1177);
#define n3 ddigit(0x11E7);
#define n4 ddigit(0x5508);
#define n5 ddigit(0x11EE);
#define n6 ddigit(0x11FE);
#define n7 ddigit(0x2206);
#define n8 ddigit(0x11FF);
#define n9 ddigit(0x11EF);

#define A ddigit(0x119F);
#define B ddigit(0x927E);
#define C ddigit(0x007E);
#define D ddigit(0x44E7);
#define E ddigit(0x107E);
#define F ddigit(0x101E);
#define G ddigit(0x807E);
#define H ddigit(0x1199);
#define I ddigit(0x4466);
#define J ddigit(0x4436);
#define K ddigit(0x9218);
#define L ddigit(0x0078);
#define M ddigit(0x0A99);
#define N ddigit(0x8899);
#define O ddigit(0x00FF);
#define P ddigit(0x111F);
#define Q ddigit(0x80FF);
#define R ddigit(0x911F);
#define S ddigit(0x8866);
#define T ddigit(0x4406);
#define U ddigit(0x00F9);
#define V ddigit(0x2218);
#define W ddigit(0xA099);
#define X ddigit(0xAA00);
#define Y ddigit(0x4A00);
#define Z ddigit(0x2266);
#define s_dot     ddigit(0);
#define s_ddot    ddigit(1);
#define s_minus   ddigit(0x1100);
#define s_plus    ddigit(0x5500);
#define s_greater ddigit(0x2800);
#define s_less    ddigit(0x8200);
#define s_sqrt    ddigit(0x0C02);
#define s_uline   ddigit(0x0060);
#define _  ch_pos.x += ch_space.x;  // blanc
#define nl ch_pos.x = ch_start.x;  ch_pos.y -= 3.0;

float dseg(vec2 p0, vec2 p1)    // draw segment
{
  p0 *= ch_size;
  p1 *= ch_size;
  vec2 dir = normalize(p1 - p0);
  vec2 cp = (uv - ch_pos - p0) * mat2(dir.x, dir.y,-dir.y, dir.x);
  return 2.0*distance(cp, clamp(cp, vec2(0), vec2(distance(p0, p1), 0)));   
}

bool bit(int n, int b)  // return true if bit b of n is set
{
  return mod(floor(float(n) / exp2(floor(float(b)))), 2.0) != 0.0;
}

float d = 1.0;

void ddigit(int n)
{
  float v = 1.0;	
  vec2 cp = uv - ch_pos;
  if (n == 0)        v = min(v, dseg(vec2(-0.005, -1.000), vec2( 0.000, -1.000)));
  else if (n == 1) { v = min(v, dseg(vec2( 0.005, -1.000), vec2( 0.000, -1.000))); 
		     v = min(v, dseg(vec2( 0.005,  0.000), vec2( 0.000,  0.000))); 
		   }
  else 
  {
	if (bit(n,  0)) v = min(v, dseg(vec2( 0.500,  0.063), vec2( 0.500,  0.937)));
	if (bit(n,  1)) v = min(v, dseg(vec2( 0.438,  1.000), vec2( 0.063,  1.000)));
	if (bit(n,  2)) v = min(v, dseg(vec2(-0.063,  1.000), vec2(-0.438,  1.000)));
	if (bit(n,  3)) v = min(v, dseg(vec2(-0.500,  0.937), vec2(-0.500,  0.062)));
	if (bit(n,  4)) v = min(v, dseg(vec2(-0.500, -0.063), vec2(-0.500, -0.938)));
	if (bit(n,  5)) v = min(v, dseg(vec2(-0.438, -1.000), vec2(-0.063, -1.000)));
	if (bit(n,  6)) v = min(v, dseg(vec2( 0.063, -1.000), vec2( 0.438, -1.000)));
	if (bit(n,  7)) v = min(v, dseg(vec2( 0.500, -0.938), vec2( 0.500, -0.063)));
	if (bit(n,  8)) v = min(v, dseg(vec2( 0.063,  0.000), vec2( 0.438, -0.000)));
	if (bit(n,  9)) v = min(v, dseg(vec2( 0.063,  0.063), vec2( 0.438,  0.938)));
	if (bit(n, 10)) v = min(v, dseg(vec2( 0.000,  0.063), vec2( 0.000,  0.937)));
	if (bit(n, 11)) v = min(v, dseg(vec2(-0.063,  0.063), vec2(-0.438,  0.938)));
	if (bit(n, 12)) v = min(v, dseg(vec2(-0.438,  0.000), vec2(-0.063, -0.000)));
	if (bit(n, 13)) v = min(v, dseg(vec2(-0.063, -0.063), vec2(-0.438, -0.938)));
	if (bit(n, 14)) v = min(v, dseg(vec2( 0.000, -0.938), vec2( 0.000, -0.063)));
	if (bit(n, 15)) v = min(v, dseg(vec2( 0.063, -0.063), vec2( 0.438, -0.938)));
  }
  ch_pos.x += ch_space.x;
  d = min(d, v);
}

void showValue (float value)
{
  for(int ni = 4; ni > -3;ni--)
  {
    if (ni == -1) s_dot;   // add dot
    float dd = (value / pow(10.0,float(ni)));
    dd = mod(floor(dd), 10.0);
    if      (dd < 0.5) n0
    else if (dd < 1.5) n1
    else if (dd < 2.5) n2
    else if (dd < 3.5) n3
    else if (dd < 4.5) n4
    else if (dd < 5.5) n5
    else if (dd < 6.5) n6
    else if (dd < 7.5) n7
    else if (dd < 8.5) n8
    else if (dd < 9.5) n9
  }
}

void integer (int value)
{
  float fv = float(value);
  for(int ni = 5; ni > 0;ni--)
  {
    float dd = fv / pow(10.0,float(ni));
    dd = mod(floor(dd), 10.0);
    if      (dd < 0.5) n0
    else if (dd < 1.5) n1
    else if (dd < 2.5) n2
    else if (dd < 3.5) n3
    else if (dd < 4.5) n4
    else if (dd < 5.5) n5
    else if (dd < 6.5) n6
    else if (dd < 7.5) n7
    else if (dd < 8.5) n8
    else if (dd < 9.5) n9
  }
}

void main( void ) 
{
  vec2 aspect = resolution.xy / resolution.y;
  uv = ( gl_FragCoord.xy / resolution.y ) - aspect / 2.0;
  uv *= 20.0 + sin(time);     //  set zoom size
  if (REPEAT_SIGN)
    uv = -12.0 + mod(1.8*(uv-1.0), ch_space*vec2(16.,6.5));   //  set zoom size

  ch_pos = ch_start + vec2(sin(time),4.0);  // set start position
       
  ch_color = vec3 (2.6 - 4.*mouse.x, 1.2-mouse.x*mouse.y, 0.5+mouse.y);
  B Y E s_minus B Y E _ V I N C E N T nl
  W E _ W I L L _ A L L _ M I S S _ Y O U nl
		
  ch_color = mix(ch_color, bg_color, 1.0- (0.08 / d));  // shading
	
  gl_FragColor = vec4(ch_color, 1.0);
}

