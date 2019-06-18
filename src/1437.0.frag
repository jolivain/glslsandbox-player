/**

###Anaglyph 3d tunnel###
by Ralph Hauwert / @UnitZeroOne / UnitZeroOne.com
Put on your red / magenta anaglyph glasses and enjoy the trip.
**/

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//There is a nasty bug on chrome (at leat mine), that breaks on any usage of cos, workaround with the mycos define below.
#define mycos(x) sin(1.57079633-x) 

vec3 roy(vec3 v, float x)
{
    return vec3(mycos(x)*v.x - sin(x)*v.z,v.y,sin(x)*v.x + mycos(x)*v.z);
}

vec3 rox(vec3 v, float x)
{
    return vec3(v.x,v.y*mycos(x) - v.z*sin(x),v.y*sin(x) + v.z*mycos(x));
}

float fdtun(vec3 rd, vec3 ro, float r)
{
	
	//float a = dot(rd.xy,rd.xy);
	float a = rd.x*rd.x + rd.y*rd.y;
	float b = ro.x*rd.x + ro.y*rd.y;
	float c = dot(ro.xy,ro.xy) + r*r;
	//b = dot(ro.xy,rd.xy);
	//return sqrt(c);
  	return c;
	float d = (b*b)-(4.0*a*(dot(ro.xy,ro.xy)+(r*r)));
	return d;
	float t1 = (-b + sqrt(d))/(2.0*a);
  	float t2 = (-b - sqrt(d))/(2.0*a);
  	float t = min(t1, t2); 
  	return t;
}

vec2 tunuv(vec3 pos){
	return vec2(pos.z,(atan(pos.y, pos.x))/0.31830988618379);
}

vec3 checkerCol(vec2 loc, vec3 col)
{
	return mix(col, vec3(0.0), mod(step(fract(loc.x), 0.5) + step(fract(loc.y), 0.5), 2.0));
}

vec3 lcheckcol(vec2 loc, vec3 col)
{
	return checkerCol(loc*2.0,col)*checkerCol(loc*0.8,col);	
}

void main( void ) {
	vec3 dif = vec3(0.15,0.0,0.0);
	vec3 scoll = vec3(0.0,1.0,1.0);
	vec3 scolr = vec3(1.0,0.0,0.0);
	vec2 uv = (gl_FragCoord.xy/resolution.xy);
	vec3 ro = vec3(0.0,0.0,time*2.0);
	vec3 dir = normalize( vec3( -1.0 + 2.0*vec2(uv.x - .2, uv.y)* vec2(resolution.x/resolution.y, 1.0), -1.33 ) );

	float ry = time*0.3;
	
	dir = roy(rox(dir,time*0.4),time*0.2);
	vec3 lro = ro-dif;
	vec3 rro = ro+dif;

	const float r = 3.0;
	float ld = fdtun(dir,lro,r);
	float rd = fdtun(dir,rro,r);
	vec2 luv = tunuv(ro + ld*dir);
	vec2 ruv = tunuv(ro + rd*dir);
	vec3 coll = lcheckcol(luv*.3,scoll)*(10.0/exp(sqrt(ld)));
	vec3 colr = lcheckcol(ruv*.3,scolr)*(10.0/exp(sqrt(rd)));
	gl_FragColor = vec4(sqrt(coll+colr),1.0);
}
