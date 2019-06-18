#ifdef GL_ES
precision highp float;
#endif

// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Made with love after a famous movie character. Modeling is pretty arbitrary and was 
// done by visual inspiration from the first picture you get in google images when you 
// type "mike wazowski".

// Uncomment the following define in order to see Mike in 3D!
//#define STEREO 


uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform sampler2D iChannel0;

float hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

float noise( in float x )
{
    float p = floor(x);
    float f = fract(x);

    f = f*f*(3.0-2.0*f);

    return mix( hash(p+0.0), hash(p+1.0),f);
}

float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*157.0;

    float res = mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                    mix( hash(n+157.0), hash(n+158.0),f.x),f.y);

	return res;
}


mat2 m2 = mat2( 0.80, -0.60,
                0.60, 0.80 );

float fbm( vec2 p )
{
    float f = 0.0;

    f += 0.5000*noise( p ); p = m2*p*2.02;
    f += 0.2500*noise( p ); p = m2*p*2.03;
    f += 0.1250*noise( p ); p = m2*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

vec3 texturize( sampler2D sa, vec3 p, vec3 n )
{
	vec3 x = texture2D( sa, p.yz ).xyz;
	vec3 y = texture2D( sa, p.zx ).xyz;
	vec3 z = texture2D( sa, p.xy ).xyz;

	return x*abs(n.x) + y*abs(n.y) + z*abs(n.z);
}

//----------------------------------------------------------------

vec2 sdSegment( vec3 a, vec3 b, vec3 p )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	
	return vec2( length( pa - ba*h ), h );
}

