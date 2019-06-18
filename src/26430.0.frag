#ifdef GL_ES
precision mediump float;
#endif

#define SUPERSAMPLE 	8
#define MAXDIST		0.01

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 tex(vec2 uv, vec3 col1, vec3 col2)
{
	return (mod(floor(uv.x) + floor(uv.y), 2.0)==0.0?col1:col2);	
}

void main( void ) {

	vec2 position = ( gl_FragCoord.xy / resolution.xy ) - vec2(0.5, 0.5); position.x *= resolution.x/resolution.y;
	vec2 uv = position*5.0;
	uv*=0.5 + mouse.x;
	uv.x += sin(length(uv+time))*(sin(time*2.0)+1.0)*0.5;
	uv.y += cos(length(uv+time))*0.4;
	
	
	// Don't leave this uninitialized, that's not portable.
	vec3 color = vec3(0);
	float d = MAXDIST / float(SUPERSAMPLE) * (0.5 + mouse.x);
	for(int x = 0; x < SUPERSAMPLE; x++){
		for(int y = 0; y < SUPERSAMPLE; y++){
			color += tex(uv + vec2(float(x)*d, float(y)*d), vec3(0.7, 0.1, 0.1), vec3(1.0, 1.0, 1.0));
		}
	}
	color /= float(SUPERSAMPLE * SUPERSAMPLE);
	gl_FragColor = vec4(color, 1.0 );

}
