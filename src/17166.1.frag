#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D iChannel0, iChannel1, iChannel2;

#define   iResolution vec3(resolution, 1.0)
#define   iGlobalTime time

// uniform vec3       iResolution;
// uniform float      iGlobalTime;
// uniform float      iChannelTime[4];
 // uniform vec3       iChannelResolution[4];
// uniform vec4       iMouse;
// uniform vec4       iDate;

#define R(p,a) p=p*cos(a)+vec2(-p.y,p.x)*sin(a);

float sph(vec3 p, float r){
	return sqrt(dot(p,p))-r;
}

float box(vec3 p, vec3 r){
	vec3 di = abs(p)-r;
	return min( max(di.x,max(di.y,di.z)), length(max(di,0.0)) );
}

vec3 dd(vec3 p, vec2 mo, vec4 ro){
	vec3 sp = p;
	sp.x=abs(sp.x);
	vec3 tp = p+vec3(0.0,0.0,0.345);
	R(tp.yz,-0.4);
	R(tp.xz,-p.x);
	tp.x = mod(tp.x,0.03)-0.015;
	tp.y=tp.y*(3.17+mo.x)-0.05*mo.y;
	float m = sph(tp,0.008);
	float b = p.y>-0.4?sph(p*vec3(1.0,0.5,1.0)-vec3(0.0,-0.2,0.0),0.4):sqrt(dot(p+vec3(0.0,0.4,0.0),p+vec3(0.0,0.4,0.0)))-0.4;
	float r = sph(sp*vec3(p.x<0.0?ro.x:ro.y,1.0,1.0)-vec3(0.0,p.x<0.0?ro.z:ro.w,-0.3),0.1);
	float e = max(sph(sp-vec3(0.05,0.1,-0.3),0.04),-r);

	sp.y-=0.13;
	R(sp.xy,-0.6);
	R(sp.xz,0.9);
	R(sp.yz,sp.x*13.3+11.3);
	float ht = 0.07 - sp.x*0.13;
	float h = box(sp,vec3(0.5,ht,ht));
	return vec3(b,h,-min(m,e));
}

float bg(vec3 p){
	R(p.xz,1.3*cos(max(iGlobalTime-2.66,0.0)));
	vec3 sp = p;
	sp.xz+=1.0;
	sp.xz = mod(sp.xz,1.6)-0.8;
	sp.y+=1.3+0.1*cos(iGlobalTime+p.x);
	sp.y*=1.0-dot(p.xz,p.xz)*0.02;
	float f = sph(sp,1.0);
	sp = p;
	sp.y-=8.7;
	R(sp.yz,iGlobalTime*0.02);
	sp = mod(sp,0.34)-0.17;
	float c = sph(sp,0.10+0.01*cos(iGlobalTime*7.0+p.x+p.y+p.z));
	return min(-sph(p,7.0),max(f,-c));
}

vec2 scene(vec3 p){
	float t = iGlobalTime-2.66;
	p.z-=0.13*(-cos(max(t,0.0)*0.3));
	R(p.xz,0.17*sin(max(t,0.0)));
	
	float t1 = mod(max(t,0.0),15.0);
	float t2 = clamp(mod(max(t,0.0),45.0)-36.0,0.0,1.41)*6.66;
	float t3 = clamp(mod(max(t,0.0),30.0)-21.0,0.0,3.14);

	vec2 m;
	m.x = -(2.1+clamp(t1-4.0,0.0,0.9)-2.0*clamp(t1-14.55,0.0,0.9))-0.02*cos(t*3.3);
	m.y = (1.0-cos(abs(p.x-0.3*sin(clamp(t1*1.3,0.0,6.28)))))*28.0*cos(5.0);
	vec4 r;
	r.x = 0.6-0.6*sin(clamp(t1*1.3,0.0,6.28));
	r.y = 0.6-0.6*sin(clamp(t1*1.3+3.14,3.14,9.42));
	r.z = 0.175+0.040*clamp(t,0.0,0.25)+0.02*(sin(t3)+abs(sin(t2)));
	r.w = 0.175+0.040*clamp(t,0.0,0.25)+0.02*abs(sin(t2));
	vec3 d = dd(p,m,r);
	float b = bg(p);
	float c = d.x<0.0?2.0:1.0;
	d.y = min(d.x,d.y);
	d.x=max(max(d.y,-d.x),d.z);
	return vec2(min(d.x,b),d.x<b?c:0.0);
}

void main(void)
{
	vec2 pos = (gl_FragCoord.xy-0.5*iResolution.xy) / min(iResolution.x,iResolution.y);
	vec3 o = vec3(0.0,0.0,-min(iResolution.x,iResolution.y)/max(iResolution.x,iResolution.y));
	vec3 d = vec3(pos,0.0)-o;
	vec3 p = o;
	vec2 l;
	float e = 0.0001;
	vec3 c = vec3(0.0);
	for(int i = 0; i<128; i++){
		l=scene(p);
		if(abs(l.x)<e){
			c.x = 1.0+float(i)/128.0;
			break;
		}
		p += l.x*d;
	}
	c=(l.y==0.0?vec3(0.3,0.13*abs(0.2+0.5*cos((p.y+iGlobalTime)*3.0+0.5*cos(p.x*12.0))),0.1)*c.xxx:c);
	c=(l.y==2.0?vec3(1.0,+0.6+0.2*abs(cos(p.y*66.6-iGlobalTime*6.66+cos(p.x*33.0))),0.0):c);
	c*=(l.y!=2.0?scene(p+0.1*vec3(2.0,2.0,-3.3)).x:1.0);
	gl_FragColor = vec4(c,1.0);
}
