// Port of ShaderToy https://www.shadertoy.com/view/XlX3DM
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// ShaderToy globals
#define iTime time
#define iResolution resolution

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Created by S.Guillitte 

void mainImage( out vec4 z, in vec2 w )
{
    float k=0.;
    vec3 d = vec3(w/iResolution,1.0)-.5, o = d, c=k*d, p;

    for( int i=0; i<99; i++ ) {

        p = o+sin(iTime*.1);
		for (int j = 0; j < 10; j++) 

        	p = abs(p.zyx-.4) -.7,k += exp(-6. * abs(dot(p,o)));

		k/=3.;
        o += d *.05*k;
        c = .97*c + .1*k*vec3(k*k,k,1);
    }
    c =  .4 *log(1.+c);
    z.rgb = c;
}

void main( void ) {
	gl_FragColor = vec4(0,1,0,1);
	mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
