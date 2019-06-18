/*
 * Original shader from: https://www.shadertoy.com/view/XtyGR1
 */

#extension GL_OES_standard_derivatives : enable

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
// Fixed and optimized version of sillsm's shader (https://www.shadertoy.com/view/XtyGzh)


// Copyright Max Sills 2016, licensed under the MIT license.
//
// Inspired by Knighty's using base n encodings to explore
// n-ary IFS. Bounding volumes are trash.


// iq: I fixed and optimized the original shader. The idea of recursing a tree without a stack 
// is a really good one. In the context of raymarching, the pruning can be done also based on a 
// screen space pixel coverage threshold, but it's still too slow (tried a few months ago for 
// bushes). Still, I made this variation on sillsm's shader for bug fixing it and for further study.
//
// Enable the define below in order to see the true distance field (very slow).


//#define TRUE_DISTANCE


#define kDepth 7
#define kBranches 3
#define kMaxDepth 2187 // branches ^ depth

//--------------------------------------------------------------------------

mat3 matRotate(float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat3( c, s, 0, -s, c, 0, 0, 0, 1);
}

mat3 matTranslate( float x, float y )
{
    return mat3( 1, 0, 0, 0, 1, 0, -x, -y, 1 );
}

float sdBranch( vec2 p, float w1, float w2, float l )
{
    float h = clamp( p.y/l, 0.0, 1.0 );
	float d = length( p - vec2(0.0,l*h) );
    return d - mix( w1, w2, h );
}

//--------------------------------------------------------------------------

float map( vec2 pos )
{
    const float len = 3.2;
    const float wid = 0.3;
    const float lenf = 0.6;
    const float widf = 0.4;
    
    float d = sdBranch( pos, wid, wid*widf, len );
    
    int c = 0;
    for( int count=0; count < kMaxDepth; count++ )
    {
        int off = kMaxDepth;
    	vec2 pt_n = pos;
        
        float l = len;
        float w = wid;
        
      	for( int i=1; i<=kDepth; i++ )
      	{
            l *= lenf;
            w *= widf;

            off /= kBranches; 
            int dec = c / off;
        	int path = dec - kBranches*(dec/kBranches);
          
            mat3 mx;
	    	if( path == 0 )
           	{
		  		mx = matRotate(0.75 + 0.25*sin(iTime-1.0)) * matTranslate( 0.0,0.4*l/lenf);
	    	}
        	else if( path == 1 )
            {
          		mx = matRotate(-0.6 + 0.21*sin(iTime)) * matTranslate(0.0,0.6*l/lenf);
	    	}
	    	else
            {
          		mx = matRotate(0.23*sin(iTime+1.)) * matTranslate(0.0,1.0*l/lenf);
	    	}
            pt_n = (mx * vec3(pt_n,1)).xy;

            
        
        	// bounding sphere test
            float y = length( pt_n - vec2(0.0, l) );
            #ifdef TRUE_DISTANCE
            if( y-1.4*l > d   ) { c += off-1; break; }
            #else
       		if( y-1.4*l > 0.0 ) { c += off-1; break; }
            #endif

            
            d = min( d, sdBranch( pt_n, w, w*widf, l ) );
     	}
        
    	c++;
    	if( c > kMaxDepth ) break;
	}
    
   	return d;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // coordinate system
    vec2  uv = (-iResolution.xy + 2.0*fragCoord.xy) / iResolution.y;
    float px = 2.0/iResolution.y;

    // frame in screen
    uv = uv*4.0 + vec2(0.0,3.5);
    px = px*4.0;
   
    
    // compute
    float d = map( uv );
    
    
    
    // shape
    vec3 cola = vec3( smoothstep( 0.0, 2.0*px, d ) );
    
    // distance field
    vec3 colb = vec3( pow(abs(d),0.4)*0.5 + 0.015*sin( 40.0*d ) );
    
   	// derivatives
    #if 1
        vec2 der = vec2( dFdx(d), dFdy(d) )/px;
    #else
        float eps = 0.1/iResolution.y;
        vec2 der = vec2( map(uv+vec2(eps,0.0))-d,map(uv+vec2(0.0,eps))-d) /eps;
    #endif
    vec3 colc = vec3(0.5+0.5*der.x,0.5+0.5*der.y,0.0) * clamp(abs(d)*8.0+0.2,0.0,1.0);
      

    // final color
    float t = fract( 0.2 + iTime/11.0 );    
    
    vec3 col = mix( colc, cola, smoothstep( 0.00, 0.05, t ) );
         col = mix( col , colb, smoothstep( 0.30, 0.35, t ) );
         col = mix( col , colc, smoothstep( 0.60, 0.65, t ) );
    
    fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
