/*
 * Original shader from: https://www.shadertoy.com/view/MdlSRM
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
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Try KIFS...

 void ry(inout vec3 p, float a){  
 	float c,s;vec3 q=p;  
  	c = cos(a); s = sin(a);  
  	p.x = c * q.x + s * q.z;  
  	p.z = -s * q.x + c * q.z; 
 }  
 void rx(inout vec3 p, float a){  
 	float c,s;vec3 q=p;  
  	c = cos(a); s = sin(a);  
  	p.y = c * q.y - s * q.z;  
  	p.z = s * q.y + c * q.z; 
 }  

 void rz(inout vec3 p, float a){  
 	float c,s;vec3 q=p;  
  	c = cos(a); s = sin(a);  
  	p.x = c * q.x - s * q.y;  
  	p.y = s * q.x + c * q.y; 
 }  
float plane(vec3 p, float y) {
    return length(vec3(p.x, y, p.z) - p);
}

// folding hex from nimitz: https://www.shadertoy.com/view/XtdGDB
vec2 fold(vec2 p)
{
    p.xy = abs(p.xy);
    const vec2 pl1 = vec2(-0.5, 0.8657);
    const vec2 pl2 = vec2(-0.8657, 0.4);
    p -= pl1*2.*min(0., dot(p, pl1));
    p -= pl2*2.*min(0., dot(p, pl2));
    return p;
}

vec3 mat=vec3(0.0);
bool bcolor = false;

float menger_spone(in vec3 z0){
	vec4 z=vec4(z0,1.0);
    vec3 offset = vec3(0.785,1.1,0.46);
    float scale = 2.46;
	for (int n = 0; n < 4; n++) {
		z = abs(z);
		if (z.x<z.y)z.xy = z.yx;
		if (z.x<z.z)z.xz = z.zx;
		if (z.y<z.z)z.yz = z.zy;
		z = z*scale;
		z.xyz -= offset*(scale-1.0);
       	if(bcolor && n==2)
            mat+=vec3(0.5)+sin(z.xyz)*vec3(1.0, 0.24, 0.245);
		if(z.z<-0.5*offset.z*(scale-1.0))
            z.z+=offset.z*(scale-1.0);
	}
	return (length(max(abs(z.xyz)-vec3(1.0),0.0))-0.05)/z.w;
}

 vec3 f(vec3 p){ 
     ry(p,iTime*0.4);
     float d1 = plane(p, -0.8);
     p.xz = fold(p.xz);

     float d2 = menger_spone(p);
     if(d1 < d2)
     {
         return vec3(d1, 0.0, 0.0);
     }
     else
     {
         return vec3(d2, 1.0, 0.0);
     } 
 } 

 float ao(vec3 p, vec3 n){ 
 	float ao=0.0,sca=1.0; 
 	for(float i=0.0;i<20.0;++i){ 
 		float hr=0.05+0.015*i*i; 
 		ao+=(hr-f(n*hr+p).x)*sca; 
 		sca*=0.75; 
 	} 
 	return 1.0-clamp(ao,0.0,1.0); 
 } 


float rand(vec2 t){
	return fract(sin(dot(t*0.123,vec2(12.9898,78.233))) * 43758.5453);
}
float softshadow(vec3 ro, vec3 rd, float k ){ 
     float s=1.0,h=0.0; 
     float t = 0.01;
     for(int i=0; i < 50; ++i){ 
         h=f(ro+rd*t).x; 
         if(h<0.001){s=0.0;break;} 
         s=min(s, k*h/t); 
         t+=abs(h);
     } 
     return clamp(s*0.9+0.1, 0.0, 1.0); 
} 
 vec3 nor(vec3 p){ 
 	vec3 e=vec3(0.0001,0.0,0.0); 
 	return normalize(vec3(f(p+e.xyy).x-f(p-e.xyy).x, 
 						  f(p+e.yxy).x-f(p-e.yxy).x, 
 						  f(p+e.yyx).x-f(p-e.yyx).x)); 
 } 

vec3 intersect( in vec3 ro, in vec3 rd )
{
    float t = 0.0;
    vec3 res = vec3(-1.0);
	vec3 h = vec3(1.0);
    for( int i=0; i<64; i++ )
    {
		if( h.x<0.003 || t>30.0 ){
		}else {
        	h = f(ro + rd*t);
        	res = vec3(t,h.yz);
        	t += abs(h.x);
		}
    }
	if( t>30.0 ) res=vec3(-1.0);
    return res;
}

 void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
 { 
    vec2 q=fragCoord.xy/iResolution.xy; 
 	vec2 uv = -1.0 + 2.0*q; 
 	uv.x*=iResolution.x/iResolution.y; 

    vec3 ta = vec3(0,0.08,0.);
    vec3 ro = vec3(1., 1.4, -3.);
 	vec3 cf = normalize(ta-ro); 
    vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0))); 
    vec3 cu = normalize(cross(cs,cf)); 
 	vec3 rd = normalize(uv.x*cs + uv.y*cu + 2.8*cf);  // transform from view to world

    vec3 sundir = normalize(vec3(3., 5.,-2.8)); 
    vec3 sun = vec3(1.64, 1.27, 0.99); 
    vec3 skycolor = vec3(0.6, 1.5, 1.0); 

	vec3 bg = exp(uv.y-1.0)*vec3(0.5, 0.9, 1.5);

    float sc=clamp(dot(sundir, rd), 0.0, 1.0); 
    vec3 col=bg+vec3(1.0,0.8,0.4)*pow(sc,50.0); 


    float t=0.0;
    vec3 p=ro; 
	 
	vec3 res = intersect(ro, rd);
	 if(res.x > 0.0){
		   p = ro + res.x * rd;
           bcolor = true;
           mat=vec3(0.0);
           vec3 n=nor(p);
           mat/=6.0;
           bcolor = false;
           float occ = ao(p, n); 
           float shadow = softshadow(p, sundir, 50.0);

           float dif = max(0.0, dot(n, sundir)); 
           float sky = 0.6 + 0.4 * max(0.0, dot(n, vec3(0.0, 1.0, 0.0))); 
 		   float bac = max(0.3 + 0.7 * dot(vec3(-sundir.x, -1.0, -sundir.z), n), 0.0); 
           float spe = max(0.0, pow(clamp(dot(sundir, reflect(rd, n)), 0.0, 1.0), 20.0)); 

           vec3 lin = 5.5 * sun * dif; 
           lin += 0.8 * bac * sun * occ; 
           lin += 0.6 * sky * skycolor * occ; 
           lin += 2.0 * spe * occ; 

           col = shadow * lin *(vec3(0.6, 0.8, 0.9)*(1.0-res.y)+mat*res.y) *  0.2; 
 		   col = mix(col,bg, 1.0-exp(-0.003*res.x*res.x)); 
    } 	
    // post
    col=pow(clamp(col,0.0,1.0),vec3(0.45)); 
    col=col*0.6+0.4*col*col*(3.0-2.0*col);  // contrast
    col=mix(col, vec3(dot(col, vec3(0.33))), -1.);  // satuation
    col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.8);  // vigneting
 	fragColor.xyz = col; 
 }
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
