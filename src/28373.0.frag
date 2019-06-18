#ifdef GL_ES
precision mediump float;
#endif

// simple progress bar

uniform float time;
uniform vec2 resolution;

#define progress sin(time)/4.

void main(void) {
	vec4 bg = vec4(.2,.2,.2,1.);
	vec4 fg1 = vec4(.1,.6,.1,1.);
	vec4 fg2 = vec4(.4,.8,.3,1.);
	vec2 sz = vec2(.25,0.016);
	
	vec2 position = (gl_FragCoord.xy - resolution.xy/2.0)/resolution.x;

	vec4 color = vec4(0);
	if(abs(position.x)<sz.x-sz.y && abs(position.y) < sz.y || length(position-vec2(sz.x-sz.y,0))<sz.y || length(position-vec2(-sz.x+sz.y,0))<sz.y) {
		color = bg;
		if(progress>position.x)
		if(mod(position.x-position.y*.75-time/16.,4.*sz.y)>2.*sz.y)color = fg1; else color = fg2;
	}

	gl_FragColor = color;
	
}
