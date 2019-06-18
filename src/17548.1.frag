#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D iChannel0, iChannel1, bb;


varying vec2 surfacePosition;

#define iGlobalTime time*0.1 + length(surfacePosition)

//orbit traps from julia version of fractal formula z=(z+1/z+c)*-scale;

#define zoom 5.
#define offset vec2(0.3,0.2)

#define iterations 27
#define scale -.4
#define julia ((mouse-.5)*4.)

#define orbittraps vec3(.8,.5,-.01)
#define trapswidths vec3(.2,.2,.3)

#define trap1color vec3(1.00,0.30,0.10)
#define trap2color vec3(1.00,0.50,0.10)
#define trap3color vec3(0.10,0.20,1.00)

#define trapsbright vec3(1.,.8,.7)
#define trapscontrast vec3(5.,10.,5.)

#define trapsfreq vec3(5.,8.,20.)
#define trapsamp vec3(.03,.03,.01)
#define trapspeeds vec3(20.,20.,40.)

#define saturation .5
#define brightness .9
#define contrast 1.35
#define minbright .3

#define antialias 1. //max 4


vec2 rotate(vec2 p, float angle) {
return p*mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
}

void main(void)
{
	vec3 aacolor=vec3(0.);
	vec2 uv=gl_FragCoord.xy / resolution - 0.5;
	float aspect=resolution.x/resolution.y;
	vec2 pos=uv;
	pos.x*=aspect;
	float t=iGlobalTime*.07;
	float zoo=.005+pow(abs(sin(t*.5+1.4)),5.)*zoom;
	pos=rotate(pos,t*2.442365);
	pos+=offset;
	pos*=zoo; 
	vec2 pixsize=2./resolution*zoo;
	pixsize.x*=aspect;
	float av=0.;
	vec3 its=vec3(0.);
	for (float aa=0.; aa<16.; aa++) {
		vec3 otrap=vec3(12000.);
		if (aa<antialias*antialias) {
			vec2 aacoord=floor(vec2(aa/antialias,mod(aa,antialias)));
			vec2 z=pos+aacoord*pixsize/antialias;
			for (int i=0; i<iterations; i++) {
				vec2 cz=vec2(z.x,-z.y);
				z=z+cz/dot(z,z)+julia;
				z=z*scale;
				float l=length(z);
				vec3 ot=abs(vec3(l)-orbittraps+
					(sin(pos.x*trapsfreq/zoo+t*trapspeeds)+
					 sin(pos.y*trapsfreq/zoo+trapspeeds))*trapsamp);
				if (ot.x<otrap.x) {
					otrap.x=ot.x;
					its.x=float(iterations-i);	
				}
				if (ot.y<otrap.y) {
					otrap.y=ot.y;
					its.y=float(iterations-i);	
				}
				if (ot.z<otrap.z) {
					otrap.z=ot.z;
					its.z=float(iterations-i);	
				}
			}
		}
		otrap=pow(max(vec3(0.),trapswidths-otrap)/trapswidths,trapscontrast);
		its=its/float(iterations);
		vec3 otcol1=otrap.x*pow(trap1color,3.5-vec3(its.x*1.5))*max(minbright,its.x)*trapsbright.x;
		vec3 otcol2=otrap.y*pow(trap2color,3.5-vec3(its.y*4.))*max(minbright,its.y)*trapsbright.y;
		vec3 otcol3=otrap.z*pow(trap3color,3.5-vec3(its.z*4.875))*max(minbright,its.z)*trapsbright.z;
		aacolor+=(otcol1+otcol2+otcol3);
	}
	aacolor=aacolor/(antialias*antialias)+.15;
	vec3 color=mix(vec3(length(aacolor)),aacolor,saturation)*brightness;
	color=pow(color,vec3(contrast));		
	gl_FragColor = vec4(color,1.0);
}
