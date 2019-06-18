#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float layers=10.0;
const int iter=16;
const bool parallax=true;
const vec3 c=vec3(0.75,0.5,1.3);
const float stepLength=8.0;

const vec3 spaceColor=vec3(0.1,0.1,0.2);
const vec3 starColor=vec3(0.1,0.5,0.3);

void main( void ) {
	gl_FragColor = vec4(0.);
	vec2 p = ( gl_FragCoord.xy / resolution.xy );
	p.x*=resolution.x/resolution.y;
	
	for(float i=1.0;i<layers;i++){
		vec3 z=vec3(i*0.01*p+0.001*time*i,i+0.0001*time);
		if(parallax){
			z.y+=0.002*time/i;
		}
		
		z=2.0*abs(fract(z)-0.5);
		for(int j=0;j<iter;j++){
			z=abs(z)/dot(z,z*0.34)-c;
		}
		
		float m=smoothstep(0.0,stepLength,length(z.y));
		vec3 col=mix(spaceColor,starColor,m)*m*(layers-i);
		gl_FragColor+=2.0/layers*vec4(col,1);
	}
}
