/*
 * Original shader from: https://www.shadertoy.com/view/XlVfDy
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
vec3 rotate(vec3 p,vec3 n,float a)
{
    vec3 v = cross(p, n), u = cross(v, n);
    return u * cos(a) + v * sin(a) + n * dot(p, n);   
}

float hash(float n)
{
	return fract(sin(n+99.0))*2.0-1.0;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0); 
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 rd = normalize(vec3((fragCoord * 2.0-iResolution.xy) / iResolution.y,-2));
    vec3 ro = vec3(0,0,20);
	vec3 col = vec3(0);

    float t = iTime + 20.0;
	float z=99.0;
	for(float i=0.0;i<500.0;i++){
		vec3 p=vec3(hash(i),hash(i*18.0),hash(i*182.0))*t*0.2;
		p = (abs(fract(p)*2.0-1.0)*2.0-1.0)*15.0;
		if(length(cross(rd,p-ro))<1.45)
		{
			vec3 a =ro;
			for(float j=1.0; j>0.0;j-=0.05) {
				vec3 q = rotate(a-p,normalize(vec3(1)),t*2.0+i);
				float x=sdBox(q,vec3(0.5));      
 				if(x<.001)
    			{
					float s = dot(rd,a-ro);
					if(s<z)
					{
						col =exp(-0.0005*s*s)*j*j*j*vec3(1); 
						z=s;
					}
					break;
				}
 				a += rd*x;
     		}
		}
	}
    col = pow(col,vec3(1,2,3)*0.8);
    fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
