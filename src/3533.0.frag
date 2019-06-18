//@ME 
//Stones
//TODO: colors, cover with moss, ...

// iq's noise generation! superb!

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform vec2 reyboard;

mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

float hash( float n )
{
	return fract(sin(n)*43758.5453+time*0.3);
}

float noise( in vec2 x )
{
	vec2 p = floor(x);
	vec2 f = fract(x);
    	f = f*f*(3.0-2.0*f);
    	float n = p.x + p.y*57.0;
    	float res = mix(mix( hash(n+  0.0), hash(n+  1.0),f.x), mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y);
    	return res;
}

float fbm( vec2 p )
{
    	float f = 0.0;
    	f += 0.50000*noise( p ); p = m*p*2.02;
    	f += 0.25000*noise( p ); p = m*p*2.03;
    	f += 0.12500*noise( p ); p = m*p*2.01;
    	f += 0.06250*noise( p ); p = m*p*2.04;
    	f += 0.03125*noise( p );
    	return f/0.984375;
}

float thing(vec2 pos) 
{
	vec2 p = pos;
	float offset = 0.0;
	float row = floor((pos.y)/1.0);
	if (mod(row, 2.0) < 1.0)
		offset = 0.5;
	
	pos.x = fract(pos.x + fbm(p*0.75) + offset +.5)-0.5;
	pos.y = fract(pos.y +.5)-0.5;
	
	//pos.x = fract(pos.x + fbm(p*0.75) +.5)-0.5;
	//pos.y = fract(pos.y + fbm(p*0.75) +.5)-0.5;
	
	pos = abs(pos);
	float r = sqrt(pos.x*pos.y * 2.0) * 3.;
	return clamp((r*fbm(p*1.5)+(fbm(p*m*25.) * 0.25))-.25, 0.0, 1.0);
}

void main(void) 
{
	vec2 position = ( gl_FragCoord.xy / resolution );
	vec2 world = position * 6.0;
	world.x *= resolution.x / resolution.y;
	world.x += time;
	float shade = thing(world);
	gl_FragColor = vec4(shade, shade, shade, 1.0 );
}
