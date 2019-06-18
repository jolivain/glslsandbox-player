
#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float pw = 0.002; // pixel width
const float ph = 0.002; // pixel height
const float cw = 0.002*8.0; // character width
const float ch = 0.002*8.0; // character height

const float pw0 = pw*0.0; 
const float pw1 = pw*1.0; 
const float pw2 = pw*2.0; 
const float pw3 = pw*3.0; 
const float pw4 = pw*4.0; 
const float pw5 = pw*5.0; 
const float pw6 = pw*6.0; 
const float pw7 = pw*7.0; 

const float ph0 = ph*0.0; 
const float ph1 = ph*2.0; 
const float ph2 = ph*4.0; 
const float ph3 = ph*6.0; 
const float ph4 = ph*8.0; 
const float ph5 = ph*10.0; 
const float ph6 = ph*12.0; 
const float ph7 = ph*14.0; 
float block(vec2 pos,float x,float y,float w,float h)
{
  if (abs(pos.x+x) <= w && abs(pos.y+y) <= h)
    return 1.0; 
  return 0.0;

}

float pixel(int w, vec2 pos)
{
  if (abs(pos.x-float(w)*pw*0.5) < pw*0.5*float(w) && abs(pos.y) < ph)
    return 1.0;
  return 0.0; 
}

// fix by darkstalker: "char" is a reserved word!
float char_(vec2 pos, int p0,int p1,int p2,int p3,int p4,int p5,int p6, int p7)
{
  float acc = 0.0;

  if (p0 > 0) acc += pixel(p0,pos-vec2(pw0,0.0));
  if (p1 > 0) acc += pixel(p1,pos-vec2(pw1,0.0));
  if (p2 > 0) acc += pixel(p2,pos-vec2(pw2,0.0));
  if (p3 > 0) acc += pixel(p3,pos-vec2(pw3,0.0));
  if (p4 > 0) acc += pixel(p4,pos-vec2(pw4,0.0));
  if (p5 > 0) acc += pixel(p5,pos-vec2(pw5,0.0));
  if (p6 > 0) acc += pixel(p6,pos-vec2(pw6,0.0));
  if (p7 > 0) acc += pixel(p7,pos-vec2(pw7,0.0));
  return acc;
}
// Characters have to be "run length" encoded to avoid overloading the number of const registers
float charset_A(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_B(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_S(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}


float charset_I(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_X(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_C(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_O(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph1),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph2),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph3),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph4),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph5),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph6),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph7),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_D(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}


float charset_M(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,2,0,0,0,0,2,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,3,0,0,0,3,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,7,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,2,0,0,1,0,2,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,0,2,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,0,2,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,0,2,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}


