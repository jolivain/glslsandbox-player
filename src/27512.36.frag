#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//The Worst Demo
//16 x 24 x 1 bpp sprite test brought to you by comic sans

#define IS_THUMBNAIL (resolution.xy == vec2(200,100))

float tau = atan(1.0)*8.0;

float repeatTime = 3.8;
float zoomTime = 1.0;
float spinTime = 7.0;
float colorTime = 7.0;

float animTime = 0.0;

float zoom = 1.0;
float ang = 0.0;
bool doRepeat = false;
bool doColor = false;
vec3 fg = vec3(1);
vec3 bg = vec3(0);

#define SCALE 1.0

vec2 size = vec2(16,24);

#define STRSIZE(n) (n * size)

mat4 c_g = mat4(0x000000, 0x000000, 0x01E007, 0xF80FFC, 0x1E1C3C, 0x003800, 0x780070, 0x0070FF, 0xE7FFEF, 0xFFEF0E, 0xE01EE0, 0x1CE03C, 0xF0F87F, 0xF03FE0, 0x1F8000, 0x000000);
mat4 c_l = mat4(0x000000, 0x000000, 0x100038, 0x003800, 0x380038, 0x003800, 0x380038, 0x003800, 0x380038, 0x003800, 0x380038, 0x003800, 0x38783F, 0xFC3FF8, 0x1FC000, 0x000000);
mat4 c_s = mat4(0x000000, 0x000000, 0x01F807, 0xFE0FFE, 0x1E003C, 0x003800, 0x3C003F, 0xF01FFC, 0x07FE00, 0x0F0007, 0x0007E0, 0x07E00F, 0xF07EFF, 0xFC7FF8, 0x1FC000, 0x000000);

//Extracts 4 bits from 4 numbers at once.
vec4 extract_bit(vec4 n, vec4 b)
{
	b = clamp(b,vec4(-1.0),vec4(24.0));
	return mod(floor(n / exp2(floor(b))),vec4(2.0));   
}

//Returns the pixel at uv in the given bit-packed sprite.
float sprite(mat4 spr, vec2 size, vec2 uv)
{
	uv = floor(uv);
	
	//Calculate the bit to extract (x + y * width) (flipped on x-axis)
	float bit = (size.x-uv.x-1.0) + uv.y * size.x;
	
	//Clipping bound to remove garbage outside the sprite's boundaries.
	bool bounds = all(greaterThanEqual(uv,vec2(0))) && all(lessThan(uv,size));
	
	float pixels = 0.0;
	pixels += dot(extract_bit(spr[3], bit - (vec4(72,48,24,0) +   0.0)), vec4(1));
	pixels += dot(extract_bit(spr[2], bit - (vec4(72,48,24,0) +  96.0)), vec4(1));
	pixels += dot(extract_bit(spr[1], bit - (vec4(72,48,24,0) + 192.0)), vec4(1));
	pixels += dot(extract_bit(spr[0], bit - (vec4(72,48,24,0) + 288.0)), vec4(1));
	
	return bounds ? pixels : 0.0;
}

float hash( vec2 p )
{
     mat2 m = mat2( 15.32, 83.43,
                     117.38, 289.59 );
    
     return dot(fract( sin( m * p) * 46783.289 ),vec2(1));
}

vec3 hue(float x)
{
	return clamp(2.0 * cos(vec3(tau * x) + (tau * vec3(0,2,1) / 3.0)),-1.0, 1.0) * 0.5 + 0.5;
}

void main( void ) 
{
	if(!IS_THUMBNAIL)
	{
		animTime = max(0.0, time - zoomTime);
		zoom = sin(animTime + tau*(3.0/4.0)) * 3.0 + 4.0;
		
		animTime = max(0.0, time - spinTime);
		ang = animTime;
		
		doRepeat = time > repeatTime;
		
		doColor = time > colorTime;
	}
	
	vec2 res = resolution / SCALE / zoom;
	vec2 uv = floor( gl_FragCoord.xy / SCALE ) / zoom;
	
	uv -= (res / 2.0);
	
	uv *= mat2(cos(ang),sin(ang),-sin(ang),cos(ang));
	uv += (STRSIZE(vec2(4,1)) / 2.0);
	
	vec2 tile = vec2(0);
	
	if(doRepeat)
	{
		tile = floor((uv + size/2.0) / (size * vec2(5,2)));
		uv = mod(uv, size * vec2(5,2));
	}
	
	vec2 cursor = vec2(0,0);
	
	float pixel = 0.0;
	pixel += sprite(c_g, size, uv - cursor); cursor.x += size.x;
	pixel += sprite(c_l, size, uv - cursor); cursor.x += size.x;
	pixel += sprite(c_s, size, uv - cursor); cursor.x += size.x;
	pixel += sprite(c_l, size, uv - cursor); cursor.x += size.x;
	
	if(doColor)
	{
		float c = hash(vec2(tile));
		
		fg = hue(c);
		bg = hue(c + 0.3);
	}
	
	vec3 color = mix(bg, fg, pixel); 
	
	gl_FragColor = vec4( vec3( color ), 1.0 );

}
