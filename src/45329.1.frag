/*
 * Original shader from: https://www.shadertoy.com/view/MdB3Dw
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
// The MIT License
// Copyright © 2014 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



// Analytic motion blur, for spheres
//
// (Linearly) Moving Spheres vs ray intersection test. The resulting equation is a double
// quadratic in two parameters, distance (as usual in regular raytracing) and time. It's sort
// of space-time raytracing if you wish.
// 
// The quadratic(s) are solved to get the time interval of the intersection, and the distances.
// Shading is performed only once at the middle of the time interval.
//
// This method allows for (virtually) inexpensive motion blur, without time supersampling.
//
// Uncomment the define bellow to have a side by side comparison with brute force supersampled 
// motion blur. Most of the look differences come from the choice of a single shading instant/point
// rather than the full sequence. I think I might have done some small mistake somewhere in the 
// maths though.
//
// 2D case here: https://www.shadertoy.com/view/MdB3Rc


#define USE_ANALYTICAL_MBLUR

// intersect a MOVING sphere
vec2 iSphere( in vec3 ro, in vec3 rd, in vec4 sp, in vec3 ve, out vec3 nor )
{
    float t = -1.0;
	float s = 0.0;
	nor = vec3(0.0);
	
	vec3  rc = ro - sp.xyz;
	float A = dot(rc,rd);
	float B = dot(rc,rc) - sp.w*sp.w;
	float C = dot(ve,ve);
	float D = dot(rc,ve);
	float E = dot(rd,ve);
	float aab = A*A - B;
	float eec = E*E - C;
	float aed = A*E - D;
	float k = aed*aed - eec*aab;
		
	if( k>0.0 )
	{
		k = sqrt(k);
		float hb = (aed - k)/eec;
		float ha = (aed + k)/eec;
		
		float ta = max( 0.0, ha );
		float tb = min( 1.0, hb );
		
		if( ta < tb )
		{
            ta = 0.5*(ta+tb);			
            t = -(A-E*ta) - sqrt( (A-E*ta)*(A-E*ta) - (B+C*ta*ta-2.0*D*ta) );
            nor = normalize( (ro+rd*t) - (sp.xyz+ta*ve ) );
            s = 2.0*(tb - ta);
		}
	}

	return vec2(t,s);
}

// intersect a STATIC sphere
float iSphere( in vec3 ro, in vec3 rd, in vec4 sp, out vec3 nor )
{
    float t = -1.0;
	nor = vec3(0.0);
	
	vec3  rc = ro - sp.xyz;
	float b =  dot(rc,rd);
	float c =  dot(rc,rc) - sp.w*sp.w;
	float k = b*b - c;
	if( k>0.0 )
	{
		t = -b - sqrt(k);
		nor = normalize( (ro+rd*t) - sp.xyz );
	}

	return t;
}

vec3 getPosition( float time ) { return vec3(     2.5*sin(8.0*time), 0.0,      1.0*cos(8.0*time) ); }
vec3 getVelocity( float time ) { return vec3( 8.0*2.5*cos(8.0*time), 0.0, -8.0*1.0*sin(8.0*time) ); }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 q = fragCoord.xy / iResolution.xy;
	vec2 p = -1.0 + 2.0*q;
	p.x *= iResolution.x/iResolution.y;	

	// camera
	vec3  ro = vec3(0.0,0.0,4.0);
    vec3  rd = normalize( vec3(p.xy,-2.0) );
	
    // sphere	
	
	// render
	vec3  col = vec3(0.0);
	
	#ifdef USE_ANALYTICAL_MBLUR
	
    //---------------------------------------------------	
    // render with analytical motion blur
    //---------------------------------------------------	
	vec3  ce = getPosition( iTime );
	vec3  ve = getVelocity( iTime );
    	
	col = vec3(0.25) + 0.3*rd.y;
	vec3 nor = vec3(0.0);
	vec3 tot = vec3(0.25) + 0.3*rd.y;
    vec2 res = iSphere( ro, rd, vec4(ce,1.0), ve/24.0, nor );
	float t = res.x;
	if( t>0.0 )
	{
		float dif = clamp( dot(nor,vec3(0.5703)), 0.0, 1.0 );
		float amb = 0.5 + 0.5*nor.y;
		vec3  lcol = dif*vec3(1.0,0.9,0.3) + amb*vec3(0.1,0.2,0.3);
		col = mix( tot, lcol, res.y );
	}
	
	#else
	
    //---------------------------------------------------	
    // render with brute force sampled motion blur
    //---------------------------------------------------	
	
    #define NUMSAMPLES 32
	vec3 tot = vec3(0.0);
	for( int i=0; i<NUMSAMPLES; i++ )
	{
		float fi = float(i)/float(NUMSAMPLES);
        vec3  ce = getPosition( iTime + fi/24.0 );
        vec3 nor = vec3(0.0);
        vec3 tmp = vec3(0.25) + 0.3*rd.y;
        float t = iSphere( ro, rd, vec4(ce,1.0), nor );
        if( t>0.0 )
        {
            float dif = clamp( dot(nor,vec3(0.5703)), 0.0, 1.0 );
            float amb = 0.5 + 0.5*nor.y;
            tmp = dif*vec3(1.0,0.9,0.3) + amb*vec3(0.1,0.2,0.3);
        }
        col += tmp;
	}		
	col /= float(NUMSAMPLES);
		
    #endif
	
	col = pow( clamp(col,0.0,1.0), vec3(0.45) );

	fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
