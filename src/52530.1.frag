//--- Snowflake Generator
// by Catzpaw 2019
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//Shape
#define THICKNESS 0.04
#define SHRINK 0.9

//Deformation
#define SCALE 1.3
#define ITERATIONS 4
#define NARROW 1.4
#define SPREAD 0.08
#define DECAY 0.9

//Tone
#define THRESHOLD 0.001
#define COMPLEXITY 50.0
#define VELOCITY 0.15

//snowflake generator
float hash(float v){return fract(sin(v*22.9)*67.);}
mat2 rotate(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}
vec2 foldRotate(vec2 p){float a=.5236-atan(p.x,p.y),n=1.0472;a=floor(a/n)*n;return p*rotate(a);}
float dHex2d(vec2 p){p*=rotate(.5236);p=abs(p)*SHRINK;return max((p.x*.866+p.y*.5),p.y)-THICKNESS;}
float map(vec2 p,float x,float y){
	float h=hash(x+y*133.3),d=0.,v=0.,u=.5/float(ITERATIONS);
	for(int i=0;i<ITERATIONS;i++){p.xy=foldRotate(p.xy);
		h=hash(h);p.x*=((NARROW+hash(h))-h);
		h=hash(h);p.y-=h*SPREAD;
		h=hash(h);p*=DECAY+h;
		d=dHex2d(p);
		if(d<.0)v+=u+floor(sin(d*COMPLEXITY)*2.+1.)*VELOCITY;}
	return v<THRESHOLD?0.:1.-v;}

//print digits
#define TEXTLINES   16.	
#define FONTHEIGHT  8.	
#define DIGITS      6.	//not a number of significant figures
float digit(vec2 p,float n){if(abs(p.x-.5)>.5||abs(p.y-.5)>.5)return 0.;float d=0.;
	if(n<0.)d=1792.;else if(n<1.)d=480599.;else if(n<2.)d=139810.;else if(n<3.)d=476951.;
	else if(n<4.)d=476999.;else if(n<5.)d=349556.;else if(n<6.)d=464711.;else if(n<7.)d=464727.;
	else if(n<8.)d=476228.;else if(n<9.)d=481111.;else if(n<10.)d=481095.;else d=2.;
	p=floor(p*vec2(4.,FONTHEIGHT));return mod(floor(d/pow(2.,p.x+(p.y*4.))),2.);}
float putInt(vec2 uv,vec2 p,float n){uv*=TEXTLINES;p+=uv;
	float c=0.,m=abs(n)<1.?2.:1.+ceil(log2(abs(n))/log2(10.)+1e-6),d=floor(p.x+m);
	if(d>0.&&d<m){float v=mod(floor(abs(n)/pow(10.,m-1.-d)),10.);c=digit(vec2(fract(p.x),p.y),v);}
	if(n<0.&&d==0.)c=digit(vec2(fract(p.x),p.y),-1.);
	return c;}

//main
void main(void){
	vec2 uv=(gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
	float x=floor(mouse.x*100.),y=floor(mouse.y*100.),v=map(uv*(1./SCALE),x,y);
	v+=putInt(uv,vec2(-6.,6.),x+y*100.);
	gl_FragColor=vec4(vec3(v),1);
}

