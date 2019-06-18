/*
 * Original shader from: https://www.shadertoy.com/view/wdsGzB
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// Emulate a black texture
#define texture(s, uv, l) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Created by Stephane Cuillerdier - Aiekick/2019 (twitter:@aiekick)
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

mat3 RotZ(float a){return mat3(cos(a),-sin(a),0.,sin(a),cos(a),0.,0.,0.,1.);}

vec3 path(vec3 p)
{
	p *= RotZ(p.z * 0.1);
    p += sin(p.zxy * 0.4) * 0.5;
	p *= RotZ(p.z * 0.2);
   	return sin(p.zxy * 0.2) * 2.;
}

float pn( in vec3 x ) // iq noise
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	vec2 rg = texture(iChannel0, (uv+ 0.5)/256.0, -100.0 ).yx;
	return -1.0+2.4*mix( rg.x, rg.y, f.z );
}

const mat3 mx = mat3(1,0,0,0,7,0,0,0,7);
const mat3 my = mat3(7,0,0,0,1,0,0,0,7);
const mat3 mz = mat3(7,0,0,0,7,0,0,0,1);

// base on shane tech in shader : One Tweet Cellular Pattern
float func(vec3 p)
{
    p = fract(p/50.0) - .5;
    return min(min(abs(p.x), abs(p.y)), abs(p.z)) + 0.1;
}

vec3 effect(vec3 p)
{
	p *= mz * mx * my * sin(p.zxy); // sin(p.zxy) is based on iq tech from shader (Sculpture III)
	return vec3(min(min(func(p*mx), func(p*my)), func(p*mz))/.6);
}

vec4 displacement(vec3 p)
{
    vec3 col = 1.-effect(p*0.8);
   	col = clamp(col, -.5, 1.);
    float dist = dot(col,vec3(0.023));
	col = step(col, vec3(0.82));// black line on shape
    return vec4(dist,col);
}

vec4 map(vec3 p)
{
	p += path(p);
	p *= RotZ(p.z * 0.1);
	vec4 disp = displacement(sin(p.zxy*3.)*.75);
	p.y = mod(p.y, 1.5)-.75;
    float l = abs(p.y)-0.1;
    return vec4(max(-l + 0.085, l) - disp.x, disp.yzw);
}

vec3 nor( in vec3 pos, float prec )
{
	vec3 eps = vec3( prec, 0., 0. );
	vec3 nor = vec3(
	    map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	    map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	    map(pos+eps.yyx).x - map(pos-eps.yyx).x );
	return normalize(nor);
}

vec4 light(vec3 ro, vec3 rd, float d, vec3 lightpos)
{
	vec3 p = ro + rd * d;
	
	vec3 n = nor(p, 0.1);
	
	vec3 lightdir = vec3(-1.);
	float lightlen = length(lightpos - p);
	lightdir /= lightlen;
    
	float amb = 0.6;
	float diff = clamp( dot( n, lightdir ), 0.0, 1.0 );
	float spe = pow(clamp( dot(reflect(rd,n), lightdir),0.,1.),5.);
    
	vec3 brdf = vec3(0);
	brdf += amb * vec3(0.8,0.2,0.4); // color mat
	brdf += diff * 1.;
	brdf += spe * 1.;
	
	brdf = mix(brdf, map(p).yzw, 0.25);
		
	return vec4(brdf, lightlen);
}

////////MAIN///////////////////////////////
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 g = fragCoord;
	vec2 si = iResolution.xy;
	vec2 uv = (g+g-si)/si.y;
    
	vec3 ro = vec3(0,0, iTime * 3.); ro -= path(ro);
	vec3 cv = ro + vec3(0,0,4); cv -= path(cv);
	vec3 cu = normalize(vec3(0,1,0));
  	vec3 z = normalize(cv-ro);
    vec3 x = normalize(cross(cu,z));
  	vec3 y = cross(z,x);
  	vec3 rd = normalize(uv.x * x + uv.y * y + z);

    float ao = 0.; // ao low cost :)
    
    const int iter = 200;
    float st = 0.;
    float d = 0.;
    for(int i=0;i<iter;i++)
    {            
        st = map(ro+rd*d).x;
        d += st * 0.5;
        ao++;
        if (st<0.025*log(d*d/st/1e4)) break;
    }
	
    vec4 li = light(ro, rd, d, ro + vec3(0,0,1));
    vec3 col = li.xyz/(li.w);
   	  
    col = mix(vec3(1.-ao/float(iter)), col, 0.25);// low cost ao :)
    fragColor.rgb = mix( col, vec3(0), 1.0-exp( -0.01*d*d ) );
           
    vec2 q = fragCoord/si;
	fragColor.rgb *= 0.5 + 0.5*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.25 );
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
