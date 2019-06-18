/*
 * Original shader from: https://www.shadertoy.com/view/ldcGWH
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

float sdBerry( vec3 p, float s )
{
  p.x += min(p.y, 0.0) * 0.5;
  return length(p)-s;
}

////////
////////

mat3 rotx(float a) { mat3 rot; rot[0] = vec3(1.0, 0.0, 0.0); rot[1] = vec3(0.0, cos(a), -sin(a)); rot[2] = vec3(0.0, sin(a), cos(a)); return rot; }
mat3 roty(float a) { mat3 rot; rot[0] = vec3(cos(a), 0.0, sin(a)); rot[1] = vec3(0.0, 1.0, 0.0); rot[2] = vec3(-sin(a), 0.0, cos(a)); return rot; }
mat3 rotz(float a) { mat3 rot; rot[0] = vec3(cos(a), -sin(a), 0.0); rot[1] = vec3(sin(a), cos(a), 0.0); rot[2] = vec3(0.0, 0.0, 1.0); return rot; }

mat3 rotation = mat3(0.);

/**
* trying to do something like http://viscorbel.com/wp-content/uploads/The-basics_html_m6c308b3d.jpg 
* also, http://http.developer.nvidia.com/GPUGems/gpugems_ch16.html
*/
float map(in vec3 rp)
{
    rp *= rotation;
    
    // thanks Shane!
	float d = sdBerry(rp, 0.055) - dot(abs(sin(rp*140.0)), vec3(0.0035));
    d = min(d, sdBerry(rp, 0.055) - dot(abs(sin(rp*160.0)), vec3(0.0025)));
    d -= dot(abs(sin(rp*1000.0)), vec3(0.0001));
	return d;
}


vec3 grad(in vec3 rp)
{
    vec2 off = vec2(0.0001, 0.0);
    vec3 g = vec3(map(rp + off.xyy) - map(rp - off.xyy),
                  map(rp + off.yxy) - map(rp - off.yxy),
                  map(rp + off.yyx) - map(rp - off.yyx));
    return normalize(g);
}

float trace(inout vec3 rp, in vec3 rd, inout vec3 closestPoint)
{
    float closest = 99.0;
    bool hit = false;
    for (int i = 0; i < 250; ++i)
    {
        float dist = map(rp);
        if (dist < closest)
        {
        	closest = dist;
            closestPoint = rp;
        }
        
        if(dist < 0.0)
        {
            hit = true;
            break;
        }
        rp += rd * max(dist * 0.5, 0.00001);
        
        if(rp.z > 1.0) 
        {
            rp += (1.0 - rp.z) * rd;
            break;
        }
        
    }
    return closest;
}

// (too much) tweakable parameters.
// falloff control
const float density = 8.;
const float ss_pow = 3.; 
const float ss_scatter = 0.4;
const float ss_offset = .5;

// color controls
const float ss_intensity = 1.;
const float ss_mix = 1.;
const vec4 ss_color = vec4(.85, .05, .2, 0.0);

// determines how deep from surface to start scattering tracing, not something to tweak really.
const float surfaceThickness = 0.008;

// Fresnel
vec4 rimCol = vec4(1.0, 1.0, 1.0, 1.0);
float rimPow = 2.5;
float rimAmount = 1.;
float F = 2.2;



float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

/**
* Gets thickness for subsurface scattering calculation. 
* I first offset the ray hit position a bit along opposite of the surface normal 
* to get a starting position inside the volume.
* From there I step towards the light and calculate distance travelled inside the negative volume of
* the distance function.
* 
* Outer loop is for approximating scattering of the light that travels in the volume,
* I just offset the light direction by some scatter value for each sample.
*/
float ssThickness(in vec3 raypos, in vec3 lightdir, in vec3 g, in vec3 rd)
{
    vec3 startFrom = raypos + (-g * surfaceThickness);
    vec3 ro = raypos;
	
    float len = 0.0;
    const float samples = 12.;
    const float sqs = sqrt(samples);
    
    for (float s = -samples / 2.; s < samples / 2.; s+= 1.0)
    {
        vec3 rp = startFrom;
        vec3 ld = lightdir;
        
        ld.x += mod(abs(s), sqs) * ss_scatter * sign(s);
        ld.y += (s / sqs) * ss_scatter;
        
        ld.x += rand(rp.xy * s) * ss_scatter;
        ld.y += rand(rp.yx * s) * ss_scatter;
        ld.z += rand(rp.zx * s) * ss_scatter;
		
        ld = normalize(ld);
        vec3 dir = ld;
		
        for (int i = 0; i < 50; ++i)
        {
            float dist = map(rp);
            if(dist < 0.0) dist  = min(dist, -0.0001);
            if(dist >= 0.0) break;

            dir = normalize(ld);
            rp += abs(dist * 0.5) * dir;  
        }
        len += length(ro - rp);
    }
    
    return len / samples;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= vec2(0.5);
    uv.y /= iResolution.x / iResolution.y;
    
    vec2 m = (iMouse.xy / iResolution.xy) - vec2(0.5);
    
    
    rotation = roty(m.x * 10.0);
    rotation *= rotx(-m.y * 10.0);
    
    if(iMouse.z <= 0.0)
    {
    	rotation = roty(sin(iTime * 0.5) * 2.0);
    	rotation *= rotz(.8);
    	rotation *= rotx(sin(iTime) * 0.2);
        
    }

    
    
    fragColor = vec4(0.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 rp = vec3(0.0, -0.01, -.3);

    // closest point is used for antialising outline of object
    vec3 closestPoint = vec3(0.0);
    float hit = trace(rp, rd, closestPoint);
    vec4 color = vec4(.0);
    rp = closestPoint;

    vec3 ld = normalize( vec3(14.0, 1.0, 20.0) - rp);
    vec3 g = grad(rp);
    float d = dot(g, ld);
    d = clamp(d, 0.0, 1.0);

    //fresnel
    vec3 r = reflect(-ld, g);
    float rimd = 1.0 - dot(r, -rd);
    rimd = clamp(rimd, 0.0, 1.0);
    rimd = pow(rimd, rimPow);

    float frn = rimd + F * (1.0 - rimd);
    color += frn * rimCol * rimAmount * d;

    // subsurface        
    float t = ssThickness(rp, ld, g, rd);
    t = exp(ss_offset -t * density);
    t = pow(t, ss_pow);
 
    vec4 sscol = t * ss_color * ss_intensity;
    sscol = mix(sscol, ss_color, 1.0 - ss_mix);
    color += sscol;
	
    fragColor = vec4(.9, .9, 1.0, 1.0);
    // color + AA
    fragColor = mix(color, fragColor, mix(0.0, 1.0, clamp(hit / surfaceThickness * 16.0, 0.0, 1.0)));
    
    // vignette
    fragColor *= smoothstep(0.55, 0.48, abs(uv.x));
    fragColor *= smoothstep(0.31, 0.27, abs(uv.y));
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
