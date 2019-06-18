/*
 * Original shader from: https://www.shadertoy.com/view/XlBGRz
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
#define MOTION_BLUR

float lineSegDist(vec2 uv, vec2 lineDir, vec2 linePoint, float r) {
    vec2 ba = -lineDir * r;
    vec2 pa = uv - linePoint + ba;
    ba *= 2.0;
    return length(pa - ba*clamp( dot(pa, ba)/dot(ba, ba), 0.0, 1.0));
}

float aa(float dist, float threshold)
{
    float pixelSize = 2.0 / iResolution.y;
	return dist < threshold-pixelSize ? 0.0 : min(1.0, 1.0-(threshold-dist)/pixelSize);
}

float scene(vec2 uv, float t)
{
    vec2 p = vec2(sin(t*40.3), cos(t*10.0)*0.4);

    vec2 v = normalize(vec2(sin(t*8.0), cos(t*8.0)));
	vec2 p2 = vec2(sin(1.0+t*50.0), cos(0.7+t*24.0)*0.4);

    vec2 p3 = vec2(sin(t*37.3+2.0)*1.2, sin(t*2.0)*0.2+cos(1.0+t*21.0)*0.4);

    float r = (0.3);
    vec2 p4 = vec2(cos(t*60.0), sin(t*64.0)) * r*2.5;
    vec2 p5 = vec2(-cos(t*60.0+3.14159*2.0*0.3333), sin(t*65.0+3.14159*2.0*0.3333)) * r*2.0;
    vec2 p6 = vec2(cos(t*50.0+3.14159*2.0*0.6666), sin(t*55.0+3.14159*2.0*0.6666)) * r;
    vec2 p7 = vec2(cos(t*181.0)*0.03, cos(t*81.4)*0.02+sin(t*42.0)*0.02);

    return min(aa(length(uv-p6), 0.03*(1.0+0.5*sin(t*50.0+3.14159*2.0*0.6666))),
           min(aa(length(uv-p5), 0.04*(1.0+0.5*-sin(t*60.0+3.14159*2.0*0.3333))),
           min(aa(length(uv-p4), 0.05*(1.0+0.5*sin(t*60.0))),
           min(aa(length(uv-p3), 0.03),
           min(aa(length(uv-p), 0.05),
           min(aa(abs(length(uv-p7)-0.18-0.01*cos(t*150.0)), 0.01+0.0001*tan(0.1*t)),
               aa(lineSegDist(uv, v, p2, 0.5), 0.05)
              ))))));
}

float hash( vec2 v ) {
    return fract(sin(mod(dot(v.xy,vec2(12.9898,78.233)),3.14) * 43758.5453));
    //return texture(iChannel0, v, 0.0).r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = vec2(iResolution.x/iResolution.y, 1.0) * (-1.0 + 2.0*fragCoord.xy / iResolution.xy);
	#ifdef MOTION_BLUR
	    fragColor = vec4(0.0);
        for (float i=0.0; i<12.0; i++) {
            float r = hash(mod(fragCoord+vec2(i,0.0), 64.0) / 64.0);
            fragColor += (1.0-scene(uv, iTime+(1.0/58.5)*((i+r)/12.0))) * vec4(abs(uv)+0.3,0.5+0.5*sin(20.0*iTime),1.0);
        }
        fragColor /= 12.0;
    #else
		fragColor = (1.0-scene(uv, iTime)) * vec4(abs(uv)+0.3,0.5+0.5*sin(iTime),1.0);
    #endif
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
