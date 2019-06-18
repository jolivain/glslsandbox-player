/*
 * Original shader from: https://www.shadertoy.com/view/ltlXzl
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
/*====================================================================
[SIG15] Fight Club End Scene
	fragment shader by movAX13h and srtuss
	sound shader by srtuss
	19.July - 10.August 2015
======================================================================
Making of (screen capture of movAX13h,30 videos):http://bit.ly/1IC3exn
======================================================================

	SCRIPT:
															   FADE IN
								JACK
                     Trust me. Everything's gonna be fine.

														   MUSIC START
												      EXPLOSIONS START

	MASSIVE EXPLOSION... the glass walls rattle...
         Jack and Marla look -- OUT THE WINDOWS: a BUILDING EXPLODES;
         collapsing upon itself.  Then, ANOTHER BUILDING IMPLODES
         into a massive cloud of dust.  Jack and Marla are
         silhouetted against the SKYLINE.  Jack,
         reaches to take her hand.

                                JACK
                     I'm sorry... you met me at a very
                     strange time in my life.

         ANOTHER BUILDING IMPLODES and COLLAPSES
         inward... and ANOTHER BUILDING... and ANOTHER ...
														MUSIC FADE OUT
                                                              FADE OUT

======================================================================*/

#define ROOM
#define ROOM_SHADOW
#define CITY
#define EXPLOSIONS
#define PARTICLES
#define FLASH_AND_SHAKE
#define SILHOUETTES
#define TEXT
#define BACK
#define POST

//======================================================================

//#define resolution iResolution
//#define mouse iMouse

#define pi  3.14159265358979323846264338328
#define pi2 6.28318530717958647692528676656
#define pih 1.5707963267949

#define eStart 18.0
#define wtcStart 12.0

//float time;
float et1 = 0.0, ef1 = 0.0;

vec2 constShake, shake;

// == helpers ============================================================
float ctri(float x, float s) {return abs(fract(x / s + 0.5) - 0.5) * s;}
vec2 ctri(vec2 x, vec2 s) {return abs(fract(x / s + 0.5) - 0.5) * s;}
vec2 ctri2(vec2 x, vec2 s) {return (fract(x / s + 0.5) - 0.5) * s;}
float ctriid(float x, float s) {return floor(x / s + 0.5);}
vec2 ctriid(vec2 x, vec2 s) {return floor(x / s + 0.5);}
vec3 ctriid(vec3 x, vec3 s) {return floor(x / s + 0.5);}
float rrect(vec2 p, vec2 sz) {return length(max(abs(p) - sz, vec2(0.0)));}
float rmax(vec2 p) {return max(p.x, p.y);}
vec2 rotate(vec2 p, float a) { return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)); }

