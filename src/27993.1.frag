////based on  https://www.shadertoy.com/view/Ml2GWy

// Created by inigo quilez - iq/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

	vec2 uv = 256.0 * ( gl_FragCoord.xy / resolution.x ) + vec2(time) ;

	
	vec3 col = vec3(0.0);
	
        for( int i=0; i<4; i++ )
	{
		uv/=2.0;
		
		vec2 a = floor(uv);        
		vec2 b = fract(uv);
 
		vec4 w = fract((sin(a.x*7.0+31.0*a.y + 0.01*time)+vec4(0.035,0.01,0.0,0.7))*13.545317); // randoms       
         
		col += smoothstep(0.45,0.55,w.w) *               // intensity
			vec3(sqrt( 16.0*b.x*b.y*(1.0-b.x)*(1.0-b.y))); // pattern	

		//col = pow( 0.5 * col, vec3(1.0,1.0,0.7) );    // contrast and color shape
		
		//col.r = pow( 0.8 * col.r ,  .9 );
		//col.g = pow( 1.0 * col.g , 1.0 );
		//col.b = pow( 1.0 * col.b , 0.7 );
	
		col = pow( vec3(0.82,1.0,.91) * col, vec3(0.8,1.0,.7) );    // contrast and color shape
	}
	col += vec3(0.1,0.2,0.15);
	gl_FragColor = vec4( col , 1.0 );
}
