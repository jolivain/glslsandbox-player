#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
vec3 c;

vec2 random(vec2 p)
{
    mat2 m = mat2(  77.85, 92.77,
                    18.41, 55.48
                );	
    return fract(sin(m*(p*5.0))* ((sin(time*0.9) + 1.0)*0.5));
}

vec2 random2(vec2 co){	
    return vec2(fract(sin(dot(co.xy ,vec2(12.9898 ,78.233))) * ((sin(time*0.9) + 1.0)*0.5)));
}

float voronoi(vec2 p) {
	
	float closestPoint = 1.0;
		
	for(int x = -1; x <= 1; ++x) {
		for(int y = -1; y <= 1; ++y) {
			
			vec2 p = vec2(x,y)+random(floor(p) + vec2(x,y)) - fract(p);
			float currentDistance = max(abs(p.x)+p.y,-p.y);  
			closestPoint = min(closestPoint, currentDistance);
		}
	}
	
	return closestPoint;
}

void main( void ) {

	vec2 position = (gl_FragCoord.xy / 64.0);	
	
	float v = voronoi(position);
	
	c = vec3(v);
	
	gl_FragColor = vec4(1.0-c,1.0);

}