float charset_R(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_E(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}


float charset_6(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,5,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_4(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,0,0,3,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,4,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,7,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_2(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,2,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_star(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_K(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,3,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,2,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_Y(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_T(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_3(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,3,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_8(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_9(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,5,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}
float charset_1(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,3,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_F(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,6,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,4,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,2,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_V(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,2,0,0,0,2,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,4,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_point(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   0,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   0,0,0,2,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   0,0,0,0,0,0,0,0); 
  return acc; 
}

float charset_cursor(in vec4 color, vec2 pos)
{
  float acc = 0.0;
  acc += char_(pos+vec2(0.0, ph*00.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*02.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*04.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*06.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*08.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*10.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*12.0),   8,0,0,0,0,0,0,0); 
  acc += char_(pos+vec2(0.0, ph*14.0),   8,0,0,0,0,0,0,0); 
  return acc; 
}

void main( void ) 
{
    
    //vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;
    vec2 pos = gl_FragCoord.xy / resolution.xy - vec2(0.5,0.5);  
    
    vec4 color = vec4(0,0,1,1); 
    vec4 charcol = vec4(0,0,1,1); 
    
    // black border
    color = vec4(0,0,0,1); 
    
    // C64 screen
    if (abs(pos.x) < 0.32 && abs(pos.y) < 0.32)
        color = vec4(0,0,0.5,1);
    else // border
        color = vec4(0,0,1.0,1); 
    // black screen
    if (abs(pos.x) > 0.4 || abs(pos.y) > 0.4) 
            color = vec4(0,0,0,1.0); 

    // upper left corner
    pos.x += pw*8.0*20.0; 
    pos.y -= ph*8.0*18.0; 
    
    float acc = 0.0; 
    vec2 cursor = pos; 

    cursor.x -= cw*4.0; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_C(color, cursor); cursor.x -= cw; 
    acc += charset_O(color, cursor); cursor.x -= cw; 
    acc += charset_M(color, cursor); cursor.x -= cw; 
    acc += charset_M(color, cursor); cursor.x -= cw;  
    acc += charset_O(color, cursor); cursor.x -= cw; 
    acc += charset_D(color, cursor); cursor.x -= cw; 
    acc += charset_O(color, cursor); cursor.x -= cw; 
    acc += charset_R(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_6(color, cursor); cursor.x -= cw; 
    acc += charset_4(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_B(color, cursor); cursor.x -= cw; 
    acc += charset_A(color, cursor); cursor.x -= cw; 
    acc += charset_S(color, cursor); cursor.x -= cw; 
    acc += charset_I(color, cursor); cursor.x -= cw; 
    acc += charset_C(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_V(color, cursor); cursor.x -= cw; 
    acc += charset_2(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    acc += charset_star(color, cursor); cursor.x -= cw; 
    
    cursor = pos; 
    cursor.x -= cw*1.0; 
    cursor.y += ch*4.0; 
    acc += charset_6(color, cursor); cursor.x -= cw; 
    acc += charset_4(color, cursor); cursor.x -= cw; 
    acc += charset_K(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_R(color, cursor); cursor.x -= cw; 
    acc += charset_A(color, cursor); cursor.x -= cw; 
    acc += charset_M(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_S(color, cursor); cursor.x -= cw; 
    acc += charset_Y(color, cursor); cursor.x -= cw; 
    acc += charset_S(color, cursor); cursor.x -= cw; 
    acc += charset_T(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    acc += charset_M(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_3(color, cursor); cursor.x -= cw; 
    acc += charset_9(color, cursor); cursor.x -= cw; 
    acc += charset_8(color, cursor); cursor.x -= cw; 
    acc += charset_1(color, cursor); cursor.x -= cw; 
    acc += charset_1(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_B(color, cursor); cursor.x -= cw; 
    acc += charset_A(color, cursor); cursor.x -= cw; 
    acc += charset_S(color, cursor); cursor.x -= cw; 
    acc += charset_I(color, cursor); cursor.x -= cw; 
    acc += charset_C(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_B(color, cursor); cursor.x -= cw; 
    acc += charset_Y(color, cursor); cursor.x -= cw; 
    acc += charset_T(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    acc += charset_S(color, cursor); cursor.x -= cw; 
    cursor.x -= cw; 
    acc += charset_F(color, cursor); cursor.x -= cw; 
    acc += charset_R(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    
    cursor = pos; 
    cursor.y += ch*8.0; 
    acc += charset_R(color, cursor); cursor.x -= cw; 
    acc += charset_E(color, cursor); cursor.x -= cw; 
    acc += charset_A(color, cursor); cursor.x -= cw; 
    acc += charset_D(color, cursor); cursor.x -= cw; 
    acc += charset_Y(color, cursor); cursor.x -= cw; 
    acc += charset_point(color, cursor); cursor.x -= cw; 
    
    // Blinking cursor
    float blink = mod(time, 1.0); 
    cursor = pos; 
    cursor.y += ch*10.0; 
    acc += charset_cursor(color, cursor)*step(blink,0.5); cursor.x -= cw; 

    color += charcol*acc; 
    gl_FragColor = color; 
}
