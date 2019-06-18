//frorked by T_S / RTX1911
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define EPSM  0.9999

//iq's tools.
float hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

vec4 tv(vec4 col, vec2 pos)
{	
	float speed = 0.0;
	
	vec4 tmp;
	
	// vibrating rgb-separated scanlines
	tmp.r = sin(( pos.y + 0.0002 + sin(time * 64.0) * 0.0002 ) * resolution.y * 2.0 + time * speed);
	tmp.g = sin(( pos.y + 0.0004 - sin(time * 70.0) * 0.0002 ) * resolution.y * 2.0 + time * speed);
	tmp.b = sin(( pos.y + 0.0006 + sin(time * 90.0) * 0.0002 ) * resolution.y * 2.0 + time * speed);

	// normalize tmp
	tmp = clamp(tmp, 0.75, 1.0);
	
	// accumulate
	col *= tmp;
	
	// grain
	float grain = hash( ( pos.x + hash(pos.y) ) * time ) * 0.15;
	col += grain;
	
	// flicker
	float flicker = ( sin(hash(time)) + 0.5 ) * 0.075;
	col += flicker;
	
	// vignette
	vec2 t = 1.0 * ( pos);
	
	t *= t;
	
	float d = 1.0 - clamp( length( t ), 0.0, 1.0 );
	
	col *= d;
	
	return col;
}


float hexp( vec2 p, vec2 h )
{
    vec2 q = abs(p);
    return max(q.x-h.y,max(q.x+q.y*0.57735,q.y*1.1547)-h.x);
}

float plane(vec3 p, float D) {
	return D - dot(abs(p), normalize(vec3(0.0, 1.0, 0.0)));
}

vec2 rot(vec2 p, float a) {
	return vec2(
		cos(a) * p.x - sin(a) * p.y,
		sin(a) * p.x + cos(a) * p.y);
}

vec3 map(vec3 p) {
	vec3 pp = p;
	
	//ground
	float k = plane(pp, 0.7);
	
	//PYRAMID
	pp = mod(-abs(p), 1.0) - 0.5;
	
	float tim = time * 2.0 + sin(time * 1.14) * 4.0;
	for(int e = 0 ; e < 6; e++) {
		//rotate
		if( floor(float(e) / 2.0) > 0.0 ) tim = -tim;
		vec3 ppp = pp;
		
		//get fake unique angle.
		ppp.xz = rot(ppp.xz, tim * 0.3 + ceil(p.z) / (1.5));
		k = min(k, max(ppp.y - 0.08 * float(e), hexp(ppp.xz, vec2(0.48 - 0.08 * float(e)))) );
	}
	return vec3(pp.xz, k);
}
	
void main( void ) {
	vec2 uv    = -1.0 + 2.0 * ( gl_FragCoord.xy / resolution.xy );
	
	//ray
	vec3 dir   = normalize(vec3(uv * vec2(resolution.x / resolution.y, 1.0), 1.0)).xyz;
	
	//rotate
	dir.xz = rot(dir.xz, cos(time * 0.25) * 0.5);
	dir.yz = rot(dir.yz, sin(time * 0.25) * 0.25);
	//dir.xy = rot(dir.xy, time * 0.005);
	
	//camera 
	vec3 pos   = vec3(0.0);
	pos.x	   = mouse.x -0.5;
	pos.y	   = mouse.y * 0.25 - 0.125;
	pos.z     += time * 0.5;
	pos.x     += sin(time * 0.5) * 0.125;
	
	//col
	vec3  col  = vec3(0.0);
	float t    = 0.01;

	//raymarching
	vec3  gm   = vec3(0.0);
	for(int i  = 0 ; i < 64; i++) {
		gm = map(pos + dir * t * EPSM);
		t += gm.z;
	}
	vec3  IP   = pos + dir * t;
	
	//fake shadow and fake ao : http://pouet.net/topic.php?which=7535&page=1
	vec3  L    = vec3(-0.5, 1.2, -0.7); //norm...
	float Sef  = 0.05;
	float S1   = max(map(IP + Sef * L).z, 0.005);
	col        = max(vec3(S1), 0.0);
	
	//sun
	vec3 sun   = mix(vec3(1, 2, 3), vec3(1, 2, 3).zyx, t * 0.5) * 0.04;
	col        = sqrt(col) + dir.zxy * 0.005+ t * 0.05 + sun;
	vec4 fcol  = vec4(col.gbr, 1.0);
	fcol = tv(fcol, uv);
	gl_FragColor = fcol;
	gl_FragColor *= mod(gl_FragCoord.y, 2.0);
}
