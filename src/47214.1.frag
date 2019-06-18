/*
 * Original shader from: https://www.shadertoy.com/view/MsV3Wt
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.1415926535
#define clamps(x) clamp(x,0.,1.)
vec2 rotate(float angle,vec2 position)
{
    mat2 matrix = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
    return position*matrix;
}
float chess_dist(vec2 uv) {
    return max(abs(uv.x),abs(uv.y));
}
float lthan(float a, float b) {
    //return step(a,b);
    return clamps(((b-a)*200.)+.5); //Smoother
}
float ulam_spiral(vec2 p)
{
	float x 	= abs(p.x);
	float y		= abs(p.y);
	bool q		= x > y;
	
	x		= q ? x : y;
	y		= q ? p.x + p.y : p.x - p.y;
	y 		= abs(y) + 4. * x * x + 1.;
	x 		*= 2.;
	
	return q ? (p.x > 0. ? y - x - x : y) : (p.y > 0. ? y - x : y + x);	
}
float drawing(vec2 uv, float time) {
    time = fract(time*.6);
    uv = rotate((-time*(PI/2.))+(PI/2.),uv);
    uv /= pow(3.,fract(time)); //Zoom in to middle square
    uv *= 5.; //Zoom out
    float a = 0.;
    float s = fract(time); //Seperation time
    for (float i = 0.; i < 9.; i++) { //3x3
        vec2 p = vec2(mod(i,3.),floor(i/3.))-1.;
        p += p*pow(max((s*8.)-(9.-ulam_spiral(-p)),0.),2.); //Move squares
    	a += lthan(chess_dist(uv-p),.5); //Draw square
    }
    return clamps(a);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy / iResolution.xy)-.5;
    uv.x *= iResolution.x / iResolution.y;
    float time = iTime;
    
	float a = 0.;
    //Motion-blur
    #define SAMPLES 10.
    for (float i = 0.; i < SAMPLES; i++) {
        a += drawing(uv,time-(i*.002));
    }
    a /= SAMPLES;
    
	fragColor = vec4(mix(vec3(0.9),vec3(0.1),a)-(length(uv)*.1),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
