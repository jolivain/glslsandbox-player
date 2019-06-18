/*
 * Original shader from: https://www.shadertoy.com/view/4slGRf
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
// by Nikos Papadopoulos, 4rknova / 2013
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define EPS		.001
#define PI		3.14159265359
#define RADIAN	180. / PI
#define SPEED	iTime * 1.2

float hash(in float n) { return fract(sin(n)*43758.5453123); }

float hash(vec2 p)
{
    return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123);
}

float noise(vec2 p)
{
    vec2 i = floor(p), f = fract(p); 
	f *= f*(3.-2.*f);
    
    vec2 c = vec2(0,1);
    
    return mix(mix(hash(i + c.xx), 
                   hash(i + c.yx), f.x),
               mix(hash(i + c.xy), 
                   hash(i + c.yy), f.x), f.y);
}

float fbm(in vec2 p)
{
	return	.5000 * noise(p)
		   +.2500 * noise(p * 2.)
		   +.1250 * noise(p * 4.)
		   +.0625 * noise(p * 8.);
}

float dst(vec3 p)
{
	return dot(vec3(p.x, p.y + .45 * fbm(p.zx), p.z), vec3(0.,1.,0.));	
}

vec3 nrm(vec3 p, float d)
{
	return normalize(
			vec3(dst(vec3(p.x + EPS, p.y, p.z)),
    			 dst(vec3(p.x, p.y + EPS, p.z)),
    			 dst(vec3(p.x, p.y, p.z + EPS))) - d);
}

bool rmarch(vec3 ro, vec3 rd, out vec3 p, out vec3 n)
{
	p = ro;
	vec3 pos = p;
	float d = 1.;

	for (int i = 0; i < 64; i++) {
		d = dst(pos);

		if (d < EPS) {
			p = pos;
			break;
		}
		pos += d * rd;
	}
	
	n = nrm(p, d);
	return d < EPS;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec2 uvn = (2. * uv - 1.)
			 * vec2(iResolution.x / iResolution.y, 1.);
	
	if (abs(EPS + uvn.y) >= .7) { 
		fragColor = vec4(vec3(0.),1.);
		return;
	}

	vec3 cu = vec3(0.,1.,0.);
	vec3 cp = vec3(0., 1.1 + fbm(vec2(iTime)) * .2, SPEED);
	vec3 ct = vec3(1.5 * sin(iTime), 
				   -8. + cos(iTime) + fbm(cp.xz) * 5., 15. + SPEED);
		
	vec3 ro = cp,
		 rd = normalize(vec3(uvn, 1. / tan(30. * RADIAN)));
	
	vec3 cd = ct - cp,
		 rz = normalize(cd),
		 rx = normalize(cross(rz, cu)),
		 ry = normalize(cross(rx, rz));

	rd = normalize(mat3(rx, ry, rz) * rd);

	vec3 sp, sn;
	vec3 col = (rmarch(ro, rd, sp, sn) ?
		  vec3(.6) * dot(sn, normalize(vec3(cp.x, cp.y + .5, cp.z) - sp))
		: vec3(0.));
	
    float noise = hash((hash(uv.x) + uv.y) * iTime) * .25;
	col += noise;
	col *= 1.9 * smoothstep(length(uv * .5 - .25), .8, .4);
	col *= smoothstep(EPS, 3.5, iTime);
	fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
