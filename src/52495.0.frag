/*
 * Original shader from: https://www.shadertoy.com/view/WsBGzK
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
//Ethan Alexander Shulman 2019, made on livestream at twitch.tv/ethanshulman

#define EPSILON 1e-2
#define REFLECTION_EPSILON 4e-2
#define NORMAL_PRECISION 1e-3

vec2 rot(vec2 v, float ang) {
    float si = sin(ang);
    float co = cos(ang);
    return v*mat2(co,-si,si,co);
}
mat2 rot2(float a) {
    float si = sin(a), co = cos(a);
    return mat2(co,-si,si,co);
}

vec4 hash(vec4 a) {
	return fract(abs(sin(a.ywxz*766.345)+cos(normalize(a)*4972.92855))*2048.97435+abs(a.wxyz)*.2735);
}

//from https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}
float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}
float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*.5,-p.y)-h.x*0.5);
}
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
float smax( float a, float b, float k) {
    return log(exp(k*a)+exp(k*b))/k;
}

float ruins(vec3 p) {
    vec3 rp = p;
    float d = 0.;
    float s = 20.;
    
    for (int i = 0; i < 3; i++) {
        rp -= s/8.;
        d = max(-sdBox(mod(abs(rp), s*2.)-s, vec3(s*.9)), d);
        
        if (mod(float(i),2.) > 0.) {
            rp.xz = abs(rot(rp.xz,float(i)*1.8+1.5));
        } else {
            rp.zy = abs(rot(rp.zy,float(i)*1.2+0.5));
        }
        
    	s /= 2.;
    }
                       
    return max(d,p.y);
}

float distf(vec3 p) {
	return ruins(p);
}

vec3 normf(vec3 p, float bd) {
	return normalize(vec3(distf(p+vec3(NORMAL_PRECISION,0,0))-bd,
						  distf(p+vec3(0,NORMAL_PRECISION,0))-bd,
						  distf(p+vec3(0,0,NORMAL_PRECISION))-bd));
}

#define AO_ITER 16

float ambientOcclusion(vec3 arp, vec3 nrm) {
	float asum = 0., as = .1;
	for (int i = 0; i < AO_ITER; i++) {
		float adst = distf(arp);
		asum += max(0.,1.-adst/as);
		arp += nrm*adst;
		as += adst;
	}
	return pow(clamp(1.-asum*.07,0.,1.),1./2.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord*2.-iResolution.xy)/iResolution.x;
    
	//initial ray parameters
	vec4 hsh = hash(uv.xyyx*vec4(1,1,.3,.3));
	vec3 rp = vec3(cos(iTime*.044)*100.,-40.+sin(iTime*.05+.5)*20.,0.),
		rd = normalize(vec3(uv+(hsh.xy-.5)/iResolution.xy,1.));
	mat2 rang = rot2(iTime*.04);
	rp.xz *= rang;
	rd.xz *= rang;
	rp += rd*(5.+hsh.z*2.0);
	
	//raytracing
	vec3 orp = rp;
	float eps = EPSILON;
	for (int i = 0; i < 64; i++) {
		float dst = distf(rp);
		if (dst < eps) break;
		rp += rd*dst;
		eps *= 1.1;
	}
	
	#define depthl(p) clamp(p.y*.01+1.,0.,1.)
	#define bgl(rd) max(0.,rd.y)
	#define fogl(v,len,rd) mix(v,bgl(rd),min(1.,len/200.))
	
	float bdst = distf(rp);
	if (bdst < eps) {
		rp -= rd*eps*5.;
		rp += rd*distf(rp)*.7;rp += rd*distf(rp)*.7;
		vec3 nrm = normf(rp,distf(rp));
		float sv = 0.;
		
		//reflection
		vec3 reflDir = reflect(rd,nrm), reflp = rp+reflDir*REFLECTION_EPSILON*2.;
		float reps = REFLECTION_EPSILON, reflectionAmount = (1.-max(0.,dot(rd,-nrm)))*.5;
		for (int i = 0; i < 32; i++) {
			float dst = distf(reflp);
			if (dst < reps) break;
			reflp += reflDir*dst;
			reps *= 1.1;
		}
		if (distf(reflp) < reps) {
			reflp -= reflDir*reps*5.;
			reflp += reflDir*distf(reflp)*.7;reflp += reflDir*distf(reflp)*.7;
			vec3 reflNrm = normf(reflp,distf(reflp));
			float rl = ambientOcclusion(reflp,reflNrm);
			rl *= depthl(reflp);
			rl = fogl(rl,length(reflp-rp),reflDir);
			sv += rl*reflectionAmount;
		} else sv += bgl(reflDir)*reflectionAmount;
		
		//ambient occlusion
		sv += ambientOcclusion(rp,nrm)*(1.-reflectionAmount);
		sv *= depthl(rp);
		sv = fogl(sv,length(rp-orp),rd);
		fragColor = vec4(sv);
	} else {
		fragColor = vec4(max(0.,rd.y));//background
	}
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
