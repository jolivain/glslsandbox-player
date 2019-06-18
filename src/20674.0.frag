#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

float hash( float n )
{
    return fract(sin(n)*43758.5453123);
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

mat3 m3 = mat3( 0.00,  0.80,  0.60,
               -0.80,  0.36, -0.48,
               -0.60, -0.48,  0.64 );

float fbm( vec3 p )
{
    float f = 0.0;

    f += 0.5000*noise( p ); p = m3*p*2.02;
    f += 0.2500*noise( p ); p = m3*p*2.03;
    f += 0.1250*noise( p ); p = m3*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}



float dbox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}

float freqs[4];

vec3 map( in vec3 pos )
{

	vec2 fpos = fract( pos.xz ); 
	vec2 ipos = floor( pos.xz );
	
	//ipos.x += floor(10.0*sin( iGlobalTime + 0.1*ipos.y));
	
    float f = 0.0;	
	float id = hash( ipos.x + ipos.y*57.0 );
	#if 1
	f  = freqs[0] * clamp(1.0 - abs(id-0.20)/0.30, 0.0, 1.0 );
	f += freqs[1] * clamp(1.0 - abs(id-0.40)/0.30, 0.0, 1.0 );
	f += freqs[2] * clamp(1.0 - abs(id-0.60)/0.30, 0.0, 1.0 );
	f += freqs[3] * clamp(1.0 - abs(id-0.80)/0.30, 0.0, 1.0 );
	f = pow( clamp( f*0.75, 0.0, 1.0 ), 2.0 );
	#endif
    float h = 0.01 + 4.0*f;
	float dis = dbox( vec3(fpos.x-0.5,pos.y-0.5*h,fpos.y-0.5), vec3(0.3,h*0.5,0.3), 0.1 );

    return vec3( dis,id, f );
}


const float surface = 0.001;

vec3 trace( in vec3 ro, in vec3 rd, in float startf, in float maxd )
{ 
    float s = surface*2.0;
    float t = startf;

    float sid = -1.0;
	float alt = 0.0;
    for( int i=0; i<128; i++ )
    {
        if( s<surface || t>maxd ) break;
        t += 0.15*s;
	    vec3 res = map( ro + rd*t );
        s   = res.x;
	    sid = res.y;
		alt = res.z;
    }
    if( t>maxd ) sid = -1.0;
    return vec3( t, sid, alt );
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k )
{
    float res = 1.0;
    float dt = 0.02;
    float t = mint;
    for( int i=0; i<64; i++ )
    {
        float h = map( ro + rd*t ).x;
        res = min( res, k*h/t );
        t += max( 0.05, dt );
    }
    return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal( in vec3 pos )
{
	vec3 eps = vec3(surface*0.5,0.0,0.0);
	vec3 nor;
	nor.x = map(pos+eps.xyy).x - map(pos-eps.xyy).x;
	nor.y = map(pos+eps.yxy).x - map(pos-eps.yxy).x;
	nor.z = map(pos+eps.yyx).x - map(pos-eps.yyx).x;
	return normalize(nor);
}


void main( void )
{
    vec2 xy = -1.0 + 2.0*gl_FragCoord.xy / resolution.xy;
    xy.x *= resolution.x/resolution.y;
	
    float gtime = 5.0 + 0.2*time + 20.0*mouse.x/resolution.x;

freqs[0] = sin(time);
freqs[1] = cos(time*2.);;
freqs[2] = sin(time*.5);
freqs[3] = cos(time*5.5);
	
	
    // camera	
	vec3 ro = vec3( 8.5*cos(0.2+.33*gtime), 5.0+2.0*cos(0.1*time), 8.5*sin(0.1+0.37*gtime) );
	vec3 ta = vec3( -2.5+3.0*cos(1.2+.41*gtime), 0.0, 2.0+3.0*sin(2.0+0.38*gtime) );
	float roll = 0.2*sin(0.1*gtime);
	
	// camera tx
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(roll), cos(roll),0.0);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv = normalize(cross(cu,cw));
	vec3 rd = normalize( xy.x*cu + xy.y*cv + 1.75*cw );
	
    // image
    vec3 col = vec3( 0.0 );
	
    vec3 res = trace( ro, rd, 0.025, 40.0 );
    float t = res.x;
    float sid = res.y;


	vec3 light1 = vec3(  0.577, 0.577, -0.577 );
    vec3 light2 = vec3( -0.707, 0.000,  0.707 );
    vec3 lpos = vec3(0.0) + 6.0*light1;
	
    if (sid>-0.5)
    {
    vec3 pos = ro + t*rd;
    vec3 nor = calcNormal( pos );
	    
	  
    // lighting
    vec3  ldif = pos - lpos;
    float llen = length( ldif );
    ldif /= llen;
	float con = dot(-light1,ldif);
	float occ = mix( clamp( pos.y/4.0, 0.0, 1.0 ), 1.0, max(0.0,nor.y) );
	float sha =  softshadow( pos, -ldif, 0.01, 5.0, 32.0 );;
		
    float bb = smoothstep( 0.5, 0.8, con );
    float lkey = clamp( dot(nor,-ldif), 0.0, 1.0 );
	vec3  lkat = vec3(1.0);
          lkat *= vec3(bb*bb*0.6+0.4*bb,bb*0.5+0.5*bb*bb,bb).zyx;
          lkat /= 1.0+0.25*llen*llen;		
		  lkat *= 25.0;
          lkat *= sha;
    float lbac = clamp( 0.1 + 0.9*dot( light2, nor ), 0.0, 1.0 );
          lbac *= smoothstep( 0.0, 0.8, con );
		  lbac /= 1.0+0.2*llen*llen;		
		  lbac *= 4.0;
	float lamb = 1.0 - 0.5*nor.y;
          lamb *= 1.0-smoothstep( 10.0, 25.0, length(pos.xz) );
		  lamb *= 0.25 + 0.75*smoothstep( 0.0, 0.8, con );
		  lamb *= 0.25;
		
    vec3 lin  = 1.0*vec3(0.20,0.05,0.02)*lamb*occ;
         lin += 1.0*vec3(1.60,0.70,0.30)*lkey*lkat*(0.5+0.5*occ);
         lin += 1.0*vec3(0.70,0.20,0.08)*lbac*occ;
         lin *= vec3(1.3,1.1,1.0);

		
    // material	
	col = 0.5 + 0.5*vec3( cos(0.0+6.2831*sid),		
                          cos(0.4+6.2831*sid),
                          cos(0.8+6.2831*sid) );
    float ff = fbm( 10.0*vec3(pos.x,4.0*res.z-pos.y,pos.z)*vec3(1.0,0.1,1.0) );	
    col *= 0.2 + 0.8*ff;
		
	col = col*lin;

    vec3 spe = vec3(1.0)*occ*lkat*pow( clamp(dot( reflect(rd,nor), -ldif  ),0.0,1.0), 4.0 );
	col += (0.5+0.5*ff)*0.5*spe*vec3(1.0,0.9,0.7);
    }

	
	col = sqrt( col );
	

    // vigneting
	vec2 q = gl_FragCoord.xy/resolution.xy;
    col *= 0.2 + 0.8*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );

    gl_FragColor=vec4( col, 1.0 );
}
