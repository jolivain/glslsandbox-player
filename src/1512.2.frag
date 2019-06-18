#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float halfpi = asin(1.0);
float pixel = 0.0;

float circle(vec2 uv, vec2 pos, float d){
	// Modified to add anti-aliasing.
	return 1.0 - smoothstep(d, d + pixel * 1.5, length(uv - pos));
}

void main( void ) {

	pixel = 1.0 / resolution.y;
	
	vec2 aspect = vec2(resolution.x/resolution.y,1.);

	vec2 uv = 0.5 + ( gl_FragCoord.xy / resolution.xy -0.5 )*aspect;
	
	vec2 mouse = 0.5 + (mouse-0.5)*aspect;

	vec2 pos1 = floor(uv * 4.0) * 0.25 + 0.125;
	
	vec2 d1;
	
	if (distance(mouse, pos1) < 0.07) {
		d1 = (mouse - pos1) / 0.07;
	} else {
		float w1 = atan(mouse.x-pos1.x, mouse.y-pos1.y);
		d1 = vec2(sin(w1), sin(w1 + halfpi));
	}
	
	float layer1 = circle(uv, pos1, 0.1) - circle(uv, pos1, 0.09);
	layer1 += circle(uv, pos1 + d1*0.07, 0.015);
	
	gl_FragColor = vec4(layer1);

	
	gl_FragColor.a = 1.0;

}
