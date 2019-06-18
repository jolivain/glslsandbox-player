#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//Edit of e#27059.8 for easier typing

float SCALE = 1.0;
vec2 SPR_SIZE = vec2(6, 8);

vec2 start = vec2(0,0);
vec2 tuv = vec2(0,0);
vec2 chp = vec2(0,0);
vec2 cur = vec2(0,0);
vec2 char = vec2(0,0);

#define NL nl();
#define _ spc();
#define A ch(vec2(0x7228BE, 0x8A2000));
#define B ch(vec2(0xF22F22, 0x8BC000));
#define C ch(vec2(0x722820, 0x89C000));
#define D ch(vec2(0xE248A2, 0x938000));
#define E ch(vec2(0xFA0E20, 0x83E000));
#define F ch(vec2(0xFA0E20, 0x820000));
#define G ch(vec2(0x72282E, 0x89C000));
#define H ch(vec2(0x8A2FA2, 0x8A2000));
#define I ch(vec2(0xF88208, 0x23E000));
#define J ch(vec2(0xF84104, 0x918000));
#define K ch(vec2(0x8A4A34, 0x8A2000));
#define L ch(vec2(0x820820, 0x83E000));
#define M ch(vec2(0x8B6AA2, 0x8A2000));
#define N ch(vec2(0x8B2AA6, 0x8A2000));
#define O ch(vec2(0x7228A2, 0x89C000));
#define P ch(vec2(0xF228BC, 0x820000));
#define Q ch(vec2(0x7228AA, 0x99E000));
#define R ch(vec2(0xF228BC, 0x8A2000));
#define S ch(vec2(0x7A0702, 0x0BC000));
#define T ch(vec2(0xF88208, 0x208000));
#define U ch(vec2(0x8A28A2, 0x89C000));
#define V ch(vec2(0x8A28A2, 0x508000));
#define W ch(vec2(0x8A28AA, 0xDA2000));
#define X ch(vec2(0x8A2722, 0x8A2000));
#define Y ch(vec2(0x8A2782, 0x89C000));
#define Z ch(vec2(0xF84210, 0x83E000));
#define _0 ch(vec2(0x732AA6, 0x89C000));
#define _1 ch(vec2(0x218208, 0x23E000));
#define _2 ch(vec2(0x722108, 0x43E000));
#define _3 ch(vec2(0x722302, 0x89C000));
#define _4 ch(vec2(0x92491E, 0x104000));
#define _5 ch(vec2(0xFA0F02, 0x89C000));
#define _6 ch(vec2(0x72283C, 0x89C000));
#define _7 ch(vec2(0xF82108, 0x420000));
#define _8 ch(vec2(0x722722, 0x89C000));
#define _9 ch(vec2(0x722782, 0x89C000));
#define PER ch(vec2(0x000000, 0x008000));
#define EXC ch(vec2(0x208208, 0x008000));
#define COM ch(vec2(0x000000, 0x008400));
#define COL ch(vec2(0x008000, 0x008000));
#define SOL ch(vec2(0x008000, 0x008400));
#define PLS ch(vec2(0x00823E, 0x208000));
#define DSH ch(vec2(0x00003E, 0x000000));
#define DIV ch(vec2(0x002108, 0x420000));
#define AST ch(vec2(0x000508, 0x500000));
#define LBR ch(vec2(0x084104, 0x102000));
#define RBR ch(vec2(0x810410, 0x420000));
#define LSB ch(vec2(0x184104, 0x106000));
#define RSB ch(vec2(0xC10410, 0x430000));
#define LCB ch(vec2(0x184208, 0x106000));
#define RCB ch(vec2(0xC10208, 0x430000));
#define LES ch(vec2(0x084208, 0x102000));
#define GRT ch(vec2(0x408104, 0x210000));
#define SQO ch(vec2(0x208000, 0x000000));
#define DQO ch(vec2(0x514000, 0x000000));
#define QUE ch(vec2(0x72208C, 0x008000));
#define PCT ch(vec2(0x022108, 0x422000));
#define DOL ch(vec2(0x21EA1C, 0x2BC200));
#define NUM ch(vec2(0x53E514, 0xF94000));
#define ATS ch(vec2(0x722BAA, 0xA9C000));
#define EQU ch(vec2(0x000F80, 0xF80000));
#define TDL ch(vec2(0x42A100, 0x000000));
#define RSL ch(vec2(0x020408, 0x102000));
#define CRT ch(vec2(0x214880, 0x000000));
#define AMP ch(vec2(0x42842C, 0x99C000));
#define BAR ch(vec2(0x208208, 0x208208));
#define BLK ch(vec2(0xFFFFFF, 0xFFFFFF));
#define TRD ch(vec2(0xFD5FD5, 0xFD5FD5));
#define HLF ch(vec2(0xA95A95, 0xA95A95));
#define QRT ch(vec2(0xA80A80, 0xA80A80));

