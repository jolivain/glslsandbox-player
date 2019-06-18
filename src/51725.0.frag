/*
 * Original shader from: https://www.shadertoy.com/view/3sfGzB
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

// modified sdTriangle function
float sdQuads( in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p3, in vec2 p )
{
	vec2 e0 = p1 - p0;
	vec2 e1 = p2 - p1;
	vec2 e2 = p3 - p2;
    vec2 e3 = p0 - p3;

	vec2 v0 = p - p0;
	vec2 v1 = p - p1;
	vec2 v2 = p - p2;
    vec2 v3 = p - p3;

	vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
	vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
	vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
    vec2 pq3 = v3 - e3*clamp( dot(v3,e3)/dot(e3,e3), 0.0, 1.0 );
    
    float s = sign( e0.x*e3.y - e0.y*e3.x );
    vec2 d = min( min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
                       vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
                 	   vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) )),
                       vec2( dot( pq3, pq3 ), s*(v3.x*e3.y-v3.y*e3.x) ));

	return -sqrt(d.x)*sign(d.y);
}

float sdTriangleIsosceles( in vec2 q, in vec2 p )
{
    p.y -= 0.5;
    p.x = abs(p.x);
    
	vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    
    float s = -sign( q.y );

    vec2 d = min( vec2( dot( a, a ), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot( b, b ), s*(p.y-q.y)  ));

	return -sqrt(d.x)*sign(d.y);
}

float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }
float sdRhombus( in vec2 p, in vec2 b ) 
{
    vec2 q = abs(p);

    float h = clamp( (-2.0*ndot(q,b) + ndot(b,b) )/dot(b,b), -1.0, 1.0 );
    float d = length( q - 0.5*b*vec2(1.0-h,1.0+h) );
    return d * sign( q.x*b.y + q.y*b.x - b.x*b.y );
}

vec3 animateCircle(vec2 uv, vec3 col,vec2 pos, float deg, float size, float thic, float speed) {
	float rad = ((iTime*speed)+deg)*degToRad;
    float s = sin(rad);
    float c = cos(rad);
    
    vec2 q = (uv+pos) * mat2(c, -s, s, c);
    float r2 = (length( q )*size);
    
    if(r2 > 1.0-thic && r2 < 1.0 && q.y > 0.15){
        vec3 ltex = lineTex(q);
        col *= ltex/100.0;
    }
    
    return col;
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord.xy-iResolution.xy)/min(iResolution.y,iResolution.x);
    vec2 uvRef = uv;
    
    // bg color
    vec3 col = vec3(0.9,0.9,0.9);
    vec3 bcol = vec3(0.3,0.75,0.7);
    
	float r3 = length( uv+vec2(-0.5,0.75) )*3.0;
    float r4 = length( uv+vec2(-0.5,0.75) )*3.5;
    
    col = mix( col, vec3(0.2,0.2,0.2), 1.0-smoothstep(0.98,1.0,r3) );
    col = mix( col, bcol, 1.0-smoothstep(0.98,1.0,r4) );
    
	if(uv.x >= 0.23 && uv.x<0.7){
        uvRef = uv;
        uvRef.x += iTime*0.25;
        
        uvRef.x = mod(uvRef.x,2.0)-1.0;
        uvRef.y += 0.75;
        col = line( col, vec2(0.0, 0.07), vec2(0.07, -0.07), uvRef, vec2(0.02,2.0), vec4(vec3(0.9),2.0) );
        col = line( col, vec2(0.1-0.2, 0.07), vec2(0.17-0.2, -0.07), uvRef, vec2(0.02,2.0), vec4(vec3(0.9),2.0) );
        col = line( col, vec2(0.2-0.4, 0.07), vec2(0.27-0.4, -0.07), uvRef, vec2(0.02,2.0), vec4(vec3(0.9),2.0) );
        col = line( col, vec2(0.35-0.2, 0.07), vec2(0.27-0.2, -0.07), uvRef, vec2(0.02,2.0), vec4(vec3(0.9),2.0) );
        col = line( col, vec2(0.45-0.2, 0.07), vec2(0.37-0.2, -0.07), uvRef, vec2(0.02,2.0), vec4(vec3(0.9),2.0) );
    }   
    
    col = animateCircle(uv, col,vec2(-0.5,0.75), 45.0,3.5,0.25,-50.0); 
    
    
    float r = length( uv+vec2(-1.0,0.5) )*2.0;
    float r2 = (length( uv+vec2(-1.0,0.5) )*2.3);
    
	col = mix( col, vec3(0.2,0.2,0.2), 1.0-smoothstep(0.98,1.0,r) );
    col = mix( col, bcol, 1.0-smoothstep(0.98,1.0,r2) );
    
    col = animateCircle(uv, col,vec2(-1.0,0.5), 0.0,2.3,0.1,20.0);
   	col = animateCircle(uv, col,vec2(-1.0,0.5), 180.0,2.3,0.1,20.0);
    col = animateCircle(uv, col,vec2(-1.0,0.5), 240.0,2.7,0.2,-50.0);
    
    
    float ax = cos(iTime*2.5)*0.03;
    float ay = sin(iTime*1.7)*0.04;
    float ax2 = cos(iTime*1.9)*0.05;
    float ay2 = sin(iTime*2.1)*0.06;
	float ad = sdQuads(vec2(0.1+ax,0.1+ay2),vec2(-0.1+ax2,0.1+ay),vec2(-0.1+ax,-0.1+ay2),vec2(0.1+ax2,-0.1+ay),uv+vec2(-1.0,0.5));
    col = mix( col, vec3(0.5,0.95,0.9), 1.0-smoothstep(0.006,0.01,abs(ad)) );
    
    col = line( col, vec2(0.6, 0.8), vec2(0.6, -0.05), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    col = line( col, vec2(-0.6, 0.8), vec2(-0.6, -0.05), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    
    col = line( col, vec2(0.5, 0.6), vec2(0.5, 0.1), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    col = line( col, vec2(-0.5, 0.6), vec2(-0.5, 0.1), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    
    if(uv.y >= -0.05 && uv.y<0.8){
        uvRef = uv;
		uvRef.y += iTime*0.1;
    	uvRef.y = mod(uvRef.y,0.1)-0.05;
    	col = line( col, vec2(-0.65, 0.0), vec2(-0.61, 0.0), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
        col = line( col, vec2(0.65, 0.0), vec2(0.61, 0.0), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
    }
    
    if(uv.y >= 0.1 && uv.y<0.6){
    	uvRef = uv;
        uvRef.y -= iTime*0.1;
    	uvRef.y = mod(uvRef.y,0.2)-0.1;
        col = line( col, vec2(-0.49, 0.0), vec2(-0.43, 0.0), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
        col = line( col, vec2(0.49, 0.0), vec2(0.43, 0.0), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
    }
    
    if(uv.x >= -0.5 && uv.x<0.5){
    	uvRef = uv;
        uvRef.y -= 0.75;
        uvRef.x -= iTime*0.1;
    	uvRef.x = mod(uvRef.x,0.2)-0.1;
        col = line( col, vec2(0.0, -0.01), vec2(0.0, 0.01), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
     
    }
    
    // map
    col = line( col, vec2(0.85, 0.9), vec2(0.85, 0.5), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    col = line( col, vec2(1.45, 0.9), vec2(1.45, 0.5), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    col = line( col, vec2(0.85, 0.9), vec2(1.45, 0.9), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    col = line( col, vec2(0.85, 0.5), vec2(1.45, 0.5), uv, vec2(0.003,2.0), vec4(bcol,2.0) );
    if(uv.y >= 0.5 && uv.y<0.9){
        uvRef = uv;
        uvRef.y -= iTime*0.1;
    	uvRef.y = mod(uvRef.y,0.08)-0.04;
        col = line( col, vec2(0.86, 0.0), vec2(1.44, 0.0), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
    	if(uv.x >= 0.85 && uv.x<1.45){
            uvRef = uv;
    		uvRef.x = mod(uvRef.x,0.08)-0.04;
        	col = line( col, vec2(0.0, 0.5), vec2(0.0, 0.9), uvRef, vec2(0.003,2.0), vec4(bcol,2.0) );
        }
    }
    
    vec2 tri = vec2(0.03,-0.06);
	float d = sdTriangleIsosceles( tri, uv+vec2(-1.15,-0.25) );
    col = mix( col, vec3(0.7,0.0,0.0), 1.0-smoothstep(0.0,0.01,abs(d)) );
    
    
    // navi icon
    vec2 triNavi = vec2(0.04,0.08);
	float navi = sdTriangleIsosceles( triNavi, uv+vec2(sin(iTime)*0.5,-0.3) );
    col = mix( col, vec3(0.7,0.0,0.0), 1.0-smoothstep(0.0,0.005,abs(navi)) );
    
    // guage
    float gd = sdQuads(vec2(0.7,-0.04),vec2(-0.3,0.07),vec2(-0.2,-0.07),vec2(0.8,-0.18),uv+vec2(1.15,0.5));
    col = mix( col, bcol, 1.0-smoothstep(0.005,0.01,abs(gd)) );
    float gd2 = sdQuads(vec2(0.8,-0.04),vec2(-0.1,0.05),vec2(-0.2,-0.09),vec2(0.7,-0.18),uv+vec2(1.15,0.637));
    col = mix( col, bcol, 1.0-smoothstep(0.005,0.01,abs(gd2)) );
    
    float ganimate = mod(iTime*5.0,26.0);
    float gx = -0.3-ganimate*0.1;
    if(ganimate>=13.0){
        gx = -1.4+( ganimate-13.0)*0.1;
    }
    
    if(uv.x >= -1.5 && uv.x<gx){
        float gd3 = sdQuads(vec2(0.665,-0.08),vec2(-0.21,0.02),vec2(-0.17,-0.03),vec2(0.7,-0.12),uv+vec2(1.15,0.5));
    	col = mix( col, vec3(0.2,0.8,0.5), 1.0-smoothstep(0.02,0.04,abs(gd3)) );
    }
    
    
    float ganimate2 = mod(iTime*4.5,26.0);
    float gx2 = -0.3-ganimate2*0.1;
    if(ganimate2>=13.0){
        gx2 = -1.4+( ganimate2-13.0)*0.1;
    }
    
    if(uv.x >= -1.5 && uv.x<gx2){
        float gd4 = sdQuads(vec2(0.72,-0.08),vec2(-0.08,0.0),vec2(-0.12,-0.05),vec2(0.675,-0.135),uv+vec2(1.15,0.637));
        col = mix( col, vec3(0.9,0.6,0.0), 1.0-smoothstep(0.025,0.04,abs(gd4)) );
    }
    
    // target
    float targetD = sdRhombus(uv, vec2(0.16+sin(iTime*2.0)*0.01,0.1+sin(iTime*2.0)*0.01));
    
    col = mix( col, bcol, 1.0-smoothstep(0.002,0.01,abs(targetD)) );
    
    
    float bar0 = dBox2d(uv+vec2(1.4,-0.3), vec2(0.01,0.1+(sin(iTime*3.0)*0.05)));
    col = mix( col, bcol, 1.0-smoothstep(0.04,0.05,abs(bar0)) );                    
    float bar1 = dBox2d(uv+vec2(1.28,-0.3), vec2(0.01,0.1+(sin(iTime*2.0)*0.06)));
    col = mix( col, bcol, 1.0-smoothstep(0.04,0.05,abs(bar1)) );    
    float bar2 = dBox2d(uv+vec2(1.16,-0.3), vec2(0.01,0.1+(sin(iTime*3.5)*0.08)));
    col = mix( col, bcol, 1.0-smoothstep(0.04,0.05,abs(bar2)) );    
    float bar3 = dBox2d(uv+vec2(1.04,-0.3), vec2(0.01,0.1+(sin(iTime*4.0)*0.07)));
    col = mix( col, bcol, 1.0-smoothstep(0.04,0.05,abs(bar3)) );
    
    // digit
    uv = ( fragCoord.xy /iResolution.xy ) * vec2(128,64);
	vec2 cpos = vec2(2.0,57.0);
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
   	col = mix(col,bcol,dc );
    
    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
