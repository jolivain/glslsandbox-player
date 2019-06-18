#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define STEPSEC 1
#define HASCHRONO 0;
#define PI 3.14159265359
#define SCALE 0.75

const float radius   = 0.33;
const float radius_h = 0.29;
const float radius_m = 0.30;
const vec3 color1 = 0.8*vec3(0.2,0.9,0.7);
const vec3 color2 = vec3(1.1,0.05,0.05);

float d2y(float d){return 1./(0.2+d);}

vec2 p = vec2(0.0);
float a = 0.0, r = 0.0;

float angle(vec2 orig){
	vec2 t = p-orig;
	return 0.5-atan(t.x, -t.y)/(2.*PI);
}

float dtick(float r, float a, float n, float l, float f0, float f1){
	float h = f1*abs(fract(n*a+0.5)-0.5);
	float hi = f0*max(0., l-r);
	return 9.*length(vec2(h,hi));
}

float ticks(){
	float a = 0.5-atan(p.x, -p.y)/(2.*PI);
	
	float dh = dtick(r, a, 12., radius_h, 35., 6.);
	float dm = dtick(r, a, 60., radius_m, 200., 5.);
	
	return d2y(dh) + d2y(dm);
}

   
float circle(float R){
    float d=distance(r, R);
    return d2y(200.*d);
}

float hands(float e){
	float s = mod(time,60.); // 0.00->0.99
	#if STEPSEC
	s=floor(s);
	#endif
	float ah = 60.*a;
	float dr = 0.5*r*min(min(abs(s-ah),abs(s-ah+60.)),abs(s-ah-60.));
	float dl = 4.*max(0., r-0.27);
	float d = length(vec2(dr, dl));
	float x = 0.01;
	return d2y(e*d) * step(x,r) + circle(x);
}

float chrono(float e, vec2 orig, float k){
	float s = mod(time,k); // 0.00->0.99
	float r = distance(p,orig);
	float ah = k*angle(orig);
	float dr = 20.*r*min(min(abs(s-ah),abs(s-ah+k)),abs(s-ah-k));
	float dl = 4.*max(0., r-0.03);
	float d = length(vec2(dr, dl));
	return d2y(e*d);
}


void main( void ) {
	p = SCALE*(gl_FragCoord.xy-0.5*resolution)/ resolution.y ;
	r = length(p);
	a = angle(vec2(0.));
	float inCircle = step(r,radius);
	
	vec2 y = vec2(0.);
	y.x += circle(radius);
	y.x += ticks() * inCircle;
	
	y.y += hands(50.);
	y.y += chrono(80., vec2(0.15,-0.12),1.); 
	y = pow(y, vec2(0.9));
	vec3 rgb = y.x*color1+y.y*color2;
	rgb = 0.8*mix(rgb,rgb.gbr+rgb.brg,0.15);
	gl_FragColor = vec4(rgb, 1.0);
}