float smin( float a, float b )
{
    float k = 0.06;
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

float opS( float d1, float d2 )
{
    return max(-d1,d2);
}


vec2 sdMonster( vec3 p )
{
	p.y -= 1.8;
	p.x = abs(p.x);

	vec3 q = p;
	q.y -= 0.3*pow(1.0-length(p.xz),1.0)*smoothstep(0.0, 0.2, p.y);
	q.y *= 1.05;
	q.z *= 1.0 + 0.1*smoothstep( 0.0, 0.5, q.z )*smoothstep( -0.5, 0.5, p.y );
    float dd = length( (p - vec3(0.0,0.65,0.8))*vec3(1.0,0.75,1.0) );
	float am = clamp( 4.0*abs(p.y-0.45), 0.0, 1.0 );
	float fo = -0.03*(1.0-smoothstep( 0.0, 0.04*am, abs(dd-0.42) ))*am;
    float dd2 = length( (p - vec3(0.0,0.65,0.8))*vec3(1.0,0.25,1.0) );
	float am2 = clamp( 1.5*(p.y-0.45), 0.0, 1.0 );
	float fo2 = -0.085*(1.0-smoothstep( 0.0, 0.08*am2, abs(dd2-0.42) ))*am2;
    q.y += -0.05+0.05*length(q.x);
	
	float d1 = length( q ) - 0.9 + fo + fo2;
    vec2 res = vec2( 0.8*d1, 1.0 );

	// arms
	vec2 h = sdSegment( vec3(.83,0.15,0.0), vec3(1.02,-0.6,-.1), p );
	float d2 = h.x - 0.07;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(1.02,-0.6,-.1), vec3(0.95,-1.2,0.1), p );
	d2 = h.x - 0.07 + h.y*0.02;
	res.x = smin( res.x, d2 );
	
	// hands
	if( p.y<-1.0 )
	{
    float fa = sin(3.0*time);
	h = sdSegment( vec3(0.95,-1.2,0.1), vec3(0.97,-1.5,0.0), p );
	d2 = h.x - 0.03;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.97,-1.5,0.0), vec3(0.95,-1.7,0.0)-0.01*fa, p );
	d2 = h.x - 0.03 + 0.01*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.95,-1.2,0.1), vec3(1.05,-1.5,0.1), p );
	d2 = h.x - 0.03;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(1.05,-1.5,0.1), vec3(1.0,-1.75,0.1)-0.01*fa, p );
	d2 = h.x - 0.03 + 0.01*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.95,-1.2,0.1), vec3(0.98,-1.5,0.2), p );
	d2 = h.x - 0.03;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.98,-1.5,0.2), vec3(0.95,-1.7,0.15)-0.01*fa, p );
	d2 = h.x - 0.03 + 0.01*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.95,-1.2,0.1), vec3(0.85,-1.4,0.2), p );
	d2 = h.x - 0.04 + 0.01*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.85,-1.4,0.2), vec3(0.85,-1.63,0.15)+0.01*fa, p );
	d2 = h.x - 0.03 + 0.01*h.y;
	res.x = smin( res.x, d2 );
	}
	
	// legs
	if( p.y<0.0 )
	{
	h = sdSegment( vec3(0.5,-0.5,0.0), vec3(0.6,-1.2,0.1), p );
	d2 = h.x - 0.14 + h.y*0.08;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.6,-1.2,0.1), vec3(0.5,-1.8,0.0), p );
	d2 = h.x - 0.06;
	res.x = smin( res.x, d2 );
	}

    // feet
	if( p.y<-1.5 )
	{
	h = sdSegment( vec3(0.5,-1.8,0.0), vec3(0.6,-1.8,0.4), p );
	d2 = h.x - 0.09 + 0.02*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.5,-1.8,0.0), vec3(0.77,-1.8,0.35), p );
	d2 = h.x - 0.08 + 0.02*h.y;
	res.x = smin( res.x, d2 );
	h = sdSegment( vec3(0.5,-1.8,0.0), vec3(0.9,-1.8,0.2), p );
	d2 = h.x - 0.07 + 0.02*h.y;
	res.x = smin( res.x, d2 );
	}
	
	// horns
	vec3 hp = p - vec3(0.0,0.8,0.0);
	float hh = -2.5*hp.x*hp.x;
	float co = cos(hh);
	float si = sin(hh);
	hp.xy = mat2(co,si,-si,co)*hp.xy;
	float d4 = length( hp*vec3(0.3,1.0,1.0) ) - 0.19;
	d4 *= 0.5;
	if( d4<res.x ) res = vec2( d4, 3.0 );

	// eyes
	float d3 = length( (p - vec3(0.0,0.25,0.35))*vec3(1.0,0.8,1.0) ) - 0.5;
	if( d3<res.x ) res = vec2( d3, 2.0 );

	// mouth
	float mo = length( (q-vec3(0.0,-0.35,1.0))*vec3(1.0,1.2,0.25)/1.2 ) -0.3/1.2;
	float of = 0.1*pow(smoothstep( 0.0, 0.2, abs(p.x-0.3) ),0.5);
	mo = max( mo, -q.y-0.35-of );

	float li = smoothstep( 0.0, 0.05, mo+0.02 ) - smoothstep( 0.05, 0.10, mo+0.02 );
	res.x -= 0.03*li*clamp( (-q.y-0.4)*10.0, 0.0, 1.0 );
	
	if( -mo > res.x )
		res = vec2( -mo, 4.0 );

    res.x += 0.01*(smoothstep( 0.0, 0.05, mo+0.062 ) - smoothstep( 0.05, 0.10, mo+0.062 ));

    // teeth	
	if( p.x<0.3 )
	{
    p.x = mod( p.x, 0.16 )-0.08;	
    float d5 = length( (p-vec3(0.0,-0.37,0.65))*vec3(1.0,2.0,1.0))-0.08;
	if( d5<res.x )
		res = vec2( d5, 2.0 );
	}
	
	return res;
}


vec2 map( in vec3 p )
{
    vec2 res = vec2( p.y, 0.0 );
		
	vec2 tmp = sdMonster( p );

	if( tmp.x<res.x ) res=tmp;
	
	return res;
}

