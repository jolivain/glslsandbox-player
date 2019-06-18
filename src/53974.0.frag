/*
 * Original shader from: https://www.shadertoy.com/view/wdBSDd
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

mat3 inverse(mat3 m)
{
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

    float b01 =  a22 * a11 - a12 * a21;
    float b11 = -a22 * a10 + a12 * a20;
    float b21 =  a21 * a10 - a11 * a20;

    float det = a00 * b01 + a01 * b11 + a02 * b21;

    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
                b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
                b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

// --------[ Original ShaderToy begins here ]---------- //
float N21(vec2 p) {
	p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

float inRect(vec2 pos, vec2 topLeft, vec2 rightBottom) {
	return step(topLeft.x, pos.x) * step(rightBottom.y, pos.y) * step(-rightBottom.x, -pos.x) * step(-topLeft.y, -pos.y);
}

float inBetween(float x, float a, float b) {
    return step(a, x) * step(-b, -x);
}

float boxLayer(float depth, vec2 uv, float size, float pos) {

    const float fullDepth = 4.0;
    
    vec2 boxCenter = vec2(fullDepth * pos, sin(iTime * 10.0 * (0.3 + 0.7 * N21(vec2(depth, size))) ));
    float boxHalfSize = size * 0.5;
    
    float m = 0.0;

    m = inRect(uv, boxCenter + vec2(-boxHalfSize, boxHalfSize), boxCenter + vec2(boxHalfSize, -boxHalfSize))
    * inRect(uv, vec2(0.0, 1.0), vec2(3.99, -1.0));
	return clamp(m, 0.0, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 inv_resolution = 1.0 / iResolution.xy;
    vec2 uv = fragCoord * inv_resolution.xy;

    // Time varying pixel color
    // vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
	float sWidth = iResolution.x * inv_resolution.y;
    const float barWidthRatio = 0.8;
    float barHeight = 0.06;
    uv.x = uv.x * sWidth;
    mat3 m_s2bar = mat3(vec3(barWidthRatio * sWidth, 0.0, 0.0),
                        vec3(0.0, barWidthRatio * sWidth, 0.0),
                        vec3((1.0 - barWidthRatio) * sWidth * 0.5, 0.5, 1.0));
    vec2 uv_bar = (inverse(m_s2bar) * vec3(uv.xy, 1.0)).xy;
    float isInBaseRect = inRect(uv_bar, vec2(0.0, 0.5 * barHeight), vec2(1.0, -0.5 * barHeight));
    float isInActiveRect = inRect(uv_bar, vec2(0.0, 0.5 * barHeight), vec2(fract(iTime * 0.1), -0.5 * barHeight)); 
    vec3 baseColor = vec3(0.12941, 0.13725, 0.17647);
    // vec3 activeColor = vec3(0.0, uv_bar.x, 0.0);
    vec3 activeColor = mix(vec3(0.2, 0.35294, 0.91373), vec3(0.43529, 0.43529, 0.96078), uv_bar.x);
    vec3 color = vec3(0.0, 0.0, 0.0);
    color = mix(color, baseColor, isInBaseRect);
    color = mix(color, activeColor, isInActiveRect);
    
    mat3 T_bar2top = mat3(
    	vec3(0.5 * barHeight, 0.0, 0.0),
        vec3(0.0, 0.5 * barHeight, 0.0),
		vec3(fract(iTime * 0.1), 0.0, 1.0)
    );

    vec2 topCord = (inverse(T_bar2top) * vec3(uv_bar, 1.0)).xy;
    
    float sizes[10];

    sizes[0] =  0.64443028954883467;
    sizes[1] =  0.5305055282034009;
    sizes[2] =  0.663223756594665;
    sizes[3] =  0.7904855321774765;
    sizes[4] =  0.58575556655444496;
    sizes[5] =  0.4690261013697286;
    sizes[6] =  0.40226518516562614;
    sizes[7] =  0.935630139708542;
    // sizes[8] =  0.30465976518251916;
    // sizes[9] =  0.6511662264743197;

    float inBoxes = 0.0;
    float depthStep = 1.0 / 10.0;
    // for (float j = 0.0; j < 10.0; j++) {
    // 	// float depth = fract(i + iTime * 0.6);
    // 	float depth = j * depthStep;
    //     inBoxes += boxLayer(depth, topCord, sizes[int(j)]);
    // }

    for (float j = 0.0; j < 1.0; j+=0.125) {
    	// float depth = fract(i + iTime * 0.6);
    	float depth = j;
        float pos = fract(j + iTime * 0.6);
        inBoxes += boxLayer(depth, topCord, sizes[int(j * 8.0)], pos);
    }
    color = mix(color, activeColor, clamp(inBoxes, 0.0, 1.0) * inBetween(uv_bar.x, 0.0, 1.0) );

    // Output to screen
    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
