/*
 * Original shader from: https://www.shadertoy.com/view/tls3Dl
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
mat2 rot(float a)
{
  float s = sin(a);
  float c = cos(a);
  return mat2(c, s, -s, c);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 pos = (fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float d = 3.0-length(1.5*pos)*4.0;
    pos*=rot(pos.x*4.0+iTime+log(d));
    pos*=0.5;
    pos+=vec2(0.5);
	float vv = (pos.y*pos.y*pos.y*d);
	vv+=sin(pos.x*3.14);
	float v = sin(sin(pos.x*15.0)*4.0+(vv) * 2.5 + iTime * 2.0);
	fragColor = vec4( v*0.54, .25+.2*v, 0.3, 1.0 )*d;
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
