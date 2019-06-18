/*
 * Original shader from: https://www.shadertoy.com/view/XdS3DG
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define s3 1.7320508075688772
#define i3 0.57735026918962584

#define farval 1e5

#define ppp vec3( 1.0,  1.0,  1.0)
#define ppm vec3( 1.0,  1.0, -1.0)
#define pmp vec3( 1.0, -1.0,  1.0)
#define pmm vec3( 1.0, -1.0, -1.0)
#define mpp vec3(-1.0,  1.0,  1.0)
#define mpm vec3(-1.0,  1.0, -1.0)
#define mmp vec3(-1.0, -1.0,  1.0)
#define mmm vec3(-1.0, -1.0, -1.0)

const vec3 tgt = vec3(-0.5, 0.5, 0.5);
const vec3 cpos = vec3(12.51951088,  5.82929222,  23.82997848);

const vec3 fogc = vec3(0.56, 0.58, 0.62);


const mat3 R = mat3(  9.76533123e-01,   3.80711949e-02,  -2.11975573e-01,
					  7.67662775e-04,  -9.84860642e-01,  -1.73346262e-01,
					 -2.15365898e-01,   1.69115641e-01,  -9.61778264e-01);

const mat3 Kinv = mat3( 0.0026788,   0.,          0.,       
			 		    0.,          0.0026788,   0.,
					   -1.07257601, -0.6084867,   1.); 

const vec2 origResolution = vec2(596.0, 486.0);


vec3 L = normalize(vec3(-0.5, 1.5, 1.25));

#define miss vec4(vec3(0.0), farval);


#define rayiter 75
#define marchiter 70
#define dmax 40.0


vec4 pselect(vec4 a, vec4 b) {
	return a.w < b.w ? a : b;
}

float par(vec3 fp) {
	return fract(0.5*dot(vec3(1.0), fp)+0.5) * 4.0 - 1.0;
}

vec4 tetN(in vec3 p) {
	return pselect(pselect(vec4(ppp, dot(mmm,p)), vec4(pmm, dot(mpp,p))),
				   pselect(vec4(mpm, dot(pmp,p)), vec4(mmp, dot(ppm,p))));
}

vec4 classify(in vec3 pos) {
	
	vec3 fp = floor(pos);
	
	vec3 t = fp + 0.5;
	
	float parity = par(fp);
	
	vec4 n = tetN(parity*(pos-t));
		
	return n.w > -0.5 ? vec4(t, parity) : vec4(t + 0.5*parity*n.xyz, 0.0);
	
}


vec4 plane(vec3 o, vec3 d, vec3 n) {

	float denom = dot(d,n);
	return vec4( n, denom < 0.0 ? 1e5 : (1.0-dot(o,n))/denom );
	
}

vec4 uplane(vec3 o, vec3 d, vec3 n) {
	
	float dn = dot(d,n);
	float s = sign(dn);
	float t = (1.0-s*dot(o,n))/(s*dn);
	return vec4( s*n, t );
	
}

// ray test for tetrahedron centered at ctr (assumes ray started inside)
vec4 raytet(in vec3 o, in vec3 d, inout vec4 octet) {
	
	o -= octet.xyz;
	
	o *= 2.0;
	d *= 2.0;
			
	vec4 p = pselect(pselect(plane(o, d, octet.w*ppp), 
							 plane(o, d, octet.w*pmm)),
					 pselect(plane(o, d, octet.w*mpm),
							 plane(o, d, octet.w*mmp)));
	
	octet = vec4(octet.xyz + 0.5 * p.xyz, 0.0);
	
	return vec4(-p.xyz*i3, p.w);
	
}

// ray test for octahedron centered at ctr (assumes ray started inside)
vec4 rayoct(in vec3 o, in vec3 d, inout vec4 octet) { 
	
	o -= octet.xyz;

	vec4 p = pselect(pselect(uplane(o, d, ppp), 
							 uplane(o, d, ppm)), 
					 pselect(uplane(o, d, pmp), 
							 uplane(o, d, pmm))); 
		
	octet.xyz += 0.5*p.xyz;
	octet.w = par(floor(octet.xyz));
	
	return vec4(-p.xyz*i3, p.w);

}


vec3 normalMap(vec3 n, vec3 p, float w) {
	
	vec3 s = sign(n);
	p *= s;
	
	const vec3 nn = vec3(1.0);
	
	vec2 uv = mix(vec2(1.0, 0.0), vec2(-0.5, 0.5), w);
	
	vec3 a = vec3(uv.x, uv.y, uv.y);
	vec3 b = vec3(uv.y, uv.x, uv.y);
	vec3 c = vec3(uv.y, uv.y, uv.x);	

	float k = uv.y-uv.x; 
	float j = uv.y+uv.x;
	
	vec3 nab = vec3(k, k, 0.0);
	vec3 nbc = vec3(0.0, k, k);
	vec3 nca = vec3(k, 0.0, k);
		
	float r = 0.15 - 0.05*w;
	
	vec3 d = clamp((p*mat3(nab, nbc, nca)-j*k)/r, 0.0, 1.0);
	
	return s * normalize(mat3(c,a,b)*d);
	
}


float sdTet(in vec3 p, in float s) {
	return (-tetN(p/s).w*i3 - 0.5*i3)*abs(s);	
}

float sdOct(in vec3 p, in float s) {
	return (dot(vec3(i3), abs(p/s)) - i3)*s;
}

vec3 projLine(vec3 a, vec3 d, vec3 p) {
	return a + d*clamp( dot(p-a, d) / dot(d, d), 0.0, 1.0 );
}

float line(vec3 a, vec3 d, vec3 p) {
	return distance(p, projLine(a, d, p) );
}

float octline(vec3 a, vec3 d, float r, vec3 p) {
	return sdOct(p - projLine(a, d, p), r);
}

float tets(vec3 lo, float n, vec3 pos) {
	
	float py = pos.y - lo.y;
	float ya = clamp(4.0*floor(0.25*py+0.5), 0.0, 4.0*n);
	float yb = clamp(4.0*floor(0.25*py)+2.0, 2.0, 4.0*n+2.0);
	
	return min(sdTet(pos - (lo + vec3(0.0, ya, 0.0)), 3.0),
			   sdTet(pos - (lo + vec3(0.0, yb, 0.0)), 3.0));

}

float pillar(vec3 a, float dy, vec3 p) {
	vec3 pos = vec3(a.x, clamp(p.y, a.y, a.y+dy), a.z);
	return distance(pos,p);
}

#define intersect(a, b) max(a,b)
#define unite(a, b) min(a,b)
#define subtract(a, b) max(a,-(b))

float env(in vec3 pos) {

#define dppp dot(pos, ppp)
#define dppm dot(pos, ppm)
#define dpmp dot(pos, pmp)
#define dpmm dot(pos, pmm)
#define dmpp dot(pos, mpp)
#define dmpm dot(pos, mpm)
#define dmmp dot(pos, mmp)
#define dmmm dot(pos, mmm)


#define pA (dpmp)
#define pB (dmmp+14.0)
#define pC (dmpp-4.0)
#define pD (dpmm-4.0)
#define pE (dmmm-12.0)
#define pF (dppm+10.0)
#define pG (dmpm-20.0)
#define pH (dpmm+24.0)
#define pI (dppp-20.0)
#define pJ (dpmm+6.0)
#define pK (dmmm+26.0)
#define pL (dmpm+14.0)
#define pM (dmpp+16.0)
#define pN (dppp+0.0)
#define pO (dmmp+16.0)
#define pP (dppp+22.0)
#define pQ (dmmp)
#define pR (dpmp+26.0)
#define pS (dmpp+14.0)
#define pT (dppp-28.0)
#define pU (dmpm+14.0)
#define pV (dpmp+40.0)

	float o = intersect(intersect(pA, pE), intersect(pC, pD));
	o = unite(o, intersect(intersect(pA, pF), intersect(pG, pI)));
	o = unite(o, intersect(pA, intersect(pH, pI)));
	o = unite(o, intersect(intersect(pA, pB), pD));
	o = unite(o, intersect(pA, pO));
	o = unite(o, intersect(pB, pJ));
	o = unite(o, intersect(pB, pK));
	o = unite(o, intersect(pB, pL));
	o = unite(o, intersect(pM, pN));
	o = unite(o, subtract(intersect(pC, pQ), pE));
	o = unite(o, intersect(pP, pR));
	o = unite(o, intersect(intersect(pS, pT), pU));	
	o = unite(o, pV);
	
	o*= i3;
	

	// bounding octahedron
	//o = unite(o, -sdOct(pos-vec3(12.0, 5.0, 23.0), 70.0));

	// left platform
	o = unite(o, sdOct(pos-vec3(-16.0, -6.0, 8.0), 14.0));

	// center platform
	o = unite(o, sdOct(pos-vec3(0.0, -8.0, -2.0), 10.0));

	// center bottom platform	
	o = unite(o, octline(vec3(0.0, -16.0, 8.0), vec3(8.0, 0.0, 8.0), 8.0, pos));

	// left platform
	o = unite(o, octline(vec3(-15.0, -0.0, 15.0), vec3(0.0, -6.0, 6.0), 8.0, pos));
	
	// bottom left platform
	o = unite(o, sdOct(pos - vec3(3.0, -9.0, 21.0), 11.0));
	
	// upper right "decoration"
	o = unite(o, sdTet(pos-vec3(13.5, 8.5, 9.5), -3.0));
	o = unite(o, sdTet(pos-vec3(13.0, 8.0, 10.0), 2.0));
	o = unite(o, sdOct(pos-vec3(12.0, 7.0, 11.0), 2.0));
	
	// center right pillar
	o = unite(o, pillar(vec3(5.0, -6.0, 0.0), 12.0, pos) - 0.75);
	
	// right pillar below decoration	
	o = unite(o, pillar(vec3(15.5, -5.0, 6.5), 10.0, pos) - 0.75);

	// line off of center platform
	o = unite(o, line(vec3(0.0, -8.0, 7.0), vec3(8.0, 0.0, 8.0), pos) - 0.75 );
	
	// line from left plattform to lower platform
	o = unite(o, line(vec3(-3.0, -6.0, 8.0), vec3(3.0, -3.0, 0.0), pos) - 0.75 );
	
	// center left pillar
	o = unite(o, pillar(vec3(-6.75, 1.5, 5.75), 10.0, pos) - 0.5 );

	// center pillar
	o = unite(o, intersect(pA, tets(vec3(-0.5, 1.5, -0.5), 3.0, pos)));

	// left pillar
	o = unite(o, pillar(vec3(-5.0, -20.0, 11.0), 30.0, pos) - 1.25 );
		
	// pointy line between right pillars
	o = unite(o, line(vec3(7.75, -5.5, -2.75), vec3(-8.0, 0.0, -8.0), pos) -0.7);

	// octahedron outline in middle
	vec3 p = vec3(11.0, -1.0, 13.0);
	o = unite(o, line(p, vec3( 8.0, -8.0,  0.0), pos)-0.6);
	o = unite(o, line(p, vec3(-8.0, -8.0,  0.0), pos)-0.6);
	o = unite(o, line(p, vec3( 0.0, -8.0,  8.0), pos)-0.6);
	o = unite(o, line(p, vec3( 0.0, -8.0, -8.0), pos)-0.6);
	
	return o;

}


vec3 fog(vec3 color, float t) {
	float fogv = exp(-0.0006*t*t);
	return mix(fogc, color, fogv);
}



float smin( float a, float b ) {
	const float k = 0.05;
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float smax(float x, float y) {
	return -smin(-x, -y);
}

float wedge(in vec3 pos, float a, float b, float r) {
	float s1 = length(pos - vec3( a, -b, 0.0))-r;
	float s2 = length(pos - vec3(-a, -b, 0.0))-r;
	return smax(-pos.y, smax(s1, s2));
}

float wtip(in vec3 pos) {
	return smax(-pos.z, wedge(pos-vec3(0.0, 0.0, -0.6), 1.85, 3.4, 4.0));
}

vec2 eye(vec2 pos) {
	
	pos.y -= 0.85;
	pos = abs(pos);
	pos.y *= 0.7;
	
	const vec2 ctr = vec2(0.055, 0);
	const float r0 = 0.035;
	const float r1 = 0.015;
	const float r2 = 0.013;
	
	pos -= ctr;
	
	float w = step(length(pos),r0);
	
	const float sx = 1.5;
	const float sy = 1.0; 
	
	vec2 pc = r1 * normalize(dot(pos, vec2(sx, sy)) > 0.0 ? vec2(-sy, sx) : pos);
	float p = step(length(pos - pc), r2);
	
	return vec2(w, p);
	
}


vec2 opU(in vec2 a, in vec2 b) {
	return a.x < b.x ? a : b;
}


vec2 worm(in vec3 p) {
	
	const float scale = 6.0;
	
	p /= scale;

	p.z += 0.16;
	p.y += 0.03;
						 
	const float f = 6.0;
	const float a = 0.03;
	p.y += a*sin(f*p.z+5.0*iTime);
	
	vec2 e = eye(p.xz);
	
	float stripe = 0.5 + 0.49*sin(p.z*70.0);
	stripe = mix(0.0, stripe, smoothstep(0.02, 0.1, p.y));
	
	float c = mix(0.7-0.1*stripe, mix(2.0, 1.0, e.y), e.x);
	
	float body =  wedge(p, 1.70, 3.5, 4.0);
				  
	p.z -= 0.8;
	float nose = wtip(p);
	
	const vec3 delta = vec3(0.0, 0.0, 0.05);
	
	float cheeks = smin(wtip(p.zyx + delta), 
						wtip((p.zyx - delta)*vec3(1.0, 1.0, -1.0)));
	
	float head = smin(nose, cheeks);
	
	
	return vec2( scale*smin(body, head), c );
	
	//return eye(p) * vec2(scale, 1.0);

}

float sdBox( in vec3 p, in vec3 b ) {
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
	
#define wdims vec3(1.4, 0.7, 5.4)

vec4 wormline(in vec3 p0, in vec3 d, in float a, in float b, in vec3 pos) {

	vec3 z = normalize(d);
	vec3 x = normalize(cross(vec3(0.0, 1.0, 0.0), z));
	vec3 y = cross(z, x);
		
	vec3 p = (pos - (p0 + (a + mod(4.0*iTime, b-a))*z))*mat3(x,y,z);
	
	float w = sdBox(p, wdims);
	
	return vec4(p, w);
	
}


vec2 map(in vec3 pos) {	

	// mid right to bottom left
	vec4 o = wormline(vec3(16.0, -1.5, -9.0), 
					  vec3(-2.0, -0.4, 2.4), 
					  -7.0, 44.0, pos);	
	
	// back center to left
	o = pselect(o, wormline(vec3(-13.0, -0.5, -10.5), 
							vec3(2.2, 0.4, 4.0), 
							-3.0, 44.0, pos));
	
	// right of center to bottom right
	o = pselect(o, wormline(vec3(1.0, 0.0, -11.0),
							vec3(2.0, -0.0, 2.0),
							-4.0, 35.0, pos));
	
	// left to mid right	
	o = pselect(o, wormline(vec3(-6.0, 3.6, 10.0),
							vec3(11.0, -1.6, -12.0),
							-14.0, 40.0, pos));

	// thru pyramid
	o = pselect(o, wormline(vec3(11.0, -3.9, 14.5),
							vec3(-1.0, 0.25, 0.1), 
							-15.0, 26.0, pos));
	
	// close top to bottom
	o = pselect(o, wormline(vec3(-5.0, 14.0, 11.0), 
							vec3(0.3, -0.2, 0.2),
							-1.0, 33.0, pos));
	
	if (o.w > 0.2) {
		return vec2(o.w, 1.8);
	} else {
		return worm(o.xyz);
	}
	
}

vec2 castRay( in vec3 ro, in vec3 rd, in float maxd ) {
	float precis = 0.001;
    float h=precis*2.0;
    float t = 0.0;
    float m = -1.0;
    for( int i=0; i<marchiter; i++ )
    {
        if( abs(h)<precis||t>maxd ) continue;//break;
        t += h;
	    vec2 res = map( ro+rd*t );
        h = res.x;
	    m = res.y;
    }
	if (t > maxd) { m = -1.0; }
    return vec2( t, m );
}

vec3 calcNormal( in vec3 pos ) {
	
	vec3 eps = vec3( 0.03, 0.0, 0.0 );

	vec3 nor = vec3(
	    map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	    map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	    map(pos+eps.yyx).x - map(pos-eps.yyx).x );

	return normalize(nor);
	
}

vec3 hue(float h) {
	vec3 c = mod(h*6.0 + vec3(2, 0, 4), 6.0);
	return h >= 1.0 ? vec3(h-1.0) : (clamp(min(c, -c+4.0), 0.0, 1.0)*0.75 + 0.2);
}

vec3 light(in vec3 color, in vec3 n, in vec3 rd, in float specc, in float spece) {
	vec3 diffamb = color*clamp(dot(n,L), 0.0, 1.0);
	return diffamb + specc*pow(clamp(dot(rd, reflect(L,n)), 0.0, 1.0), spece);
}

vec4 raymarch( in vec3 ro, in vec3 rd ) {
	
	vec2 tm = castRay(ro, rd, dmax);
	
	if (tm.y >= 0.0) {
		vec3 n = calcNormal(ro + tm.x * rd);
		vec3 color = light(hue(tm.y), n, rd, 0.4, 40.0);
		return vec4(color, tm.x);
	} else {
		return vec4(vec3(0.0), 1e5);
	}
	
}


/*
vec4 raymarch( in vec3 ro, in vec3 rd ) {
	
	vec3 t = vec3(4.0, 0.0, 4.0) + sin(iTime)*vec3(4.0, 5.0, 0.0);

	// p = ro + s*rd
	// p' = R(ro + s*rd) + t
	
	// ro' = Rro + t
	// rd' = Rrd
	
	mat3 M = R;
	
	rd = M*rd;
	ro = M*ro - M*t;
	
	vec3 rdi = 1.0/rd;	
	vec3 b = vec3(1.0, 0.5, 3.0);
		
	vec3 t1 = (-b - ro)*rdi;
	vec3 t2 = ( b - ro)*rdi;
	
	vec3 tvmin = min(t1, t2);
	vec3 tvmax = max(t1, t2);
		
	float tmin = max(max(tvmin.x, tvmin.y), tvmin.z);
	float tmax = min(min(tvmax.x, tvmax.y), tvmax.z);		
	
	if (tmin <= tmax) {
		return vec4(vec3(1.0), tmin);
	} else {
		return miss;
	}
 
}
*/

