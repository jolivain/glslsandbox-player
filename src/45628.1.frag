/*
 * Original shader from: https://www.shadertoy.com/view/Xl2XDm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
//Basic fractal by @paulofalcao

const int maxIterations=8;//a nice value for fullscreen is 8

float circleSize = 0.5 * pow(2.0, -float(maxIterations));

//generic rotation formula
vec2 rot(vec2 uv,float a){
	return vec2(uv.x*cos(a)-uv.y*sin(a),uv.y*cos(a)+uv.x*sin(a));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	//normalize stuff
	vec2 size = iResolution.xy;
    vec2 uv = -.5 * (size - 2.0 * fragCoord.xy) / size.x;

    float t = iTime * 0.5;
    t = t - sin(t);
	//global rotation and zoom
	uv = rot(uv, t);
	uv *= sin(t) * 0.5 + 1.5;
	
	//mirror, rotate and scale N times...
	float s=0.3;
	for(int i=0;i<maxIterations;i++){
		uv=abs(uv)-s;
		uv=rot(uv, t);
		s=s/2.0;
	}
	
	//draw a circle
	float c = size.x * (circleSize - length(uv));
	fragColor = vec4(c,c,c,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
