/*
 * Original shader from: https://www.shadertoy.com/view/MtlGR2
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

// --------[ Original ShaderToy begins here ]---------- //
#define thank you eiffie :D 
#define and greetings to Kali :)
#define and_long_overdue thank_you iq
#define your_publications_where_a_greater_impact_than_sep11


// More Kali-de explorations 
// please by kind to this set
// License aGPL v3
// 2015, stefan berke 


// http://www.musicdsp.org/showone.php?id=238
float Tanh(in float x) { return clamp(x * ( 27. + x * x ) / ( 27. + 9. * x * x ), -1., 1.); }

// two different traps and colorings
#define mph (.5 + .5 * Tanh(sin(iTime/9.123+1.2)*7.))


vec3 kali_sky(in vec3 pos, in vec3 dir)
{
	vec4 col = vec4(0,0,0,1);
	
	float t = 0., pln;
    for (int k=0; k<50; ++k)
	{
		vec4 p = vec4(pos + t * dir, 1.);

		vec3 param = mix(
            vec3(1., .5, 1.),
			vec3(.51, .5, 1.+0.1*mph), mph);

        // "kali-set" by Kali
		float d = 10.; pln=6.;
        vec3 av = vec3(0.);
		for (int i=0; i<6; ++i)
		{
            p = abs(p) / dot(p.xyz, p.xyz);
            // distance to tretrahedron / cylinder
            d = min(d, mix(p.x+p.y+p.z, length(p.xy), mph) / p.w);
            // disc?
            if (i == 2)	pln = min(pln, dot(p.xyz, vec3(0,0,1)) / p.w);
			av += p.xyz/(4.+p.w);
            p.xyz -= param 
                // a little transition that makes it swim
                - 100.*col.x*mph*(1.-mph);
		}
        // blend the gems a bit 
		d += .03*(1.-mph)*smoothstep(0.1,0., t);
		if (d <= 0.0) break;
        // something like a light trap
		col.w = min(col.w, d);
        
#if 1
        // a few more steps for texture
        for (int i=0; i<3; ++i)
        {
            p = abs(p) / dot(p.xyz, p.xyz);
            av += p.xyz/(4.+p.w);
            p.xyz -= param;
        }
#endif        
        // (why are these values getting so large?) 
		col.xyz += av / 4000. + p.xyz / 40000.;
		
        // quadratic seems to work pretty good for the gems
        // well it's just a sum otherwise
		t += min(0.1, mix(d*d*1., d, mph));
	}
	
	return mix(col.xyz/col.w*(2.1-2.*mph)/(1.+.2*t), 
               mph-0.001/col.www - (1.-mph*0.8)*vec3(0.1,0.2,0.4)/(1.+pln), 
               mph);
}


vec2 rotate(in vec2 v, float r) { float s = sin(r), c = cos(r);	return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord.xy - iResolution.xy*.5) / iResolution.y * 2.;
    
    vec3 dir = normalize(vec3(uv, (.9+.2*mph) - 0.4*length(uv)));
    
    float t = iTime-2.;
	vec3 pos = vec3((1.-mph*.5)*sin(t/2.), (.3-.2*mph)*cos(t/2.), (.3+2.*mph)*(-1.+sin(t/4.13)));
    pos.xy *= 1.5 + sin(t/3.47) + 0.5 * -pos.z;
    dir.yz = rotate(dir.yz, -1.4+mph+(1.-.6*mph)*(-.5+0.5*sin(t/4.13+2.+1.*sin(t/1.75))));
    dir.xy = rotate(dir.xy, sin(t/2.)+0.2*sin(t+sin(t/3.)));
    
	fragColor = vec4(kali_sky(pos, dir), 1.);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