vec3 intersect( in vec3 ro, in vec3 rd )
{
	float maxd = 70.0;
	float precis = 0.001;
    float h=precis*2.0;
    float t = 0.0;
	float d = 0.0;
    float m = 1.0;
    for( int i=0; i<90; i++ )
    {
        if( abs(h)<precis||t>maxd ) continue;//break;
        t += h;
	    vec2 res = map( ro+rd*t );
        h = res.x;
		d = res.y;
		m = res.y;
    }

    if( t>maxd ) m=-1.0;
    return vec3( t, d, m );
}

vec3 calcNormal( in vec3 pos )
{
    vec3 eps = vec3(0.002,0.0,0.0);

	return normalize( vec3(
           map(pos+eps.xyy).x - map(pos-eps.xyy).x,
           map(pos+eps.yxy).x - map(pos-eps.yxy).x,
           map(pos+eps.yyx).x - map(pos-eps.yyx).x ) );
}

float softshadow( in vec3 ro, in vec3 rd, float mint, float k )
{
    float res = 1.0;
    float t = mint;
	float h = 1.0;
    for( int i=0; i<35; i++ )
    {
        h = map(ro + rd*t).x;
        res = min( res, k*h/t );
		t += clamp( h, 0.02, 2.0 );
    }
    return clamp(res,0.0,1.0);
}


vec3 lig = normalize(vec3(1.0,0.7,0.9));

