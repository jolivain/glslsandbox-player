/*
 * Original shader from: https://www.shadertoy.com/view/Wdf3zl
 */

#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.14159265359
#define degToRad (PI * 2.0) / 360.0
const float WallDistance = 0.03;
const float GlowDistance = 0.01874;
const float MarchDumping = 0.358;

/* The glass like shader is based on https://www.shadertoy.com/view/Md3SDB */

float c_0 = 31599.0;
float c_1 = 9362.0;
float c_2 = 29671.0;
float c_3 = 29391.0;
float c_4 = 23497.0;
float c_5 = 31183.0;
float c_6 = 31215.0;
float c_7 = 29257.0;
float c_8 = 31727.0;
float c_9 = 31695.0;
float c_colon = 1040.0;

// 2d distance functions from http://www.iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
float dBox2d(vec2 p, vec2 b) {
	return max(abs(p.x) - b.x, abs(p.y) - b.y);
}

vec3 lineTex(vec2 uv)
{
    float stripeSize = 50.0;
    float t = iTime*10.0;
    return vec3(tan((uv.x+uv.y+(-t/stripeSize))*stripeSize)*stripeSize,tan((uv.x+uv.y+(-t/stripeSize))*stripeSize)*stripeSize,tan((uv.x+uv.y+(-t/stripeSize))*stripeSize)*stripeSize);
}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{
	vec2 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h );
}

vec3 line( in vec3 buf, in vec2 a, in vec2 b, in vec2 p, in vec2 w, in vec4 col )
{
   float f = sdLine( p, a, b );
   float g = fwidth(f)*w.y;
   return mix( buf, col.xyz, col.w*(1.0-smoothstep(w.x-g, w.x+g, f)) );
}

float sdTriangle( in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p )
{
	vec2 e0 = p1 - p0;
	vec2 e1 = p2 - p1;
	vec2 e2 = p0 - p2;

	vec2 v0 = p - p0;
	vec2 v1 = p - p1;
	vec2 v2 = p - p2;

	vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
	vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
	vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
    
    float s = sign( e0.x*e2.y - e0.y*e2.x );
    vec2 d = min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
                       vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
                       vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) ));

	return -sqrt(d.x)*sign(d.y);
}

float hash(float h) {
    return fract(sin(h) * 43758.5453123);
}

mat3 matRotateX(float rad)
{
    return mat3(1,       0,        0,
                0,cos(rad),-sin(rad),
                0,sin(rad), cos(rad));
}

