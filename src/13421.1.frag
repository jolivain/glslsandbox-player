#ifdef GL_ES
precision mediump float;
#endif

// Hello Morph! By David Hoskins. Jan 2014.
// Aardman's (from Wallace & Gromit fame) early work.
// Morph, the plasticine animation from British childhoods in the 70s and 80s.
// http://www.youtube.com/watch?v=jSMRPKM1evk

uniform float time;
uniform vec2 resolution;

// Comment this line out to remove frame judder effect...
#define STOP_MOTION_EFFECT

#define 	elbowR		vec3(1.0, -.1, 0.3)
#define 	shoulderR	vec3(0.4, 0.56,  -.05)
#define 	wristR		vec3(.5, -.4, -0.1)
#define 	shoulderL	vec3(-0.4, 0.56, -.05)
vec3 elbowL = vec3(0.);
vec3 wristL = vec3(0.);

const vec3 sunColour  = vec3(1.0);
const vec3 skinColour = vec3(.72, .23, 0.12);
vec3 sunDir	= normalize(vec3(.5, .7, -.8));

float hello = 0.;
float owwww = 0.;
float wave = 0.;
float gtime = 0.;
bool  blink = false;

//----------------------------------------------------------------------------------------
mat3 RotMat(vec3 v, float angle)
{
	v = normalize(v);
	float c = cos(angle);
	float s = sin(angle);
	
	return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,
		(1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,
		(1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z
		);
}

float Segment(vec3 p,  vec3 a, vec3 b, float r1, float r2)
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	
	return length( pa - ba*h ) - r1 + r2*h;
}

//----------------------------------------------------------------------------------------
float  Sphere( vec3 p, float s )
{
    return length(p)-s;
}

//----------------------------------------------------------------------------------------
float Mouth( vec3 p, vec3 a)
{
	float curve = cos(p.x*(5.35+sin(time)*1.25))*.11;
	p.y += curve;
	a.y += (curve*curve);
	return length(max(abs(p) - a,0.0)) -.02;
}

//----------------------------------------------------------------------------------------
float Cylinder( vec3 p, vec2 h )
{
  return max( length(p.xz)-h.x, abs(p.y)-h.y );
}

//----------------------------------------------------------------------------------------
float RoundBox( vec3 p, vec3 b, float r )
{
	//b.x -= p.y * .08;
	return length(max(abs(p)-b,0.0))-r;
}

//----------------------------------------------------------------------------------------
float Nose(vec3 p, vec3 a, float r )
{
	float h = clamp( dot(p,a)/dot(a,a), 0.0, 1.0 );
	return length( p - a*h ) - r;
}

//----------------------------------------------------------------------------------------
vec2 opU( vec2 d1, vec2 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}


//----------------------------------------------------------------------------------------
float sMin( float a, float b )
{
    float k = .1;
	float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.-h);
}


