#ifdef GL_ES
precision mediump float;
#endif

/* a lot of code stolen from @iq mixed with some random geometry */

uniform vec2 resolution;
uniform float time;


float hash( float n )
{
    return fract(sin(n)*43758.5453);
}


float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*57.0 + 113.0*p.z;

    float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                    mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                        mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    return res;
}

mat3 m = mat3( 0.00,  0.80,  0.60,
              -0.80,  0.36, -0.48,
              -0.60, -0.48,  0.64 );


float fbm( vec3 p )
{
    float f = 0.0;

    f += 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

float
maxcomp(vec3 v)
{
	return max(v.x, max(v.y, v.z));
}

float sdbox( vec3 p, vec3 b )
{
  vec3  di = abs(p) - b;
  float mc = maxcomp(di);
  return min(mc,length(max(di,0.0)));
}

float
map(vec3 rp)
{
	float dp = rp.y + 1.0;
	float ds = length(rp) - 0.3;
	float us = 1000.0;
	for(int i=0; i<3; i++){
		for(int j=0; j<3; j++){
			vec3 org = vec3(float(i-1)/3.0, -1, float(j-1)/3.0);
			us = min(us, length(rp - org) - 0.1);
		}
	}
	
	vec3 c = vec3(.0, .0, -0.75);
	vec3 b = vec3(.2, .2, .2);
	float db = sdbox(rp-c, b);
	float dq = length(rp-c) - 0.25;
	return min(max(dp, -us), max(db, -dq));
}

vec3
normal(vec3 p)
{
	vec3 e = vec3(.001, .0, .0);
	return normalize(vec3(
		map(p+e.xyy) - map(p-e.xyy),
		map(p+e.yxy) - map(p-e.yxy),
		map(p+e.yyx) - map(p-e.yyx)
	));
}

vec3
fbmnormal(vec3 p)
{
	vec3 e = vec3(.001, .0, .0);
	return normalize(vec3(
		fbm(p+e.xyy) - fbm(p-e.xyy),
		fbm(p+e.yxy) - fbm(p-e.yxy),
		fbm(p+e.yyx) - fbm(p-e.yyx)
	));
	
}

vec2
rot(vec2 v, float a)
{
	return mat2(cos(a), -sin(a), sin(a), cos(a)) * v;
}

float
shadow(vec3 rp, vec3 rd, float a, float b, float k)
{
	float t = a;
	float r = 1.0;
	for(int i=0; i<80; i++){
		float h = map(rp+rd*t);
		if(h < 0.001)
			return 0.0;
		r = min(r, k*h/t);
		t += h;
		if(t >= b)
			return r;
	}
	return r;
}

void
main(void)
{
	vec2 pos = (2.0*gl_FragCoord.xy - resolution.xy) / resolution.x;
	float c = 0.0;
	
	vec3 lo = vec3(0.5, sin(time)/2.0, -1);
	vec3 ro = vec3(0,0.1,-1);
	vec3 rd = normalize(vec3(pos, 1.0));
	vec3 rp = ro;
	float d = 1000.0;
	vec2 cam;
	//cam = rot(rd.xz, sin(time)/8.0+.125);
	//rd = vec3(cam.x, rd.y, cam.y);
	cam = rot(rd.yz, -.8);
	rd = vec3(rd.x, cam.x, cam.y);
	for(int i=0; i<80; i++){
		d = map(rp);
		if(d < 0.0001)
			break;
		rp += rd*d;
	}
	if(d < 0.001){
		vec3 snor = normal(rp) + 0.3 * fbmnormal(rp*100.0);
		vec3 ld = lo - rp;
		float diff = max(0.0, dot(ld, snor)) * shadow(rp, normalize(ld), 0.01, length(ld), 16.0);
		float amb = 0.1;
		c = diff;
	}
	//c = 0.0;
	gl_FragColor = vec4(c, c, c, 1);
}