vec4 raytrace(in vec3 ro, in vec3 rd) {
	
	vec4 h = miss;

	float t = 7.0;
	ro += t*rd;
	
	vec4 octet = classify(ro);
	
	vec3 p = ro;
	
	for (int iter=0; iter<rayiter; ++iter) {
		
		if (h.w < 1e5) { continue; }
							
		vec4 s = (octet.w == 0.0) ? rayoct(p, rd, octet) : raytet(p, rd, octet);
		
		p += s.w*rd;
		t += s.w;

		if (env(octet.xyz) < 0.0) {
			vec3 nn = normalMap(s.xyz, p-octet.xyz, abs(octet.w));
			h = vec4(normalize(mix(nn, s.xyz, smoothstep(20.0, 50.0, t))), t);
		}

	}
	
	vec3 col = fogc; 

	if (h.w < farval) {
		vec3 l = light(vec3(0.95, 0.98, 1.0), h.xyz, rd, 0.3, 5.0);
		vec3 e = texture(iChannel0, R*reflect(rd, h.xyz)).zyx;
		col = mix(l, e, 0.18);
	}	
	
	return vec4(col, h.w);
	
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {	

	vec2 theta = vec2(0.0);
	
	if (max(iMouse.x, iMouse.y) > 20.0) { 
		theta.yx = (iMouse.xy - 0.5*iResolution.xy) * 0.3 / iResolution.xy;
	}

	float cx = cos(theta.x);
	float sx = sin(theta.x);
	float cy = cos(theta.y);
	float sy = sin(theta.y);
	
	mat3 Rx = mat3(1.0, 0.0, 0.0, 
				   0.0, cx, sx,
				   0.0, -sx, cx);
	
	mat3 Ry = mat3(cy, 0.0, -sy,
				   0.0, 1.0, 0.0,
				   sy, 0.0, cy);

	float resScale = origResolution.y / iResolution.y;
	
	vec2 uv = (fragCoord.xy - 0.5*iResolution.xy) * vec2(resScale, -resScale) + 0.5*origResolution;
	
	
	mat3 RR = R*Ry*Rx*mat3(R[0].x, R[1].x, R[2].x,
						   R[0].y, R[1].y, R[2].y,
						   R[0].z, R[1].z, R[2].z);
	

	vec3 cam = cpos;
	vec3 tar = mix(cam, tgt, 0.75);

#if 1
	cam += vec3(0.0, 0.1*sin(1.3*iTime), 0.0);
	uv.x += (2.0 + 1.0*sin(0.04*uv.y+0.7*iTime+3.0)) * sin(0.05*uv.y + 2.0*iTime);
#endif

	vec3 ro = RR*(cam-tar) + tar;
	vec3 rd = RR*normalize((Kinv*vec3(uv,1.0))*R);
	
	vec4 bg = raytrace(ro, rd);
	vec4 fg = raymarch(ro, rd);
	
	vec4 p = pselect(bg, fg);
	
	vec3 col = fog(p.xyz, p.w);
	
	col = pow(col, vec3(0.7));
	
	fragColor.xyz = col;
	
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
