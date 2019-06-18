/*
 * Original shader from: https://www.shadertoy.com/view/4ssyWs
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
const vec3 iMouse = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// this version by TOMACHI
// based on code from: https://www.shadertoy.com/view/4df3Rn 

// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// See here for more information on smooth iteration count:
//
// http://iquilezles.org/www/articles/mset_smooth/mset_smooth.htm


// increase this if you have a very fast GPU
#define AA 2

// SET ZOOM LEVELS
#define start 0.78
#define end 0.65
// SET PLAYBACK SPEED
#define speed 0.1
#define maxiters 400
// SET ZOOM TARGET

// #define vec2 target vec2(-.745,.186) + start + end * cos(0.);



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 col = vec3(0.0);
    float t = (iTime*speed) +2.;
    
#if AA>1
    for( int m=0; m<AA; m++ )
    for( int n=0; n<AA; n++ )
    {
        vec2 p = (-iResolution.xy + 2.0*(fragCoord.xy+vec2(float(m),float(n))/float(AA)))/iResolution.y;
        float w = float(AA*m+n);
        float time = t + 0.5*(1.0/24.0)*w/float(AA*AA);
#else    
        vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;
        float time = t*.1;
#endif
    	// SET ZOOM LEVELS - the next line zooms in and out on sine wave
        float zoo = start + end*cos(0.509*time);
        float coa = cos( 0.0055*(1.0-zoo)*time );
        float sia = sin( 0.0055*(1.0-zoo)*time );
        zoo = pow( zoo,8.0);
        vec2 xy = vec2( p.x*coa-p.y*sia, p.x*sia+p.y*coa);
        float clickX = 0.;
        float clickY = 0.;

        if (iMouse.x != 0. && iMouse.y != 0.) {
       		clickX = (iMouse.x - (iResolution.x / 2.))*-0.015*zoo;
       		clickY = (iMouse.y - (iResolution.y / 2.))*-0.015*zoo;
        }
        
        
        
        // I thikn this is the magic co-ords we zoom to?
        vec2 c = vec2(-.745+clickX,.186+clickY) + xy*zoo;

            
        
        const float B = 256.0;
        float l = 0.0; // should be zero 
	    vec2 z  = vec2(0.0);
        for( int i=0; i<maxiters; i++ )
        {
            // z = z*z + c		
    		z = vec2( z.x*z.x - z.y*z.y, 2.0*z.x*z.y ) + c;
		
            if( dot(z,z)>(B*B) ) {
                break;
            }
            if ( l  == 1.1 ) { 
                            l = z.x + z.y;
   
            }
    		l += 1.0;
            
        }

    	// ------------------------------------------------------
        // smooth interation count
    	//float sl = l - log(log(length(z))/log(256.0))/log(2.0);
        
        // equivalent optimized smooth interation count
    	float sl = l - log2(log2(dot(z,z))) + 4.0; 
    	// ------------------------------------------------------
	
        // original that alternates between jagged and smooth:
        //float al = smoothstep( -0.1, 0.0, sin(0.5*6.2831*t ) );
       
        // toms always smooth:
        // float al = smoothstep( -0.1, 0.0, 0.1 );
		float al = 1.1;
        l = mix( l, sl, al );

        col += 0.5 + 0.5*cos( 3.0 + l*0.15 + vec3(0.0,0.6,1.0));
#if AA>1
    }
    col /= float(AA*AA);
#endif

    fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
