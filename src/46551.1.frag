#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Verlet Spider. By David Hoskins - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// It uses Verlet Integration to place the 'knees' correctly.

// https://www.shadertoy.com/view/ltjXzt

#define MOD3 vec3(.1031,.11369,.13787)

struct SPID_LEGS
{
    vec3 point;
    vec3 knee;
    vec3 ankle;
    vec3 fix;
};
    
SPID_LEGS spiderLegs[8];
float gTime = 0.;
vec3 body = vec3(0.0);
vec2 add = vec2(1.0, 0.0);


//----------------------------------------------------------------------------------------
float hash11(float p)
{
	vec3 p3  = fract(vec3(p) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float noise11(float n)
{
    float f = fract(n);
     f = f*f*(3.0-2.0*f);
    n = floor(n);
    return mix(hash11(n),  hash11(n+1.0), f);
}

//----------------------------------------------------------------------------------------
float  sphere(vec3 p, vec3 x, float s )
{
    return length(p-x)-s;
}

//----------------------------------------------------------------------------------------
float  ass(vec3 p, vec3 x, float s )
{
    return length((p-x)* vec3(1., 1.0, .8)) - s;
}

//----------------------------------------------------------------------------------------
float upperLeg( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r*(sin(h*2.14+.4));
}

float upperLegCE( vec3 p, vec3 a, vec3 b, float r)
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	float d =  length( pa - ba*h ) - r*(sin(h*2.14+.4));
	if (d< .05)
     	return h;
        else return -1.0;
}


//----------------------------------------------------------------------------------------
float lowerLeg(vec3 p,  vec3 a, vec3 b, float r1, float r2)
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r1 + r2*h;
}
//----------------------------------------------------------------------------------------
float lowerLegCE(vec3 p,  vec3 a, vec3 b, float r1, float r2)
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    float d = length( pa - ba*h ) - r1 + r2*h;
	if (d< .05)
     	return h;
        else return -1.0;
}

//----------------------------------------------------------------------------------------
float smoothMin( float a, float b, float k )
{
    
	float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.-h);
}

//----------------------------------------------------------------------------------------
// Map the distance estimation...
float mapDE(vec3 p)
{
    float d;

    // Body...
    d = ass(p, body+vec3(0.0, 0.1, -1.7), .9);
    d = smoothMin(d, sphere(p, body+vec3(0.0, 0., .5 ), .65), .8);
    // Eight legs....
    for (int i = 0; i < 8; i++)
    {
        d = min(d, upperLeg(p, spiderLegs[i].fix, spiderLegs[i].knee, .18)); 
        d = min(d, upperLeg(p, spiderLegs[i].knee, spiderLegs[i].ankle, .16)); 
        d = min(d, lowerLeg(p, spiderLegs[i].ankle, spiderLegs[i].point, .09, .05)); 
    }
    
    // Mirror down body...
    p.x = abs(p.x);
    // Eyeballs...
    d = min(d, sphere(p, body+vec3(0.2, 0.4, .93 ), .14));
    d = min(d, sphere(p, body+vec3(0.11, 0.18, 1.1), .08));
    // Mandible parts..
    d = min(d, lowerLeg(p, body+vec3(0.2, 0., 1. ), body+vec3(0.07, -.4, 1.24), .12,.12));
    return d;
}

//----------------------------------------------------------------------------------------
// Map the colour material...
vec3 mapCE(vec3 p)
{
    // Default red...
    vec3 mat  = vec3(.1, 0.0, 0.0);

    
    float d = ass(p, body+vec3(0.0, 0.1, -1.7), 1.);
    if (d< .05)
        mat  = mix(vec3(.05, 0.02, .0),mat, clamp((p.z-body.z+.7)*4.0, 0.0, 1.0));
        
    d = smoothMin(d, sphere(p, body+vec3(0.0, 0., .5 ), .65), .8);
    
        // Eight legs....
    for (int i = 0; i < 8; i++)
    {
        float h = -1.0, h2 = h;
        h = max(upperLegCE(p, spiderLegs[i].fix, spiderLegs[i].knee, .18), h); 
        
        h = max(upperLegCE(p, spiderLegs[i].knee, spiderLegs[i].ankle, .16), h); 
        
        h = max(lowerLegCE(p, spiderLegs[i].ankle, spiderLegs[i].point, .09, .05), h); 
        if (h  > .0)
            mat = mix(vec3(.1, 0.0, 0.0), vec3(.008, .008, .0), fract(abs(h-.5))*2.);
            
    }
    

    p.x = abs(p.x);
    // Eye balls...  
    if (sphere(p, body+vec3(0.2, 0.40, .93 ), .14) < 0.05 || sphere(p, body+vec3(0.1, 0.18, 1.1), .09) <0.05)
   		 mat  = vec3(.0, 0.00, 0.00);
    
    return mat;
}