//----------------------------------------------------------------------------------------
vec2 Map( in vec3 pos )
{	// Floor...
    vec2 res = vec2( 1000.0, -1.0);
	float d;
	vec3 p2;

	// Head...
	vec3 p = pos-vec3(0.0, 1.0, -0.1);
	float h = sin(time*2.3) * .1 - wave*0.01;
	p = RotMat(vec3(0.0, 0.5, .1), h) * p;
	p2 = RotMat(vec3(1.0, 0.0, .0), wave*.01+hello*2.0) * p;
	res = opU(res, vec2(Sphere(p, .38), 3.0 ));
	// Mouth...
	float mo = -Mouth(p2-vec3(0.0, -.057-hello, -0.3), vec3(.155-owwww, -.01+hello, .2));
	if (res.x  < mo ) res = vec2(mo, 2.0);
	
	// Eyes...
	if (res.y > 2.5)
	{
		vec3 p3 = vec3(abs(p2.x), p2.yz);
		if (dot(normalize(p3*vec3(1.0, .9, 1.0)), normalize(vec3(.32, 0.28, -.7))) > .945) res.y = 4.0;
		if (dot(normalize(p3), normalize(vec3(.32, 0.18, -.8))) > .993) res.y = 5.0;
	}

	// Nose
	p2 = p2-vec3(0.0, 0.0, 0.0);
	res = opU(res, vec2(Nose(p2, vec3(.0,0.0,-.5), 0.07), 3.0 ));
	
	// Neck...
	p = p-vec3(0.0, -.4, .1);
	d = Cylinder(p, vec2(0.16, .17));
	res.x = sMin(res.x, d);

	// Body...	
	p = p-vec3(0.0, -.85, 0.0);
	d = RoundBox(p, vec3(0.18, .49, 0.0), .26);
	res.x = sMin(res.x, d);
	
	// Right arm upper...
	p = p-vec3(0.0, 0.0, 0.0);
	d = Segment(p, shoulderR, elbowR, .19, .05);
	res.x = sMin(res.x, d);
	// Right arm lower...
	d = Segment(p, elbowR, wristR, .15, .03);
	res.x = sMin(res.x, d);
	// Right hand...	
	d = Segment(p*vec3(1.0, .75, 1.0), wristR+vec3(0, .1, 0.), wristR+vec3(-.15, .05, -.15), .14, .02);
	res.x = min(res.x, d);
	
	// Left arm upper...
	d = Segment(p, shoulderL, elbowL, .19, .05);
	res.x = sMin(res.x, d);
	// Left arm lower...
	d = Segment(p, elbowL, wristL, .14, .01);
	res.x = sMin(res.x, d);
	
	// Hand...	
	p = (p-wristL);
	p.z -= p.x*.5;
	p = RotMat(vec3(0.0, 0.0, 1.0), -wave*1.5) * p;
	d = Segment(p, vec3(0.0), -vec3(-.25, -0.15, 0.1), .06, .01);
	res.x = sMin(res.x, d);
	d = RoundBox(p-vec3(0.0, .25, 0.0), vec3(.045, .09, -.05), .09);
	res.x = sMin(res.x, d);
	
	p = pos;
	// Mirrored legs...
	p.x = abs(p.x);
	vec3 topLeg = vec3(0.22, -.8, 0.0);
	vec3 ankle  = vec3(0.3, -2.0, 0.0);
	d = Segment(p, topLeg, ankle, .23, .05);
	res.x = sMin(res.x, d);
	ankle.y -=.3;
	vec3 foot = ankle + vec3(0.27, -.05, -0.3);
	d = Segment(p, ankle, foot, .25, .05);
	d = max((ankle.y-p.y), d);
	res.x = sMin(res.x, d);

    return res;
}

//----------------------------------------------------------------------------------------
vec2 RayMarch( in vec3 ro, in vec3 rd)
{
	const float precis = 0.01;
	float t = .25;
	
	vec2 res = vec2(precis*2.0, -1.0);
    for( int i = 0; i < 70; i++ )
    {
        if(res.x < precis) continue;
		if (t > 8.0)
		{
			res.y = -1.0;
			continue;
		}
		t += max(.005, res.x * .45);
		res = Map( ro+rd*t );
    }
	return vec2( t, res.y);	
}

//----------------------------------------------------------------------------------------
float Shadow( in vec3 ro, in vec3 rd)
{
	float res = 1.0;
    float t = 0.1;
    for( int i=0; i < 6; i++ )
    {
		if (res < 0.0) continue;
        float h = Map( ro + rd*t ).x;
        res = min( res, 8.0*h/t);
     	t += clamp( h, 0.02, 2.0 );
    }
    return max(res, 0.0);
}

//----------------------------------------------------------------------------------------
vec3 Normal( in vec3 pos )
{
	const vec2 eps = vec2( 0.03, 0.0);
	vec3 nor = vec3(
	    Map(pos+eps.xyy).x - Map(pos-eps.xyy).x,
	    Map(pos+eps.yxy).x - Map(pos-eps.yxy).x,
	    Map(pos+eps.yyx).x - Map(pos-eps.yyx).x );
	return normalize(nor);
}

