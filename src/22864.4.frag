#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec3 positionSurface;
varying vec3 positionSize;

float  iGlobalTime() { return (time-60.); }

//Cubic Entanglement by eiffie
//Inspired by this little StructureSynth video http://www.youtube.com/watch?v=1uusQday0Z4
//I had to dumb this down to get it to compile but you get the point.

//Visually inspect the cubes for intersections then test yourself by undefining...

//#define SHOW_INTERSECTIONS
//#define SHOW_MORE_CONFIGURATIONS
#ifdef SHOW_INTERSECTIONS
	int ints=0;
#endif

#define time iGlobalTime()
#define size iResolution
mat3 matPyr(vec3 rot){vec3 c=cos(rot),s=sin(rot);//orient the mat3 (pitch yaw roll)
	return mat3(c.z*c.y+s.z*s.x*s.y,s.z*c.x,-c.z*s.y+s.z*s.x*c.y,-s.z*c.y+c.z*s.x*s.y,c.z*c.x,s.z*s.y+c.z*s.x*c.y,c.x*s.y,-s.x,c.x*c.y);
}

struct configuration{mat3 rmx; vec3 offset;}cfg;

configuration config(float i){
	vec3 rot=vec3(0.0),offset=vec3(0.0,-1.0,-0.56);
   #ifdef SHOW_MORE_CONFIGURATIONS
    i=mod(i,10.0);
	if(i<1.0){rot.x=0.52;offset.y=-0.94;}
	else if(i<2.0){rot.xy=vec2(0.52,0.21);offset.xy=vec2(-0.04,-0.94);}
	else if(i<3.0){rot.xy=vec2(0.52,-0.44);offset.xz=vec2(-0.15,-0.31);}
	else if(i<4.0){rot.xy=vec2(0.58,0.7);offset.x=-0.15;}
	else if(i<5.0){rot=vec3(0.64,0.97,0.08);offset.x=0.06;}
	else if(i<6.0){rot.xy=vec2(0.64,-0.94);offset.x=0.06;}
	else if(i<7.0){rot.y=-0.63;offset=vec3(0.4,-0.36,0.05);}
	else if(i<8.0){rot.xy=vec2(0.61,0.85);offset.xy=vec2(0.09,-0.98);}
	else if(i<9.0){rot.xy=vec2(0.46,-0.47);offset=vec3(0.34,-0.34,0.03);}
	else{rot.xy=vec2(0.7,-0.63);offset.xy=vec2(-0.02,-0.72);}
   #else
    i=mod(i,4.0);
    if(i<2.0){rot.xy=vec2(0.58,0.7);offset.x=-0.15;}
    else{rot.xy=vec2(0.7,-0.63);offset.xy=vec2(-0.02,-0.72);}
    if(mod(i,2.0)<1.0){rot.y=-rot.y;offset.x-=offset.x;}
   #endif
	return configuration(matPyr(rot)*1.25,offset);
}

float cbox(vec3 p){
	p=abs(p);//there must be a more efficient way
	return max(max(p.x,max(p.y,p.z))-1.0,-min(max(p.x,p.y),min(max(p.y,p.z),max(p.z,p.x)))+0.9);
}
float id=0.0,lastConfig=-100.0;
float DE(in vec3 p){
	vec2 c=floor(p.xz*0.2);
	float fig=c.x+c.y*8.0;
	if(lastConfig!=fig){cfg=config(fig);lastConfig=fig;}
	p.xz=mod(p.xz,5.0)-2.5;
	c=abs(p.xz)-2.5;
	float b=min(p.y+1.0,max(p.y-2.0,0.5-max(c.x,c.y)));
	p.x+=cfg.rmx[2].x*0.5;
	float d=cbox(p),dr=1.0;
	for(int i=0;i<8;i++){
		p=p*cfg.rmx;
		p+=cfg.offset;
		dr*=0.8;
		float d2=cbox(p)*dr;
		#ifdef SHOW_INTERSECTIONS
			if(d2<0.0)ints++;
		#endif
		d=min(d,d2);
	}
	if(id<0.0){if(b<d)id=0.0;else id=1.0;}
	return min(b,d);
}

