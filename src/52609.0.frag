/*
 * Original shader from: https://www.shadertoy.com/view/MdGGRW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
vec4 cellColor = vec4(0.0,0.0,0.0,0.0);
vec3 cellPosition = vec3(0.0,0.0,0.0);
float cellRandom = 0.0, onOffRandom = 0.0;


float random (vec3 i){
	return fract(sin(dot(i.xyz,vec3(4154895.34636,8616.15646,26968.489)))*968423.156);
}

vec4 getColorFromFloat (float i){
    i *= 2000.0;
    return vec4(normalize(vec3(abs(sin(i+radians(45.0))),abs(sin(i+radians(90.0))),abs(sin(i)))),1.0);
}

vec3 getPositionFromFloat (float i){
    i *= 2000.0;
    return vec3(normalize(vec3(abs(sin(i+radians(45.0))),abs(sin(i+radians(90.0))),abs(sin(i)))))-vec3(0.5,0.5,0.5);
}

float map(vec3 p){
    //p *= 1.0;
    cellRandom = random(floor((p*0.5)+0.0*vec3(0.5,0.5,0.5)));
    onOffRandom = random(vec3(5.0,2.0,200.0)+floor((p*0.5)+0.0*vec3(0.5,0.5,0.5)));
    cellColor = getColorFromFloat(cellRandom);
    cellPosition = getPositionFromFloat(cellRandom);
    p.x = mod(p.x, 2.0);
    p.y = mod(p.y, 2.0);
    p.z = mod(p.z, 2.0);
    p += 1.0*cellPosition.xyz;
    p += p.xyz*sin(10.0*iTime+onOffRandom*300.0)*			0.05;
    p += p.yzx*cos(10.0*iTime+onOffRandom*300.0+1561.355)*	0.05;
    if(onOffRandom>0.5){
    	return length(p-vec3(1.0,1.0,1.0)) - 0.2*cellRandom+0.02*(sin(iTime*20.0*onOffRandom+cellRandom*2000.0));
    } else {
        return 1.0;
    }
}

float trace(vec3 o, vec3 r){
    float t = 0.5;
    const int maxSteps = 48;
    for (int i = 0; i < maxSteps; i++){ 
        vec3 p = o + r * t;
        float d = map(p);
        t += d*0.35;
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv*2.0 -1.0;
    uv.x *= iResolution.x / iResolution.y;
    vec3 r = normalize(vec3(uv, 1.0));
    r = r*0.1+cross(r,vec3(0.0,1.0,-1.0));
    vec3 o = vec3(0.);
    o.z = 8.5*iTime;
    o += vec3(0.52,0.5,-3.0);

    float t = trace(o,r);
    float fog = 1.0 / (1.0 + t * t * 0.1);
    vec3 fc = vec3(fog);

	fragColor = vec4(fc*vec3(28.0,10.0+-1.0*length(uv+vec2(0.0,1.0)),6.4)*0.6/length(uv+vec2(0.0,1.0))*1.0,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
