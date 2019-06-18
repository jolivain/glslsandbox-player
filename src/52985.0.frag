/*
 * Original shader from: https://www.shadertoy.com/view/tssSDN
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
// distance function by iq
// https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0);
}

vec3 opRep(vec3 p, vec3 c)
{
    return mod(p,c)-0.5*c;
}

vec2 opU(vec2 d1, vec2 d2)
{
	return (d1.x<d2.x) ? d1 : d2;
}

#define PI 3.141592

vec2 map(vec3 p)
{
    float c = 0.05;
    vec2 id = floor(p.xz / c);

    vec2 b = vec2(9999., 0.0);
    vec3 pp = p;
    float t = iTime;
    pp.xz = mod(pp.xz, c) - 0.5*c;
 	float v = sin(t) * 0.5 + 0.5;
   	vec3 bp = vec3(sin(t) * 3.0, v * 5.0, cos(t) * 3.0);
    for (int i = 0; i < 5; i++) {
        float y = float(i) * c * 2.0;
    	vec3 cp = vec3(id.x, -y, id.y);
    	float s = clamp(pow(5.0 / distance(bp, cp), -6.0), 0.0, 1.0);
        float by = (1.0 - s) * -0.4;
        b = opU(b, vec2(sdBox(pp + vec3(0.0, by + y, 0.0), vec3(c * s * smoothstep(-0.4, -0.3,  by) * 0.5)), 1.0));
    }
    return b;
}

mat3 camera(vec3 ro, vec3 ta, float cr )
{
	vec3 cw = normalize(ta - ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 normal( in vec3 pos, float eps )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*eps;
    return normalize( e.xyy*map( pos + e.xyy ).x +
					  e.yyx*map( pos + e.yyx ).x +
					  e.yxy*map( pos + e.yxy ).x +
					  e.xxx*map( pos + e.xxx ).x );
}

vec3 materialize(vec3 p, vec3 ray, float depth, vec2 mat)
{
    vec3 ret = vec3(0.0);
    vec3 nor = normal(p, 0.0001);
    if (depth > 2000.0) {
    	ret = vec3(0.0);
    } else if (mat.y == 1.0) {
    	vec2 id = floor(p.xz / 0.05);
        if (id.x == 3.0 && id.y == 0.0 && p.y >= 0.0) {
            ret = vec3(nor.y, 0.0, 0.0) + nor.z * 0.3;
        } else {
            ret = vec3(nor.y) + nor.z * 0.3;
        }
    }
    return ret;
}

vec3 trace(vec3 ro, vec3 ray)
{
    float t = 1.3;
    vec3 col = vec3(0.0);
    vec3 p;
    vec2 m;
    vec3 rdi = 1.0 / ray;
    for(int i = 0; i < 60; i++) {
    	p = ray * t + ro;
        m = map(p);
        if (m.x < 0.001) {
            break;
        }
        // grid traverse technique
        // https://qiita.com/ukeyshima/items/221b0384d39f521cad8f
        t += min(min((step(0.0,ray.x)-mod(p.x, 0.05)) * rdi.x, (step(0.0,ray.z)-mod(p.z, 0.05))*rdi.z)+0.001,m.x);
    }
    return materialize(p, ray, t, m);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 ro = vec3(1.0, 1.0, 1.0);
    vec3 ta = vec3(0.0, 0.0, 0.0);
    vec3 ray = camera(ro, ta, 0.0) * normalize(vec3(p, 7.5));
    
    vec3 col = trace(ro, ray);
    p = fragCoord.xy / iResolution.xy;
    p *=  1.0 - p.yx;
    float vig = p.x*p.y * 30.0;
    vig = pow(vig, 0.1);
    
    fragColor = vec4(col * vig,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
