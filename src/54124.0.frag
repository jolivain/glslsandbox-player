/*
 * Original shader from: https://www.shadertoy.com/view/MlScRV
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
float merge(float d1, float d2)
{
    return min(d1, d2);
}

float sub(float d1, float d2)
{
    return max(-d1, d2);
}

float sdSphere(vec2 p, float r)
{
	return length(p) - r;
}

//***/
float sdTriangle( in vec2 p0, in vec2 p1, in vec2 p2, in vec2 p )
{
	vec2 e0 = p1 - p0;
	vec2 e1 = p2 - p1;
	vec2 e2 = p0 - p2;

	vec2 v0 = p - p0;
	vec2 v1 = p - p1;
	vec2 v2 = p - p2;

	vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
	vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
	vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
    
    float s = sign( e0.x*e2.y - e0.y*e2.x );
    vec2 d = min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
                       vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
                       vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) ));

	return -sqrt(d.x)*sign(d.y);
}

float mapleLeafSDF(vec2 p, float r)
{
    p.x = -abs(p.x);
    p.y-=0.045;
    float s = sdSphere(p, 0.65);
    float t = sdTriangle(vec2(0.045,-0.4), vec2(1.0,-0.56), vec2(0.06,-1.0), p) - r; 
    t = merge(t, sdTriangle(vec2(-0.045,-0.4), vec2(-1.0,-0.56), vec2(-0.06,-1.0), p) - r);	
    t = merge(t, sdTriangle(vec2(-0.35,-0.35), vec2(-0.75,0.0), vec2(-1.0,-1.6), p) - r);  	
    t = merge(t, sdTriangle(vec2(-0.57,0.0), vec2(-1.0,1.0), vec2(-1.5,-0.5), p) - r);    
    t = merge(t, sdTriangle(vec2(-0.42,0.15), vec2(-1.2,0.35), vec2(-0.3,1.0), p) - r);   
    t = merge(t, sdTriangle(vec2(-0.21,0.05), vec2(-1.0,1.0), vec2(-0.35,1.0), p) - r);   
    t = merge(t, sdTriangle(vec2(-0.12,0.35), vec2(-1.0,0.75), vec2(0.25,1.0), p) - r);  
    return sub(t,s);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy / iResolution.xy) * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    uv *=1.2;
    
    float wave = 0.05*sin((iTime+uv.x)*2.0)/2.0*(uv.x+1.75);    
    uv.y += wave;
    
    vec3 red = vec3(.835, .169, .118);
    vec3 wh = vec3(1.0);
    vec3 bl = vec3(0.2);
    vec3 bg;
    vec3 grey = vec3(0.3);
    vec4 col;
    
    bg = mix(grey, bl, length(uv)-3.)+ wave*0.8;
    /*** Draw ***/    
    col.rgb = (length(uv.x) > .8 || mapleLeafSDF(uv, 0.03) < 0.0) ? red : wh;
    col.rgb = (length(uv.y) > 1. || length(uv.x) > 1.8) ?  bg : col.rgb + wave*0.7;
 
    fragColor = col;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
