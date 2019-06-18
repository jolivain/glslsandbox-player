#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// neon spinner, nodj.

#define PI       3.14159265359
#define SCALE    1.
#define N        8.
#define R        0.45
#define W        mouse.x*PI
#define CONTRAST 1.6
#define SPEED    1.
#define OFFSET   0.98
#define E        100.
#define SAT      0.85
#define TWIST    0.75

const float radius   = 0.33;
const vec3 color1 = 0.8*vec3(0.2,0.9,0.7);
const vec3 color2 = vec3(1.1,0.05,0.05);

float a = 0., r = 0.;
vec2 p = vec2(0.);


float d2y(float d){return 1./(0.2+d);}
float angle(vec2 orig){ vec2 t = p-orig; return atan(t.y, t.x);}
float sdistance(vec2 a, vec2 b){ b-=a; return dot(b,b);	}
float dCircle(vec2 center, float radius){ return abs(distance(p,center)-radius); }
vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float dArc(vec2 center, float radius, float a0, float a1){
	float f = floor(a0/(2.*PI));
	a0-=f*2.*PI;
	a1-=f*2.*PI;
	float am = a;
	
	float dc = dCircle(center, radius);
	float dc0 = dc+100000.*(1.-step(a0,am)*step(am,a1));
	am +=2.*PI;
	dc0 = min(dc0,dc+100000.*(1.-step(a0,am)*step(am,a1)));
	
	float da0 = distance(p, radius*vec2(cos(a0), sin(a0)));
	float da1 = distance(p, radius*vec2(cos(a1), sin(a1)));
	
	return min(dc0,min(da1,da0));
}

const vec2 Orig = vec2(0.);
void main() {

	p = SCALE*(gl_FragCoord.xy-0.5*resolution)/ resolution.y ;
	//r = length(p);
	a = angle(vec2(0.));
	
	
	vec3 rgb = vec3(0.);
	float t = time*SPEED;
	for(float i = 0.; i<N; ++i){
		float x = 2.*t-OFFSET*(i-TWIST*N)*sin(t*0.8);
		float y = 0.;
		float r = R*(i+0.6)/N;
		float d = dArc(Orig, r, x, x+W);
		y += d2y(E*d);
		
		x+=PI;
		d = dArc(Orig, r, x, x+W);
		y += d2y(E*d);
		
		y = pow(y,CONTRAST);
		rgb += y * hsv2rgb(vec3(i/N, SAT,1.0));
	}

	gl_FragColor = vec4( rgb, 1.0 );
}
