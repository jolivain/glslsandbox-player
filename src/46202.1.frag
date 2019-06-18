/*
 * Original shader from: https://www.shadertoy.com/view/MsycRV
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
float gradient(vec2 point, vec2 origin, vec2 dir) {
    return clamp(dot(point - origin, dir) + 0.5, 0.0, 1.0);
}

float plasma(vec2 p, float offset) {
    vec2 point = p * 2.0;
    float plsm = 1.0;
    for(float i = 0.0; i < 30.0; i++) {
        float t1 = iTime * 0.04 + offset;
        float t2 = iTime * 0.08 + offset;
        vec2 origin = vec2(cos(i+t1), sin(i+t1));
        vec2 dir = vec2(cos(i*3.0 + t2), sin(i*2.0 + t2));
        plsm = abs(plsm - gradient(point, origin, dir));
    }
    return plsm;
}

vec2 rotate(vec2 point, float angle) {
    return vec2(  point.x * cos(angle) + point.y * sin(angle),
                - point.x * sin(angle) + point.y * cos(angle) );
}

float smin( float a, float b, float k )
{
    // if (k == 0.0) return min(a,b);
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float hexpart(vec2 p) {
    vec2 point = p + vec2(0.5, 0.0);
    float x = point.x - floor(point.x);
    float fac = 0.289;
    float yy = point.y*fac + mod(floor(point.x), 2.0)*0.5;
    float y = yy - floor(yy);
    return max(abs(x - 0.5) - 0.08, abs(y-0.5)/fac - 0.6);
}

float hexagons(vec2 point) {
    return smin(smin(
        hexpart(point),
        hexpart(rotate(point, 3.141*1.0/3.0)), 0.1),
        hexpart(rotate(point, 3.141*2.0/3.0)), 0.1
    );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 framecoords = (fragCoord-iResolution.xy/2.0)/iResolution.yy;
    
    vec2 uv = rotate(framecoords, cos(iTime*0.054)*5.0+cos(iTime*0.013)*10.0)*(1.0+cos(iTime*0.67)*0.5);
    uv += vec2(cos(iTime*0.05*2.0), sin(iTime*0.05*3.0))*0.5;
    
    float hexmult = 20.0;
    float hex = hexagons(uv*hexmult);
    
    if ( hex < 0.0) {
        uv += vec2(-0.005,0.005);
    }
	
    float pls = plasma(uv, 0.0);
    float plshighlight = pow(pls, 2.0);
    for (float i = 0.0; i < 2.0; i++) {
        for (float j = 0.0; j < 2.0; j++) {
            vec2 coord = vec2(i,j)*2.0 - 1.0;
            plshighlight += pow(plasma(uv + coord*0.005, 0.0), 2.0);
        }
    }
    plshighlight = 1.0 - pls/sqrt(plshighlight)*2.0;


    // Time varying pixel color
    float col = (1.0-pls)*0.8;
    col += max(0.0,plshighlight)*0.5;
    
    if ( hex < 0.0) {
        hex += hexagons((uv + vec2(-0.005,0.005))*hexmult);
        col *= mix(1.0, -hex*5.0, 0.5);
    }
    // Output to screen
    fragColor = vec4(col, 0.04,0.11,0.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
