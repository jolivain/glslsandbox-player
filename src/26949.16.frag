#ifdef GL_ES
precision mediump float;
#endif

// testing by nodj 

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec2  p  = vec2(0.);
vec2  ci = vec2(0.);
vec2  cs = vec2(0.);
vec3 spotColor = vec3(0.2,0.5,0.8);
vec3 backColor = vec3(0.);
vec3 lightColor = vec3(1.,0.5,0.1);

float r   = 0.;
vec3  rgb = vec3(0.);
float k = 0.;
float y = 0.;
float y2 = 0.;

#define N 40
#define Nf float(N)

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void compCellY(){
	y = sin(ci.x*0.3 + 2.6*cos(0.1*time)) + cos(ci.y*0.8+4.*cos(0.05*time) * 0.7*ci.x);
	y = clamp(0.5+0.25*y,0.,1.);
	
}

void mask(){
	float yn = clamp(0.8*(y+y2), 0.,1.);
	float d = length((cs-vec2(0.5))*vec2(pow(yn, -2.),1.));
	k = 1.-smoothstep(0.40,0.52, d);
	k*= 0.3+0.7*cos((cs.x-0.5)*3.14159*pow(yn,-2.));
}

void main( void ) {
	
	p = (gl_FragCoord.xy-0.5*resolution)/ resolution.y ;
	
	vec2 cm = (mouse-0.5) * resolution / resolution.y;
	//cm = floor(cm*Nf);
	cm *= Nf;
	
	ci = floor(p*Nf);
	cs = fract(p*Nf);
	
		
	compCellY();
	y2=1.2/(0.99+0.05*distance(cm,ci));
	
	//compLighting();
	mask();
	
	
	r = length(p);
	// a = angle(vec2(0.));

	spotColor = hsv2rgb(vec3(0.1*time + 0.3*p.x+0.1*p.y, 0.6, 0.6));
	
	
	rgb = mix(backColor, vec3(pow(1.3*y,2.)*spotColor) + vec3(pow(1.3*y2,2.)*lightColor), k);
	gl_FragColor = vec4(rgb, 1.0 );

}