void main(void)
{
	vec2 q = gl_FragCoord.xy / resolution;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= resolution.x/resolution.y;
    vec2 m = mouse/resolution;

	#ifdef STEREO
	float eyeID = mod(gl_FragCoord.x + mod(gl_FragCoord.y,2.0),2.0);
    #endif

    //-----------------------------------------------------
    // animate
    //-----------------------------------------------------
	
	float ctime = time;

	
    //-----------------------------------------------------
    // camera
    //-----------------------------------------------------
	
	float an = (-0.25 + 0.31416*ctime) - 6.2831*(m.x-0.5);

	vec3 ro = vec3(3.5*sin(an),1.8,3.5*cos(an));
    vec3 ta = vec3(0.0,1.5,0.0);

    // camera matrix
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));

	// create view ray
	vec3 rd = normalize( p.x*uu + p.y*vv + 2.0*ww );

	#ifdef STEREO
	vec3 fo = ro + rd*7.0; // put focus plane behind Mike
	ro -= 0.1*uu*eyeID;    // eye separation
	rd = normalize(fo-ro);
    #endif

    //-----------------------------------------------------
	// render
    //-----------------------------------------------------

	vec3 col = vec3(1.0);

	// raymarch
    vec3 tmat = intersect(ro,rd);
    if( tmat.z>-0.5 )
    {
        // geometry
        vec3 pos = ro + tmat.x*rd;
        vec3 nor = calcNormal(pos);
		vec3 ref = reflect( rd, nor );

        // materials
		vec4 mate = vec4(0.0);
		vec2 mate2 = vec2(0.0,1.0);
		if( tmat.z<0.5 )
		{
			mate.xyz = vec3(1.0);
            mate2.y = 1.0 - 0.9*(2.0/(2.0+dot(pos.xz,pos.xz)));
		}
		else if( tmat.z<1.5 )
		{
            mate2.x = 4.0;
			mate = vec4(0.16,0.32,0.0,0.8);

            float f = texturize( iChannel0, 0.15*pos, nor ).x * texturize( iChannel0, 0.2*0.25*pos, nor ).x;
			mate.xyz = mix( 0.8*mate.xyz, vec3(0.3,0.4,0.0), f );

			f = texturize( iChannel0, pos, nor ).x * texturize( iChannel0, 0.25*pos, nor ).x;
			f = f*f;
		    mate.xyz = mix( mate.xyz, vec3(0.3,0.4,0.0), 0.6*f );

			vec3 bnor = -1.0+2.0*texturize( iChannel0, 4.0*pos, nor );
			nor = normalize( nor + 0.15*bnor );
			
			mate.xyz *= 0.7;

		}
		else if( tmat.z<2.5 )
		{
			vec3 q = pos-vec3(0.0,1.8,0.0) - vec3(0.0,0.44,0.35);

			float an2 = an + 0.015*(-1.0+2.0*noise( 6.0*time ));
            vec3 oq = q;			
			q.x += -2.0*0.15*clamp(sin(an2),-0.42,0.42);
			float f = length( q.xy );
			
			mate2.y = 1.0-0.3*smoothstep(0.24,0.35,length( oq.xy-vec2(0.0,0.035) ));
			
			mate = vec4(0.5,0.5,0.5,1.0);
			mate.xyz = mix( mate.xyz, vec3(0.6,0.4,0.3), 0.5*smoothstep(0.1,0.4,f) );
			
            vec3 c1 = vec3(0.0,0.15,0.05)*(1.0-0.85*f/0.19);
			float a = atan(q.y,q.x);
			c1 *= 0.3 + 5.0*fbm( 20.0*vec2(0.3*a,1.0*f) );
			mate.xyz = mix( mate.xyz, c1, 1.0-smoothstep( 0.18, 0.19, f ) );

			oq.x += -2.0*0.19*clamp(sin(an2),-0.42,0.42);
			f = length( oq.xy );
			mate.xyz *= smoothstep( 0.07, 0.10, f );
			
			mate.w = 2.0;
            mate2.x = 32.0;
		}
		else if( tmat.z<3.5 )
		{
			mate = 0.8*vec4(0.85,0.7,0.6,0.0);
            mate2.x = 0.0;

			float f = smoothstep( 0.0, 0.1, 0.5*abs(pos.x)+pos.y-3.02 );
			mate.xyz *= 1.0 - 0.8*vec3( f );
			
			mate.xyz *= 0.2 + 0.8*smoothstep( 0.0, 1.0, texturize( iChannel0, 0.1*2.1*pos*vec3(4.0,0.1,4.0), nor ).x );
		}
		else if( tmat.z<4.5 )
		{
			float z = smoothstep( 0.0, 2.0, pos.z+0.5 );
			mate = 0.5*vec4(0.5,0.25,0.1,0.0);
			mate.x += 0.1*(1.0-z);
			mate2.y = z;
		}


		// lighting
		float occ = (0.5 + 0.5*nor.y)*mate2.y;
        float amb = 0.5;
		float bou = clamp(-nor.y,0.0,1.0);
		float dif = max(dot(nor,lig),0.0);
        float bac = max(0.3 + 0.7*dot(nor,-lig),0.0);
		float sha = 0.0; if( dif>0.01 ) sha=softshadow( pos+0.01*nor, lig, 0.0005, 32.0 );
        float fre = pow( clamp( 1.0 + dot(nor,rd), 0.0, 1.0 ), 2.0 );
        float spe = max( 0.0, pow( clamp( dot(lig,reflect(rd,nor)), 0.0, 1.0), mate2.x ) );
		
		// lights
		vec3 lin = vec3(0.0);
        lin += 2.0*dif*vec3(1.00,1.00,1.00)*pow(vec3(sha),vec3(1.0,1.2,1.5));
		lin += 1.0*amb*vec3(0.30,0.30,0.30)*occ;
		lin += 2.0*bou*vec3(0.40,0.40,0.40)*mate2.y;
		lin += 4.0*bac*vec3(0.40,0.30,0.25)*occ;
        lin += 1.0*fre*vec3(1.00,1.00,1.00)*2.0*mate.w*(0.5+0.5*dif*sha)*occ;
		lin += 1.0*spe*vec3(1.0)*occ*mate.w*dif*sha;

		// surface-light interacion
		col = mate.xyz* lin + vec3(0.3)*mate.w*pow(spe,2.0)*sha;

	}


	//-----------------------------------------------------
	// postprocessing
    //-----------------------------------------------------
    // gamma
	col = pow( clamp(col,0.0,1.0), vec3(0.45) );

	// vigneting
    col *= 0.5 + 0.5*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.25 );

    #ifdef STEREO	
    col *= vec3( eyeID, 1.0-eyeID, 1.0-eyeID );	
	#endif

    gl_FragColor = vec4( col, 1.0 );
}