// == silhouettes ========================================================
#define FXA(uv) (texture(iChannel1, uv).x - 0.5)
#ifdef SILHOUETTES
float silhouettes(vec2 uv)
{
    float a = smoothstep(4.0, 5.0, et1);
    
    uv.x += 0.22;
    uv.y += 0.22;
    uv *= 2.8-et1*0.01;
    
    vec2 p = uv;
    vec2 q = abs(p);
    float v, w;
    
    // jack
    float r = -0.2-0.1*a;
    
    v = rrect(q, vec2(0.23, 0.54)) - 0.05 + FXA(uv * 0.1 - 0.599) * 0.15;
    w = dot(vec2(abs(p.x), p.y - 0.77), normalize(vec2(1.0, 1.2)));
    w = max(w, 0.7 - p.y) + FXA(uv * 0.1 - 0.2) * 0.15;
    v = min(v, w);
    
    w = length(rotate((p - vec2(0.04, 0.94)), 0.2) * vec2(1.3, 1.0)) - 0.11 + FXA(uv * 0.2 + 0.1) * 0.15;
    v = min(v, w);
    
    q = abs(p - vec2(-0.08, -0.6));
    w = rrect(q, vec2(0.0, 0.2)) - 0.035 + FXA(uv * 0.1 - 0.1) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(-0.05, -1.1), -0.08));
    w = rrect(q, vec2(0.0, 0.28)) - 0.02 + FXA(uv * 0.11 - 0.13) * 0.1;
    v = min(v, w);
    
    vec2 qq = rotate(p - vec2(-0.05, -1.39), -1.3);
    q = abs(qq);
    w = max(rrect(q, vec2(0.0, 0.05)) - 0.02, 0.01 - qq.x) + FXA(uv * 0.1 - 0.64) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(0.13, -0.6), -0.1));
    w = rrect(q, vec2(0.0, 0.2)) - 0.065 + FXA(uv * 0.12 + 0.5) * 0.05;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(0.14, -1.1), 0.05));
    w = rrect(q, vec2(0.0, 0.28)) - 0.02 + FXA(uv * 0.11 - 0.14) * 0.1;
    v = min(v, w);
    
    qq = rotate(p - vec2(0.14, -1.36), 0.4);
    q = abs(qq);
    w = rrect(q, vec2(0.0, 0.05)) - 0.02 + FXA(uv * 0.1 - 0.64) * 0.1;
    v = min(v, w);
    
    q = rotate(p - vec2(-0.22, .1), -0.09);
    w = length(q * vec2(3.0, 1.0)) - 0.49 + FXA(uv * 0.15 - 0.15) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(0.36, 0.2), r)); // upper arm
    w = rrect(q, vec2(0.0, 0.35)) - 0.03 + FXA(uv * 0.11 - 0.14) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(0.16-r, -0.12), r-0.2)); // lower arm
    w = rrect(q, vec2(0.0, 0.15)) - 0.03 + FXA(uv * 0.11 - 0.14) * 0.1;
    v = min(v, w);
    
    
    // marla
    r = 0.3+0.08*a;
    
    q = abs(rotate(p - vec2(1.1, -0.12), 0.05)); // body
    w = rrect(q, vec2(0.18, 0.55)) - 0.05 + FXA(uv * -0.05 - 0.1) * 0.15;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(1.15, 0.3), 0.2)); // neck
    w = rrect(q, vec2(0.1, 0.2)) - 0.05 + FXA(uv * 0.05 - 0.3) * 0.15;
    v = min(v, w);
    
    qq = rotate(p-vec2(1.04-r+0.33,-0.05), r); // arm
    q = abs(qq);
    w = max(max(rrect(q, vec2(0.1, 0.3)) - 0.32, qq.x + 0.13), -0.3 - qq.y)
        + FXA(uv * 0.4 + vec2(0.24, -0.1)) * 0.1 + 0.03;
    v = min(v, w);
    
    q = abs(p - vec2(1.15, 0.8)); // head
    w = rrect(q, vec2(0.035, 0.07)) - 0.083 + FXA(uv * 0.4 - 0.33) * 0.15;
    v = min(v, w);
    
    q = p - vec2(1.35, 0.09);
    w = length(q * vec2(2.5, 1.0)) - 0.43 + FXA(uv * 0.4 - 0.15) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(1.09, -1.0), 0.05));
    w = rrect(q, vec2(0.0, 0.28)) - 0.01 + FXA(uv * 0.11 - 0.15) * 0.1;
    v = min(v, w);
    
    q = abs(rotate(p - vec2(1.24, -1.0), -0.02));
    w = rrect(q, vec2(0.0, 0.28)) - 0.01 + FXA(uv * 0.03 - 0.21) * 0.1;
    v = min(v, w);
    
    qq = rotate(p - vec2(1.08, -1.29), 0.0);
    q = abs(qq);
    w = rrect(q, vec2(0.03, 0.06)) - 0.005 + FXA(uv * 0.1 - 0.15) * 0.1;
    v = min(v, w);
    
    qq = rotate(p - vec2(1.23, -1.3), 0.2);
    q = abs(qq);
    w = rrect(q, vec2(0.03, 0.06)) + 0.002 + FXA(uv * 0.1 - 0.254) * 0.1;
    v = min(v, w);
   
    return v;
}
#endif

// == textures ===========================================================
float tex1(vec2 p, float ps)
{
    vec2 q = ctri(p, vec2(0.5));
    vec2 q1 = ctri2(p, vec2(0.5));
    vec2 z = ctriid(p, vec2(0.5));
    float id = step(fract(sin(z.x * 124.123 + z.y) * 129867.253), 0.5);
    float v0 = max(q.x - 0.15, q.y - 0.15);
    float v1 = v0 - 0.005;
    v1 = max(v1, -v0);
    float tmp = min(q1.y + 0.07, q.x - 0.005);
    float w = max(tmp, v0);
    v1 = min(v1, w);

    float cm = texture(iChannel1, p*0.1).x * 0.5 * id + 0.3;

    float c = 0.2;
    c = mix(c, cm, smoothstep(ps, 0.0, v0));
    c = mix(c, 0.1, smoothstep(ps, 0.0, v1));
    return c;
}
float tex2_msk(vec2 id)
{
    float v = fract(sin(id.x * 121.298672 + id.y) * 296235.16712);
    float v2 = fract(sin(floor(id.x * 0.11 + id.y * 0.14) * 121.298672 + id.y) * 296235.16712);
    return step(0.5, (v2 * (sin(id.y * 0.4-1.9) * 0.3 + 0.7) - (v - 0.5) * 0.5));
}
float tex2(vec2 p, float ps)
{
    if (p.y < 0.06) return 0.2;

    p.y *= 20.0;
    p.x *= 10.0;

    vec2 sz = vec2(0.5);
    vec2 q = ctri(p, sz);
    vec2 q1 = ctri2(p, sz);
    vec2 z = ctriid(p, sz);

    float v0 = q.y - 0.21;
    float v1 = abs(q1.x) - 0.08;

    float c = 0.2;
    c = mix(c, smoothstep(wtcStart+1.2, wtcStart+1.0, et1-0.8*step(-0.3, p.x))*tex2_msk(z) * 0.6 + 0.15, smoothstep(ps, 0.0, rmax(abs(q) - vec2(0.17, 0.23))));
    return c;
}
float tex3(vec2 p)
{
    if (p.y < 0.06) return 0.24; // roof
    p*=1.6;
    float c = 0.1;
    float a = mod(p.y, 0.12);
    c = mix(0.2, 0.5, step(mod(p.x,0.4), 0.05));
    float d = mix(0.56, 0.4, smoothstep(0.002, 0.01, mod(p.y+0.003,0.03)));
    c = mix(c,d, smoothstep(0.05, 0.075, a));
    return c;
}
float tex4(vec2 p)
{
    if (p.y < 0.02) return 0.24; // roof
    p.y -= 0.2;
    p.y *= 1.4;
    float c = tex1(-8.0*p, 0.001);
    c = mix(0.24, c, smoothstep(0.18,0.22, mod(p.x-0.18,0.5))); // vertical flat
    return c;
}