float rnd(vec2 c){return fract(sin(dot(vec2(1.317,19.753),c))*413.7972);}
float rndStart(){
	return 0.5+0.5*rnd(gl_FragCoord.xy+vec2(time*217.0));
}
float shadao(vec3 ro, vec3 rd, float px){//pretty much IQ's SoftShadow
	float res=1.0,d,t=2.0*px*rndStart();
	for(int i=0;i<12;i++){
		d=max(px,DE(ro+rd*t)*1.5);
		t+=d;
		res=min(res,d/t+t*0.1);
	}
	return res;
}
vec3 Sky(vec3 rd){//what sky??
	return vec3(max(0.0,rd.y)*(0.5+0.5*abs(sin(rd.x*10.0))));
}
vec3 L=vec3(0.0);
vec3 Color(vec3 ro, vec3 rd, float t, float px, vec3 col, bool bFill){
	ro+=rd*t;
	id=-1.0;
	float d=DE(ro);
	vec2 e=vec2(px*t,0.0);
	vec3 dn=vec3(DE(ro-e.xyy),DE(ro-e.yxy),DE(ro-e.yyx));
	vec3 dp=vec3(DE(ro+e.xyy),DE(ro+e.yxy),DE(ro+e.yyx));
	vec3 N=(dp-dn)/(length(dp-vec3(d))+length(vec3(d)-dn));
	vec3 R=reflect(rd,N);
	vec3 lc=vec3(1.0,0.9,0.8),sc,rc=Sky(R);
	if(id==0.0){//floor
		sc=vec3(0.5)-abs(fract(ro*0.7)-vec3(0.5));
		sc=vec3(mix(0.3,0.5+0.05*sin((sc.x+sc.z)*50.0),smoothstep(0.0,1.6*px*t,min(sc.x,sc.z))));
	}else{//box
		sc=vec3(0.9,0.5,0.4);
	}
	float sh=clamp(shadao(ro,L,px*t)+0.2,0.0,1.0);
	sh=sh*(0.5+0.5*dot(N,L))*exp(-t*0.125);
	vec3 scol=sh*lc*(sc+rc*pow(max(0.0,dot(R,L)),4.0));
	if(bFill)d*=0.1;
	col=mix(scol,col,clamp(d/(px*t),0.0,1.0));
	return col;
}
mat3 lookat(vec3 fw){
	fw=normalize(fw);vec3 rt=normalize(cross(fw,vec3(0.0,1.0,0.0)));return mat3(rt,cross(rt,fw),fw);
}
float saw(float t){
	float d=abs(fract(t)-0.5);
	if(mod(t,4.0)>3.0)d=1.0-d;
	return d;
}
vec3 path(float t){
	float tx=100.0+abs(mod(t,12.0)-6.0)-3.0;
	return vec3(2.5+tx+saw(tx),0.5,t+saw(t+0.5))*5.0;
}
void main() {
	vec3 iResolution = vec3(resolution, 1.0);
	float px=0.5/size.y;
	L=normalize(vec3(0.4,0.8,-0.6));
	float tim=time*0.1;
	vec3 ro=(path(tim)+path(tim+0.1)+path(tim+0.3))/3.0;
	vec3 ta=(ro+path(tim+0.66)+path(tim+0.84))/3.0-ro;ta.y-=dot(ta,ta)*0.13;
	
	vec3 rd=lookat(ta)*normalize(vec3((2.0*gl_FragCoord.xy-size.xy)/size.y,3.0));
	//ro=eye*10.0;rd=normalize(dir);
	float t=DE(ro)*rndStart(),d=0.0,od=10.0;
	vec3 edge=vec3(-1.0);
	bool bGrab=false;
	vec3 col=Sky(rd);
	for(int i=0;i<64;i++){
		t+=d;
		d=DE(ro+rd*t);
		if(d>od){
			if(bGrab && od<px*t && edge.x<0.0){
				edge=vec3(edge.yz,t-od);
				bGrab=false;
			}
		}else bGrab=true;
		od=d;
		#ifdef SHOW_INTERSECTIONS
			d=max(d,0.01);
			if(ints>1){gl_FragColor = vec4(1.0,0.0,0.0,1.0);return;}
			ints=0;
		#endif
		if(t>1000.0 || d<0.00001)break;
	}
	bool bFill=false;
	d*=0.1;
	if(d<px*t && t<1000.0){
		if(edge.x>0.0)edge=edge.zxy;
		edge=vec3(edge.yz,t);
		bFill=true;
	}
	for(int i=0;i<3;i++){
		if(edge.z>0.0)col=Color(ro,rd,edge.z,px,col,bFill);
		edge=edge.zxy;
		bFill=false;
	}
	gl_FragColor = vec4(4.0*col,1.0);
}
