/*
 * Original shader from: https://www.shadertoy.com/view/MsdBDn
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
const vec3 YELLOW = vec3(.9921, .898, .4823);
const vec3 RED = vec3(.5294, .1294, .2862);
const vec3 PINK = vec3(.9764, .7568, .8705);
const vec3 BLACK = vec3(0.);
const vec3 WHITE = vec3(1.);

const vec3 DARK_YELLOW_1 = vec3(.949, .8627, .2313);
const vec3 DARK_YELLOW_2 = vec3(.945, .9058, .6627);
const vec3 LIGHT_YELLOW_1 = vec3(.9921, .9843, .5019);
const vec3 LIGHT_YELLOW_2 = vec3(.9372, .9294, .8313);

#define saturate(x) clamp(x, 0., 1.)

float circle(vec2 uv, vec2 center, float r, float sm)
{
    return 1. - smoothstep(r - sm, r, distance(uv, center));
}

float rectangle(vec2 uv, vec2 center, vec2 size, float sm)
{
    vec2 lb = center - size * .5;
    vec2 rt = center + size * .5;
    vec2 lbRes = smoothstep(lb, lb + sm, uv);
    vec2 rtRes = 1. - smoothstep(rt - sm, rt, uv);
    return lbRes.x * lbRes.y * rtRes.x * rtRes.y;
}

//sidesToCut -> radius percentage [l, b, r, t]
float circleCut(vec2 uv, vec2 center, float r, vec4 sidesToCut, float sm)
{
    float c = circle(uv, center, r, sm);
    
    vec2 posToCut = center - (1. - sidesToCut.xy) * r;
    vec2 lb = smoothstep(posToCut, posToCut + sm, uv);
    posToCut = center + (1. - sidesToCut.zw) * r;
    vec2 rt = 1. - smoothstep(posToCut - sm, posToCut, uv);    
    return c * lb.x * lb.y * rt.x * rt.y;
}

//range and target -> [minX, minY, maxX, maxY]
vec2 map(vec2 v, vec4 range, vec4 target)
{
    return ((v - range.xy) / (range.zw - range.xy)) * (target.zw - target.xy) + target.xy;
}

vec2 map01(vec2 v, vec4 range) 
{
	return map(v, range, vec4(.0, .0, 1., 1.));
}

vec4 head(vec2 uv)
{
    float outline = circle(uv, vec2(.0), .45, .005);
    float inside = circle(uv, vec2(.0), .425, .005);
    float shadow = circle(uv, vec2(.015, -.015), .49, .12);
    
    vec3 col = YELLOW * inside;
	return vec4(col, saturate(outline + shadow));
}

vec4 eye(vec2 uv)
{
    uv -= .5;
    
    float outline = circleCut(uv, vec2(0.), .5, vec4(0., .65, 0., 0.), .012);
    float inside = circleCut(uv, vec2(0.), .424, vec4(0., .73, 0., 0.), .012);
    float pupil = circle(uv, vec2(.27 , .25), .15, .012);
    
	vec3 col = vec3(inside - pupil);
    return vec4(col, outline);
}

vec4 mouth(vec2 uv)
{
    uv -= .5;
    uv.x += .15 * uv.y ;
    
    float outline = circleCut(uv, vec2(0.), .5, vec4(0., .0, 0., 1.15), .005);
    float inside = circleCut(uv, vec2(0.), .465, vec4(0., .0, 0., 1.21), .005);
    float upperLip = rectangle(uv, vec2(-.009, -.08), vec2(1.02, .033), .005);
    float tongue = circle(uv, vec2(.12 , -.5), .23, .005);
        
    vec3 col = RED * inside;
    col = mix(col, PINK, tongue * inside);
    return vec4(col, saturate(outline + upperLip));
}

vec3 background(vec2 uv)
{
    float angle = atan(uv.y, uv.x);
    float dist = length(uv) * 2.;
    
    vec3 c1 = mix(DARK_YELLOW_2, DARK_YELLOW_1, dist);
    vec3 c2 = mix(LIGHT_YELLOW_2, LIGHT_YELLOW_1, dist);
    
    float v = cos(iTime + angle * 8.0) * .5 + .5;
    return mix(c1, c2, smoothstep(0.48, 0.52, v));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{    
    vec2 uv = fragCoord / iResolution.xy;
    const float ratio = 16./9.;
    
    uv -= .5;
    uv.x *= iResolution.x / iResolution.y;
    
    vec4 h = head(uv);
    vec4 le = eye(map01(uv, vec4(-.207 * ratio, -.08, -.07 * ratio, .25)));
    vec4 re = eye(map01(uv, vec4(.0, -.08, .155 * ratio, .25)));
    vec4 m = mouth(map01(uv, vec4(-.19 * ratio, -.37, .165 * ratio, .35)));
    
    vec3 col = background(uv);
    col.rgb = mix(col, h.rgb, h.a);
    col.rgb = mix(col, le.rgb, le.a);
    col.rgb = mix(col, re.rgb, re.a);
	col.rgb = mix(col, m.rgb, m.a);
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
