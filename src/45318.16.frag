//--- mucous membrane
// by Catzpaw 2018

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define D .6

float wave(vec2 p){float v=sin(p.x+sin(p.y)+sin(p.y*.43));return v*v;}

const mat2 rot=mat2(.5,.86,-.86,.5);
float map(vec2 p){float v=0.;
	v+=wave(p);p.x+=time;p*=rot;v+=wave(p);p.x+=time*.17;p*=rot;v+=wave(p);
	v=abs(1.5-v);return v;
}

void main( void ) {
	vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
	vec2 p=normalize(vec3(uv.xy,2.3)).xy*19.;p.y+=time*2.;
	float v=map(p);
	vec3 c=mix(vec3(.8,.4,.5),vec3(1.,.3+map(p*2.5)*.1,.5),v);
	vec3 n=normalize(vec3(v-map(vec2(p.x+D,p.y)),v-map(vec2(p.x,p.y+D)),-D));
	vec3 l=normalize(vec3(.4,.4,-1.5));
	v=dot(l,n)+pow(dot(l,n),80.);
	c.rg*=v;
//	c.b*=v;	//WTF!?
	gl_FragColor = vec4(c,1);
}
