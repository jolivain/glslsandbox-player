/*
 * Original shader from: https://www.shadertoy.com/view/XdXXz4
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
vec4 circle(vec2 p, vec2 center, float radius)
{
	return mix(vec4(1,1,1,0), vec4(1,0,0,1), smoothstep(radius + 0.005, radius - 0.005, length(p - center)));
}

vec4 scene(vec2 uv, float t)
{
	return circle(uv, vec2(0, sin(t * 16.0) * (sin(t) * 0.5 + 0.5) * 0.5), 0.2);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 resol = iResolution.xy / vec2(6,1);
	vec2 coord = mod(fragCoord.xy, resol);
	float view = floor(fragCoord.x / resol.x);
	
	vec2 uv = coord / resol;
	uv = uv * 2.0 - vec2(1);
	uv.x *= resol.x / resol.y;
	
	fragColor = vec4(1,1,1,1);
	
	float frametime = (60. / (floor(view / 2.) + 1.));
	float time = floor((iTime + 3.) * frametime) / frametime;
	vec4 mainCol = scene(uv, time);
	
	vec4 blurCol = vec4(0,0,0,0);
	for(int i = 0; i < 32; i++)
	{
		if ((i < 8 || view >= 2.0) && (i < 16 || view >= 4.0))
		{
			blurCol += scene(uv, time - float(i) * (1. / 15. / 32.));
		}
	}
	blurCol /= pow(2., floor(view / 2.) + 3.);
	
	if (mod(view, 2.) == 0.)
		fragColor = mainCol;
	else
		fragColor = blurCol;
	
	if (iMouse.z > 0. && mod(view, 2.) == mod(floor(iMouse.z / resol.x), 2.))
		fragColor = vec4(0,0,0,1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
