/*
 * Original shader from: https://www.shadertoy.com/view/MsBSzW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Created by c.Kleinhuis - VJSpackOMat/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// https://www.facebook.com/VJSpackOMat
// http://www.fractalforums.com 
#define PI 3.14159265359
#define PI2 PI*2.0

vec2 siney(float t){
	return vec2(0,-clamp(sin(t),0.0,1.0));
}

vec2 cosey(float t){
	t=mod(t,PI2);
	return vec2(0,-clamp(cos(t),0.0,1.0));
}

float circle(vec2 center,float radius)
{
	float result=1.0;
	float l=length(center);

	l-=radius;

	if(l>radius)result=0.0;

	return result;

}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdCapsule( vec2 p, vec2 a, vec2 b, float r )
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}
float capsule( vec2 p, vec2 a, vec2 b, float r )
{

	if(sdCapsule(p,a,b,r)<0.0)return 1.0;

	return 0.0;

} 
float cos3Big(float t){

	return (cos(t)+cos(t*2.0)*0.5+cos(PI/4.0+t*4.0)*0.25)/3.0;

}
float circleHalve(vec2 center,float radius)
{
	float result=1.0;


	float l=length(center);


	l-=radius;

	if(center.y<0.0)result=0.0;
	if(l>radius)result=0.0;

	return result;

}

float walkingDude(vec2 uv,float time){

	float val=0.0;
	float floorHeight= (-0.5 );
	float tempduetocomplainingcompiler=(uv.x+1.5)/3.0-1.5;
	tempduetocomplainingcompiler=    floor(tempduetocomplainingcompiler) ;
	time=time+tempduetocomplainingcompiler *112.00;
	uv.x=mod(uv.x,3.0)-1.5;

	//body
	vec2 bodyPos=vec2(0.0,sin(time*8.0)*.15+.55-floorHeight);
	val+=circle((uv-bodyPos)*vec2(1.25,1.0),.2);


	vec2 headPos=bodyPos+vec2(cos3Big(time)*0.2,0.4+cos3Big(time*1.12)*0.2);
			val+=circle(uv-headPos,.1);

	//val+=circleHalve(uv+footDist+cosey(iTime*4)*0.4,cos(PI+iTime*4)*0.05+0.1);


			vec2 footDist=vec2(0.35,0);
			vec2 footLeft=footDist+cosey(PI/2.0+time*4.0+PI)*0.4;
			float footLeftRadius=cos(time*4.0+PI)*0.05+0.15;
			val+=circleHalve(uv+footLeft,footLeftRadius);


	footDist=vec2(-0.35,0.0);
	vec2 footRightPos=footDist+cosey(PI/2.0+time*4.0)*0.4 ;
	val+=circleHalve(uv+footRightPos,cos(time*4.0)*0.05+0.15);


	val+=capsule(uv,bodyPos,-footRightPos+vec2(0,0.1),0.1);

	val+=capsule(uv,bodyPos,-footLeft+vec2(0,0.1),0.1);



	vec2 handDist=bodyPos+vec2(-0.6,-2.25);
	vec2 handLeft=handDist+vec2(-cos3Big(PI/2.0+time*1.3+PI)*0.2,cos3Big(PI/2.0+time*1.11+PI)*0.25);
	float handLeftRadius=0.05;
	val+=circle(uv+handLeft,handLeftRadius);
	val+=capsule(uv,bodyPos+vec2(0,0.2),-handLeft ,0.05);


	 handDist=bodyPos+vec2(0.6,-2.25);;
	vec2 handRight=handDist+vec2(cos3Big(PI/2.0+time*1.3+PI)*0.2,cos3Big(PI/2.0+time*1.11+PI)*0.25);
	float handRightRadius=0.05;
	val+=circle(uv+handRight,handLeftRadius);
	val+=capsule(uv,bodyPos+vec2(0,0.2),-handRight ,0.05);

val=clamp(val,0.0,1.0);

	return val;

}


float walkingDudeScaled(vec2 uv,float time,float scale){

	return walkingDude(uv*scale+vec2(0,scale),time);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

	  vec2  xy= -1.0 + 2.0*fragCoord.xy / iResolution.xy;
	  vec2 uv = xy * vec2(iResolution.x/iResolution.y,1.0);
float val=0.0;

//head

//val+=circle(+vec2(0,sin(iTime*8)*.25-.25),.25);
vec2 uvorig=uv;
uv.x+=iTime;
//body
val=walkingDudeScaled(uv,iTime,1.0);
uv.x=uvorig.x+iTime*.5;
val=max(val,walkingDudeScaled(uv+vec2(-1.0,0.0),345.0+iTime*1.0,2.0)*0.5);
//val+=walkingDudeScaled(uv+vec2(1,0),2314+iTime*1,2)*0.75;
uv.x=uvorig.x+iTime*.25;

val=max(val,walkingDudeScaled(uv+vec2(1.5,0.0),34256.0+iTime*1.0,4.0)*0.25);
//val+=walkingDudeScaled(uv+vec2(-1.5,0),7655+iTime*1,4)*0.5;
//val+=walkingDudeScaled(uv+vec2(sawtooth(-iTime*.1)*6,0),iTime*1.73,sawtooth(-iTime*.1)*8);
//val+=walkingDudeScaled(vec2(-2,0)+uv+vec2(sawtooth(-iTime*.14)*3,0),234+iTime*2.1,sawtooth(-iTime*.14)*8);
//val+=walkingDudeScaled(vec2(-1,0)+uv+vec2(sawtooth(-iTime*.14)*3,0),44+iTime*1.3,sawtooth(-iTime*.14)*8);

//val+=walkingDudeScaled(uv+vec2(1,0),iTime*3,3);
//val+=walkingDudeScaled(uv+vec2(1,0),iTime*2,4)*0.5;
//val+=walkingDudeScaled(uv+vec2(-1,0),iTime*2.3,0.5)*0.5;


	vec3 color=vec3(1.0,1.0,1.0);

	fragColor = vec4( color*val, 1 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