//----------------------------------------------------------------------------------------
vec3 Render( in vec3 ro, in vec3 rd )
{ 
	vec3 col = vec3(0.9), pos, norm;
	vec2 res = RayMarch(ro, rd);

	float dis = res.x;
	float mat = res.y;
	
	if (mat < .5)
	{
		// Missed...
		if (rd.y < 0.0)
		{
			dis = (-2.3-ro.y)/rd.y;
			vec2 p = ro.xz + rd.xz * dis;
			pos = vec3(p.x, -2.0, p.y);
			col = vec3(.85, .6, .3);//texture2D(iChannel0, p*.3).xyz*.65;
			norm = vec3(0.0, 1.0, 0.0);
			mat = 1.5;
		}
	}else
	{
		pos = ro + dis * rd;
		norm = Normal( pos );

		if (mat < 2.5)
		{
			// Inside mouth...
			col = skinColour*.3;
	
		}else if (mat < 3.5)
		{
			// Plasticine...
			col = skinColour;
	
		}else if (mat < 4.5)
		{
			// Eye balls...
			if (blink == true)
				col = skinColour * .7;
			else
				col = vec3(1.0);
		}else if (mat < 5.5)
		{
			// Pupil...
			if (blink == true)
				col = skinColour * .7;
			else
				col = vec3(0.0);
		}
	}
	if (mat > 0.5)
	{
		float diff = max(dot(norm, sunDir), 0.0);
		float ambi = clamp(.2 + 0.2 * norm.y,0.0, 1.0);
		float shad = Shadow(pos, sunDir);
		float spec = max( 0.0, pow( max( dot(sunDir,reflect(rd,norm)), 0.0), 5.0) ) * .2;
		
		vec3 lite = diff * sunColour * shad + diff*ambi;
			
		col = col * lite + spec * shad;
		col = mix(col, vec3(.9), min(dis*dis*.001, 1.0));
	}
	

	return col;
}

//----------------------------------------------------------------------------------------
void main( void )
{
	// Stop motion time...
#ifdef STOP_MOTION_EFFECT
	gtime = mod((floor(time*20.0) / 20.0), 20.0)-.5;
#else
	gtime = mod(iGlobalTime, 20.0)-.5;
#endif
	
	vec2 q = gl_FragCoord.xy/resolution.xy;
    vec2 p = -1.0+2.0*q;
	p.x *= resolution.x/resolution.y;
    //vec2 mo = (iMouse.xy/iResolution.xy)-.5;
	
	float m = fract(time*.19);
	hello =  (1.0+sin(m*100.0)) * .02 * (smoothstep(0.0, .01, m) - smoothstep(0.05, .1, m));
	owwww = (smoothstep(0.05, .1, m)-smoothstep(0.12, .15, m))*.12;
	if (mod(time-1.0, 3.0) < .12)
			blink = true;
	
	// Camera...
	float t = clamp(time-2.5, 0.0, 1.0);
	t = t*t*(3.0-2.0*t);
	vec3 origin = mix(vec3(0.0, 1.0, -1.2), vec3(-1.0, 1.0, -5.0), t);
	vec3 target = mix(vec3(0.0, 1.0, 4.0),  vec3( 0.0, -.4, 0.0), t);
	
	vec3 cw = normalize( target-origin);
	vec3 cp = vec3( 0.0, 1.0, 0.0 );
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = ( cross(cu,cw) );
	vec3 ray = normalize( p.x*cu + p.y*cv + 2.6*cw );
	
	// Wave...
	wave = sin(time*15.0-.8)*.5+.5;
	wave = wave*wave*(3.0-2.0*wave)-.5;
	elbowL		= vec3(-.95-wave*.05, .2, -0.25);
	wristL		= vec3(elbowL.x+1.0*sin(wave)*.6, elbowL.y+cos(wave)*.6, -.75);

    vec3 col = Render(origin, ray);
	
	col = sqrt(col);
	col *= 0.5 + 0.5*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.25 );
    gl_FragColor=vec4(clamp(col, 0.0, 1.0), 1.0 );
}
