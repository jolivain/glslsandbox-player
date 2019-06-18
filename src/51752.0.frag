/*
 * Original shader from: https://www.shadertoy.com/view/Wds3WN
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

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.1415926
#define INNER 0.0
#define OUTTER 40.0
#define FAREST 150.0
struct Ray{
   vec3 o;
   vec3 d;
};

vec2 sphereIntersect(vec3 o,vec3 dir,vec4 sp){
   vec3 a = sp.xyz - o;
   float b = dot(dir,a);
   float d = sqrt(dot(a,a)-b*b);
   float t = sqrt(sp.w*sp.w-d*d);
   if(d>sp.w) return vec2(-1);
    
   return vec2(b-t,b+t);
}

float density(float h,float s){
    return exp(-h/s);
}
    
float phase_ray(float c){
    return 3.0/16.0/PI*(1.+c*c);    
}

float phase_mie( float g, float c, float cc ) {
	float gg = g * g;
	
	float a = ( 1.0 - gg ) * ( 1.0 + cc );

	float b = 1.0 + gg - 2.0 * g * c;
	b *= sqrt( b );
	b *= 2.0 + gg;	
	
	return ( 3.0 / 8.0 / PI ) * a / b;
}


float optics(vec3 hi,vec3 lw,float s){
    vec3  a   = hi-lw;
    vec3  d   = normalize(a);
    vec3  c   = lw;  
    float ret = 0.0;
    const float smp = 8.0;
    float t   = 0.0;
    
    float stp = length(a)/smp;
    
    for(float i=0.0;i<smp;i++){
       t= c.y-INNER;
       
       if(t<=0.){
           break;
       }
       ret+= density(t*0.5,s);
       c+=d*stp; 
    }
    
    return ret*stp;
}


mat2 rot2D(float a){
   float c = cos(a);
   float s = sin(a);
   return mat2(c,s,-s,c); 
}

mat3 rot3D(vec4 a){
   float c  = cos(a.w);
   float s  = sin(a.w);
   float rc = 1.0-c;
   
   float m00 = a.x*a.x*rc+c;
   float m01 = a.y*a.x*rc+a.z*s;
   float m02 = a.z*a.x*rc-a.y*s;
   
   float m10 = a.x*a.y*rc-a.z*s;
   float m11 = a.y*a.y*rc+c;
   float m12 = a.z*a.y*rc+a.x*s;
   
   float m20 = a.x*a.z*rc+a.y*s;
   float m21 = a.y*a.z*rc-a.x*s;
   float m22 = a.z*a.z*rc+c;
    
   return mat3(
      m00,m01,m02,
      m10,m11,m12,
      m20,m21,m22
   ); 
}


float hash1(float x){
    
	return fract(sin(dot(vec2(x),vec2(PI,2.73461)))*327672.0);
}

float hash1(vec2 v){
   return fract(sin(dot(v,vec2(1623713,1241701)))*3267137.0);
}

vec2 hash2(vec2 v){
   float x =  fract(sin(dot(v,vec2(1.4623713,0.734566)))*100000.0*PI);
    
   float y =  fract(sin(dot(v,x*vec2(0.923713,-0.7441701)))*100000.0*PI);
    
   return vec2(x,y);
}

vec3 hash3(vec3 v){
   float x =  fract(sin(dot(v,vec3(1.4623713,0.734566,0.334566)))*100000.0*PI);
   float y =  fract(sin(dot(v,x*vec3(0.923713,-0.7441701,-0.334566)))*100000.0*PI);
   float z =  fract(sin(dot(v,y*vec3(-0.223713,1.4441701,0.634566)))*100000.0*PI);
    //*rot3D(vec4(0.5,0.5,0,iTime*0.1+y))
   return vec3(x,y,z);
}


float curve_cubic(float v){
   return v*v*(3.0-2.0*v);
}

vec2 curve_cubic(vec2 v){
   return v*v*(3.0-2.0*v);
}

float curve_pro(float v){
   return v*v*v*(v*(6.0*v-15.0)+10.0);
}

vec2 curve_pro(vec2 v){
   return v*v*v*(v*(6.0*v-15.0)+10.0);
}

vec3 curve_pro(vec3 v){
   return v*v*v*(v*(6.0*v-15.0)+10.0);
}


vec3 getColor(float v){
   float r = cos((v-0.78)*PI*1.66);
   float g = cos((v-0.58)*PI*1.66);
   float b = cos((v-0.28)*PI*1.66);
   return vec3(r,g,b); 
}

    
float noise1D(float x){
   float p  = floor(x);
   float f  = fract(x); 
    
   float v1 = hash1(p);
   float v2 = hash1(p+1.0);
    
   f  = curve_pro(f);
    
   return mix(v1,v2,f); 
}

float noise2D(vec2 v){
   vec2 p = floor(v);
   vec2 f = fract(v); 
   vec2 e = vec2(1,0);
    
   vec2 h00 = hash2(p);
   vec2 h01 = hash2(p+e.xy);
   vec2 h10 = hash2(p+e.yx);
   vec2 h11 = hash2(p+e.xx);
     
   float d00 = dot(h00,f);
   float d01 = dot(h01,f-e.xy);
   float d10 = dot(h10,f-e.yx);
   float d11 = dot(h11,f-e.xx);
    
   f = curve_pro(f);
   
   return mix(mix(d00,d01,f.x),mix(d10,d11,f.x),f.y); 
}


// 3d noise ,inspired by iq ,but without the gradient
float noise3D(vec3 p){
   vec3 x000 = floor(p);
   //evaluate the eight corner first 
   vec3 x001 = x000+vec3(0,0,1);
   vec3 x010 = x000+vec3(0,1,0);
   vec3 x011 = x000+vec3(0,1,1);
   
   vec3 x100 = x000+vec3(1,0,0);
   vec3 x101 = x000+vec3(1,0,1);
   vec3 x110 = x000+vec3(1,1,0);
   vec3 x111 = x000+vec3(1,1,1);
   
   // get the interpolation coe  
   vec3 cp  = fract(p);
   
   //get each random vector of the corner 
   vec3 v000 = hash3(x000);
   vec3 v001 = hash3(x001);
   vec3 v010 = hash3(x010);
   vec3 v011 = hash3(x011);
   vec3 v100 = hash3(x100);
   vec3 v101 = hash3(x101);
   vec3 v110 = hash3(x110);
   vec3 v111 = hash3(x111);
    
   //do the projection 
   float d000 = dot(v000,p-x000);
   float d001 = dot(v001,p-x001);
   float d010 = dot(v010,p-x010);
   float d011 = dot(v011,p-x011);
    
   float d100 = dot(v100,p-x100);
   float d101 = dot(v101,p-x101);
   float d110 = dot(v110,p-x110);
   float d111 = dot(v111,p-x111);
    
   //interpolation curve vector 
   cp = curve_pro(cp);
   
    
   d000 = mix(d000,d010,cp.y);
   d100 = mix(d100,d110,cp.y);
   
   d001 = mix(d001,d011,cp.y);
   d101 = mix(d101,d111,cp.y);
   
   return mix(mix(d000,d100,cp.x),mix(d001,d101,cp.x),cp.z);
    
}
//fbm stuffs
float fbm1(float x){
   float freq = 0.5;
   float am   = 1.0;
   float ret  = 0.0;
   
   for(int i=0;i<5;i++){
       ret+=noise1D(x*freq)*am;
       freq *=2.0;
       am   *=0.5;
   }
    
   return ret; 
}

float fbm2(vec2 x){
   float freq = 0.5;
   float am   = 5.0;
   float ret  = 0.0;
    
   for(int i=0;i<9;i++){
       ret+=noise2D(x*freq)*am;
       
       freq *=2.;
       am   *=.4;
       x    *=rot2D(freq);
   } 
    
   return ret; 
}
 
float getHeight(vec2 p){
   
  return fbm2(p.xy*0.1)*1.4;
}
vec2 ground(vec3 p ,vec3 c){
    p-=c;
    float m = getHeight(p.xz)+fbm1(p.y*0.9+noise1D(p.x*.1)*0.5)*1.2;
    return vec2(p.y-m,0);
}
 
vec2 sphere(vec3 p ,vec3 c){
    p-=c;
    return vec2(length(p)-4.0,1);
}


void cmp(inout vec2 a,vec2 b){
    a = a.x>b.x?b:a;
}

vec2 map(vec3 p){
   vec2 res = vec2(1000.0);
    
   cmp(res,ground(p,vec3(0)));
   //cmp(res,sphere(p,vec3(1,1,40)));
     
   return res;
}

float occlusion(vec3 p,vec3 norm){
    float scalor=0.7;
    
    float occ =0.;
    const float sm = 4.0;
    for(float i=0.;i<sm;i++){
       float k= i/sm;
       k*=scalor;
       float d=map(p+k*norm).x;
       occ+= pow(0.5,i*0.3)*(k-d);
    }
    occ=1.-clamp(occ,0.,1.);
    return occ;
}


vec3 grad(vec3 p){
   float m = map(p).x;
   vec2 e = vec2(1,0)*0.01; 
   return normalize(vec3(map(p+e.xyy).x-m,map(p+e.yxy).x-m,map(p+e.yyx).x-m)); 
}

void atmosphere(inout vec3 col,vec3 sp,vec3 endp,vec3 lp){
    float t_ray0 = 0.0;
    float t_ray1 = 0.0;
    float t_mie0 = 0.0;
    float t_mie1 = 0.0;
    float d_ray  = 0.0;
    float d_mie  = 0.0;
    float g = -0.9;
    float h_ray  = 10.5;
    float h_mie  = h_ray*0.225;
    
    vec3 kray = vec3(5.5e-2,13e-2,22.4e-2);
    vec3 kmie = vec3(20e-4);

    vec3  cmul   = vec3(0.0);
    vec3  sray   = vec3(0.0);
    vec3  smie   = vec3(0.0);
    vec3  ld     = normalize(lp);
    vec3  d      = normalize(endp-sp);
    
    float c      = dot(-d,ld);
    float intens = 2.7;
    float s = 0.11;
    
    
    const float smp    = 16.0;
    float t      = 0.0;
    vec3  p      = vec3(0);
    float stp    = length(endp-sp)/smp;
    
    vec2 v1 = sphereIntersect(lp,-ld,vec4(0,0,0,OUTTER));
    
    for(float i=0.0;i<smp;i++){
       p = sp+d*t;
       if(p.y<0.) break; 
       d_ray = density(p.y,h_ray)*stp;
       d_mie = density(p.y,h_mie)*stp;
        
       t_ray0 += d_ray;
       t_mie0 += d_mie;
        
       t_ray1 = optics(OUTTER*ld,p,h_ray);
       t_mie1 = optics(OUTTER*ld,p,h_mie);
          
       cmul = (t_ray0+t_ray1)*kray+(t_mie0+t_mie1)*kmie*0.;
       cmul = exp(-cmul*s);
       sray += cmul*d_ray;
       smie += cmul*d_mie;
           
       t+=stp; 
    }
    
    col+= (sray*kray*phase_ray(c)+smie*kmie*phase_mie(g,c,c*c))*intens;
}
 void shading(inout Ray r,vec3 lp,inout vec3 col,vec2 res){
    vec3 p = r.o+r.d*res.x;
    vec3 n = grad(p);
    vec3 ld = normalize(lp);
    float nl = smoothstep(-1.0,1.,dot(ld,n));
    float oc = occlusion(p,n);    
    float hv = dot(normalize(-ld+r.d),n);
    hv = 0.3+0.7*(1.0-pow(hv,5.0)); 
    atmosphere(col,r.o,p,lp);
    if(res.x<FAREST){
   
        if(res.y==0.0){
           float v = fbm2(p.xz*0.1); 
           col = mix(col,(nl*oc)*getColor(nl*0.08+0.66),nl+1.0-exp(-res.x*0.1));
            
        }  
    } 
}
    
void rayMarch(in Ray r,vec3 lp,inout vec3 col,inout vec2 res){
    float t =0.0;
    vec2 h  = vec2(0);
    vec3 p  = vec3(0);
     
    for(int i=0;i<64;i++){
       p = r.o+r.d*t;
       h = map(p);
      
       if(t>=FAREST){
           t=FAREST;
  
           break;
       }
        
       if(h.x<=0.0005){
                 
           break;
       } 
       
        t+=h.x; 
    }
     
    res = vec2(t,h.y);
}
       
void setCamera(inout Ray r,vec3 eye,vec3 tar,vec2 uv){
    vec3 look = normalize(tar-eye);
    vec3 right = normalize(cross(vec3(0,1,0),look));
    vec3 up   = normalize(cross(look,right));
    
    r.o = eye;
    r.d = normalize(uv.x*right + uv.y*up+ look);
}   

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    vec2 cuv = uv- vec2(0.5);
    cuv.x*=iResolution.x/iResolution.y;
    
    // Time varying pixel color
    vec3 col = vec3(0);
    float a = PI*0.44;
    float t = sin(iTime*0.5);
  
 
    vec3 lp  = vec3(0,50.0*cos(a),100.0*sin(a));
    vec3 eye = vec3(0,4.,-9.0);
    vec3 tar = vec3(0,3.,1);
    eye*=rot3D(vec4(normalize(vec3(0,1,0)),iTime*0.1));
    vec2 res = vec2(0);
    
    Ray r;
    r.o = vec3(0.);
    r.d = vec3(0.);
    setCamera(r,eye,tar,cuv);
    rayMarch(r,lp,col,res);
    shading(r,lp,col,res);
    
    col = smoothstep(0.,1.,col);
    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
