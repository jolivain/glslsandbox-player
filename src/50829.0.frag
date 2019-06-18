/*
 * Original shader from: https://www.shadertoy.com/view/MtGfWK
 */

#extension GL_OES_standard_derivatives : enable

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
// Author: ocb

/*****************************************************************************/
/* dFdx Terrain Gen
/* First try to use dFdx() and fwidth()
/* dFdx/dFdy is used to find local normal on a value noise.
/* fwidth() is used as an indicator of slope (ex. to avoid forest or snow on steep slope
/*****************************************************************************/


#define R iResolution
#define STEP 9.

float H2(in vec2 st) { 						
    return fract(sin(dot(st,vec2(12.9898,8.233))) * 43758.5453123);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float ti = iTime*.2;
    vec2 uv = (2.*fragCoord-R.xy)/R.y;
    uv.y += ti+2.;
    float h = 0., hsea = 0.;
    vec3 col = vec3(.5);
    vec3 lit = normalize(vec3(.5,.0,1.));
    
	float a = 1., Hz = 1., m = 1.;					// fbm
    vec2 d = vec2(1.,0.);
    for(float i=1.;i<=STEP; i++){
        vec2 e = floor(uv*Hz), f = fract(uv*Hz);
        f = smoothstep(0.,1.,f);
        h += mix(
            	mix(H2(e),H2(e+d.xy),f.x)*a,
            	mix(H2(e+d.yx),H2(e+d.xx),f.x)*a,
            	f.y);
        
        a *= .3+.1*h+.015*i;
        //a *= .5;
        Hz *= 2.;
        m += a;
        
        hsea += .1*h;		// kind of integrated h to smooth the sea bottom
    }
    h/=m;
    h = h-.5;
    
    

    float below = step(h,0.), above = 1.-below;		// above and below sea level
    float fwdh = R.x*fwidth(h);		// fwidth is used to reduce or avoid snow or trees on steep slope

    col.b += .4*below;								// sea water
    col.g += .6*smoothstep(.4,.8,hsea)*below;
        
    col += vec3(smoothstep(.2,.4-.02*fwdh,h));		// snow
    
    col -= vec3(.3-h,.25,.35)*(1.-smoothstep(.1,.2,h))*above*(1.-smoothstep(1.,6.,(h*h+.9)*fwdh));	// forest

    float dx= R.x*dFdx(h)*above + R.x*dFdx(hsea)*below;			// derivatives
    float dy= R.y*dFdy(h)*above + R.y*dFdy(hsea)*below;
    vec3 n = normalize(cross(vec3(1.,dx,0.),vec3(0.,dy,1.)));	// local normal
    float shad = (.5+.5*dot(n,-lit));							// shadowing
    col *= shad*smoothstep(-.3,.0,h)*(.2+.8*above);
    col += vec3(.2,.15,.0)*(shad-.5)*above;				// warmer the light on the sunny side 

    col += .03*max(0.,-dx)*fwdh*below*smoothstep(-.02,0.,h)*shad;	// wave foam along coast
    
	fragColor = vec4(1.7*col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
