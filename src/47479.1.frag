/*
 * Original shader from: https://www.shadertoy.com/view/4dyfWW
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
float random (in vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
float noise (in vec2 st)
{
	vec2 i = floor(st);
	vec2 f = fract(st);
	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));
	vec2 u = f*f*(3.0-2.0*f);
	return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
/*
vec2 rotate(vec2 v, float a)
{
	vec2 r = vec2(cos(a), sin(a));
	return vec2(r.x * v.x - r.y * v.y, r.y * v.x + r.x * v.y);
}
*/
mat2 rot(float a)
{
    vec2 r = vec2(cos(a), sin(a));
    return mat2(r.x, r.y, -r.y, r.x);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 pos = (2.*fragCoord - iResolution.xy ) / iResolution.y;
	//pos = rotate(pos, -1.0 * length(pos) + 2.0 / length(pos) + 2.0 * iTime);
	pos *= rot(length(pos) - 2.0 / length(pos) - 2.0 * iTime);
    vec3 col = 0.2 * vec3(0.2 * (1.0 + 0.5 * sin(4.0 * pos.x)), 0.4, 0.8 * (1.0 + 0.25 * sin(iTime))) * (dot(pos, pos) + 0.01 / dot(pos, pos));
    float light = 0.;
    for(int i = 0; i < 5; i++)
        light += pow(0.5, float(i)) * noise(pow(2.0, float(i)) * pos + 0.1 * iTime);
    col += 0.4 * vec3(0.2, 0.5, 1.0) * light;
    /*
    for(int i = 0; i < 5; i++)
        col += 0.4 * vec3(0.2, 0.5, 1.0) * pow(0.5, float(i))  * noise(2.0 * float(i) * pos + 0.1 * iTime);
    */
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
