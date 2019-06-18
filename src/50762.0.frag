/*
 * Original shader from: https://www.shadertoy.com/view/XttBWX
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
// Created by EvilRyu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


#define PI 3.1415926535
#define FAR 30.0

vec2 hash22(vec2 p)
{
    float f=p.x+p.y*37.0;
    return fract(cos(f)*vec2(10003.579, 37049.7));
}

float hash13(vec3 p)
{
    p=fract(p * vec3(5.3983, 5.4472, 6.9371));
    p += dot(p.yzx, p.xyz + vec3(21.5351, 14.3137, 15.3219));
    return fract(p.x * p.y * p.z * 95.4337);
}

mat2 rot(float t)
{
    float c=cos(t);
    float s=sin(t);
    return mat2(c,-s,s,c);
}

float smin(float a, float b, float k)
{
    float h=clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}


float smax(float a, float b, float k)
{
    return smin(a, b, -k);
}


vec2 line(vec3 pos, vec3 a, vec3 b)
{
    vec3 pa=pos-a;
    vec3 ba=b-a;
   
    float h=clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    
    return vec2(length(pa-h*ba), h);
}

float line(vec3 pos, vec3 a, vec3 b, float r)
{
    vec3 pa=pos-a;
    vec3 ba=b-a;
   
    float h=clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    
    return length(pa-h*ba)-r;
}

float line(vec2 pos, vec2 a, vec2 b, float r)
{
    vec2 pa=pos-a;
    vec2 ba=b-a;
   
    float h=clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    
    return length(pa-h*ba)-r;
}

float torus(vec3 p, vec2 t)
{
  vec2 q=vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sphere(vec3 p)
{
    return length(p)-0.5;
}

float cylinder(vec3 p, vec2 h)
{
  vec2 d=abs(vec2(length(p.xz),p.y))-h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float box(vec3 p, vec3 b)
{
  vec3 d=abs(p)-b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); 
}

float prism(vec3 p, vec2 h)
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float ellipsoid(vec3 p, vec3 r)
{
    float k0=length(p/r);
    float k1=length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float rbox(vec3 p, vec3 b, float r)
{
  vec3 d=abs(p)-b;
  return length(max(d,0.0)) - r
         + min(max(d.x,max(d.y,d.z)),0.0);
}

vec3 swing(vec3 p)
{
    p.xy*=rot(0.15*sin(1.5*iTime));

    p+=vec3(0.5*sin(1.5*iTime),0.,-0.3+2.*iTime);
    return p;
}

// for bounding sphere
vec3 inverse_swing(vec3 p)
{
    p.xy*=rot(-0.15*sin(1.5*iTime));

    p-=vec3(0.5*sin(1.5*iTime),0.,-0.3+2.*iTime);
    return p;
}

#define HEAD 1
#define BODY 2
#define NOSE 3
#define HAND 4
#define BELL 5
// machine
#define BASE 6
#define CONTROL 7
#define CONTROL_FRONT 8
#define FUEL 9
#define HANDLE1 10
#define HANDLE2 11
#define SOFA 12
#define LIGHT 13

int obj_id, machine_id;

void body(vec3 p, inout float d0)
{
    float d1=line(p+vec3(0.,.6,0.),vec3(0),vec3(0.,0.2,0.),0.32);
    if(d1<d0) obj_id=BODY;
    d0=smin(d0,d1,0.03);
}

void brace(vec3 p, inout float d0)
{
    float d2=torus(p+vec3(0.,.4,0.),vec2(0.31,0.03));
    if(d2<d0) {obj_id=NOSE;d0=d2;}
}

void legs(vec3 p, inout float d0)
{
    vec3 q=vec3(abs(p.x)-.18,p.y,p.z);
    float d3=line(q+vec3(0,.95,0.),vec3(0),vec3(0.,0.2,0.),0.15);
    d0=smin(d0,d3,0.13);
    
    // feet
    q.x=abs(p.x)-0.2;
    float d4=torus(q+vec3(0.,1.05,0.),vec2(0.08,0.09));
    if(d4<d0) {obj_id=HAND;d0=d4;}
}

void arms(vec3 p, inout float d0)
{
    vec2 d5=line(p+vec3(-.28,0.5,0.),vec3(0),vec3(0.27,0.25,0.));
    d5.x=d5.x-0.1*(1.-.6*d5.y);
    if(d5.x<d0) obj_id=BODY;
    d0=smin(d0,d5.x,.02);
    d5.x=length(p+vec3(-.6,0.2,0.))-0.09;
    if(d5.x<d0) {obj_id=HAND;d0=d5.x;}
    
    d5=line(p+vec3(.28,0.5,0.),vec3(0),.9*vec3(-0.27,-0.25,0.));
    d5.x=d5.x-0.1*(1.-.6*d5.y);
    if(d5.x<d0){obj_id=BODY;d0=d5.x;}
    d5.x=length(p+vec3(.55,0.75,0.))-0.08;
    if(d5.x<d0) {obj_id=HAND;d0=d5.x;}
}

void nose_tail(vec3 p, inout float d0)
{
    float d6=length(p+vec3(0.,-0.15,0.5))-0.05;
    if(d6<d0) {obj_id=NOSE;d0=d6;}
    
    // tail
    float d7=line(p+vec3(0.,0.77,-0.1),vec3(0),vec3(0.,-0.1,0.25),0.01);
    float dt=length(p+vec3(0.,0.87,-0.35))-0.04;
    if(dt<d0) {obj_id=NOSE;d0=dt;}
    if(d7<d0) {obj_id=BODY;d0=d7;}

}

void bag(vec3 p, inout float d0)
{
    vec3 q=p;
    q.yz*=rot(0.14);
    float d8=cylinder(vec3(q.x,q.z+.16,abs(q.y+0.55)), vec2(0.1,.19))-0.05;
    float d9=box(q+vec3(0.,.1,.0),vec3(1.,.44,1.));
    d8=smax(-d9,d8,.02);
    d0=smin(d0,d8,0.01);
    
    // bell
    float d10=length(p+vec3(0.,0.46,0.36))-0.06;
    float d11=torus(p+vec3(0.,0.46,0.36),vec2(0.06,0.009));
    d10=min(d10,d11);
    if(d10<d0) {obj_id=BELL;d0=d10;}
}

void mouth(vec3 p, inout float d0)
{
    vec3 q=p;
    
    p.yz*=rot(0.2);
    float d12=cylinder(vec3(p.x,p.z+.6,abs(p.y-0.11)), vec2(0.25,.19))-0.05;
    float d13=box(p+vec3(0.,-1.11,.0),vec3(1.,1.,1.));
    d12=smax(-d13,d12,.06);
    if(-d12>d0) obj_id=NOSE;
    d0=smax(-d12,d0,.03); 
    float dt=length(vec3(abs(p.x)-.05,p.y+.18,p.z+.2))-0.2;
    if(dt<d0) {obj_id=NOSE;d0=dt;}
    
    
    q.x=abs(q.x);
    
    vec2 d5=line(q+vec3(0.,-0.03,0.41),vec3(0),vec3(0.27,-0.01,-0.02));
    //if(d14<d0) obj_id=NOSE;
    d5.x-=0.07+0.01*(1.-d5.y);
    d0=smin(d0,d5.x,0.01);
}

float doraemon(vec3 p)
{
    p=swing(p);
    
    obj_id=HEAD;
    float d0=length(p)-0.5;
    
    body(p,d0);
    brace(p,d0);
    legs(p,d0);
    arms(p,d0);
    nose_tail(p,d0);
    bag(p,d0);
    mouth(p,d0);
    return d0;
}

void main_control(vec3 p, inout float d0)
{
    float d2=box(p+vec3(0.,-0.4,.9), vec3(.87,.4, .2));    
    if(d2<d0){machine_id=CONTROL;d0=d2;}
    float d3=prism(vec3(p.z+1.,p.y-0.24,p.x), vec2(0.4,0.87));
    if(d3<d0){machine_id=CONTROL_FRONT;d0=d3;}
    
    float d4=box(p+vec3(0.,-0.8,.85),vec3(0.8,0.2,0.2));
    d0=max(-d4,d0);
    
    float d5=cylinder(p+vec3(-0.5,-0.7,.8),vec2(0.015,0.2));
    if(d5<d0){machine_id=CONTROL;d0=d5;}
    
    float d6=length(p+vec3(-0.5,-0.88,.8))-0.05;
    if(d6<d0) {machine_id=HANDLE1; d0=d6;}
}

void lamp(vec3 p, inout float d0)
{
    float d7=cylinder(p+vec3(-1.17,-1.,.8),vec2(0.025,1.));
    float d8=line(p+vec3(-1.17,-2.,.8),vec3(0.),vec3(-0.35,0.35,0.),0.025);
    d8=min(d7,d8);
    if(d8<d0){machine_id=CONTROL;d0=d8;}
    
    vec3 q=p;
    q.xy*=rot(0.8);
    float d9=ellipsoid(q+vec3(1.32,-2.22,.8),vec3(0.25,0.07,0.2));
    if(d9<d0){machine_id=LIGHT;d0=d9;}
}

void handles(vec3 p, inout float d0)
{
    float d=cylinder(vec3(p.x+1.35,p.z-1.2, p.y-.1),vec2(0.3,.25));
    d=max(d,-box(p+vec3(1.65,-.2,-1.2),vec3(0.3,0.4,0.3)));
    d=max(d,-box(p+vec3(1.25,.4,-1.2),vec3(0.3,0.4,0.3)));
    if(d<d0){machine_id=CONTROL;d0=d;}
    
    p=p+vec3(1.15,-.3,-1.1);
    
    for(int i=0;i<3;++i)
    {
        d=line(p,vec3(0),vec3(0.1,0.2,0.),0.01);
        d0=min(d0,d);
        d=length(p+vec3(-0.1,-0.2,0.))-0.04;
        if(d<d0){machine_id=HANDLE2;d0=d;}
        p.z-=0.11;
    }
}

void sofa(vec3 p, inout float d0)
{
    float d12=rbox(p+vec3(0.,-.5,-.8),vec3(0.6,0.5,0.04), 0.05);
    float d13=rbox(p+vec3(0.,-.15,-.4),vec3(0.6,0.15,0.3), 0.05);
    d13=smin(d12,d13,0.2);  
    if(d13<d0){machine_id=SOFA;d0=d13;}
}

float timemachine(vec3 p)
{
    p=swing(p+vec3(0,0,0));p.y+=1.15;
    
    machine_id=BASE;
    
    float d0=box(p+vec3(0.,0.02,0.), vec3(1.5,0.06,1.8));
    
    main_control(p,d0);
    lamp(p,d0);
    handles(p,d0);
    sofa(p,d0);
    
    p.x=abs(p.x)-1.17;
    float d1=line(p+vec3(0.,-0.1,1.45),vec3(0),vec3(0.,0.,1.5),0.2);
    if(d1<d0) {machine_id=FUEL; d0=d1;}
    return d0;
}


vec2 fold(vec2 p, float a)
{
    p.x=abs(p.x);
    vec2 n = vec2(cos(a),sin(a));
    for(int i = 0; i < 3; ++i)
    {
        p -= 2.*min(0.,dot(p,n))*n;
        n = normalize(n-vec2(1.,0.));
    }
    return p;
}

vec3 path(float p)
{
    return vec3(sin(p*0.05)*cos(p*0.025)*18., 0.,0.);
}

/// from Klem's Olympian: https://www.shadertoy.com/view/XltyRf
vec3 tunnel(vec3 rd, float pos, float speed) 
{
    const float max_r = 5.;
    vec3 col;//=vec3(1.);
    for (float r=1.0;r<max_r;r+=1.0) 
    {
        // calculate where the ray intersects several fixed radius cylinders
        // using cylindrical coordinates
        // (phi, r, z)
        // phi=arctan(rd.y/rd.x)
        // r=r
        // length(rd.xy) / r = rd.z / z ==> z=rd.z*r/length(rd.xy)
        float phi=atan(rd.x, rd.y);
        float z=rd.z*r/length(rd.xy);
        if(r<1.5)col=vec3(abs(z)*.005);
        // adjust the uv acoording to cylinder size and position
        vec2 uv=vec2(phi*r, pos+z);
        uv.x+=1.717*hash13(vec3(floor(uv),r))*r;
        
        vec2 cell_center=floor(uv)+0.5;
        cell_center+=hash22(cell_center+vec2(0.,r))-.5;

        vec2 size=vec2(.01);
        size.y+=speed/r;
        size.y/=sin(atan(r/abs(z)));
        
        //float d=(length((uv-cell_center)/size)-1.)*size.y;
        //col+=vec3(1,.9,.6)*smoothstep(0.105,-0.105,d)/(.5*r*r+.3*z*z);

        
        float redshift=0.01+speed/r;
        cell_center.y-=redshift;
        for (int i=0; i<3; i++) 
        {
            cell_center.y+=redshift;
            
            // draw stars
            vec2 p=uv-cell_center;
            float d=(length(p/size)-1.0)*size.y;
            float dist=(r*r+z*z);
            col[i]+=smoothstep(0.02, -0.02, d)/dist;
        }
        
    }
    return 3.*col;
}


float get_ao(vec3 p, vec3 n)
{
    float r=0.0, w=1.0, d;
    for(float i=1.; i<5.0+1.1; i++)
    {
        d=i/5.0;
        r+=w*(d-min(doraemon(p+n*d),timemachine(p+n*d)));
        w*=0.5;
    }
    return 1.0-clamp(r,0.0,1.0);
}



vec3 material_doraemon(vec3 rd, vec3 pos, vec3 nor)
{
    vec3 col=vec3(0);
    float d; 
    pos=swing(pos);
    
    if(obj_id==HEAD)
    {
        col=vec3(0.,0.5,1.0); 
        if(pos.z<0.&&length(vec2(pos.x*0.9,pos.y+0.05))<0.38)col=vec3(0.9);
        
        // eyes
        if(pos.z<0.)
        {
            vec2 p=vec2(abs(pos.x)-0.1,pos.y*.7-0.2);
            float r=length(p.xy);
            col*=pow(1.-smoothstep(0.08,0.09,r)*smoothstep(0.1,0.09,r),1.);
            if(r<0.085) col=vec3(1.);
            p=vec2(abs(pos.x)-0.06, pos.y-0.26);
            r=length(p);
            p=vec2(abs(pos.x)-0.06, pos.y-0.26);
            float r1=length(p);
            col*=pow(1.-smoothstep(0.0,0.025,r)*smoothstep(0.03,0.025,r),7.0);
            
            // beards
            if(pos.y>0.&&pos.y<0.11)
            col*=smoothstep(0.,0.01,abs(pos.x));
            col*=smoothstep(0.,0.01, line(vec2(abs(pos.x)-0.16,pos.y), vec2(0.,0.14),vec2(0.14,0.18),0.001));
            col*=smoothstep(0.,0.01, line(vec2(abs(pos.x)-0.16,pos.y+0.04), vec2(0.,0.14),vec2(0.15,0.15),0.001));
            col*=smoothstep(0.,0.01, line(vec2(abs(pos.x)-0.16,pos.y+0.08), vec2(0.,0.14),vec2(0.15,0.13),0.001));
        }
    }
    else if(obj_id==BODY)
    {
        col=vec3(0.,0.5,1.0); 
        if(pos.z<0.&&length(vec2(pos.x,pos.y+.6))<.22)col=vec3(0.9);
    }
    else if(obj_id==NOSE)
        col=vec3(.4,0.,0.);
    else if(obj_id==BELL)
        col=vec3(1.2,0.7,0.);
    else if(obj_id==HAND)
        col=vec3(.9);
    else if(obj_id==BASE)
        col=vec3(0.05,0.1,0.2);
    else if(obj_id==CONTROL)
        col=vec3(.9,.7,.5);
    else if(obj_id==CONTROL_FRONT)
    {
        col=vec3(.9,.7,.5);
        // pos.y -1.x -> -0.7
        col=mix(vec3(1.,0.2,0.),col,pow(smoothstep(0.,0.04, line(vec2(pos.x,pos.y), vec2(-0.5,-0.8),vec2(0.5,-0.8),0.001)),40.));
        col=mix(vec3(1.,0.2,0.),col,pow(smoothstep(0.,0.04, line(vec2(pos.x,pos.y), vec2(-0.5,-0.9),vec2(0.5,-0.9),0.001)),40.));
        col=mix(vec3(1.,0.2,0.),col,pow(smoothstep(0.,0.04, line(vec2(pos.x,pos.y), vec2(-0.5,-1.),vec2(0.5,-1.),0.001)),40.));
        
    }
    else if(obj_id==HANDLE1)
        col=vec3(0.,0.1,0.3);
    else if(obj_id==FUEL)
        col=vec3(0.01,0.04,0.1);
    else if(obj_id==HANDLE2||obj_id==SOFA)
        col=vec3(0.1,0.,0.04);
    else if(obj_id==LIGHT)
    {
        // pixel light
        vec2 frp=abs(fract(pos.xz*10.));
        frp=pow(frp, vec2(4.));
        float edge=max(0.,1.-(frp.x+frp.y));
        vec2 flp=floor(pos.xz*10.);
        float k=dot(sin(flp+cos(flp.yx*2.+iTime*2.)),vec2(.5));
        col=nor.y<0.? 10.*edge*vec3(pow(k,.7)*2., 4.*pow(k, 1.5), pow(k,2.)) : vec3(.9,.7,.5);
    }
    return col;
}

vec3 lighting_doraemon(vec3 rd, vec3 pos, float ps,float hitinfo, float t)
{
    vec3 l1dir=normalize(vec3(1.0,2.,-1.));
    vec3 l1col=vec3(1.,0.8,0.8);
    
    vec3 e=vec3(0.5*ps,0.0,0.0); 
    vec3 nor;

    if(hitinfo<.9)
        nor=normalize(vec3(doraemon(pos+e.xyy)-doraemon(pos-e.xyy), 
                          doraemon(pos+e.yxy)-doraemon(pos-e.yxy), 
                          doraemon(pos+e.yyx)-doraemon(pos-e.yyx)));
    else
        nor=normalize(vec3(timemachine(pos+e.xyy)-timemachine(pos-e.xyy), 
                          timemachine(pos+e.yxy)-timemachine(pos-e.yxy), 
                          timemachine(pos+e.yyx)-timemachine(pos-e.yyx)));
    
    if(timemachine(pos)<doraemon(pos))obj_id=machine_id;
    if(t>FAR&&obj_id==LIGHT)obj_id=CONTROL; // avoid weird artifacts, should find a bettwe way
    
    vec3 mate=material_doraemon(rd,pos,nor);
    float ao=get_ao(pos,nor);
    float dif=max(0.0,dot(nor,l1dir));
    float bac=max(0.0,dot(nor,-l1dir));
    float spe=max(0.0, pow(clamp(dot(l1dir, reflect(rd, nor)), 0.0, 1.0), 32.0));

    vec3 lin=6.0*dif*l1col*ao;
    lin+=1.*bac*l1col;
    lin+=3.*spe*vec3(1.);
    return lin*0.2*mate;
}

float pixel_size = 0.;

vec4 intersect_doraemon(vec3 ro, vec3 rd, out vec3 hitinfo)
{
    hitinfo=vec3(0.,0.,1.);
    float d_first=100.0, t_first=0.0;
    float old_d=1000.0;
    float d_max=1000.0, t_max=0.0;
    float t=1.0;
    float d=100.0;
    float hitwho=0.,old_hitwho=0.;
    
    for(int i=0; i<64; ++i) 
    {
        hitwho=0.;
        // splitting them is just for not crashing my windows laptop....
        d=doraemon(ro+rd*t);
        float d1=timemachine(ro+rd*t);
        if(d1<d){hitwho=1.;d=d1;}

        
        if(d_first == 100.0)  // the first edge
        {
            hitinfo.x=hitwho;
            if(d>old_d) 
            {
                if(old_d<pixel_size * (t-old_d))
                {
                    d_first=old_d;
                    t_first=t-old_d;
                    hitinfo.x=old_hitwho;
                }
            }
            old_d=d;
            old_hitwho=hitwho;
        }
        if(d<d_max) // save the max occluder
        { 
            t_max=t; 
            d_max=d;
            hitinfo.y=hitwho;
        }  
        
        if(d<0.00001 || t>FAR)
            break;
        t += d;
        hitinfo.z=t;
    }
    return vec4(t_max, d_max, t_first, d_first);
}

float bounding_sphere(in vec3 ro, in vec3 rd, in vec4 sph)
{
    vec3 p=sph.xyz;
    p=inverse_swing(p);
    float t=-1.0;
    vec3  ce=ro-p;
    float b=dot(rd, ce);
    float c=dot(ce, ce)-sph.w*sph.w;
    float h=b*b - c;
    if(h>0.0)
    {
        t=-b-sqrt(h);
    }
    
    return t;
}

vec3 render_doraemon(vec3 ro, vec3 rd, vec3 bg)
{
    float t=bounding_sphere(ro,rd,vec4(0.,-0.35,0.,2.5));
    if(t<=0. || t>1000.)
        return bg;
    
    // first hit, max hit, t
    vec3 hitinfo;
    vec4 res=intersect_doraemon(ro,rd,hitinfo);
    
    float d_max, t_max, d_first, t_first;
    t_max=res.x;
    d_max=res.y;
    t_first=res.z;
    d_first=res.w;
    vec3 nor,pos;
    
    vec3 col=bg;
    
    if(d_max < pixel_size*t_max) 
    {
        pos=ro+rd*t_max;
        col=mix(lighting_doraemon(rd, pos, pixel_size*t_max,hitinfo.y, hitinfo.z), col, 
                  clamp(d_max/(pixel_size * t_max), 0.0, 1.0));
    }
    float ratio=0.0;

    if(d_first==100.0 || t_max==t_first)
    {
        t_first=t_max;
        d_first=d_max;
        ratio=0.5;
    }
    
    pos=ro+rd*t_first;
    col=mix(lighting_doraemon(rd, pos, pixel_size*t_first,hitinfo.x, hitinfo.z),
              col, clamp(ratio+d_first/(pixel_size*t_first), 0.0, 1.0));
    
    return col;
}


#define CITY_MENGER 1
#define CITY_ROAD 2

#define VOXEL_GAP 0.1

const mat3 ma=mat3(0.6,0.,0.8,
                   0.,1.,0.,
                   -0.8,0.,0.6);

vec4 city(vec3 p)
{
    p.y-=0.3;
    obj_id=CITY_MENGER;
    vec2 flp=floor(p.xz);
    vec2 frp=fract(p.xz);
    
    frp-=0.5;
    
    vec2 rand;
    rand=hash22(flp);
    float height=0.4+rand.x*rand.x*1.7;
    float d0=box(vec3(frp.x,p.y,frp.y),vec3(0.1,height,.4));   
    
    vec4 res=vec4(d0, 1.0, 0.0, 0.0);
    
    // menger spone from iq
    // larger value gives higher density of rooms
    // I like 1.1, 1.2, 1.7
    float s=1.+.2*rand.y*(1.-step(1.6,height)); 
    vec3 q=p;
    for(int m=0; m<4; m++)
    {      
        p.y+=rand.y;
        vec3 a=mod(p*s, 2.0)-1.0;
        s*=3.;
        vec3 r=abs(1. - 3.0*abs(a));
        float da=max(r.x,r.y);
        float db=r.y;//max(r.y,r.z);
        float dc=max(r.z,r.x);
        float c=(min(da,min(db,dc))-1.)/s;

        if(c>d0)
        {
          d0=c;
          res=vec4(d0, min(res.y,.2*da*db*dc), (1.0+float(m))/4.0, 0. );
        }
    }
   
    if(q.y<res.x){obj_id=CITY_ROAD;res.x=q.y;}
    return res;
}


vec3 get_city_normal(vec3 p)
{
    vec3 e=vec3(0.001,0.,0.);
    return normalize(vec3(city(p+e.xyy).x-city(p-e.xyy).x,
                 city(p+e.yxy).x-city(p-e.yxy).x,
                 city(p+e.yyx).x-city(p-e.yyx).x));
}


#define CITY_ITER 250
#define CITY_FAR 50.

vec4 intersect_city_voxel(vec3 ro, vec3 rd)
{
    vec4 h=vec4(100.),res=vec4(-1);
    float t = 0.05;
    vec3 p=vec3(0.0);

    for (int i=0; i<CITY_ITER; i++)
    {
        if(h.x<0.0001+0.000125*t||t>CITY_FAR)
        {
            continue;
        }
        p=ro+rd*t;

        h=city(p);

        // 2d voxel marching the city blocks, as the boundaries are not continues
        
        float dx=-fract(p.x);
        if (rd.x>0.) 
            dx=fract(-p.x);
        
        float dz=-fract(p.z);
        if (rd.z>0.)
            dz=fract(-p.z);
        
        float nearest=min(fract(dx/rd.x), fract(dz/rd.z))+VOXEL_GAP;
        nearest=max(VOXEL_GAP, nearest);
        
        t+= min(h.x, nearest); 
        res=vec4(t,h.yzw);
        
    }
    return res;
}

vec3 material_city(vec3 p, float night)
{
    vec3 col=vec3(0.4,0.6,1.0)*0.15;
    vec4 res=city(p);
    if(obj_id==CITY_MENGER)
    {
        res.z=1.-res.z;
        col=(1.2*(1.-night)+0.8)* vec3(.5+res.z*res.z,.3+pow(res.z, 3.), res.z*res.z*0.9);
        //col=vec3(res.z);  

        if(night>0.5)
        {
            if(res.z<.25)
                col=50.*vec3(1.2,0.3,0.);
            else if(res.z<0.75)
                col*=6.;
        }
        
    }
    else
    {
        p.z-=iTime*2.;
        col+=(1.-smoothstep(0.01,0.025,abs(abs(p.x)-.25)))*vec3(1);
        col=mix(col,vec3(1.2,0.7,0.),floor(fract(p.z)+.5)*(1.-smoothstep(0.01,0.02,abs(p.x)-0.001)));//*vec3(1);
        // fake shadow
        col*=(0.06+smoothstep(0.4,0.6,abs(abs(p.x+0.13)-0.7))); 
        col*=(0.06+smoothstep(0.4,0.6,-p.x+1.47))*vec3(1); 
    }
    return col;
}

vec3 city_bg(vec3 ro, vec3 rd, float night)
{
    const vec3 moon_col=vec3(0.8,1.,1.);
    const vec3 moon_dir=vec3(0,0,-1.);    
    vec3 col;
    
    col=vec3(1.)-moon_col*smoothstep(-.1,0.,rd.y)*smoothstep(0.33,0.37,pow(max(dot(moon_dir, rd), 0.0), 32.0));

    if(night>0.)
        col=vec3(0.)+vec3(0.3,0.,0.)*smoothstep(-.1,0.,rd.y)*smoothstep(0.33,0.37,pow(max(dot(moon_dir, rd), 0.0), 32.0));
    
    return col;
}


float curve(in vec3 p, in float w)
{
    vec2 e=vec2(-1., 1.)*w;
    
    float t1=city(p+e.yxx).x, t2=city(p+e.xxy).x;
    float t3=city(p+e.xyx).x, t4=city(p+e.yyy).x;
    
    return 0.0125/(w*w)*(t1+t2+t3+t4-4.*city(p).x);
}

vec4 render_city(vec3 ro, vec3 rd, float night)
{
    vec4 res=intersect_city_voxel(ro,rd);
    vec3 col=city_bg(ro,rd,night);

    if(res.x<CITY_FAR)
    {
       // if(city(ro+res.x*rd).x>0.005/res.x)
         //   res.x=res.w;
        vec3 pos=ro+res.x*rd;
        vec3 nor=get_city_normal(pos);
        vec3 l1dir=normalize(vec3(1.0,2.,-1.));
        vec3 l1col=vec3(1.2,0.8,0.5);
        
        float ao=res.y*res.y;
        if(obj_id==CITY_ROAD)
            ao=1.;

        vec3 mate=material_city(pos,night);
        float dif=max(0.0,dot(nor,l1dir));
        float bac=max(0.0,dot(nor,-l1dir));
        float sky=0.5+0.5*nor.y;
        float spe=pow(max(dot(reflect(-l1dir, nor), -rd), 0.0), 16.0);
        float crv=clamp(1.-abs(curve(pos,0.0015)),0.,1.);

        vec3 lin=4.0*(1.-night)*dif*l1col*ao;
        lin+=3.*sky*vec3(0.1,0.2,0.5)*ao;
        lin+=1.*bac*l1col*ao;
        lin+=1.*spe*vec3(1.);
        col=lin*crv*0.2*mate;
        
        vec3 skycol=vec3(1.-night);
        if(rd.z<0.)
            col=mix(col,vec3(.15,0,0),1.-exp(-0.005*res.x*res.x));
        else col=mix(col,skycol,1.-exp(-0.001*res.x*res.x));
       //col=vec3(lin);
    }
    return vec4(col,res.x);
}


vec3 tonemap(vec3 x) 
{
    const float a=2.51;
    const float b=0.03;
    const float c=2.43;
    const float d=0.59;
    const float e=0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q=fragCoord/iResolution.xy;
    vec2 p=q*2.-1.;
    p.x*=iResolution.x/iResolution.y;
    pixel_size=1.0/(iResolution.y);
   
     // debugging camera
    //float x_rot=-iMouse.x/iResolution.x*PI*2.0;
    //float y_rot=iMouse.y/iResolution.y*3.14*0.5 + PI/2.0;
    //vec3 ro=vec3(0.,0.9,-2.*iTime)+vec3(cos(y_rot)*cos(x_rot),0.,cos(y_rot)*sin(x_rot))*10.;
    //vec3 ta=vec3(0.,0.,-2.*iTime);
   
    float time=mod(iTime,40.);
    vec3 ro,ro2;
    if(time < 20.)
    {
        ro=vec3(0.,.9,-9.);
        ro2=ro;
        
        if(time>10.)
        {
            ro.xz*=rot(-(time-10.)*0.07);
        }
    }
    else
    {
        ro=vec3(0.,.9,9.);
        ro2=ro;
    }

    ro.z-=2.*iTime;
    ro2.z-=2.*iTime;
    vec3 ta=vec3(0.,0.,-2.*iTime);
    
    
    vec3 f=normalize(ta-ro);
    vec3 r=normalize(cross(f,vec3(0.,1.,0.)));
    vec3 u=normalize(cross(r,f));
    
    vec3 rd=normalize(r*p.x + u*p.y + f*2.3);
    
    vec3 timetunnel=tunnel(rd,-iTime*8.,.05);
    vec3 menger=render_city(ro2,rd, 1.0-step(0.0,sin(0.05*(iTime+40.-14.)))).xyz;
    
    vec3 bg=mix(timetunnel,menger,1.-smoothstep(0.,1.,sin(0.1*(iTime+40.))));
    vec3 col=render_doraemon(ro,rd,bg);
    
    // post processing
    col=tonemap(col);
    col=pow(clamp(col,0.,1.0),vec3(0.45));
    col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);
    fragColor=vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
