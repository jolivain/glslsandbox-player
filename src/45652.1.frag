/*
 * Original shader from: https://www.shadertoy.com/view/lscGR8
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
#define STEPS 128

mat3 my(float beta)
{
	return mat3(cos(beta), 0, sin(beta),
				0, 1, 0,
				-sin(beta), 0, cos(beta));
}

mat3 mx(float beta)
{
	return mat3(1, 0, 0,
				0, cos(beta), sin(beta),
				0, -sin(beta), cos(beta));
}


float sphere ( vec3 p, float s )
{
    return length(p) - s;
}


float rep( vec3 p, vec3 c )
{
    vec3 q = mod(p, c) - 0.5 * c;
    return sphere(q, 0.05);
}

float map( vec3 ro, vec3 rd )
{
	float res;
	float val = -1.0;
	vec3 ray = ro + rd;
	for (int j = 0; j < STEPS; j++)
	{
		float t = float(j)/float(STEPS);
		
		float res = rep(ray, vec3(0.55));		
		
		if (res < .001)
		{
			val = length(ray);
            break;
		}
				
		if (length(ray) > 9.0) return -1.0;
		ray += res * rd;
	}
	return val;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
   
    float aspect = iResolution.x/iResolution.y;
	vec3 ro = vec3(0.0, 0.0, 3.0);
	vec3 rd = normalize(vec3( (-1.0+2.0*uv) * vec2(aspect, 1.0), -1.0));
    
    ro *= my(iTime) * mx(iTime * 0.1);
    rd *= my(iTime) * mx(iTime * 0.1);
    
    float c;
	float d = map(ro, rd);
	
	vec3 col;
	if (d > 0.0)
	{
        col = vec3(pow(d * 0.3, 0.9));
	}
	else
    {
		col = vec3(1.0); //background
    }
    
    
    
	fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
