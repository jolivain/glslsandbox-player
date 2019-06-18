#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
#define PI 3.14159265359
vec3 color(float x)
{
	return max(min(sin(vec3(x,x+PI*2.0/3.0,x+PI*4.0/3.0))+0.5,1.0),0.0);
}
void main( void ) {

	vec2 pos = (( gl_FragCoord.xy / resolution.xy )-0.5)*resolution.xy/resolution.x*4.0;
	pos+=normalize(pos);
	pos.xy+=sin(pos.yx*10.0)*0.1;
	float r=(2.0/(dot(pos,pos)*10.0+1.0));
	vec2 rr=vec2(cos(r),sin(r));
	pos=pos.xy*rr.xx+pos.yx*rr.yy*vec2(-1.0,1.0);
	float f=(length(pos)*10.0)+time;
	//f=acos((pos.x/length(pos)*0.5+0.5)*PI);
	f+=sin(atan(pos.y,pos.x)*7.0)*5.0;
	gl_FragColor = vec4(color(f),1.0);
	//gl_FragColor = vec4(f);
}