mat3 matRotateY(float rad)
{
    return mat3(cos(rad), 0, -sin(rad),
					0, 1, 0,
					sin(rad), 0, cos(rad));
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdCapsule( vec3 p, float h, float r )
{
    p.z -= clamp( p.z, 1.0, h );
    return length( p ) - r;
}

float opElongate( in vec3 p, in vec2 size, in vec3 h )
{
    vec3 q = abs(p)-h;
    return sdTorus( max(q,0.0), size ) + min(max(q.x,max(q.y,q.z)),0.0);
}

float opSubtraction( float d1, float d2 ) { return max(-d1,d2); }

vec4 combine(vec4 val1, vec4 val2 ){
    if ( val1.w < val2.w ) return val1;
    return val2;
}

vec4 map(vec3 p){
    float speed = iTime*15.0;
    vec3 prevP = p;
    
    float cmnR = 0.035;
    float floorD = p.y+3.0;
    float sole0 = opElongate(p+vec3(-0.05,0,2.9), vec2(0.3,0.11), vec3(0.3,0.05,0.001));
   	sole0 = opSubtraction(length(p+vec3(0,0,2.6))-0.3, sole0)-cmnR;
    
    float sole1 = opElongate(p+vec3(0.05,0,1.8), vec2(0.35,0.11), vec3(0.6,0.05,0.001));
   	sole1 = opSubtraction(length(p+vec3(0.2,0,1.45))-0.3, sole1)-cmnR;
    sole1 = opSubtraction(length(p+vec3(0.1,0,2.15))-0.3, sole1);
    
    float sole2 = opElongate(p+vec3(0.1,0,0.7), vec2(0.4,0.11), vec3(0.75,0.05,0.001));
   	sole2 = opSubtraction(length(p+vec3(0.3,0,1.1))-0.3, sole2)-cmnR;
    
    float sole3 = opElongate(p+vec3(0,0,-0.5), vec2(0.35,0.11), vec3(0.6,0.05,0.001));
   	sole3 = opSubtraction(length(p+vec3(0,0,-1.1))-0.8, sole3)-cmnR;
    
    p.x = -abs(p.x);
    float sole4 = sdCapsule(p+vec3(0.7,0,-0.3),1.3,0.2);
    p = prevP;
    
    float sole5 = opElongate(p+vec3(0,0,-2.5), vec2(0.35,0.12), vec3(0.3,0.05,0.001));
   	sole5 = opSubtraction(length(p+vec3(0,0,-1.95))-0.7, sole5)-cmnR;
    
    vec4 res = combine(vec4(vec3(0.9,0.3,0.3),sole0),vec4(vec3(0.9,0.3,0.3),sole1));
    vec4 res2 = combine(vec4(vec3(0.9,0.3,0.3),sole2),vec4(vec3(0.9,0.3,0.3),sole3));
    vec4 res3 = combine(vec4(vec3(0.9,0.3,0.3),sole4),vec4(vec3(0.9,0.3,0.3),sole5));
    vec4 res4 = combine(res,res2);
    vec4 res5 = combine(res3,res4);
    
    return res5;
}


float getBit(float num,float bit)
{
	num = floor(num);
	bit = floor(bit);
	
	return float(mod(floor(num/pow(2.,bit)),2.) == 1.0);
}

float Sprite3x5(float sprite,vec2 p)
{
	float bounds = float(all(lessThan(p,vec2(3,5))) && all(greaterThanEqual(p,vec2(0,0))));
	
	return getBit(sprite,(2.0 - p.x) + 3.0 * p.y) * bounds;
}

float Digit(float num,vec2 p)
{
	num = mod(floor(num),11.0);
	
	if(num == 0.0) return Sprite3x5(c_0,p);
	if(num == 1.0) return Sprite3x5(c_1,p);
	if(num == 2.0) return Sprite3x5(c_2,p);
	if(num == 3.0) return Sprite3x5(c_3,p);
	if(num == 4.0) return Sprite3x5(c_4,p);
	if(num == 5.0) return Sprite3x5(c_5,p);
	if(num == 6.0) return Sprite3x5(c_6,p);
	if(num == 7.0) return Sprite3x5(c_7,p);
	if(num == 8.0) return Sprite3x5(c_8,p);
	if(num == 9.0) return Sprite3x5(c_9,p);
	if(num == 10.0) return Sprite3x5(c_colon,p);
	
	return 0.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    
    mat3 camRotY = matRotateY(-(iTime*30.0)*degToRad)*matRotateX(40.*degToRad);
	//mat3 camRotY = matRotateX(90.0*degToRad);
    
	vec3 ro=vec3(0.,-.1,-8.);
    vec3 rd=normalize(vec3(p,1.8));
	
    float t, dist;
	t = 0.0;
	vec3 distPos = vec3(0.0);
	vec4 distCl = vec4(0.0);
    
    vec3 accu = vec3(0.0);
    float glowFactor = 0.0;
    float steps = 0.0;
	for(int i = 0; i < 60; i++){
        steps = float(i);
        
		distCl = map(distPos);
		dist = distCl.w;
        float absd = abs(dist);
        absd *= 0.8 + hash(absd) * 0.2;
        
		if(dist < 1e-4){break;}
        if(t>30.)break;
        
		glowFactor += pow(1.0 - smoothstep(0.0, GlowDistance, dist), 14.0) * step(0.0, dist);
        float f = absd * (1.0 - smoothstep(0.0, WallDistance, absd));
        accu += vec3(f);

        t += max(0.0001, absd * MarchDumping);
        
		distPos = (ro+rd*t)*camRotY;
	}
    glowFactor /= steps;
	accu += 0.7 * pow(glowFactor, 1.2) * vec3(1.0, 1.0, 1.0);

    // drawing UI
    vec2 uv = (2.0*fragCoord.xy-iResolution.xy)/min(iResolution.y,iResolution.x);
    vec2 uvRef = uv;
    
    // bg color
    vec3 uicol = vec3(0.0,0.0,0.0);
    vec3 white = vec3(1.0);
    
    uvRef.y -= 0.5;
    uvRef.x = mod(uvRef.x,1.0)-0.5;
    uvRef.y = mod(uvRef.y,1.0)-0.5;
    uicol = line( uicol, vec2(0.0, 0.2), vec2(0.0, -0.2), uvRef, vec2(0.002,1.0), vec4(white,2.0) );
	uicol = line( uicol, vec2(0.2, 0.0), vec2(-0.2, 0.0), uvRef, vec2(0.002,1.0), vec4(white,2.0) );
    
    // guage
    float guageBg = dBox2d(uv+vec2(-1.0, -0.5), vec2(0.11,0.36));
    uicol = mix( uicol, white, 1.0-smoothstep(0.0001,0.01,abs(guageBg)) );
    
    vec3 ltex = lineTex(uv);
    float ganimate = sin(iTime*1.2)*0.1;
    float guageBar = dBox2d(uv+vec2(-1.0, -0.4-ganimate), vec2(0.0005,0.15+ganimate));
    uicol = mix( uicol, ltex, 1.0-smoothstep(0.09,0.105,abs(guageBar)) );
    
    float naviSize = 0.03;
    float navi = sdTriangle(vec2(naviSize,naviSize*2.0),vec2(-naviSize,naviSize),vec2(naviSize,-naviSize*0.25),uv+vec2(-1.15,-0.62-ganimate*2.2));
    uicol = mix( uicol, white, 1.0-smoothstep(0.003,0.01,abs(navi)) );

    // guage2
    ganimate = sin(iTime*1.5)*0.1;
    float guage0 = dBox2d(uv+vec2(1.1-ganimate, 0.4), vec2(0.15+ganimate,0.006));
    uicol = mix( uicol, ltex, 1.0-smoothstep(0.029,0.03,abs(guage0)));
    
    ganimate = sin(iTime*1.7)*0.1;
    float guage1 = dBox2d(uv+vec2(1.1-ganimate, 0.5), vec2(0.15+ganimate,0.006));
    uicol = mix( uicol, ltex, 1.0-smoothstep(0.029,0.03,abs(guage1)));
    
    ganimate = sin(iTime*1.9)*0.1;
    float guage2 = dBox2d(uv+vec2(1.1-ganimate, 0.6), vec2(0.15+ganimate,0.006));
    uicol = mix( uicol, ltex, 1.0-smoothstep(0.029,0.03,abs(guage2)));
    
    // fake 3D graph
    uicol = line( uicol, vec2(1.0, -0.15), vec2(1.0, -0.5), uv, vec2(0.003,1.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(1.0, -0.5), vec2(0.7, -0.7), uv, vec2(0.003,1.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(1.0, -0.5), vec2(1.3, -0.7), uv, vec2(0.003,1.0), vec4(white,2.0) );
    
    uicol = line( uicol, vec2(1.0, -0.3), vec2(0.85, -0.6), uv, vec2(0.003,1.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(1.0, -0.3), vec2(1.15, -0.6), uv, vec2(0.003,1.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.85, -0.6), vec2(1.15, -0.6), uv, vec2(0.003,1.0), vec4(white,2.0) );
    
	float dot0 = dBox2d(uv+vec2(-1.0, 0.15), vec2(0.001,0.001));
    uicol = mix( uicol, white, 1.0-smoothstep(0.025,0.03,abs(dot0)) );
	float dot1 = dBox2d(uv+vec2(-0.7, 0.7), vec2(0.001,0.001));
    uicol = mix( uicol, white, 1.0-smoothstep(0.025,0.03,abs(dot1)) );
	float dot2 = dBox2d(uv+vec2(-1.3, 0.7), vec2(0.001,0.001));
    uicol = mix( uicol, white, 1.0-smoothstep(0.025,0.03,abs(dot2)) );
    
    float ax = cos(iTime*2.5)*0.03;
    float ay = sin(iTime*1.7)*0.04;
    float ax2 = cos(iTime*1.9)*0.05;
    float ay2 = sin(iTime*2.1)*0.06;
    
    float rotVal = -(iTime*30.0)*degToRad;
    float c = cos(rotVal*2.0);
    float s = sin(rotVal*2.0);
    mat2 m = mat2(c,-s,s,c);
    
	float td = sdTriangle(vec2(0.12+ax,0.12+ay)*m,vec2(-0.12+ax2,0.12+ay2)*m,vec2(-0.12+ax,-0.12+ay)*m,uv+vec2(-1.0,0.55));
    uicol = mix( uicol, white, 1.0-smoothstep(0.006,0.01,abs(td)) );
    
    // AIR LOGO
    vec2 logoPos = vec2(1.25,-0.5);
	uicol = line( uicol, vec2(0.1, 0.07), vec2(0.0, -0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
	uicol = line( uicol, vec2(0.14, 0.07), vec2(0.14, -0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.23, 0.07), vec2(0.23, -0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.32, 0.07), vec2(0.32, -0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.36, 0.07), vec2(0.45, 0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.45, 0.07), vec2(0.37, -0.03), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    uicol = line( uicol, vec2(0.37, -0.03), vec2(0.5, -0.07), uv+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    
    // digit
    uv = ( fragCoord.xy /iResolution.xy ) * vec2(256,128);
	vec2 cpos = vec2(113.0,117.0);
	float dc = Digit(fract(iTime)*10.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*20.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(10.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*40.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*50.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(10.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*70.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*80.0,floor(uv-cpos));
	cpos.x += 3.5;
	dc += Digit(fract(iTime)*90.0,floor(uv-cpos));
   	uicol = mix(uicol,white,dc );
    
	// rendering result
	float brightness = 2.0;
    vec3 dst = accu*brightness;
	fragColor = vec4(dst+uicol, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
