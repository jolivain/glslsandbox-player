#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

varying vec2 surfacePosition;

#define PI 3.14159265359

#define SCALE 8.

#define CORNER 16.

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main( void ) {
	vec2 position = surfacePosition * SCALE;
	position += position*sin(time)/10.;
	position.y += time;
	position.x += mouse.x*8.0;
	vec2 realPos = ( gl_FragCoord.xy / resolution.xy) - 0.5;
	realPos.x *= resolution.x / resolution.y;
	
	vec2 mousePos = (mouse) - 0.5;
	mousePos.x *= resolution.x / resolution.y;
	vec3 light = vec3((mousePos - realPos), 0.5);

	vec3 normal = normalize(vec3(tan(position.x * PI), tan(position.y * PI), CORNER));
	
	float bright = dot(normal, normalize(light));
	bright = pow(bright, 1.);
	//bright *= step(length(position), 1.);
	
	vec3 color = hsv2rgb(vec3((floor(position.x + 0.5) + time)/SCALE, 1., 1.)) * bright;
	
	float rnd = fract(cos(floor(position.x + 10.5)*floor(position.y+ .5))*123.321);
	
	
	vec3 heif = normalize(light + vec3(0., 0., 1.));
	
	vec3 spec = vec3(pow(dot(heif, normal), 96.));
	
	color += spec;

	//gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );
	gl_FragColor = vec4(color, 1.);

	if (rnd > mouse.x) gl_FragColor = vec4(vec3(0), 1.);
}
