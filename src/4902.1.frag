/* Normal Map Stuff */
/* By: Flyguy */
/* With help from http://stackoverflow.com/q/5281261 */

// fancified a bit by psonice

// slimified a bit by kabuto
 
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.141592 

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform vec2 surfaceSize;
varying vec2 surfacePosition;

float heightmap(vec2 position)
{
	float height = 0.0;
	float f = .002;
	vec2 timevec = time*vec2(.1,.13);
	float g = sqrt(1.25)+.5;
	position *= f;
	float c = cos(2.*PI*g);
	float s = sin(2.*PI*g);
	mat2 matcs = mat2(c,s,-s,c)*g;
	for (int i = 0; i < 13; i++) {
		vec2 v = fract(position + timevec)-.5;
		float dots = max(0.,.13-dot(v,v));
		dots = dots*dots*dots/f*8.;
		height += dots*dots*2.;//max(height,dots);
		f *= g;
		position *= matcs;
	}
	
	return sqrt(height);
}
	
float n1,n2,n3,n4;
vec2 size = vec2(-0.4,0.0);
void main( void ) {

	vec2 pos = gl_FragCoord.xy;

	n1 = heightmap(vec2(pos.x,pos.y-1.0));
	n2 = heightmap(vec2(pos.x-1.0,pos.y));
	n3 = heightmap(vec2(pos.x+1.0,pos.y));
	n4 = heightmap(vec2(pos.x,pos.y+1.0));
	
	vec3 p2m = vec3(-((pos/resolution)-mouse)*resolution,resolution.x*.2);	
	
	vec3 normal = normalize(vec3(n2-n3, n1-n4, 0.4));
	
	float color = dot(normal, normalize(p2m))*1.;
	vec3 colorvec = vec3(pow(color,6.),pow(color,5.),pow(color,2.9));
	
	float brightness = 1./sqrt(1.+pow(distance(mouse*resolution,pos)/resolution.x*8.,2.));
	
	gl_FragColor = vec4( colorvec + brightness*vec3(1.1, 0.9, 0.7) - 1.0 + vec3(0.0, 0.1, 0.2), 1.0 );

}