//----------------------------------------------------------------------------------------
float translucency(vec3 p, vec3 nor)
{
    float d = max(mapDE(p-nor*2.), 0.0);
    return min(d*d*d, 2.);
}

//----------------------------------------------------------------------------------------
float binarySubdivision(in vec3 rO, in vec3 rD, vec2 t)
{
	// Home in on the surface by dividing by two and split...
    float halfwayT;
	for (int n = 0; n < 2; n++)
	{
		halfwayT = (t.x + t.y) * .5;
        (mapDE(rO + halfwayT*rD) < 0.05) ? t.x = halfwayT:t.y = halfwayT;
	}
	return t.x;
}

//----------------------------------------------------------------------------------------
float rayMarch(vec3 pos, vec3 dir)
{
    float d =  8., de, oldD = 0.0;
    float res = 35.0;
    for (int i = 0; i < 30 ; i++)
    {
        if (d > 35.0) break;
        vec3 p = pos + dir * d;
        de = mapDE(p);
        if(de < 0.05)
        {
            res = d;
            break;
        }
        
        oldD = d;
        d += de;
    }
    // Divide down onto the distance field..
	if (res < 35.0)
        res = binarySubdivision(pos, dir, vec2(d, oldD));
        
    return res;
}
//----------------------------------------------------------------------------------------
float shadow( in vec3 ro, in vec3 rd)
{
	float res = 1.0;
    float t = 0.1;
	float h;
	
    for (int i = 0; i <8; i++)
	{
		h = max(mapDE( ro + rd*t )+.03, 0.0);
		res = min(3.*h / t, res);
		t += h+.1;
	}
    return max(res, .12);
}

//----------------------------------------------------------------------------------------
vec3 normal( in vec3 pos)
{
	vec2 eps = vec2(.003, 0.0);
	vec3 nor = vec3(
	    mapDE(pos+eps.xyy) - mapDE(pos-eps.xyy),
	    mapDE(pos+eps.yxy) - mapDE(pos-eps.yxy),
	    mapDE(pos+eps.yyx) - mapDE(pos-eps.yyx) );
	return normalize(nor);
}

//----------------------------------------------------------------------------------------
vec3 cameraLookAt(in vec2 uv, in vec3 cam, in vec3 tar)
{
	vec3 cw = normalize(tar-cam);
	vec3 cp = vec3(0.0,1.0,0.0);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv = (cross(cu,cw));
	return normalize(-uv.x*cu + uv.y*cv +2.*cw );
}

//----------------------------------------------------------------------------------------
// Verlet integration. Only effects the second vector because there is always an anchor point.
// ie. the foot and the hip...
void verlet (in vec3 anchor, inout vec3 knee, float len)
{

		vec3 delta = anchor-knee;
		float deltalength = length(delta);
		float diff = (-len / (deltalength + len)) + 0.5;
		delta = delta * diff;
    //	Move it double becuase it's there's an anchor, so I only move one.
    	knee += delta*2.0;
}

//----------------------------------------------------------------------------------------
// Started off looking at iq's 'insect', then realised it's feet weren't passing each other.
// So this is also a larger stride, an more legs of course.
void moveSpider()
{
    float t  = gTime+sin(noise11(gTime*.7)+gTime+4.0);
	body.z = 3.*mod(t*1.2, 12.0)-2.0;
    body.y = 1.2 + sin(noise11(gTime*.9)*6.28) *.8;

    for (int i = 0; i < 8 ; i++)
    {
	    float s = sign( float(i)-3.5 );
		float h = mod( float(7-i),4. )/4.0;
        
		float z = (body.z + h*4.+s*.66 )/3.0;
		float iz = floor(z);
		float fz = fract(z);
	    float az = smoothstep(.65,  1., fz);
        
        spiderLegs[i].point = spiderLegs[i].fix;
        spiderLegs[i].point.y += sin(az*3.141); // az*(1.0-az)*4.0;//
        spiderLegs[i].point.z +=  (iz*3.0 + az*3.0 -h * 4.) + (s<.0?1.5:0.);
        spiderLegs[i].fix = spiderLegs[i].fix*vec3(.12, .4, .1) + body - vec3(.0, .34, 0.);
        spiderLegs[i].knee  = (spiderLegs[i].point+spiderLegs[i].fix)*.5;

        spiderLegs[i].knee.y+=1.3;
      

		// Iterate twice for stronger constraints..
	    // Over exagerate the limbs size to increase the contraint effect,
        // without the need for many iterations...
		verlet(spiderLegs[i].fix, spiderLegs[i].knee,2.);
		verlet(spiderLegs[i].point, spiderLegs[i].knee, 2.2);
        
		spiderLegs[i].ankle = (spiderLegs[i].point + spiderLegs[i].knee)*.5;
        spiderLegs[i].ankle.x *= 1.14;
        
    }
}

