/*
 * Original shader from: https://www.shadertoy.com/view/wtB3RG
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
/*
Save code as firesmoke.c and compile from Visual Studio command line:
cl.exe firesmoke.c d3d12.lib dxgi.lib dxguid.lib user32.lib kernel32.lib gdi32.lib
Compile own HLSL Shader Model 6.0 code to output header file containing object code:
dxc /T vs_6_0 /Fh vertex.sh vertex.hlsl
dxc /T ps_6_0 /Fh pixel.sh pixel.hlsl
To use timer, define inside HLSL pixel shader code: 
cbuffer PerFrameConstants : register (b0) {float iTime;}
and
use pixel coordinates as:
float4 position : SV_POSITION
*/

/*
References:
https://docs.microsoft.com/en-us/windows/desktop/api/_direct3d12/
https://github.com/wolfgangfengel/graphicsdemoskeleton
https://www.shadertoy.com/view/MdfGRX
https://www.shadertoy.com/view/Xt3cDn
*/

const mat3 rotationMatrix = mat3(1.0,0.0,0.0,0.0,0.47,-0.88,0.0,0.88,0.47);

#ifdef ORIGINAL_INT_HASH
float hash(float p)
{
    uint x = uint(p  + 16777041.);
    x = 1103515245U*((x >> 1U)^(x));
    uint h32 = 1103515245U*((x)^(x>>3U));
    uint n =  h32^(h32 >> 16);
    return float(n)*(1.0/float(0xffffffffU));
}
#else
float hash(float p){
    p = fract(p * .1071);
    p *= p + 19.19;
    p *= p + p;
    return fract(p);
}
#endif

float noise( vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+0.0  ), hash(n+1.0),f.x),mix( hash(n+57.0 ), hash(n+58.0 ),f.x),f.y),
           mix(mix( hash(n+113.0), hash(n+114.0),f.x),mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
} 

vec4 map( vec3 p )
{
	float d = 0.2 - p.y;	
	vec3 q = p  - vec3(0.0,1.0,0.0)*iTime;
	float f  = 0.50000*noise( q ); q = q*2.02 - vec3(0.0,1.0,0.0)*iTime;
	f += 0.25000*noise( q ); q = q*2.03 - vec3(0.0,1.0,0.0)*iTime;
	f += 0.12500*noise( q ); q = q*2.01 - vec3(0.0,1.0,0.0)*iTime;
	f += 0.06250*noise( q ); q = q*2.02 - vec3(0.0,1.0,0.0)*iTime;
	f += 0.03125*noise( q );
	d = clamp( d + 4.5*f, 0.0, 1.0 );
	vec3 col = mix( vec3(1.0,0.9,0.8), vec3(0.4,0.1,0.1), d ) + 0.05*sin(p);
	return vec4( col, d );
}

vec3 raymarch( vec3 ro, vec3 rd )
{
	vec4 s = vec4( 0,0,0,0 );
	float t = 0.0;	
	for( int i=0; i<128; i++ )
	{
		if( s.a > 0.99 ) break;
		vec3 p = ro + t*rd;
		vec4 k = map( p );
		k.rgb *= mix( vec3(3.0,1.5,0.15), vec3(0.5,0.5,0.5), clamp( (p.y-0.2)/2.0, 0.0, 1.0 ) );
		k.a *= 0.5;
		k.rgb *= k.a;
		s = s + k*(1.0-s.a);	
		t += 0.05;
	}
	return clamp( s.xyz, 0.0, 1.0 );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec3 ro = vec3(0.0,4.9,-40.);
	vec3 rd = normalize(vec3((2.0*fragCoord.xy-iResolution.xy)/iResolution.y,2.0)) * rotationMatrix;
	vec3 volume = raymarch( ro, rd );
	volume = volume*0.5 + 0.5*volume*volume*(3.0-2.0*volume);
	fragColor = vec4( volume, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