// == interior ===========================================================
const vec3 sunPos = vec3(1.0, 7.0, 15.0);
vec3 sun = normalize(sunPos);
float focus = 5.0;
float far = 30.0;

struct Hit
{
	float d;
	vec3 color;
	float edge;
    float spec;
};

#define CONCRETE_COLOR vec3(0.9, 0.9, 0.9)
#define CONCRETE_SPEC 0.4
#define WINDOW_BARS_COLOR vec3(0.01,0.01,0.01)
#define WINDOW_BARS_SPEC 0.6
#define INTERIOR_COLOR vec3(0.1)
#define INTERIOR_SPEC 0.8

#ifdef ROOM
float sdBox( vec3 p, vec3 b ) 
{	
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
    
float interior(vec3 p)
{
    float d1 = sdBox(p-vec3(-1.2,0.3,-6.5),vec3(1.1,0.7,0.4));
    d1 = min(d1, sdBox(p-vec3(-1.76,1.1,-6.5),vec3(0.5,0.17,0.2)));
    return d1;
}
   
Hit scene(vec3 p0)
{
	float d = 10000.0, d1, e = 0.04;
    float spec = CONCRETE_SPEC;
	vec3 col = vec3(0.0);
    
    // floor
    d1 = sdBox(p0-vec3(0.0,-0.92,-19.5),vec3(20.0,0.8,20.0)); 
    if (d1 < d) 
    { 
        d = d1; 
        col = CONCRETE_COLOR; 
        spec = CONCRETE_SPEC;
    }

    // pillars
    vec3 p1=vec3(mod(p0.x,8.0)-4.0,p0.y,p0.z); 
    d1 = sdBox(p1-vec3(1.0,0.6,-0.7),vec3(0.3,3.8,1.0)); 
    if (d1 < d) 
    { 
        d = d1; 
        col = CONCRETE_COLOR; 
        spec = CONCRETE_SPEC;        
    }

    // vertical bars
    vec3 p2=vec3(mod(p0.x,2.0)-1.0,p0.y,p0.z); 
    d1 = sdBox(p2-vec3(0.0,0.0,0.5),vec3(0.04,8.0,0.04)); 
    if (d1 < d) 
    { 
        d = d1; 
        col = WINDOW_BARS_COLOR; 
        spec = WINDOW_BARS_SPEC;
        e = 0.0;
    }

    // horizontal bars
    vec3 p3=vec3(p0.x,mod(p0.y,3.4)-1.7,p0.z); 
    d1 = sdBox(p3-vec3(0.0,1.6,0.5),vec3(20.0,0.04,0.04)); 
    if (d1 < d) 
    { 
        d = d1; 
        col = WINDOW_BARS_COLOR; 
        spec = WINDOW_BARS_SPEC;
        e = 0.0;
    }

    // top wall fragment
    d1 = sdBox(p0-vec3(0.0,5.0,0.5),vec3(20.0,0.8,0.2)); 
    if (d1 < d) 
    { 
        
        d = d1; 
        col = mix(CONCRETE_COLOR, WINDOW_BARS_COLOR, step(p0.y,4.22)); 
        spec = CONCRETE_SPEC;
    }

    // ceiling
    d1 = sdBox(p0-vec3(1.0,5.2,-2.6),vec3(2.65,1.0,2.5)); 
    d1 = max(d1,-sdBox(p0-vec3(1.0,4.2,-2.6),vec3(2.2,0.17,2.0))); 
    d1 = max(d1,-sdBox(p0-vec3(1.0,4.2,-2.6),vec3(1.94,0.4,1.6))); 
    if (d1 < d) 
    { 
        d = d1; 
        col = CONCRETE_COLOR; 
        spec = CONCRETE_SPEC;        
    }
	
    if (p0.y > 0.0)
    {
        d1 = interior(p0);
        if (d1 < d)
        {
            d = d1;
            col = INTERIOR_COLOR;
            spec = INTERIOR_SPEC;
        }
    }    
	return Hit(d, col, e, spec);
}

vec3 normal(vec3 p)
{
	float c = scene(p).d;
	vec2 h = vec2(0.01, 0.0);
	return normalize(vec3(scene(p + h.xyy).d - c, 
						  scene(p + h.yxy).d - c, 
		                  scene(p + h.yyx).d - c));
}

float edges(vec3 p)
{
	float acc = 0.0;
	float h = 0.01;
	acc += scene(p + vec3(-h, -h, -h)).d;
	acc += scene(p + vec3(-h, -h, +h)).d;
	acc += scene(p + vec3(-h, +h, -h)).d;
	acc += scene(p + vec3(-h, +h, +h)).d;
	acc += scene(p + vec3(+h, -h, -h)).d;
	acc += scene(p + vec3(+h, -h, +h)).d;
	acc += scene(p + vec3(+h, +h, -h)).d;
	acc += scene(p + vec3(+h, +h, +h)).d;
	return acc / h;
}

vec3 colorize(Hit hit, vec3 n, vec3 dir, const in vec3 lightPos, vec3 pos)
{
	float diffuse = 0.2*max(0.0, dot(n, lightPos));
	
	vec3 ref = normalize(reflect(dir, n));
	float specular = hit.spec*pow(max(0.0, dot(ref, lightPos)), 6.5);

	vec3 c = texture(iChannel3, pos.xz*0.2).rgb;
    float i = 0.1*smoothstep(0.6, 0.9, 1.0-c.g);
    c = mix(hit.color.rgb, c, i);    
    
	return  c +  
			diffuse * vec3(0.9) +
			specular * vec3(1.0);
}
#endif

// == explosions =========================================================
#define FXD(uv) texture(iChannel0, uv + seed).x
#define FXE(uv) texture(iChannel2, uv - seed).y
#define FXF(uv) texture(iChannel2, uv + seed /*, 4.0*/ ).y
#define FXG(uv) texture(iChannel3, uv - seed).y
#ifdef EXPLOSIONS
// t (time in sec, effect lasts from 0-2s) 
void explosion(vec2 uv, inout vec3 col, float t, float size, float seed)
{
    uv /= size;
    float x = t - 0.1;
    float iCore = exp(t * -20.0); //exp(x * x * -200.0);
    float szEx = smoothstep(0.2, 0.4, t) - smoothstep(0.4, 1.0, t) * 0.1;
    float szEx2 = smoothstep(0.2, 0.4, t);
    float flwEx = 1.0 - t * 0.5;
    float flwCore = 1.0 - t * 0.2;
    float iTotal = smoothstep(1.2, 0.5, t) * smoothstep(0.0, 0.01, t);
    float iPrt = smoothstep(0.2, 0.5, t) * smoothstep(1.0, 0.5, t);
    float szCorona = t;
    float flwPrt = 1.0 - t * 0.4;
    
    float iPrt2 = smoothstep(0.2, 0.5, t) * smoothstep(0.6, 0.5, t);
    float szCorona2 = t * 2.0;
    float flwPrt2 = 1.0 - t * 0.8;
    
    t += seed;
    
    uv += (fract(sin(vec2(time, time - 2.0) * 42.412) * 28972.0) - 0.5) * 0.1 * szEx * iTotal;
    
    float v = length(uv), sum = 0.0;
    sum = smoothstep(szEx * 0.6 + 0.1, 0.0,
   		v - szEx * 0.6
        - FXF(rotate(uv * flwEx, t * 0.2) * 0.04) * 0.9 * szEx
        - FXD(rotate(uv * flwEx, t * 0.4) * 0.2) * 0.2 * szEx                               
        );
    sum *= FXD(uv * flwEx * 0.02);
    
   	sum -= smoothstep(1.0, 0.2, v + FXE(uv * 0.1 * flwCore) * 0.5) * FXE((uv - vec2(0.1, t)) * 0.02) * 3.0 * FXD(uv * 0.7 * flwCore);
  	sum = max(sum, 0.0);

    sum += smoothstep(0.9, 0.0, v + 0.3 - iCore * 0.6);    
    sum *= iTotal;
    
    sum += pow(FXG(uv * 0.5 * flwPrt), 5.0) * iPrt * smoothstep(0.04, 0.0, v - szCorona - 0.7);
    sum += pow(FXG(-uv * 0.5 * flwPrt2 - 0.3333), 5.0) * iPrt2 * smoothstep(0.04, 0.0, v - szCorona2 - 0.7);
    
    // map intensity to color
    vec3 c = pow(vec3(sum), vec3(0.44, 0.6, 1.0) * 2.5) * 1.5;
    col += c;
}

void explosions(vec2 uv, inout vec3 col)
{
    vec2 a,b,c;
    float id, aet1,s1,s2,s3,t1,t2,t3;

    if (et1 > wtcStart+1.6)
    {
        float st = et1*0.8;
        id = floor(st/2.0);
        aet1 = mod(st-0.4,2.0);
        
        uv.y -= 0.5;
        
        s1 = 0.4;
        s2 = 0.4;
        s3 = 0.4;
        
        t1 = aet1-0.15;
        t2 = aet1+0.1*id;
        t3 = aet1-0.02*id;
        
        float oy = -id*0.24;
     	a = vec2( 0.4, oy);
     	b = vec2( 0.0, oy);
     	c = vec2(-0.5, oy);        
    }
    else if (et1 > wtcStart) // wtc 1 & 2
    {
        float w = step(-0.3, uv.x); // left/right
        uv.y += 0.2;
		uv.y += (1.0-w)*max(0.0, pow(max(0.0, 0.5*(et1-(wtcStart+1.3))), 2.0));        
		uv.y += w*max(0.0, pow(max(0.0, 0.5*(et1-(wtcStart+1.8))), 2.0));        
        uv.x += w*0.05*max(0.0, (et1-(wtcStart+1.3)));
        uv.x -= (1.0-w)*0.05*max(0.0, (et1-(wtcStart+10.3)));
        
        id = floor((-uv.y+0.2)/0.18)*step(uv.x,0.3)*step(-0.9, uv.x);
        if (id != -1.0 && id != 1.0 && id != 2.0) return;
        
        uv.y =  mod(uv.y-0.2, 0.18)-0.06;
        uv.x = mod(uv.x-0.3, 0.6)+0.5;
        uv.x *= 0.2;
        
        aet1 = (et1-0.4*w)*0.97 + id * 0.6 - (wtcStart + 0.4);
        
        s1 = 0.016;
        s2 = 0.016;
        s3 = 0.016 - 0.006*w;
        
        float t = aet1*1.4;
        t1 = t-0.001;
        t2 = t+0.01;
        t3 = t-0.004;
        
     	a = vec2(0.13, 0.0);
     	b = vec2(0.16, 0.0);
     	c = vec2(0.19, w*(-uv.x*0.8+0.15));
    } 
    else if (uv.x < 0.0) // building left
    {
        id = floor((-uv.y+0.32)/0.4);
        if (id < -1.0) return;
        
        uv.y = mod(uv.y-0.32, 0.4)-0.2;
        uv.x *= 0.6;
        uv.x -= 0.55;
        uv.x = abs(uv.x);
        
        aet1 = et1 + id * 0.3 - 1.2;
        
        s1 = 0.15;
        s2 = 0.1;
        s3 = 0.13;
        
        t1 = aet1-0.05;
        t2 = aet1+0.02;
        t3 = aet1-0.02*id;
        
     	a = vec2(1.5, 0.03);
     	b = vec2(1.3, 0.0);
     	c = vec2(1.2-0.1*(et1-1.2), 0.00);
    }
    else if (et1 > 2.0) // building mid right
    {
        id = floor((-uv.y+0.2)/0.32);
        if (id < -1.0) return;
        
        uv.y += 0.9*max(0.0, pow(max(0.0, 0.5*(et1-3.3)), 2.0));
        if (uv.y > 0.5) return;
        
        uv.y =  mod(uv.y-0.2, 0.32)-0.16;
        uv.x *= 0.6;
        uv.x += 0.75;
        
        aet1 = et1*0.97 + id * 0.3 - 2.4;
        
        s1 = 0.04;
        s2 = 0.06;
        s3 = 0.04;
        
        t1 = aet1-0.01;
        t2 = aet1+0.01;
        t3 = aet1-0.004*id;
        
     	a = vec2(1.242+0.02*(et1-2.4), 0.0);
     	b = vec2(1.13, 0.0);
     	c = vec2(0.99-0.02*(et1-2.4), 0.0);
    }
    else // building right (first to fall)
    {
        id = floor((-uv.y+0.25)/0.7);
        
        uv.y = mod(uv.y-0.25, 0.7)-0.35;
        uv.x *= 0.8;
        uv.x += 0.3;
        
        aet1 = et1*1.2 + id * 0.3;
        
        s1 = 0.2;
        s2 = 0.12;
        s3 = 0.16;
        
        t1 = aet1*0.98-0.15;
        t2 = aet1-0.1;
        t3 = aet1-0.2;
        
     	a = vec2(1.58, 0.0);
     	b = vec2(1.42, 0.0);
     	c = vec2(1.18-0.1*et1, 0.0);
    }
    
    explosion(uv-a, col, t1, s1, 3.7512*id);
    explosion(uv-b, col, t2, s2, 2.5822*id);
    explosion(uv-c, col, t3, s3, 1.2833*id);
    
    
    
    
}
#endif

// == city/buildings, textured 2D band segments ==========================
#ifdef CITY
#define BAND_INIT vec3 a,b; vec2 q=p; float x,y,y1,y2;
#define BAND_START(n) a=n; b=n; p=q;
#define BAND_TO(n,c) a=b; b=n; if (p.x > a.x && p.x < b.x) { x = (p.x - a.x)/(b.x - a.x); y1 = mix(a.y, b.y, x); y2 = mix(a.z, b.z, x); if (p.y > y1 && p.y < y2) { y = (p.y - y2)/(y1-y2); col = c; }}    

void city(vec2 p, inout vec3 col)
{
    float s = et1;
    
    // left
    BAND_INIT;
    BAND_START(vec3(-1.8,  -1.5,0.88))
	p.y+=max(0.0, pow(max(0.0, 0.8*(s-2.6)), 2.0));
    float o = -0.7*texture(iChannel2, p*0.1).b*max(0.0, min(1.0, (s-1.6)*2.0));
    
    BAND_TO(   vec3(-1.58, -1.5,0.88),  o+vec3(tex3(vec2(x,y))))
    BAND_TO(   vec3(-1.45, -1.42,0.8),  o+vec3(tex3(vec2(x,y))))
    BAND_TO(   vec3(-1.2,  -1.4,0.8),   o+vec3(tex3(vec2(x,y))))
    BAND_TO(   vec3(-0.9,  -1.25,0.65), o+vec3(tex3(vec2(x,y))))
    
    // wtc 1
    float ft = max(0.0, s-(wtcStart+1.3));
    float oy = max(0.0, pow(max(0.0, 0.5*ft), 2.0));
    BAND_START(vec3(-0.8,  -0.83,0.3))
    p = rotate(p, min(0.22, 0.1*ft));
    p.x-=ft*0.1;
	p.y+=oy;
    BAND_TO(   vec3(-0.4,  -0.82,0.28), vec3(tex2(vec2(x-5.4,y), 0.005)))
    
    // wtc 2
    ft = max(0.0, s-(wtcStart+1.8));
    oy = max(0.0, pow(max(0.0, 0.5*ft), 2.0));
    BAND_START(vec3(-0.25, -0.8,0.27))
    p = rotate(p, min(0.22, -0.06*ft));
    p.x+=ft*0.1;        
	p.y+=oy;
    BAND_TO(   vec3( 0.1,  -0.82,0.31), vec3(tex2(vec2(x,y), 0.005)))
    BAND_TO(   vec3( 0.2,  -0.8,0.26), vec3(tex2(vec2(x,y), 0.005)))
        
    // tower
    BAND_START(vec3( 0.35, -0.83,0.47))
	p.y+=max(0.0, pow(max(0.0, 0.5*(s-3.2)), 2.0));
    BAND_TO(   vec3( 0.37, -0.8,0.51), vec3(tex4(vec2(x,y))))
    BAND_TO(   vec3( 0.85, -0.8,0.51), vec3(tex4(vec2(x,y))))
        
    // right
    BAND_START(vec3( 0.96, -1.18,0.8))
	p.y+=max(0.0, pow(max(0.0, s-1.2), 2.0));
	
    o = -0.5*texture(iChannel2, p*0.1).b*max(0.0, min(1.0, (s-0.2)*2.0));
    
    BAND_TO(   vec3( 1.66, -1.4,1.01), o+vec3(tex1(2.0*vec2(x-0.4,-1.6*y-3.0), 0.001)))
    BAND_TO(   vec3( 2.8,  -1.34,1.01),  o+vec3(tex1(2.0*vec2(x-0.12,-1.6*y), 0.001)))
        
    // flashing windows
    float id = floor(ef1*3.0-1.0);
    float dy = 0.36;
    float c = smoothstep(0.1, 0.6, col.r);
    float h = 0.2;
    float sk = 0.0;

    if (id > 1.0) 
    {
        id = floor(ef1*6.0-1.0)-4.0;
        if (id != 3.0 && id != 5.0 && id != 6.0) return;
        p.x = -p.x-0.1;
        p.y += 0.55;
        dy = 0.128;
        h = 0.09;
        c = smoothstep(0.7, 0.8, 1.0-col.r);
        sk = -0.15*max(0.0, 0.19*(id-2.0));
    }
    
    col += step(0.8, p.x) * // cut
           abs(sin(8.0*ef1*pi)) * // flicker
           c * smoothstep(h, 0.0, abs(p.y+0.1-id*dy+p.x*sk)); // color replacement
}
#endif


// == particle rain ======================================================
#ifdef PARTICLES
void particleRain(vec2 p, inout vec3 col)
{
	vec3 c;
    float i,b,x = p.x;
        
    float t = -0.5*step(p.x, 0.0);
    p.x *= 1.0-2.0*step(0.0, p.x);

    t += et1;
    p = rotate(p, -0.08);
    
    b = 0.0;
    i = 0.0;
    
    x = 1.5*step(0.0, x);
    
    vec2 uv = vec2(p.y + time*2.0+x , p.x + pow(p.y+0.2, 3.0)*0.3-2.4);
    
    c = texture(iChannel3, uv).rgb;
    i = max(i, smoothstep(0.8, 0.9, c.r));
    b += c.g + 0.5*step(0.5, c.b);
    
    c = texture(iChannel3, uv.xy+vec2(0.3+time*1.3, 0.5)).rgb;
    i = max(i, smoothstep(0.86, 0.99, c.r));
    b += c.g - 1.0*step(0.2, c.b);
    
    i *= smoothstep(0.6, 0.7, abs(p.x)) *
         smoothstep(0.5, 0.6, t) *
         smoothstep(4.0, 3.5, t);
    
    col = mix(col, vec3(clamp(b, 0.0, 1.0)), 0.6*i);
}
#endif


// == TEXT ===============================================================
#ifdef TEXT
void letter(float n, vec2 p, inout float d) // 5x5
{
    p *= 50.0;
	p.y *= -1.0;
	p = floor(p + 2.5);
	
	if (clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y)
	{
		float k = p.x + p.y*5.0;
		if (int(mod(n/(pow(2.0,k)),2.0)) == 1) d = max(d, 1.0);
    }
}

vec3 txtPixel(vec2 p, float from1, float to2)
{
    p = floor(p*iResolution.x*2.0)/(iResolution.x*2.0);
    
    float from2 = from1+1.0;
    float to1 = to2-0.5;
    vec2 r = vec2(2.0*fract(sin(p.x * 121.2972 + p.y) * 2965.167), 0.1*fract(sin(p.y * 42.468 + p.x) * 11235.482) - 0.05);
    float t = time;
    t += r.x*0.5;
    float s = smoothstep(from1, from2, t) + 2.0*smoothstep(to1, to2, t);
    p += r*(1.0-s);
    s *= smoothstep(to2, to1, t);
    return vec3(p,s);
}

#define _ 4194304.0
#define _ap 132.0
#define _a 9747759.0
#define _b 16301615.0
#define _e 15768623.0
#define _f 1096767.0
#define _g 16036911.0
#define _h 9747753.0
#define _i 14815374.0
#define _l 15762465.0
#define _m 710331.0
#define _n 9745769.0
#define _o 15255086.0
#define _r 9739567.0
#define _s 16006191.0
#define _t 4329631.0
#define _u 15255089.0
#define _v 4532785.0
#define _y 4357681.0

#define CHAR_SIZE 0.11
#define SPACE_SIZE 0.1
#define TEXT_START(a) vec3 pix=txtPixel(p,from,to);float d=0.0;vec2 tp=a;
//#define P(l) letter(l-(145.110+time*10.3211)*step(0.8, fract(time*60.0+tp.x)),pix.xy-tp,d);tp.x+=CHAR_SIZE;
//#define P(l) letter(l+(18419.3382*sin(time*1.3211))*step(0.85, fract(time*60.0+tp.x*20.0)),pix.xy-tp,d);tp.x+=CHAR_SIZE;
#define P(l) letter(l,pix.xy-tp,d);tp.x+=CHAR_SIZE;
#define SPACE tp.x+=SPACE_SIZE;
#define TEXT_END vec3 c=0.6+0.3*texture(iChannel2,p*vec2(0.3)).rrb;col=mix(col,c,pix.z*smoothstep(0.5,1.0,d));

// trust me
void txt1(vec2 p, inout vec3 col, float from, float to)
{
    TEXT_START(vec2(-0.94, -0.1))
    P(_t) P(_r) P(_u) P(_s) P(_t) SPACE P(_m) P(_e)    
    TEXT_END
}

// everything's gonna be fine
void txt2(vec2 p, inout vec3 col, float from, float to)
{
	TEXT_START(vec2(-1.35, -0.2)) 
    P(_e) P(_v) P(_e) P(_r) P(_y) P(_t) P(_h) P(_i) P(_n) P(_g) P(_ap) P(_s) SPACE
    P(_g) P(_o) P(_n) P(_n) P(_a) SPACE P(_b) P(_e) SPACE P(_f) P(_i) P(_n) P(_e)        
	TEXT_END
}

// i'm sorry (not in the movie but in the original script)
void txt3(vec2 p, inout vec3 col, float from, float to)
{
	TEXT_START(vec2(-0.7, -0.1))
    P(_i) P(_ap) P(_m) SPACE P(_s) P(_o) P(_r) P(_r) P(_y) P(_) P(_) P(_)       
	TEXT_END
}

// you met me at a very 
void txt4(vec2 p, inout vec3 col, float from, float to)
{
	TEXT_START(vec2(-0.5, -0.1)) 
    P(_y) P(_o) P(_u) SPACE P(_m) P(_e) P(_t) SPACE P(_m) P(_e) SPACE
    P(_a) P(_t) SPACE P(_a) SPACE P(_v) P(_e) P(_r) P(_y)
	TEXT_END
}

// strange time in my life
 void txt5(vec2 p, inout vec3 col, float from, float to)
{
	TEXT_START(vec2(-1.2, -0.2)) 
    P(_s) P(_t) P(_r) P(_a) P(_n) P(_g) P(_e) SPACE P(_t) P(_i) P(_m) P(_e) SPACE
    P(_i) P(_n) SPACE P(_m) P(_y) SPACE P(_l) P(_i) P(_f) P(_e)
	TEXT_END
}

void text(vec2 p, inout vec3 col)
{
    //vec3 t = 0.05*texture(iChannel1, p).xyz;
    //p.xy += vec2(t-0.025);    
    txt1(p, col, 6.0, 11.0);
    txt2(p, col, 10.0, 16.0);
    txt3(p, col, eStart+6.5,  eStart+9.0);
    txt4(p, col, eStart+8.0,  eStart+12.0);
    txt5(p, col, eStart+11.0, eStart+16.0);
}
#endif

void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
{
    //time = iTime;// - smoothstep(eStart+wtcStart+6.0, eStart+wtcStart+16.0, iTime)*iTime;
    et1 = max(0.0, time-eStart); 
    ef1 = max(0.0, time-eStart+0.3);
    #ifdef FLASH_AND_SHAKE
    constShake = (fract(sin(vec2(time, time - 2.0) * 42.412) * 28972.0) - 0.5);
    shake = smoothstep(0.0, 1.0, et1-0.3)*smoothstep(wtcStart+2.0, wtcStart-4.0, et1)*constShake;
	#else
    constShake = vec2(0.0);
    shake = vec2(0.0);
	#endif    

    
    vec2 pos = (fragCoord.xy*2.0 - resolution.xy) / resolution.y;

	pos += shake*0.01;
    
    if (abs(pos.y)>.75) 
    {
        fragColor = vec4(0.0);
        return;
    }
    
	float d = clamp(1.5*sin(0.3*time), 0.5, 1.0);
    float j = et1*0.04;
	vec3 cp = vec3(1.0, 2.0, -18.0+j);
    vec3 ct = vec3(1.0, 2.0, 0.0)+0.1*vec3(shake.x, shake.y, 0.0);
	
    #if 0
	if (mouse.x > 10.0)
	{
		vec2 mrel = mouse.xy/resolution.xy-0.5;
        ct = vec3(1.0-6.0*mrel.x, 2.0+4.0*mrel.y, 0.0);
	}
    #endif
	
   	vec3 cd = normalize(ct-cp);
    vec3 cu  = vec3(0.0, 1.0, 0.0);
    vec3 cs = cross(cd, cu);
    vec3 dir = normalize(cs*pos.x + cu*pos.y + cd*focus);	
	
    Hit h;
	vec3 col = vec3(0.0);
	vec3 ray = cp;
	float dist = 0.0;
	
	// raytrace scene
    #ifdef ROOM
    for(int i=0; i < 60; i++) 
	{
        h = scene(ray);
		
		if(h.d < 0.001) break;
		
		dist += h.d;
		ray += dir * h.d;

        if(dist > far) 
		{ 
			dist = far; 
			break; 
		}
    }
	
	float m = (1.0 - dist/far);
	vec3 n = normal(ray);
	col = colorize(h, n, dir, sun, ray)*m;
    
	#else
    vec3 n = vec3(0.0);
    col = vec3(1.0, 0.0, 0.0);
    dist = 10000.0;
    #endif
    
    if (dist < far)
    {
    	#ifdef ROOM        
    	float edge = edges(ray);
		col = mix(col, vec3(0.5), min(1.0,h.edge*edge));
    
        // HARD SHADOW with low number of rm iterations (from obj to sun)
        #ifdef ROOM_SHADOW
        vec3 ray1 = ray;
        dir = normalize(sunPos - ray1);
        ray1 += n*0.002;

        float sunDist = length(sunPos-ray1);
        dist = 0.0;

        for(int i=0; i < 35; i++) 
        {
            h = scene(ray1 + dir*dist);
            dist += h.d;
        }

        col -= 0.2*smoothstep(0.5, -0.3, min(dist, sunDist)/max(0.0001,sunDist));
        #endif
        #endif
    }
    else
    {
        // outside world
        #ifdef BACK
        col = vec3(0.7*smoothstep(2.5, -3.0, pos.y))+0.4*texture(iChannel3, 0.04*pos+vec2(0.5-0.001*time, 0.0005*time)).g;
        #endif
        
        #ifdef CITY
        city(pos, col);
        #endif
        
        #ifdef EXPLOSIONS
        explosions(pos, col);
        #endif
        
        #ifdef PARTICLES
        particleRain(pos, col);
        #endif
        
        #ifdef POST
        #ifdef BACK
        vec3 o = texture(iChannel3, pos*0.1+vec2(0.0, -0.001*time-0.5)).rrg;
        col = mix(col, o, 0.2*smoothstep(0.6, 0.8, 1.0-o.g));
        
        o = texture(iChannel1, pos*0.1+vec2(0.3+time*0.001, -0.003*time+0.5)).ggg; // dust cloud
        col = mix(col, o, (min(0.5, et1) + 0.2)*smoothstep(0.6, 0.8, 1.0-o.g)*smoothstep(0.1, -0.6, pos.y));
        #endif
        #endif
    }
    
    #ifdef SILHOUETTES
    vec2 uv = pos;
    uv.y = abs(uv.y+0.71)-0.71;
    float s = silhouettes(uv);
    
    vec3 scol = vec3(0.1*smoothstep(0.01, 0.0, s) + 0.2 * smoothstep(0.02, 0.0, abs(s)));
    scol = mix(scol, col-0.2, smoothstep(0.71, 0.72, -pos.y));
    col = mix(scol, col, smoothstep(0.0, 0.01, s));
    float k = j*0.02;
    vec2 a = vec2(0.09, 0.54+k);
    
    if (pos.x > -0.2) 
    {
        a.x = 0.11;
        a.y = 0.55+k;
    }
    
    if (pos.x > 0.0)
    {
        a.x = 0.05;
        a.y = 0.55+k;
    }
    
    float b = smoothstep(0.0, 0.01, s);
    float c = 0.6*(1.0-max(b, smoothstep(0.0, 0.01, abs(pos.y+a.y)-a.x)));
    c += 0.6*(1.0-b)*smoothstep(0.2, 0.0, abs(pos.y-0.36+pos.x*0.14)-0.1);
    
    col = mix(col, vec3(0.35, 0.25, 0.18), c);
	#endif
    
    #ifdef FLASH_AND_SHAKE
    col += 0.6*step(0.3, abs(shake.x))*step(0.48, abs(constShake.x)); // flash
    #endif

    #ifdef TEXT
    text(pos, col);
    #endif    
    
    #ifdef POST
	col = clamp(col, vec3(0.0), vec3(1.0));
	col = pow(col, vec3(4.0, 3.3, 3.25)) * 3.7; // farbton & sÃ¤ttigung
	col = pow(col, vec3(1.0 / 2.2)); // gamma    
    #endif

    col *= smoothstep(1.0, 3.0, time)*smoothstep(45.0, 40.0, time);
    
	fragColor = vec4(col, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //


void main(void)
{
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
