//--- concrete world
// by Catzpaw 2018
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define OCT 7
#define ITER 192
#define EPS 0.001
#define NEAR .3
#define FAR 16.

vec3 rotX(vec3 p,float a){return vec3(p.x,p.y*cos(a)-p.z*sin(a),p.y*sin(a)+p.z*cos(a));}
vec3 rotY(vec3 p,float a){return vec3(p.x*cos(a)-p.z*sin(a),p.y,p.x*sin(a)+p.z*cos(a));}
vec3 rotZ(vec3 p,float a){return vec3(p.x*cos(a)-p.y*sin(a), p.x*sin(a)+p.y*cos(a), p.z);}
vec3 hsv(float h,float s,float v){return ((clamp(abs(fract(h+vec3(0.,.666,.333))*6.-3.)-1.,0.,111.)-1.)*s+1.)*v;}

float map(vec3 p){float r=1.,lr=0.,s=1.;;p=rotX(p,time*.15);p=rotZ(p,time*.111);p.xy+=vec2(3.4,9.3);p.z+=time;
	for(int i=0;i<OCT;i++){vec3 q=clamp(sin(p),.25,1.);r=max(lr,.3-dot(q,q));lr=r;s*=1.11;p*=s;}
	return r;}

float trace(vec3 ro,vec3 rd,inout float n){float t=NEAR,d;
	for(int i=0;i<ITER;i++){d=map(ro+rd*t);if(abs(d)<EPS||t>FAR)break;t+=step(d,1.)*d*.2+d*.5;n+=1.;}
	return min(t,FAR);}

void main(void){
	vec2 uv=(gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
	vec3 rd=vec3(uv,-.5);
	float n=0.,v=1.-trace(vec3(0),rd,n)/FAR;n/=float(ITER);
	gl_FragColor=vec4(mix(hsv(v,n,.92),vec3(1),n)*n,1);
}