//----------------------------------------------------------------------------------------
// I moved this away from random numbers to Kali's chaotic formula...
vec3 getFloorBoards(vec2 p)
{
    p *= vec2(1.5, 20.0) * .01;// ...Fiddly adjustments!
    p.y -=.4;
	//p = abs(.85-mod(p,vec2(.85*2.))); // tiling fold
	
    for (int i=0; i < 6; i++)
        p = abs(p * 2.27) / dot(p, p) - .94 ;
    
    float f = max(sin(dot(p,p)), 0.0);
    return (0.6 + .4*sin( f + vec3(1.,1.8,2.) ) )* vec3(.3, .23, .15) ;

}

//----------------------------------------------------------------------------------------
void main()
{
    gTime = time*.7-9.;
    
    vec2 xy = (gl_FragCoord.xy / resolution.xy);
	vec2 uv = (xy-.5)*vec2( resolution.x / resolution.y, 1);
    
    // Set initial feet positions...
    spiderLegs[0].fix = vec3(-1.9,0.0, 3.5);
    spiderLegs[1].fix = vec3(-2.9,0.0, 1.4);
    spiderLegs[2].fix = vec3(-3.0, 0.0, -.4);
    spiderLegs[3].fix = vec3(-2.25, 0.0, -2.4);
    
    spiderLegs[4].fix = vec3(1.9,0.0, 3.5);
    spiderLegs[5].fix = vec3(2.9, 0.0, 1.4);
    spiderLegs[6].fix = vec3(3.0, 0.0, -.4);
    spiderLegs[7].fix = vec3(2.25, 0.0, -2.4);
    
        // Do the animation..
    moveSpider();

	float height = 10.0;
//    if (iMouse.z > 0.)  height = (iMouse.y/ iResolution.y * 17.0)+2.0;
  
    vec3 pos = vec3(-10.0, height,25.0)+0.04*cos(gTime*vec3(2.4,2.5,2.1) );
    pos = mix(vec3(0.0, 1., 20.0), pos, smoothstep(0.5, 4.0, time));
    vec3 dir = cameraLookAt(uv, pos, vec3(1.0, body.y*.4, 1.0+body.z)+0.04*sin(gTime*vec3(2.7,2.4,2.4) ));
    vec3 col = vec3(0.5), mat;
    
    
    float d = rayMarch(pos, dir);
    vec3 nor, loc;
    float tra = 0.0;
    if (d < 35.0)
    {
        // Spider...
        loc = pos+dir*d;
        nor = normal(loc);
        mat = mapCE(loc);
        tra = translucency(loc, nor);  
    }else    
    {
        // Floor...
        if (dir.y < 0.0)
        {
            d = (.0-pos.y) / dir.y;
            nor = vec3(0.0, 1.0, 0.0);
            loc = pos+dir*d;
			mat = getFloorBoards(loc.zx);
            float f =  fract(loc.x*.14);
            mat = mix(mat, vec3(0.0), smoothstep(0., .025,f)*smoothstep(.05, .025, f)*.75);
        }else
        {
            gl_FragColor = vec4(.3, .3, .3, 1.0);
            return;
        }
    }
    vec3 sun = normalize(vec3(-18.5, 10.4, 10.)- loc);
    float sha = shadow(loc, sun);

    
    vec3 ref = reflect(sun, nor);
    col = (mat * (tra+max(dot(sun, nor), 0.0))+pow(max(dot(dir, ref), 0.0), 24.0)*.2) *sha;
    col+= vec3(0.01, 0.01, .02) * max(dot(normalize(vec3(18.5, 10.4, -30.)), nor),0.0);
    col += min(mat * abs(nor.y*.2), 1.0);
    
     col *= .5+.55*180.0*xy.x*xy.y*(1.0-xy.x)*(1.0-xy.y);
    // Gamma and end...
	gl_FragColor = vec4(sqrt(col),1.0);
}
