/*
 * Original shader from: https://www.shadertoy.com/view/MsdyzX
 */

#extension GL_OES_standard_derivatives : enable

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
/// Fields
float rand(float n){return fract(sin(n) * 43758.5453123);}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float inverseSquare( vec2 v, float epsilon ) {
    return 1./( epsilon + dot(v, v) );// + 2.1*noise((50.*length(v)));
}

void pointChargeField(const in vec2 position) {
}

/// Operators
vec2 gradient(float scalar) {
    return vec2(dFdx(scalar), dFdy(scalar));
}

float divergence(const in vec2 vector) {
    return dFdx(vector.x) + dFdy(vector.y);
}


float curl(const in vec2 vector) {
    float a = dFdy(vector.x);
    float b = dFdx(vector.y);
    return b - a;
}

float laplace(float scalar) {
    return divergence(gradient(scalar));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.y;

    // Time varying pixel color
    vec2 d1 = uv - vec2(0.35 + 0.15*sin(iTime), 0.35);
    vec2 d2 = uv - vec2(0.5, 0.45 + cos(iTime) * 0.25);
    vec2 d3 = uv - vec2(0.35 + cos(iTime) * 0.25 , 0.25);

    float temp1 = inverseSquare(d1,0.2);
    float temp2 = inverseSquare(d2,0.2);
    float temp3 = inverseSquare(d3,0.2);

    float temp = abs(temp1 - temp2 + temp3)/3.;
    float line = abs(fract(30.*temp - 0.5) - 0.5)/ fwidth(30.* temp);
 	
    
    // Output to screen
    fragColor = vec4(vec3(line), 1.0);;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