float sprite(vec2 ch,vec2 uv)
{
	uv = floor(uv);
	vec2 b = vec2((SPR_SIZE.x - uv.x - 1.0) + uv.y * SPR_SIZE.x) - vec2(24,0);
	vec2 p = mod(floor(ch / exp2(clamp(b,-1.0, 25.0))), 2.0);
	return dot(p,vec2(1)) * float(all(bvec4(greaterThanEqual(uv,vec2(0)), lessThan(uv,SPR_SIZE))));
}

void ch(vec2 ch)
{
	if(floor(chp) == floor(cur))
	{
		char = ch;
	}
	cur.x++;
}

void digit(float n)
{
	n = mod(floor(n),10.0);
	if(n == 0.0) { _0 }
	if(n == 1.0) { _1 }
	if(n == 2.0) { _2 }
	if(n == 3.0) { _3 }
	if(n == 4.0) { _4 }
	if(n == 5.0) { _5 }
	if(n == 6.0) { _6 }
	if(n == 7.0) { _7 }
	if(n == 8.0) { _8 }
	if(n == 9.0) { _9 }
}

void start_print(vec2 uv)
{
	cur = uv;
	start = uv;
}

void spc()
{
	cur.x++;
}
void nl()
{
	cur.x = start.x;
	cur.y--;
}

void number(float n)
{
	for(int i = 5;i > -3;i--)
	{
		float d = n/pow(10.0, float(i));
		if(i == -1){ PER }
		if(d > 1.0 || i <= 0){ digit(d); }
	}	
}

void integer(int n)
{
	for(int i = 5;i >= 0;i--)
	{
		float d = float(n)/pow(10.0, float(i));
		if(i == -1){ PER }
		if(d > 1.0 || i <= 0){ digit(d); }
	}
}

vec2 str_size(vec2 cl)
{
	return SPR_SIZE * cl;
}

void main( void ) 
{
	vec2 aspect = resolution.xy / resolution.y;
	vec2 uv = ( gl_FragCoord.xy ) / SCALE;
	
	chp = floor(uv/SPR_SIZE);
	vec2 cuv = mod(uv,SPR_SIZE);
	
	tuv = floor(cuv);
	
	vec2 cen = (resolution / (SPR_SIZE * SCALE)) / 2.0;
	
	cen -= vec2(37,6)/2.0;
	
	cen.y += 9.0;
	
	cen = floor(cen);
	
	start_print(cen);
	
	H E L L O _ W O R L D EXC NL NL
	
	T H I S _ T E X T _ I S _ O N _ L I N E _ integer(__LINE__); PER NL
		
	T H I S _ S H A D E R _ U S E S _ G L S L _ V E R S I O N _ integer(__VERSION__); PER NL
	
	T H E _ V I E W P O R T _ I S _ integer(int(resolution.x)); _ X _ integer(int(resolution.y)); PER NL
		
	Y O U _ H A V E _ B E E N _ H E R E _ F O R _ number(time/60.0); _ M I N U T E S PER NL
		
	Y O U R _ M O U S E _ I S _ A T _ integer(int(mouse.x*resolution.x)); COM _ integer(int(mouse.y*resolution.y)); PER NL
		
	T H I S _ T E X T _ S T A R T S _ A T _ integer(int(start.x)); COM _ integer(int(start.y)); PER NL
		
	start_print(vec2(0,0));	
	
	T H I S _ T E X T _ I S _ I N _ T H E _ C O R N E R
	
	gl_FragColor = vec4( vec3( sprite(char,cuv) ), 1.0 );
}
