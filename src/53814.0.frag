/*
 * Original shader from: https://www.shadertoy.com/view/tsBXRc
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
float rand ( vec2 uv) {return  fract(sin(dot(floor(uv),vec2(75.365,12.365)))*4285.365);}
float noise ( vec2 uv) {
float a = rand(uv);
float b = rand (uv+vec2(1,0));
 float c  = rand (uv+vec2(0,1));
 float d  = rand ( uv+vec2(1,1));
vec2 u =smoothstep(0.,1.,fract(uv));
return mix (a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C)
{    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0 / dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if(h >= 0.0)  { 
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y - kx;
        t = clamp( t, 0.0, 1.0 );
        vec2 qos = d + (c + b*t)*t;
        res = length(qos);}
    else{
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp( t, 0.0, 1.0 );
        vec2 qos = d + (c + b*t.x)*t.x;
        float dis = dot(qos,qos);        
        res = dis;
        qos = d + (c + b*t.y)*t.y;
        dis = dot(qos,qos);
        res = min(res,dis);
        qos = d + (c + b*t.z)*t.z;
        dis = dot(qos,qos);
        res = min(res,dis);
        res = sqrt( res );}
        return res;}
float rd (float t ) {return fract(sin(dot(floor(t),45.236))*4978.236);}
float no (float t ) {return mix(rd(t),rd(t+1.),smoothstep(0.,1.,fract(t)));}
vec2 rd2 (float t ) {return vec2(fract(sin(dot(floor(t*10.),45.236))*4978.236),
                                 fract(sin(dot(floor(t*10.),97.236))*4978.236));}
vec2 no2 (float t ) {return mix(rd2(t),rd2(t+1.),smoothstep(vec2(0.),vec2(1.),vec2(fract(t))));}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
	vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y+vec2(0.,-0.1);
        //+vec2(noise(uv*20.+iTime*10.)-0.5,noise(uv*20.+73.26+iTime*10.)-0.5)
        //*no(iTime*100.)*0.05;
    float d1 = 0.;
    float d2 = 0.;
    float d3 = 0.;
    float d4 = 0.;
    float d5 = 0.;
    float d6 = 0.;
    float d7 = 0.;
    float d8 = 0.;
    float d9 = 0.;
    float d10 = 0.;
    float d11 = 0.;
    float d12 = 0.;
    float d13 = 0.;
    float d14 = 0.;
    float d15 = 0.;
    float d16 = 0.;
    float d17 = 0.;
    float d18 = 0.;    
    float d19 = 0.;
    for (int i = 0; i < 4 ; i++){
    vec2 p1 =vec2(0.2,-0.7)+no2(iTime+float(i)*76.23)*0.1; 
    vec2 p2 =vec2(0.15,-0.75)+no2(iTime+float(i)*15.23)*0.1;
    vec2 p3 =vec2(0.,-0.9)+no2(iTime+float(i)*64.23)*0.1;
    vec2 p4 =vec2(0.65,0.1)+no2(iTime+float(i)*19.23)*0.1;
    vec2 p5 =vec2(0.2,0.55)+no2(iTime+float(i)*60.23)*0.1;
    vec2 p6 =vec2(0.,0.1)+no2(iTime+float(i)*40.36)*0.1;
    vec2 p7 =vec2(0.1,0.2)+no2(iTime+float(i)*81.23)*0.1;
    vec2 q1 =vec2(-0.2,-0.7)+no2(iTime+float(i)*75.23)*0.1; 
    vec2 q2 =vec2(-0.15,-0.75)+no2(iTime+float(i)*77.26)*0.1;
    vec2 q4 =vec2(-0.65,0.1)+no2(iTime+float(i)*81.25)*0.1;
    vec2 q5 =vec2(-0.2,0.55)+no2(iTime+float(i)*78.23)*0.1;
    vec2 p8 = vec2(-0.25,-0.4)+no2(iTime+float(i)*74.23)*0.1;
    vec2 q8 = vec2(0.25,-0.4)+no2(iTime+float(i)*74.23)*0.1;
    vec2 p9 = vec2(0.,-0.47)+no2(iTime+float(i)*66.23)*0.1;
    vec2 q9 = vec2(0.05,-0.37)+no2(iTime+float(i)*66.23)*0.1;
    vec2 p10 = vec2(0.1,-0.45)+no2(iTime+float(i)*44.23)*0.1;
    vec2 q10 = vec2(0.05,-0.37)+no2(iTime+float(i)*44.23)*0.1;
    vec2 p11 = vec2(-0.1,-0.2)+no2(iTime+float(i)*19.23)*0.1;
    vec2 q11 = vec2(0.1,-0.2)+no2(iTime+float(i)*32.36)*0.1;
    vec2 r1 = vec2(0.75,-0.8)+no2(iTime+float(i)*76.23)*0.1;
    vec2 r2 = vec2(0.15,-0.7)+no2(iTime+float(i)*15.23)*0.1;
    vec2 r3 = vec2(0.12,-0.9)+no2(iTime+float(i)*64.23)*0.1;
    vec2 r4 = vec2(0.6,0.55)+no2(iTime+float(i)*19.23)*0.1;
    vec2 t1 = vec2(-0.75,-0.8)+no2(iTime+float(i)*75.23)*0.1;
    vec2 t2 = vec2(-0.15,-0.7)+no2(iTime+float(i)*77.26)*0.1;
    vec2 t3 = vec2(-0.12,-0.9)+no2(iTime+float(i)*64.23)*0.1;
    vec2 t4 = vec2(-0.6,0.55)+no2(iTime+float(i)*81.25)*0.1;
    vec2 r5 = vec2(-0.3,0.3)+no2(iTime+float(i)*60.23)*0.1;
    vec2 r6 = vec2(-0.45,0.15)+no2(iTime+float(i)*40.36)*0.1;
    vec2 r7 = vec2(0.05,0.1)+no2(iTime+float(i)*81.23)*0.1;
    vec2 r8 = vec2(0.15,0.05)+no2(iTime+float(i)*74.23)*0.1;
    vec2 r9 = vec2(0.0,-0.55)+no2(iTime+float(i)*66.23)*0.1;
    vec2 r10 = vec2(0.0,-0.37)+no2(iTime+float(i)*44.23)*0.1;
    vec2 r11 = vec2(0.1,-0.37)+no2(iTime+float(i)*19.23)*0.1;
    vec2 r12 = vec2(0.,-0.3)+no2(iTime+float(i)*19.23)*0.1;
    vec2 pc1 = vec2(0.3,-0.05)+no2(iTime+float(i)*61.22)*0.1;
    vec2 pc2 = vec2(-0.3,-0.05)+no2(iTime+float(i)*41.05)*0.1;
     d1 += smoothstep(0.015,0.,sdBezier(p,p1,r1,p4));
     d2 += smoothstep(0.015,0.,sdBezier(p,p1,r2,p2));
     d3 += smoothstep(0.015,0.,sdBezier(p,p2,r3,p3));
     d4 += smoothstep(0.015,0.,sdBezier(p,q2,t3,p3));
     d5 += smoothstep(0.015,0.,sdBezier(p,q1,t2,q2));
     d6 += smoothstep(0.015,0.,sdBezier(p,q1,t1,q4));
     d7 += smoothstep(0.015,0.,sdBezier(p,p4,r4,p5));
     d8 += smoothstep(0.015,0.,sdBezier(p,q4,t4,q5));
     d9 += smoothstep(0.015,0.,sdBezier(p,p5,r5,p6));
     d10 += smoothstep(0.015,0.,sdBezier(p,q5,r6,p6));
	
    
    for (int i = 0 ; i < 5 ; i++){
    float va = rd (iTime*10.+float(i)*458.236);
    vec2 p5b = mix(p5,p5*vec2(-1.,1.),va);
    vec2 re =  mix(r5,r6,va);
    vec2 re2 =  mix(r7,r8,va);
    d11 = max(d11,smoothstep(0.015,0.,sdBezier(p,p5b,re,p6))); 
    d12 = max(d12,smoothstep(0.015,0.,sdBezier(p,p6,re2,p7))); 
    }
     d13 += smoothstep(0.015,0.,sdBezier(p,p8,r9,q8));
     d14 += smoothstep(0.015,0.,sdBezier(p,p9,r10,q9));
     d15 += smoothstep(0.015,0.,sdBezier(p,p10,r11,q10));
     d16 += smoothstep(0.015,0.,sdBezier(p,p11,r12,q11));
     d17 += smoothstep(0.015,0.,sdBezier(p,p11,r12,q11));
     d18 += smoothstep(0.045,0.03,distance(p,pc1))*smoothstep(0.01,0.03,distance(p,pc1));    
     d19 += smoothstep(0.045,0.03,distance(p,pc2))*smoothstep(0.01,0.03,distance(p,pc2));
    }
    float df = max(max(max(max(max(max(max(max(max(d1,d2),d3),d4),d5),d6),d7),d8),d9),d10);
    float df2 = max(max(max(max(max(max(max(max(df,d11),d12),d13),d14),d15),d16),d18),d19);
	fragColor = vec4(1.-df2);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
