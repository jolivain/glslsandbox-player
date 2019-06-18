/*
 * Original shader from: https://www.shadertoy.com/view/3d2XD3
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
vec3 POS = vec3(0.),NOR = vec3(0.);
float SIZE = 0.;

vec3 rotate(vec3 p,vec3 n,float a)
{
	n = normalize(n);
    vec3 v = cross(p, n), u = cross(v, n); 
    return u * cos(a) + v * sin(a) + n * dot(p, n);   
}

float map(vec3 p)
{
	p-=POS;
    vec3 u = normalize(cross(NOR, vec3(0,1,0)));
    p *= mat3(u, cross(NOR, u), NOR);
    float w= abs(length(p.xy)-SIZE)-0.3;
    vec2 d = vec2(w, abs(p.z)-0.05);
    return length(max(d,0.0))-0.1;
}

vec3 calcNormal(vec3 p){
 	vec2 e = vec2(1, -1) * 0.002;
  	return normalize(
    	e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+ 
    	e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx)
	);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
	vec3 rd = normalize(vec3(p,-2));
	vec3 ro = vec3(0,0,20);
	vec3 col = vec3(0.2);
	float z=50.0;
	const float itr =20.0;
	for (float j=1.0; j<=itr;j++)
	{
		float t =-iTime+j*0.5;
		POS = vec3(cos(t),sin(t),0.3*sin(t))*2.0;
 		NOR = normalize(vec3(1,2,3));
		NOR = rotate(NOR,normalize(vec3(1,2,3)), iTime*1.2 + j*0.4);
		NOR = rotate(NOR,normalize(vec3(-5,2,6)), -iTime*1.2 + j*0.3);
		SIZE=0.7*j;
		if (length(cross(rd,POS-ro))<SIZE+0.5)
		{
			const float ITR = 100.0;
			vec3 p =ro;
			float t=0.0,x;
			float i = 0.;
 			for( float ii = 0.0; ii < ITR; ii++)
  			{
				t += x =map(p);
				if(x < 0.001 || t > 50.0) break;
				p+=rd*x;
				i = ii;
  			}
  			if(x < 0.001)
  			{
				if(t<z)
				{
				 	vec3 nor = calcNormal(p);
					vec3 li = normalize(vec3(0.3,0.5,0.8));
					col=  pow(1.0 - i / ITR, 3.0)*(vec3(1.5)*(1.0-0.3*j/itr)); 
					col *= clamp(dot(nor, li), 0.3, 1.0);
        			col *= max(0.5 + 0.5 * nor.y, 0.0);
        			col += pow(clamp(dot(
                        reflect(normalize(p - ro), nor), li), 0.0, 1.0), 20.0);
       				col = clamp(col,0.0,1.0);
					z=t;
				}

			}	
		}
	}   
	col = pow(col, vec3(0.8)); 
	float t=iTime * 5.0;
	col +=vec3(1,0.5,0)* sin(p.y*500.0-t)*sin(p.x*300.0- t) *0.2;
	col *= clamp(2.4-length(p),0.0,1.0);
	fragColor=vec4(col,1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
