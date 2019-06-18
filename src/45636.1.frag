/*
 * Original shader from: https://www.shadertoy.com/view/XscyRs
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
float iTime = 0.;
#define iResolution resolution

// Protect glslsandbox uniform names
#define time        stemu_time

// --------[ Original ShaderToy begins here ]---------- //
const float PI = 3.1415926535897932384626433832795;
const float TWOPI = 2.0 * PI;
const float EPSILON = 0.0001;

const float maxDistance = 20.0;

const int m_boi = 0;
const int m_eyes = 1;
const int m_world = 2;
const int m_ghost = 3;

vec3 bg = vec3(0.3, 0.3, 0.2);

struct ray
{
	vec3 o; //origin
	vec3 d;	//direction
};

struct result
{
	float t;
	vec2 uv;
	vec3 p;
	vec3 n;
	int mID;
};

struct material 
{
	vec3 diffuse;
	vec3 shadow;
	float sss;
	float refl;
};

result compare(result a, result b)
{
    if(a.t < b.t)
        return a;
    return b;
}

float rand(float seed)
{
	return fract(sin(seed) * 1231534.9);
}

float rand(vec2 seed) 
{ 
    return rand(dot(seed, vec2(12.9898, 783.233)));
}

float distSphere(vec3 p, float r)
{
	return length(p) - r;
}

float opU(float a, float b)
{
	return min(a, b);
}

float opU2(float a, float b, float k)
{
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float opD(float a, float b)
{
	return max(a, -b);
}

vec3 opR(vec3 p, vec3 r)
{
	return mod(p, r)-0.5*r;
}

vec3 rotateX(vec3 p, float angle)
{
	mat3 r = mat3(1, 0, 0,
					0, cos(angle), -sin(angle),
					0, sin(angle), cos(angle));
	return r * p;
}

vec3 rotateY(vec3 p, float angle)
{
	mat3 r = mat3(cos(angle), 0, sin(angle),
				0, 1, 0,
				-sin(angle),0 , cos(angle));
	return r * p;
}

vec3 rotateZ(vec3 p, float angle)
{
	mat3 r = mat3(cos(angle), -sin(angle), 0,
				sin(angle), cos(angle), 0,
				0, 0, 1);
	return r * p;
}

vec2 getUVSphere(vec3 p)
{
	p = normalize(p);
	float x = atan(p.z, p.x) / TWOPI;
	float y = asin(p.y) / PI;
	
	return vec2(0.5) + vec2(x,y);
}

vec3 getLightPos(float t)
{
	return vec3(-2.0*sin(t), 0.3+sin(t*4.0)*0.2, 5.0 + 2.0 * cos(t));
}
 
result bouncyBoi(vec3 p, float t)
{
	result res;	
	res.mID = m_boi;

	p.y -= abs(sin(t * 4.0)) * 0.4;	
	p.x -= sin(t * 2.0) * 0.2;
	p.z -= 5.0;
	p = rotateY(p, sin(t * 4.0) * PI * 0.2);		
	p = rotateZ(p, smoothstep(-.6, 0.4, p.y) * PI * 0.1 * sin(t * 4.0));
			
	vec3 op = p;
	
	//body
	p = op;
	p.y += smoothstep(0.15, 2.5, abs(op.x));
	p.y *= 0.8;
	p.z += (1.0 - smoothstep(0.0, 1.2, abs(op.y - 0.1))) * 0.4 * max(0.0, op.z);
	p.xz *= (1.0 + opU2(0.0, p.y, 0.2) * 0.2 * pow((1.0 - abs(sin(t * 4.0))), 2.0));
	res.t = distSphere(p, 1.0);
		
	//arms
	p = op;
	p.x *= 0.13;
	p.y += sin((p.x) * 2.0 + t * 8.0) * 0.2 * smoothstep(0.8, 2.0, abs(op.x));
	res.t = opU2(res.t, distSphere(p, 0.2), 0.2);
		
	//mouth
	p = op;
	p -= vec3(0.0, 0.45, -1.0);
	p *= vec3(1.0, ((sin(t  * 8.0) + 1.0) * 0.5) * 0.5 + 0.5, 0.8);
	res.t = opD(res.t, distSphere(p, 0.1));
		
	//right eye
	p = op;
	p -= vec3(0.25, 0.6, -0.7);
	p = rotateY(p, -PI/16.0 + sin(t*6.0)*PI/16.0);
	p = rotateX(p, PI/2.0 + sin(t*6.0)*PI/16.0);
	result resEyeR;
	resEyeR.t = distSphere(p, 0.2);
	resEyeR.mID = m_eyes;
	resEyeR.uv = getUVSphere(p);
	
	//left eye
	p = op;
	p -= vec3(-0.25, 0.6, -0.7);
	p = rotateY(p, PI/16.0 - sin(t*6.0)*PI/16.0);
	p = rotateX(p, PI/2.0 - sin(t*6.0)*PI/16.0);		
	result resEyeL;
	resEyeL.t = distSphere(p, 0.2);
	resEyeL.mID = m_eyes;
	resEyeL.uv = getUVSphere(p);
	
	res = compare(res, resEyeR);
	res = compare(res, resEyeL);
	return res;
}

float angle(vec2 a, vec2 b)
{
	a = normalize(a);
	b = normalize(b);
	float c = dot(a,b);
	float s = a.x*b.y - b.x*a.y;
	return atan(s,c);
}
  
result ghost(vec3 p, float t)
{
	result res;
	res.mID = m_ghost;
	
	vec3 lPos = getLightPos(t);
	p -= lPos;
	float rY = angle(lPos.xz - vec2(0.0,5.0), vec2(-1.0, 0.0));
	float rX = sin(t * 4.0) * PI / 16.0;
	p = rotateY(p, rY);
	p = rotateX(p, rX);
	
	vec3 op = p;
	
	//body
	p = rotateX(p, p.y*10.0*(1.0 + 0.2*sin(t*8.0)));
	p.y += mix(0.0, 0.2, 1.0 - smoothstep(-0.6, 0.0, p.y));		
	res.t = distSphere(p, 0.16);

	//arms
	p = op;
	p = rotateZ(p, p.x*sin(t*4.0)*2.0);
	p.y += 0.04;
	p.x *= 0.6;
	p.zy *= 8.0;		
	res.t = opU2(res.t, distSphere(p,0.1), 0.2);
	
	//eyes
	p = op;
	p += vec3(0.07,-0.06,0.1);
	res.t = opD(res.t, distSphere(p, 0.06));	
	p.x -= 0.14;
	res.t = opD(res.t, distSphere(p, 0.06));

	return res;
}

result world(vec3 p, float t)
{
	result res;
	res.mID = m_world;
	
	//floor deformations
	p.z -= t * 1.4;
	p = rotateZ(p, p.x*0.1);
	p.y += sin(p.x/2.0)*sin(p.z/2.0)*0.4;
	p.y += sin(p.x)*sin(p.z)*0.2;
	p.y += sin(p.x*2.0)*sin(p.z*2.0)*0.1;
	p.y += sin(p.x*6.0)*sin(p.z*6.0)*0.01;
	res.t = p.y + 1.0;
	
	//lumps
	vec3 rep = vec3(3.0, 0.0, 2.0);
	vec2 id = floor(p/rep).xz;
	p = mod(p,rep)-rep*0.5;
	p.y += mix(0.6, 1.0,rand(id));
	p.x += rand(id.y)-0.5;
	p.z += rand(id.x)-0.5;
	res.t = opU2(res.t, distSphere(p, mix(0.2, 0.3, rand(id))), 0.6);
	
	return res;
}

result distanceField(vec3 p, float t)
{
	result res;
	res = bouncyBoi(p,t);
	res = compare(res, ghost(p,t));
	res = compare(res, world(p,t));
	return res;
}

//shadow casters only
result distanceFieldShadow(vec3 p, float t)
{
	result res;
	res = bouncyBoi(p,t);
	res = compare(res, world(p,t));
	return res;
}
  
vec3 getNormal(vec3 p, float t)
{
	vec2 d = vec2(0.01, 0.0);
	float dx = distanceField(p + d.xyy,t).t
				- distanceField(p - d.xyy,t).t;
	float dy = distanceField(p + d.yxy,t).t
				- distanceField(p - d.yxy,t).t;
	float dz = distanceField(p + d.yyx,t).t
				- distanceField(p - d.yyx,t).t;
	return normalize(vec3(dx, dy, dz));
}

float SSS(vec3 p, vec3 l, vec3 n, float t, float delta)
{
	const int samples = 6;
	float sss = 0.0;
	float lDist = length(l);
	l = normalize(l);
	for(int i = 1; i <= samples; i++)
	{
		float i_f = float(i);
		float dist = rand(i_f) * delta;
		vec3 offset = vec3(rand(i_f),rand(i_f+1.0),rand(i_f+2.0));
		offset = normalize(offset - vec3(0.5));
		vec3 dir = normalize(l + offset*0.3);
		float d = distanceField(p + dir * dist, t).t;
		float s = max(dist+d, 1.0 - (lDist - dist)/lDist);
		s /=  pow(1.0 + (delta/dist)*0.4, 2.0);
		sss += s;
	}
	sss /= float(samples);
	sss = smoothstep(0.0, 0.4, sss);
	return sss;
}

result trace(ray r, float maxDist, float time)
{		
	result res;
	float t = 0.0;
	vec3 p;
	for (int i = 0; i < 100; i++)
	{
		if (t > maxDist) break;
		p = r.o + r.d * t;
		res = distanceField(p, time);		
		if(res.t <= EPSILON) break;	
		//don't use full distance because artifacts
		t += max(res.t*0.6, t * 0.0001);
	}	
	res.t = t;
	res.p = p;
	res.n = getNormal(p, time);
	return res;
}

float shadow(result res, float time, float k)
{
	ray r;
	r.o = res.p + res.n * 0.01;
	vec3 l = getLightPos(time) - r.o;
	r.d = normalize(l);
	float maxDist = length(l);

	float s = 1.0;
	float t = 0.0;
	for (int i = 0; i < 100; i++)
	{
		if (t > maxDist) break;
		vec3 p = r.o + r.d * t;
		float d = distanceFieldShadow(p, time).t;		
		if(d <= EPSILON) break;
		s = min(s, d*k / t);
		t += max(d, t * 0.0001);
	}	
	return min(s, t < maxDist ? 0.0 : 1.0);
}

material getMaterial(result res)
{
	material m;
	if (res.mID == m_boi)
	{
		m.diffuse = vec3(1.0, 0.6, 0.4);
		m.shadow = vec3(0.4, 0.1, 0.0);
		m.sss = 1.0;
		m.refl = 0.4;
	}
	else if (res.mID == m_eyes)
    {
		m.diffuse = vec3(1.0, 1.0, 0.8);
		m.diffuse *= smoothstep(0.02,0.05, res.uv.y);
		m.shadow = vec3(0.4, 0.1, 0.1);
		m.sss = 1.0;
		m.refl = 0.6;
	}
	else if (res.mID == m_world)
    {
		m.diffuse = vec3(1.0, 0.6, 0.4);
		m.shadow = vec3(0.4, 0.1, 0.0);
		m.sss = 1.0;
		m.refl = 0.2;
	}
	else /* if (res.mID == m_ghost) */
    {
		m.diffuse = vec3(1.4, 1.3, 1.0);
		m.shadow = vec3(0.6, 0.5, 0.4);
		m.sss = 0.2;
		m.refl = 0.5;
	}
	return m;
}

