/*
 * Original shader from: https://www.shadertoy.com/view/ld2yDz
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
const vec4 iMouse = vec4(0.);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// 6 shaders mapped on the 6 faces of a cube without any buffer
//
// Coded because I love cubes (don't ask me why)
// and also love the retro amiga scene.
//
// The six shaders I love and I used here:
//
// Face 1: WWDC14 by capnslipp - https://www.shadertoy.com/view/XdfyRB
// Face 2: Plasma by Klk - https://www.shadertoy.com/view/XsVSzW
// Face 3: YaraGui by dila - https://www.shadertoy.com/view/ldlyWS
// Face 4: Combustible Voronoi by Shane - https://www.shadertoy.com/view/4tlSzl
// Face 5: Ring twister by Flyguy - https://www.shadertoy.com/view/Xt23z3
// Face 6: Glenz by myself - https://www.shadertoy.com/view/4lt3R7 
//
// The rasterization is from: https://www.shadertoy.com/view/MdS3Rz by Hlorenzi
// The sinus croll is by myself improved by gPlatl
//
// Tune is from the game Xenon2 on Amiga


vec3 xcolor = vec3(0.2, 0.5, 1.0);
vec2 xtp  = vec2(0);  // text position
vec2 xpos = vec2(0);
float tau = atan(1.0) * 8.0;
float pi = atan(1.0) * 4.0;
float aaSize = 0.0;
vec3 cubevec = vec3(0);

#define FONT_SIZE1 0.45
#define FONT_SIZE2 0.3
#define FONT_SPACE 0.42
#define SIN_FREQ 0.75
#define SIN_SPEED 3.0
#define SCROLL_LEN 65.
#define SCROLL_SPEED 2.0
#define SIN_AMP 0.5
#define S(a) c+=char(float(a)); xtp.x-=FONT_SPACE;
#define xtime iTime
#define NUM_FACES 4
#define IN_RADIUS 0.25
#define OUT_RADIUS 0.70
#define XSCROLL_SPEED -0.9
#define COLOR_1 0.50, 0.90, 0.95
#define COLOR_2 0.95, 0.60, 0.10

vec3 calcSine(vec2 uv, float frequency, float amplitude, float shift, float offset, vec3 color, float width, float exponent)
{
    float y = sin(iTime * frequency + shift + uv.x) * amplitude + offset;
    float d = distance(y, uv.y);
    float scale = smoothstep(width, 0.0, distance(y, uv.y));
    return color * scale;
}

vec3 Bars(vec2 uv)
{
    //vec2 uv = f / iResolution.xy;
    vec3 color = vec3(0.0);
    color += calcSine(uv, 2.0, 0.25, 0.0, 0.5, vec3(0.0, 0.0, 1.0), 0.1, 3.0);
    color += calcSine(uv, 2.6, 0.15, 0.2, 0.5, vec3(0.0, 1.0, 0.0), 0.1, 1.0);
    color += calcSine(uv, 0.9, 0.35, 0.4, 0.5, vec3(1.0, 0.0, 0.0), 0.1, 1.0);
    return color;
}

vec3 Twister(vec3 p)
{
    float f = sin(iTime/3.)*1.45;
    float c = cos(f*p.y);
    float s = sin(f/2.*p.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

float Cube( vec3 p )
{
    p=Twister(p);
    cubevec.x = sin(iTime);
    cubevec.y = cos(iTime);
    mat2 m = mat2( cubevec.y, -cubevec.x, cubevec.x, cubevec.y );
    p.xy *= m;p.xy *= m;p.yz *= m;p.zx *= m;p.zx *= m;p.zx *= m;
    cubevec = p;
    return length(max(abs(p)-vec3(0.4),0.0))-0.08;
}

float Face( vec2 uv )
{
        uv.y = mod( uv.y, 1.0 );
        return ( ( uv.y < uv.x ) != ( 1.0 - uv.y < uv.x ) ) ? 1.0 : 0.0;
}

vec3 getNormal( in vec3 p )
{
    vec2 e = vec2(0.005, -0.005);
    return normalize(
        e.xyy * Cube(p + e.xyy) +
        e.yyx * Cube(p + e.yyx) +
        e.yxy * Cube(p + e.yxy) +
        e.xxx * Cube(p + e.xxx));
}

vec4 Glenz(in vec2 uv )
{
    float pat = iTime*5.0;
    float Step = 1.0;
    float Distance = 0.0;
    float Near = -1.0;
    float Far = -1.0;
    vec3 lightPos = vec3(1.5, 0, 0);
    vec2 p = -1.0 + uv *2.0;
    vec2 kp=uv;
    vec4 m = iMouse / iResolution.xxxx;
    float hd=-1.;
    
    vec3 ro = vec3( 0.0, 0.0, 2.1 );
    vec3 rd = normalize( vec3( p, -2. ) );
    for( int i = 0; i < 256; i++ )
        {
        	Step = Cube( ro + rd*Distance );
            Distance += Step*.5;

            if( Distance > 4.0 ) break;
            if( Step < 0.001 )
            	{
                 	Far = Face( cubevec.yx ) + Face( -cubevec.yx ) + Face( cubevec.xz ) + Face( -cubevec.xz ) + Face( cubevec.zy ) + Face( -cubevec.zy );
            		if(hd<0.) hd=Distance;
                    if( Near < 0.0 ) Near = Far;
            		if(m.z<=0.0) Distance += 0.05; else break; // 0.05 is a magic number 
                }
        }

    vec3 Color=Bars(uv);
    if( Near > 0.0 )
    	{
            vec3 sp = ro + rd*hd;
        	vec3 ld = lightPos - sp;
            float lDist = max(length(ld), 0.001);
            ld /= lDist;
            float atten = 1./(1. + lDist*.2 + lDist*.1); 
            float ambience = 0.7;
            vec3 sn = getNormal( sp);
            float diff = min(0.3,max( dot(sn, ld), 0.0));
            float spec = pow(max( dot( reflect(-ld, sn), -rd ), 0.0 ), 32.);
            if(m.z<=0.) Color = Color/5. + mix( vec3( 0.2, 0.0, 1.0 ), vec3( 1.0, 1.0, 1.0 ), vec3( ( Near*0.45 + Far*Far*0.04 ) ) );
            else Color = mix( vec3( 0.2, 0.0, 1.0 ), vec3( 1.0, 1.0, 1.0 ), vec3( ( Near*0.45 + Far*Far*0.04 ) ) );
            Color = Color*(diff+ambience)+vec3(0.78,0.5,1.)*spec/1.5;
        }
    return vec4( Color, 1.0 );
}



vec4 slice(float x0, float x1, vec2 uv)
{
    float u = (uv.x - x0)/(x1 - x0);
    float w = (x1 - x0);
    vec3 col = vec3(0);
    col = mix(vec3(COLOR_1), vec3(COLOR_2), u);
    col *= w / sqrt(2.0 * IN_RADIUS*IN_RADIUS * (1.0 - cos(tau / float(NUM_FACES))));
    col *= smoothstep(0.05, 0.10, u) * smoothstep(0.95, 0.90, u) + 0.5;
    uv.y += iTime * XSCROLL_SPEED; //Scrolling
    col *= (-1.0 + 2.0 * smoothstep(-0.03, 0.03, sin(u*pi*4.0) * cos(uv.y*16.0))) * (1.0/16.0) + 0.7;
    float clip = 0.0;
    clip = (1.0-smoothstep(0.5 - aaSize/w, 0.5 + aaSize/w, abs(u - 0.5))) * step(x0, x1);
    return vec4(col, clip);
}

vec4 Ring(in vec2 uv)
{
    aaSize = 2.0 / iResolution.y;
    uv = uv * 2.0 - 1.0;
    vec2 uvr = vec2(length(uv), atan(uv.y, uv.x) + pi);
    uvr.x -= OUT_RADIUS;
    vec3 col = vec3(0.05);
    float angle = uvr.y + 2.0*iTime + sin(uvr.y) * sin(iTime) * pi;
    
    for(int i = 0;i < NUM_FACES;i++)
    {
        float x0 = IN_RADIUS * sin(angle + tau * (float(i) / float(NUM_FACES)));
        float x1 = IN_RADIUS * sin(angle + tau * (float(i + 1) / float(NUM_FACES)));
        vec4 face = slice(x0, x1, uvr);
        col = mix(col, face.rgb, face.a); 
    }
	return vec4(col, 1.0);
}


vec3 firePalette(float i){

    float T = 1400. + 1300.*i;
    vec3 L = vec3(7.4, 5.6, 4.4);
    L = pow(L,vec3(5.0)) * (exp(1.43876719683e5/(T*L))-1.0);
    return 1.0-exp(-5e8/L);
}

vec3 hash33(vec3 p){ 
    
    float n = sin(dot(p, vec3(7, 157, 113)));    
    return fract(vec3(2097152, 262144, 32768)*n); 
}

float xvoronoi(vec3 p){

	vec3 b, r, g = floor(p);
	p = fract(p);
	float d = 1.; 
	for(int j = -1; j <= 1; j++) {
	    for(int i = -1; i <= 1; i++) {
    		
		    b = vec3(i, j, -1);
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
    		
		    b.z = 0.0;
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
    		
		    b.z = 1.;
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
    			
	    }
	}
	
	return d;
}

float noiseLayers(in vec3 p) {
    vec3 t = vec3(0., 0., p.z+iTime*1.5);

    const int iter = 5;
    float tot = 0., sum = 0., amp = 1.;

    for (int i = 0; i < iter; i++) {
        tot += xvoronoi(p + t) * amp;
        p *= 2.0;
        t *= 1.5;
        sum += amp;
        amp *= 0.5;
    }
    return tot/sum;
}

vec4 Voronoi(in vec2 uv )
{
    uv = uv * 2.0 - 1.0;
	uv += vec2(sin(iTime*0.5)*0.25, cos(iTime*0.5)*0.125);
	vec3 rd = normalize(vec3(uv.x, uv.y, 3.1415926535898/8.));
	float cs = cos(iTime*0.25), si = sin(iTime*0.25);
	rd.xy = rd.xy*mat2(cs, -si, si, cs); 
	float c = noiseLayers(rd*2.);
	c = max(c + dot(hash33(rd)*2.-1., vec3(0.015)), 0.);
    c *= sqrt(c)*1.5;
    vec3 col = firePalette(c);
    col = mix(col, col.zyx*0.15+c*0.85, min(pow(dot(rd.xy, rd.xy)*1.2, 1.5), 1.));
    col = pow(col, vec3(1.5));
	return vec4(sqrt(clamp(col, 0., 1.)), 1.);
}

float char(float ch)
{
  vec4 f = texture(iChannel0,clamp(xtp,0.,1.)/16.+fract(floor(vec2(ch,15.999-float(ch)/16.))/16.));
  return f.x;
}

vec4 ScrollText(vec2 xuv)
{
    xtp = xuv / FONT_SIZE1;  // set font size
    xtp.x = 2.0*(xtp.x -4. +mod(xtime*SCROLL_SPEED, SCROLL_LEN));
    xtp.y = xtp.y +1.7 +SIN_AMP*sin(xtp.x*SIN_FREQ +xtime*SIN_SPEED);
    float c = 0.0;
    
    S(32.);S(32.);S(32.);S(32.);S(32.);S(32.);S(72.);S(101.);S(108.);S(108.);S(111.);S(32.);
    S(115.);S(104.);S(97.);S(100.);S(101.);S(114.);S(116.);S(111.);S(121.);S(32.);S(33.);S(33.);
    S(32.);S(84.);S(104.);S(105.);S(115.);S(32.);S(105.);S(115.);S(32.);S(97.);S(32.);S(99.);
    S(117.);S(98.);S(101.);S(32.);S(119.);S(105.);S(116.);S(104.);S(32.);S(97.);S(32.);S(115.);
    S(104.);S(97.);S(100.);S(101.);S(114.);S(32.);S(109.);S(97.);S(112.);S(112.);S(101.);S(100.);
    S(32.);S(111.);S(110.);S(32.);S(101.);S(97.);S(99.);S(104.);S(32.);S(102.);S(97.);S(99.);
    S(101.);S(32.);S(99.);S(111.);S(100.);S(101.);S(100.);S(32.);S(105.);S(110.);S(32.);S(49.);
    S(57.);S(57.);S(48.);S(32.);S(97.);S(109.);S(105.);S(103.);S(97.);S(32.);S(114.);S(101.);
    S(116.);S(114.);S(111.);S(32.);S(115.);S(116.);S(121.);S(108.);S(101.);S(32.);S(46.);S(46.);
    S(46.);S(46.);S(32.);S(73.);S(32.);S(106.);S(117.);S(115.);S(116.);S(32.);S(109.);S(105.);
    S(120.);S(101.);S(100.);S(32.);S(115.);S(101.);S(118.);S(101.);S(114.);S(97.);S(108.);S(32.);
    S(115.);S(104.);S(97.);S(100.);S(101.);S(114.);S(115.);S(32.);S(116.);S(111.);S(103.);S(101.);
    S(116.);S(104.);S(101.);S(114.);S(32.);S(46.);S(46.);S(46.);S(46.);S(32.);S(82.);S(101.);
    S(97.);S(100.);S(32.);S(116.);S(104.);S(101.);S(32.);S(99.);S(111.);S(100.);S(101.);S(32.);
    S(102.);S(111.);S(114.);S(32.);S(99.);S(114.);S(101.);S(100.);S(105.);S(116.);S(115.);S(32.);
    S(46.);S(46.);S(46.);S(46.);S(46.);S(32.);S(73.);S(32.);S(99.);S(111.);S(100.);S(101.);
    S(100.);S(32.);S(116.);S(104.);S(105.);S(115.);S(32.);S(98.);S(101.);S(99.);S(97.);S(117.);
    S(115.);S(101.);S(32.);S(73.);S(32.);S(108.);S(111.);S(118.);S(101.);S(32.);S(99.);S(117.);
    S(98.);S(101.);S(115.);S(32.);S(97.);S(110.);S(100.);S(32.);S(65.);S(109.);S(105.);S(103.);
    S(97.);S(32.);S(46.);S(46.);S(46.);S(46.);S(46.);S(32.);S(72.);S(105.);S(109.);S(114.);
    S(101.);S(100.);S(32.);S(46.);S(46.);S(46.);S(46.);S(32.);S(69.);S(79.);S(84.);S(32.);
    S(46.);S(46.);S(46.);S(46.);
    return c * vec4(xpos, 0.5+0.5*sin(2.0*xtime),1.0);
}


vec4 Plasma(vec2 uv )
{
	float time=iTime*1.0;
	uv = (uv-0.0)*6.0;
    vec2 uv0=uv;
	float i0=1.0;
	float i1=1.0;
	float i2=1.0;
	float i4=0.0;
	for(int s=0;s<7;s++)
	{
		vec2 r;
		r=vec2(cos(uv.y*i0-i4+time/i1),sin(uv.x*i0-i4+time/i1))/i2;
        r+=vec2(-r.y,r.x)*0.3;
		uv.xy+=r;
        
		i0*=1.93;
		i1*=1.15;
		i2*=1.7;
		i4+=0.05+0.1*time*i1;
	}
    float r=sin(uv.x-time)*0.5+0.5;
    float b=sin(uv.y+time)*0.5+0.5;
    float g=sin((uv.x+uv.y+sin(time*0.5))*0.5)*0.5+0.5;
	return vec4(r,g,b,1.0);
}

float sdBoxXY( vec3 p, vec3 b )
{
  vec2 d = abs(p.xy) - b.xy;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float udRoundBox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}

float smin( float a, float b, float k )
{
    float res = exp( -k*a ) + exp( -k*b );
    return -log( res )/k;
}

mat2 rot(float x) {
	return mat2(cos(x), sin(x), -sin(x), cos(x));
}

float map(vec3 p) {
    float k = 0.5 * 2.0;
	vec3 q = (fract((p - vec3(0.25, 0.0, 0.25))/ k) - 0.5) * k;
    vec3 s = vec3(q.x, p.y, q.z);
    float d = udRoundBox(s, vec3(0.1, 1.0, 0.1), 0.05);
    
    k = 0.5;
    q = (fract(p / k) - 0.5) * k;
    s = vec3(q.x, abs(p.y) - 1.5, q.z);
    float g = udRoundBox(s, vec3(0.17, 0.5, 0.17), 0.2);
    
    float sq = sqrt(0.5);
    vec3 u = p;
    u.xz *= mat2(sq, sq, -sq, sq);
    d = max(d, -sdBoxXY(u, vec3(0.8, 1.0, 0.8)));
    
    return smin(d, g, 16.0);
}

vec3 normal(vec3 p)
{
	vec3 o = vec3(0.001, 0.0, 0.0);
    return normalize(vec3(map(p+o.xyy) - map(p-o.xyy),
                          map(p+o.yxy) - map(p-o.yxy),
                          map(p+o.yyx) - map(p-o.yyx)));
}

float trace(vec3 o, vec3 r) {
    float t = 0.0;
    for (int i = 0; i < 32; ++i) {
        t += map(o + r * t);
    }
    return t;
}

vec4 Room(vec2 uv )
{
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    
    float gt = iTime / 5.0;
    vec3 r = normalize(vec3(uv, 1.7 - dot(uv, uv) * 0.1));
    float sgt = sin(gt * 3.141592 * 2.0);
    r.xy *= rot(sgt * 3.141592 / 8.0);
    r.xz *= rot(3.141592 * 0.0 + gt * 3.141592 * 2.0);
    r.xz *= rot(3.141592 * -0.25);

    vec3 o = vec3(0.0, 0.0, gt * 5.0 * sqrt(2.0) * 2.0);
    o.xz *= rot(3.141592 * -0.25);

    float t = trace(o, r);
    vec3 w = o + r * t;
    vec3 sn = normal(w);
    float fd = map(w);

    vec3 col = vec3(0.514, 0.851, 0.933) * 0.5;
    vec3 ldir = normalize(vec3(-1, -0.5, 1.1));

    float fog = 1.0 / (1.0 + t * t * 0.1 + fd * 100.0);
    float front = max(dot(r, -sn), 0.0);
    float ref = max(dot(r, reflect(-ldir, sn)), 0.0);
    float grn = pow(abs(sn.y), 3.0);

    vec3 cl = vec3(grn);
    cl += mix(col*vec3(1.5), vec3(0.25), grn) * pow(ref, 16.0);
    cl = mix(col, cl, fog);

	return vec4(cl, 1.0);
}

vec4 t(vec2 uv)
{
    float j = sin(uv.y * 3.14 + iTime * 5.0);
    float i = sin(uv.x * 15.0 - uv.y * 2.0 * 3.14 + iTime * 3.0);
    float n = -clamp(i, -0.2, 0.0) - 0.0 * clamp(j, -0.2, 0.0);
    return 3.5 * (vec4(xcolor, 1.0) * n);
}

vec4 Twirl(vec2 p)
{
    vec2 uv;
    p=-1.+2.*p;
    
    float r = sqrt(dot(p, p));
    float a = atan(
        p.y * (0.3 + 0.1 * cos(iTime * 2.0 + p.y)),
        p.x * (0.3 + 0.1 * sin(iTime + p.x))
    ) + iTime;
    
    uv.x = iTime + 1.0 / (r + .01);
    uv.y = 4.0 * a / 3.1416;
    
    return mix(vec4(0.0), t(uv) * r * r * 2.0, 1.0);
}

vec4 MetaShader(vec2 uv,int shader)
{
if(uv.x<0.005 || uv.y<0.005 || uv.x>0.995 || uv.y>0.995) return vec4(0.8,0.8,0.8,1.);   
if(shader==0) return Twirl(uv);
if(shader==1) return Plasma(uv);
if(shader==2) return Room(uv);
if(shader==3) return Voronoi(uv);
if(shader==4) return Ring(uv);
if(shader==5) return Glenz(uv);
return vec4(0);
}

vec4 inTriangle(vec2 p0, vec2 p1, vec2 p2, vec2 p)
{
	float a = 0.5*(-p1.y*p2.x + p0.y*(-p1.x + p2.x) + p0.x*(p1.y - p2.y) + p1.x*p2.y);
	float s = 1.0/(2.0*a)*(p0.y*p2.x - p0.x*p2.y + (p2.y - p0.y)*p.x + (p0.x - p2.x)*p.y);
	float t = 1.0/(2.0*a)*(p0.x*p1.y - p0.y*p1.x + (p0.y - p1.y)*p.x + (p1.x - p0.x)*p.y);
	
	if (s > 0.0 && t > 0.0 && 1.0 - s - t > 0.0) {
		return vec4(1.0,s,t,1.0-s-t);
	} else {
		return vec4(0.0,s,t,1.0-s-t);
	}
}

void triangle(inout vec4 c, vec2 p, int shader, vec3 p0, vec3 p1, vec3 p2, vec2 t0, vec2 t1, vec2 t2)
{
	float rx = iTime/3.;
	float ry = iTime;
	float rz = iTime;
	
	float cx = cos(rx); float sx = sin(rx);
	float cy = cos(ry); float sy = sin(ry);
	float cz = cos(rz); float sz = sin(rz);
	
	mat4 transform1 =
		mat4(1, 0, 0, 0,
      		 0, 1, 0, 0,
      		 0, 0, 1, 0,
			 0, 0, -2.5, 1);
	
	mat4 transform2 =
		mat4(cz*cy, -sz*cy, sy, 0,
			 sz*cx + cz*sy*sx, cz*cx - sz*sy*sx, -cy*sx, 0,
			 sz*sx - cz*sy*cx,cz*sx + sz*sy*cx, cy*cx, 0,
			 0, 0, 0, 1);
	
	float n = 1.0;
	float f = 10.0;
	float r = 1.0 * iResolution.x / iResolution.y;
	float t = 1.0;
	mat4 projection =
		mat4(n/r, 0, 0, 0,
      		 0, n/t, 0, 0,
      		 0, 0, -(f+n)/(f-n), -1,
			 0, 0, -(2.0*f*n)/(f-n), 0);
	
	vec4 pt0 = vec4(0,0,0,0);
	vec4 pt1 = vec4(0,0,0,0);
	vec4 pt2 = vec4(0,0,0,0);
	
	pt0 = projection * transform1 * transform2 * vec4(p0,1);
	pt1 = projection * transform1 * transform2 * vec4(p1,1);
	pt2 = projection * transform1 * transform2 * vec4(p2,1);
	
	
	vec4 test = inTriangle(pt0.xy / pt0.w, pt1.xy / pt1.w, pt2.xy / pt2.w, p);
	
	if (test.x != 0.0) {
		float z = ((pt1.z * test.y) / pt1.w +
				   (pt2.z * test.z) / pt2.w +
				   (pt0.z * test.w) / pt0.w) /
					(test.y / pt1.w +
					 test.z / pt2.w +
					 test.w / pt0.w);
		if (z < c.w) {
			float tx = ((t1.x * test.y) / pt1.w +
						(t2.x * test.z) / pt2.w +
						(t0.x * test.w) / pt0.w) /
					   (test.y / pt1.w +
						test.z / pt2.w +
						test.w / pt0.w);
			
			float ty = ((t1.y * test.y) / pt1.w +
						(t2.y * test.z) / pt2.w +
						(t0.y * test.w) / pt0.w) /
					   (test.y / pt1.w +
						test.z / pt2.w +
						test.w / pt0.w);

            c=MetaShader(vec2(tx,ty),shader);
            c.w=z;
		}
	}
}

vec4 pixel(vec2 p)
{
	vec4 color = vec4(0,0,0,1000);   
	triangle(color,p,0,vec3(-1,-1,-1),vec3(1,-1,-1), vec3(-1,1,-1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,0,vec3(1,-1,-1),vec3(1,1,-1),vec3(-1,1,-1),vec2(1,0),vec2(1,1),vec2(0,1));	
	triangle(color,p,1,vec3(1,1,1),vec3(-1,1,1),vec3(1,-1,1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,1,vec3(-1,1,1),vec3(-1,-1,1),vec3(1,-1,1),vec2(1,0),vec2(1,1),vec2(0,1));   
	triangle(color,p,2,vec3(-1,1,-1),vec3(-1,1,1),vec3(-1,-1,-1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,2,vec3(-1,1,1),vec3(-1,-1,1),vec3(-1,-1,-1),vec2(1,0),vec2(1,1),vec2(0,1));	
	triangle(color,p,3,vec3(1,1,-1),vec3(1,1,1),vec3(1,-1,-1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,3,vec3(1,1,1),vec3(1,-1,1),vec3(1,-1,-1),vec2(1,0),vec2(1,1),vec2(0,1));   
	triangle(color,p,4,vec3(-1,1,-1),vec3(-1,1,1),vec3(1,1,-1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,4,vec3(-1,1,1),vec3(1,1,1),vec3(1,1,-1),vec2(1,0),vec2(1,1),vec2(0,1));
	triangle(color,p,5,vec3(-1,-1,-1),vec3(-1,-1,1),vec3(1,-1,-1),vec2(0,0),vec2(1,0),vec2(0,1));
	triangle(color,p,5,vec3(-1,-1,1),vec3(1,-1,1),vec3(1,-1,-1),vec2(1,0),vec2(1,1),vec2(0,1));   
	return color;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv = uv * 2.0 - vec2(1.0,1.0);
	fragColor = pixel(uv);
	xpos = fragCoord.xy / iResolution.xy; //  0 .. 1
	vec4 sc = 2.*ScrollText(uv);
	fragColor+=sc;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
