/*
 * Original shader from: https://www.shadertoy.com/view/wssXzr
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
#define SURF_DIST 0.001
#define MAX_STEPS 256
#define MAX_STEPS_REF 32
#define MAX_STEPS_SHAD 16

int mat;
vec3 ref = vec3(0.);

vec2 rotate(vec2 a, float d){
    float s  = sin(d);
    float c = cos(d);
    
    return vec2(
        a.x*c-a.y*s,
        a.x*s+a.y*c);
}

float noise(vec3 p){
    
    return fract(sin(dot(p,vec3(41932.238945,12398.5387294,18924.178293)))*123890.12893);
    
}

float sdVerticalCapsule( vec3 p, float h, float r )
{
    p.y -= clamp( p.y, 0.0, h );
    return length( p ) - r;
}

float smin( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float sdSphere(vec3 p, float r){
    return length(p)-r;
}

float sdBox(vec3 p, vec3 b){
    
    vec3 d = abs(p)-b;
    
    return max(max(d.x,d.y),d.z);
    
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float sdOctahedron( in vec3 p, in float s)
{
    p = abs(p);
    
    return (p.x+p.y+p.z-s)*0.57735027;
}


vec3 opTwist(in vec3 p , float k)
{
   
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return q;
}


float sdHexPrism( vec3 p, vec2 h )
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
    
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdHexScrew( vec3 p, vec2 h , float t)
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(opTwist(p,t));
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
    
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float cog(vec3 p, vec3 tp ){
    
    float d = 1e10;
    
     vec3 bp = p+vec3(0,0,0);
    bp.xy=rotate(bp.xy,sin(-iTime-tp.z*.05-p.x*.01)*10.);
    
    
    float base = sdHexPrism(bp,vec2(2.,.2));
    
    d=min(d,base);
    

    bp.zy=rotate(bp.zy,1.5);
    float base2 = sdHexScrew(bp,vec2(.95,1),2.0);
    
    d=max(d,-base2);

    return d;

}


float map(vec3 p){
    vec3 tp =p;
    p.xy = rotate(p.xy,p.z*.02);
    vec3 cell = vec3(5,40.5,21.5);
    p=mod(p,cell)-cell*.5;    
    
    vec3 cp = p;
    
    
    float s = sin(iTime+tp.z*.05)*10.;
    
    cp.z+=s;
    
    float d = 1e10;
    
	float cog = cog(cp,tp);
   	d=min(d,cog);

    p.zy=rotate(p.zy,1.57);
    float screw = sdHexScrew(p,vec2(.85,11.),2.0);
    d=min(d,screw);
    

    
    //assigning our material based on our distance value
    if(d==cog){
     	mat=1;   
    }
	else if(d==screw){
        mat=3;
    }
    return d;
}


vec3 calcNormal(vec3 p){
    
    vec2 e =vec2(.01,0.);
    
    return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),
                          map(p+e.yxy)-map(p-e.yxy),
                          map(p+e.yyx)-map(p-e.yyx)));
    
}

vec4 trace(in vec3 ro, in vec3 rd){
    float t = 0.;
    vec3 col = vec3(0.9);
    float k = 0.;
    
    for(int i=0;i<MAX_STEPS;++i){
        k=map(ro+rd*t);
        t+=k*.5;
        if(abs(k)<SURF_DIST){
           
            
            if(mat==1)
                col = vec3(0.5);
            else if(mat==3)
                col=vec3(.8);
                else if(mat==2){
                    col=vec3(1.0);
                }
			
            //col*=light;
                
			break;
        }
    }
    
    
    return vec4(t,col);
    
}

vec4 traceRef(in vec3 ro, in vec3 rd, float start, float end){
    
    float t=0.;
    vec3 col = vec3(0.9);
    float k = 0.;
    
    for(int i=0;i<MAX_STEPS_REF;++i){
        
        k = map(ro+rd*t);
        t+=k*.25;
        if(k<SURF_DIST){
            float light = dot(calcNormal(ro+rd*t),normalize(vec3(.1*10.,3.,-5)))*2.;
            
            if(mat==1)
                col = vec3(0.5);
            else if(mat==3)
                col=vec3(.9);
			
            //col*=light;
            break;
        }
        
        
        
    }
    return vec4(t,col);
}

float calculateAO(vec3 p, vec3 n)
{
   const float AO_SAMPLES = 5.0;
   float r = 0.0;
   float w = 1.0;
   for (float i=1.0; i<=AO_SAMPLES; i++)
   {
      float d0 = i * 0.2; // 1.0/AO_SAMPLES
      r += w * (d0 - map(p + n * d0));
      w *= 0.5;
   }
   return 1.0-clamp(r,0.0,1.0);
}

float softShadow(vec3 ro, vec3 rd, float start, float end, float k){
    
    float shade = 1.0;
    
    float d = start;
    
    float stepDist = end/float(MAX_STEPS_SHAD);
    
    for(int i=0;i<MAX_STEPS_SHAD;i++){
        //set the end to the distance from the light to surface point
        //to avoid hitting a surface that shouldn't be lit
        float h = map(ro+rd*d);
        shade = min(shade, k*h/d);
        
        //alternatively could be +=h, +=min(h,0.1), +=stepDist...
        d+=min(h,d/2.);
        
        if(h<SURF_DIST||d>end)break;
    }
    
    
    return min(max(shade,0.)+0.3,1.0);
    
}

vec3 lighting(vec3 sp, vec3 camPos, int reflectionPass){
    
    vec3 col = vec3(0.);
    
    vec3 n = calcNormal(sp);
    
    vec3 objCol = vec3(0.5);
    
    //lighting stuff
    //light pos
    vec3 lp = vec3(sin(iTime)*50.,cos(iTime)*50.,0.+iTime*10.);//cos(iTime));
    
    //light direction and color
    vec3 ld = lp - sp;
    //subtly change color
    vec3 lcolor = vec3(1.*sin(iTime*.2),1.*cos(iTime*.2),1.)/3.+vec3(1.);
    
    //falloff of our light
    float len = length(ld);
    
    ld/=len; //normalize light-to-surface vector
    float lightAtten= clamp((0.5*len*len),0.,1.);//clamp between 0 and 1
    
    //reflect our light at the position using the normal at sp
    ref = reflect(-ld,n);
    
    //only do shadows when we aren't doing reflections
    float shadowcol = 1.0;
    if(reflectionPass==0)shadowcol = softShadow(sp,ld,0.005*2.0,len,32.0);
    
    float ao = .5+.5*calculateAO(sp,n);
    float ambient = .05;
    float specPow = 8.0;
    float diff = max(0.0,dot(n,ld));//diffuse value
    float spec = max(0.0,dot(ref,normalize(camPos-sp)));
    spec = pow(spec,specPow);//ramp up sepcular value for some shinyness
    
    col += (objCol*(diff+ambient)+spec*0.5)*lcolor*lightAtten*shadowcol*ao;
    
    return col;
    
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
     
    float t =iTime*10.;

    
    vec3 cam = vec3(0,0,-10.+t);
    vec3 dir = normalize(vec3(uv,1));
 
//    dir.xy=rotate(dir.xy,-iTime/10.);
    
    vec4 d =trace(cam,dir);
    
    vec3 p =cam+dir*d.x;
    
    vec3 n = calcNormal(p);
    
    
    
    vec4 r=traceRef(p,reflect(dir,n),0.01*5.0,32.0);
    
    vec3 l = lighting(p,cam,0);
    
    vec3 rsp = p+ref*r.x;
    
    fragColor.rgb = (lighting(rsp,p,1)*.05+l)/clamp((d.x*.015),1.,10.);//d.yzw
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