vec3 getColor(result res, float time)
{
	vec3 color = bg;
	if(res.t <= maxDistance)
	{
		material m = getMaterial(res);
		color = m.diffuse;
		
		vec3 l = getLightPos(time) - res.p;			
		float ndl = max(0.0, dot(normalize(l),res.n));
		float i = max(0.0, ndl);
		i *= shadow(res, time, 16.0);
		float sss = SSS(res.p, l, res.n, time, m.sss);
		i = mix(i, sss, (-ndl+1.0)/2.0);
		i *= 1.0 - smoothstep(4.0, 8.0, length(l));
		color = mix(color * m.shadow, color, i);	
	}
	return color;
} 

vec3 reflection(ray r, result res, float time)
{
	r.o = res.p + res.n * 0.01;
	r.d = reflect(r.d, res.n);
	res = trace(r, maxDistance, time);
	return getColor(res,time);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	float time = iTime;		
	vec4 color = vec4(0.0);    
		
	float camRotY = PI * 0.1 * sin(time * 0.5);
	float camRotX = -PI *(0.01 + 0.03 *(sin(time * 0.2)+1.0));
	
	ray r;
	r.o = vec3(0.0,0.0,-5.0);
	r.o = rotateX(r.o, camRotX);
	r.o = rotateY(r.o, camRotY);
	r.o.z += 5.0;
	r.o.y += 0.2;
	float fx = tan(radians(70.0) / 2.0) / iResolution.x;
	vec2 d = fx * (fragCoord.xy * 2.0 - iResolution.xy);
	r.d = normalize(vec3(d, 1.0));
	r.d = rotateX(r.d, camRotX);
	r.d = rotateY(r.d, camRotY);
		
	result res = trace(r, maxDistance, time);
	color.rgb = getColor(res,time);	
	if(res.t <= maxDistance)
	{	
		float fresnel = pow(1.0 + dot(r.d,res.n),2.0);
		fresnel = clamp(fresnel, 0.0, 1.0);
	
		material mat = getMaterial(res);
		color.rgb *= (1.0 - mat.refl * fresnel);
	
		vec3 reflectedColor = reflection(r, res,time);
		color.rgb += reflectedColor * mat.refl * fresnel;	
	}
	float fog = smoothstep(maxDistance * 0.5, maxDistance,res.t);
	color.rgb = mix(color.rgb, bg, fog);
	
	vec3 l = getLightPos(time)-r.o;
	float halo = dot(normalize(l),r.d);
	halo *= max(0.0, sign(res.t - length(l)));
	halo = smoothstep(0.99, 0.999, halo);
	color.rgb += halo * vec3(0.2, 0.2, 0.1);
	fragColor = color;
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
  iTime = time;

  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
