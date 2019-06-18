/*
 * Original shader from: https://www.shadertoy.com/view/MtX3DM
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
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
/*	kali-traps by bergi in 2015
	
	3d plasma fractal ray scrambling and what have you
	and another attempt to plot the surface of the kali set.
	enjoy this beautiful soup

	aGPL3 */


// needs some more iters - lowered for webgl
const int  NUM_ITERS = 			45;

const vec3 KALI_PARAM = 		vec3(.5, .4, 1.5);
//const vec3 KALI_PARAM = 		vec3(.4993, .4046, 1.5);
const int  KALI_ITERS = 		33;

// animation time
#define ti (iTime * 0.1 + 17.)



/** kali set as usual. 
	returns last magnitude step and average */
vec4 average;
float kali(in vec3 p)
{
    average = vec4(0.);
	float mag;
    for (int i=0; i<KALI_ITERS; ++i)
    {
        mag = dot(p, p);
        p = abs(p) / mag;
        average += vec4(p, mag);
        p -= KALI_PARAM;
    }
	average /= 32.;
    return mag;
}

// steps from pos along dir and samples the cloud
// stp is 1e-5 - 1e+?? :)
vec3 ray_color(vec3 pos, vec3 dir, float stp)
{
    vec3 p, col = vec3(0.);
	float t = 0.;
	for (int i=0; i<NUM_ITERS; ++i)
	{
		p = pos + t * dir;
		float d = kali(p);

		// define a surface and get trapped
		d = 1. - abs(1. - d);
		
		// always step within a certain range
		t += max(0.001, min(0.01, d )) * (stp + 3. * t);

		// some color
		col += (.5+.5*sin(average.rgb*30.)) 
		// by distance to surface
            / (1. + d * d * 1000.);
	}
    
    return clamp(col / 5., 0., 1.);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // ray stepsize - or focus scale 
    float foc = 0.0024 + 0.06*pow(sin(ti*0.9) * .5 + .5, 2.);

    // some position
	// - a circular path depending on the stepsize
    float rti = ti * 0.2;
	float rad = foc;
    
    if (iMouse.z > .5){
        foc = pow(iMouse.y / iResolution.y, 2.);
		rad = iMouse.x / iResolution.x;
    }
    
	vec3 pos = (vec3(-2.3, 1.19, -3.4)
				+ (0.001+rad)*vec3(2.*sin(rti),cos(rti),0.7*sin(rti/4.)) );
    
	vec2 uv = (fragCoord.xy / iResolution.y - .5) * 2.;
    vec3 dir = normalize(vec3(uv, 1.5-length(uv))).xzy;
    dir.xz = vec2(sin(ti)*dir.x-cos(ti)*dir.z, cos(ti)*dir.x+sin(ti)*dir.z);
    
	vec3 col = ray_color(pos, dir, foc)
//			+ 0.5 * ray_color(pos, dir, 2.)
        ;

	fragColor = vec4(pow(col,vec3(1./1.3)), 1.);	
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
