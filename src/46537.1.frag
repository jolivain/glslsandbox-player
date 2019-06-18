/*
 * Original shader from: https://www.shadertoy.com/view/XddfzN
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
#define pi  3.14159
#define tau 6.28318
#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a)) // col1a col1b col2a col2b

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

const float timeDiv = 5.5;

float voronoi(vec2 uv) 
{
    vec2 cell = floor(uv);
    vec2 frac = fract(uv);
	float ret = 1.0;
    float change = iTime / timeDiv;

    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <=1; j++) {
        	vec2 neighbor = vec2(float(i), float(j));
            vec2 rand = random2(cell + neighbor);
            float t = iTime *floor(sin(iTime));
            rand = 0.5 + 0.5 * sin(change * 4. + 2. * pi * rand);
            vec2 toCenter = neighbor + rand - frac;
            ret = min(ret, max(abs(toCenter.x), abs(toCenter.y)));
        }
    }
    
    return ret;
}

vec2 gradient(in vec2 x, float thickness)
{
	vec2 h = vec2(thickness, 0.);
    return vec2(voronoi(x + h.xy) - voronoi(x - h.xy),
               voronoi(x + h.yx) - voronoi(x - h.yx)) / (.9 * h.x);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    uv *= 3.85;
    
    float val = voronoi(uv) / length(gradient(uv, .0235));
    float colVal = pow(val, 3.) *3.9;
    
    fragColor.rgb = mix( vec3(0.86+colVal, 0.86+colVal, 0.86+colVal), 
                        vec3(0.6, 0.6, 0.6),
                        clamp(0.5, 0.5, 0.5));

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
