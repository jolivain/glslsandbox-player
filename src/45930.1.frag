//--- loading circle
// by Catzpaw 2018
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define InnerRadius .81
#define OuterRadius .99
#define Bokeh1 .005

#define Speed 24.
#define Split 24.
#define Thickness .8
#define Bokeh2 .1

/*
#define Speed 480.
#define Split 240.
#define Thickness 1.0
#define Bokeh2 .1
*/

vec2 polar(vec2 p){float l=pow(length(p),.4),a=atan(-p.x,p.y);return vec2(a,l);}
float ribbon(vec2 p){return smoothstep(InnerRadius,InnerRadius+Bokeh1,p.y)*smoothstep(OuterRadius+Bokeh1,OuterRadius,p.y);}
float stripe(vec2 p){p.x=mod(p.x+floor(time*Speed)*6.28318/Split,6.28318);
	return smoothstep(Thickness+Bokeh2,Thickness,abs(cos(p.x*Split*.5)))*(1.-floor(p.x*Split/6.28318)/Split);}

void main(void){
	vec2 p=polar((gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y));
	float v=ribbon(p)*stripe(p);
	gl_FragColor=vec4(mix(vec3(0),vec3(1.0,1.5,2.0),v),v);
}

