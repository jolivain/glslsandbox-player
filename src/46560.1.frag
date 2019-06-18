/*
 * Original shader from: https://www.shadertoy.com/view/XsVczh
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
const float PI = 3.141592;
const float TWO_PI = 2. * PI;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

const float GAMMA_COEFF = 2.2;
const float DISPLAY_GAMMA_COEFF = 1. / GAMMA_COEFF;
vec3 gammaCorrect(vec3 rgb) {
  return vec3((min(pow(rgb.r, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.g, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.b, DISPLAY_GAMMA_COEFF), 1.)));
}

vec3 degamma(vec3 rgb) {
  return vec3((min(pow(rgb.r, GAMMA_COEFF), 1.)),
              (min(pow(rgb.g, GAMMA_COEFF), 1.)),
              (min(pow(rgb.b, GAMMA_COEFF), 1.)));
}

vec3 hsv2rgb(vec3 c) {
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 compProd(const vec2 a, const vec2 b){
	return vec2(a.x * b.x - a.y * b.y,
                a.x * b.y + a.y * b.x);
}

vec2 compQuot(const vec2 a, const vec2 b){
	float denom = dot(b, b);
    return vec2((a.x * b.x + a.y * b.y) / denom,
                (a.y * b.x - a.x * b.y) / denom);
}

const float SAMPLE_NUM = 20.;
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec3 sum = vec3(0);
	float ratio = iResolution.x / iResolution.y / 2.0;
    
    const float gScale = .6;
    
    for(float i = 0. ; i < SAMPLE_NUM ; i++){
        vec2 position = ( (fragCoord.xy + (rand2n(fragCoord.xy, i))) / iResolution.yy ) - vec2(ratio, 0.5);
        position = position * 4.;
        
        position = compQuot(position - vec2(1. + sin(iTime), 0.4 + cos(iTime)), compProd(position, position) + position + vec2(1, 0)); 
        //position = compQuot(position - vec2(1., 0.), compProd(position, position) + position + vec2(1, 0)); 
        
        float absD = (log(length(position))) * 2.;
        float g = 1. - (ceil(absD) - absD) * gScale;
        
        float arg = (atan(position.y, position.x)) / TWO_PI;
        float logArg = (arg) * 10.;
        float argG = 1. - (ceil(logArg) - logArg) * gScale;
        sum += hsv2rgb(vec3(arg, 1., clamp(argG * g, 0., 1.)));
    }
    fragColor = vec4((sum/SAMPLE_NUM), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
