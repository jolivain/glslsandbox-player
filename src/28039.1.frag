// NotWasteBlood by I.G.P.    2015-10-04
// Todo: add light refraction, multicolored drops

#ifdef GL_ES
precision mediump float; 
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//----------------------------------------------------------------------
// http://www.iquilezles.org/www/articles/voronoise/voronoise.htm
//----------------------------------------------------------------------
vec3 hash3( vec2 p )
{
	vec3 q = vec3( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)), dot(p,vec2(419.2,371.9)) );
	return fract(sin(q)*43758.5453);
}

float noise( in vec2 x, float u, float v )
{
	vec2 p = floor(x);
	vec2 f = fract(x);

	float k = 1.0 + 63.0*pow(1.0-v,4.0);
	float va = 0.0;
	float wt = 0.0;
	for( int j=-2; j<=2; j++ )
	{
	    for( int i=-2; i<=2; i++ )
	    {
		vec2  g = vec2( float(i), float(j) );
		vec3  o = hash3( p + g )*vec3(u,u,1.0);
		vec2  r = g - f + o.xy;
		float d = dot(r,r);
		float w = pow( 1.0-smoothstep(0.0,1.414,sqrt(d)), k );
		va += w*o.z;
		wt += w;
	    }
	}
	return va/wt;
}

//http://www.iquilezles.org/www/articles/warp/warp.htm
float pattern( in vec2 p )
{
	vec2 q = vec2(noise( p + vec2(0.0, 0.0), 1., 1.)
		     ,noise( p + vec2(5.2, 1.3), 1., 1.));
	return noise( p + 4.0*q , 1., 1.);
}

vec3 background () 
{
  vec2 p = 2.0 * gl_FragCoord.xy / resolution.xy - 1.0;
  p.x *= resolution.x / resolution.y;
  vec3 color = 0.1+0.8*vec3(pattern(p*20.));
  return color;
}

//--------------------------------------------------------
// https://www.shadertoy.com/view/ll2SWD
//--------------------------------------------------------

#define PI 3.14159265358979

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sdPlane(vec3 p) {	return p.z; }

float sdEllipsoid(in vec3 p, in vec3 r) { return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z); }

//----------------------------------------------------------------------
vec2 opU(vec2 d1, vec2 d2) { return (d1.x<d2.x) ? d1 : d2; }
vec2 opB(vec2 d1, vec2 d2) { return vec2(smin(d1.x,d2.x,.2),smin(d1.x,d2.x,.2));}
//----------------------------------------------------------------------

vec2 map( in vec3 pos )
{
  float c1 = cos(time);
  float c2 = cos(time/2.0);
  float c3 = cos(time/3.0);
  float s1 = sin(time);
  float s2 = sin(time/2.0);
  float s3 = sin(time/3.0);
  vec2 res=vec2(sdEllipsoid( pos+vec3(s3,0.9*c3, 0.0), vec3(2.0+c1/5.0, 2.0+s2/5.0, .5)/4.0 ), 45.0 );
  res=opB(res,vec2(sdEllipsoid( pos+vec3(1.6*s1, cos(time/2.5),0.0), vec3(2.0+s1/5.0, 2.0+cos(time/1.2)/5.0, .5)/4.0 ), 45.0 ));    
  res=opB(res,vec2(sdEllipsoid( pos+vec3(1.8*c3, 1.7*s3,0.0), vec3(2.0+c3/5.0, 2.0+sin(time/5.0)/5.0, .5)/4.0 ), 45.0 ));
  res=opB(res,vec2(sdEllipsoid( pos+vec3(1.4*s3, 0.8*c3,0.0), vec3(2.0+s2/5.0, 2.0+c2/5.0, .5)/4.0 ), 45.0 ));
  res=opB(res,vec2(sdEllipsoid( pos+vec3(1.1*c2, s3,0.0), vec3(2.0+c3/5.0, 2.0+sin(time/5.0)/5.0, .5)/4.0 ), 45.0 ));
  res=opB(res,vec2(sdEllipsoid( pos+vec3(1.2*s2, 1.7*c3,0.0), vec3(2.0+s2/5.0, 2.0+c2/5.0, .5)/4.0 ), 45.0 )); 
  res=opU(res,vec2(sdPlane(pos), 1.5)); 
  return res;
}  
vec2 castRay( in vec3 ro, in vec3 rd )
{
  float tmin = 0.0;
  float tmax =20.0;
    
  #if 0
    float tp1 = (0.0-ro.y)/rd.y; if( tp1>0.0 ) tmax = min( tmax, tp1 );
    float tp2 = (1.6-ro.y)/rd.y; if( tp2>0.0 ) { if( ro.y>1.6 ) tmin = max( tmin, tp2 );
                                                 else           tmax = min( tmax, tp2 ); }
  #endif
    
  float precis = 0.0002;
  float t = tmin;
  float m = -1.0;
  for( int i=0; i<50; i++ )
  {
    vec2 res = map( ro+rd*t );
    if( res.x<precis || t>tmax ) break;
    t += res.x;
    m = res.y;
  }
  if( t>tmax ) m=-1.0;
  return vec2( t, m );
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
  float res = 1.0;
  float t = mint;
  for( int i=0; i<16; i++ )
  {
    float h = map( ro + rd*t ).x;
    res = min( res, 8.0*h/t );
    t += clamp( h, 0.02, 0.10 );
    if( h<0.001 || t>tmax ) break;
  }
  return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal( in vec3 pos )
{
	vec3 eps = vec3( 0.001, 0.0, 0.0 );
	vec3 nor = vec3( map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	                 map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	                 map(pos+eps.yyx).x - map(pos-eps.yyx).x );
	return normalize(nor);
}

float calcAO( in vec3 pos, in vec3 nor )
{
  float occ = 0.0;
  float sca = 1.0;
  for( int i=0; i<5; i++ )
  {
    float hr = 0.01 + 0.12*float(i)/4.0;
    vec3 aopos =  nor * hr + pos;
    float dd = map( aopos ).x;
    occ += -(dd-hr)*sca;
    sca *= 0.95;
  }
  return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

vec3 render( in vec3 ro, in vec3 rd )
{ 
  vec3 col = vec3(10.8, 10.9, 1.0);
  vec2 res = castRay(ro,rd);
  float t = res.x;
  float m = res.y;
  if(m > 0.0)
  {
    vec3 pos = ro + t*rd;
    vec3 nor = calcNormal( pos );
    vec3 ref = reflect( rd, nor );
    vec2 ballUv =(pos.xy+vec2(2.5,2.0))*.2;
    // material
    col = background();
    if(m < 0.01)
      col = mix (col, vec3(1.8,-0.4,-0.4), 0.58);	

    // lighting        
    vec3  lig = normalize( vec3(5.0*sin(time/3.0), 5.0*cos(time/3.0), 3.5) );
    float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
    float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
    float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );
    float spe = pow(clamp( dot( ref, lig ), 0.0, 1.0 ),16.0);
    dif *= softshadow( pos, lig, 0.02, 2.5 );

    vec3 brdf = .5*dif*vec3(1.00,0.90,0.60);
    brdf += 1.20*spe*vec3(1.00,0.90,0.60)*dif;
    brdf += 0.05;
    col = col*brdf;
  }
  else t /= 15.0;
  col *= exp( -0.015*t*t );

  // lights
  vec3 lv = normalize(vec3(5.0*sin(time/3.0), 5.0*cos(time/3.0), 3.5)) - ro/3.5;
  float ll = length( lv );
  if( ll<t )
  {
    float dle = clamp( dot( rd, lv/ll), 0.0, 1.0 );
    dle = (1.0-smoothstep( 0.0, 0.2*(0.7+0.3*.5), acos(dle)*ll ));
    col += dle*6.0*.5*vec3(1.0,1.0,0.0)*dle*exp( -0.1*ll*ll );;
  }
  return vec3( clamp(col,0.0,1.0) );
}  

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
  vec3 cw = normalize(ta-ro);
  vec3 cp = vec3(sin(cr), cos(cr),0.0);
  vec3 cu = normalize( cross(cw,cp) );
  vec3 cv = normalize( cross(cu,cw) );
  return mat3( cu, cv, cw );
}

vec3 liquid()
{
  vec2 p = 2.0 * gl_FragCoord.xy / resolution.xy - 1.0;
  p.x *= resolution.x / resolution.y;
  vec2 mo = mouse.xy / resolution.xy;
		 
  // camera	
  vec3 ro = vec3(0.0,-6.0+6.0*cos(mo.y*PI),2.0+2.0*cos(mo.y*PI));
  vec3 ta = vec3( 0.0, -0.5, 0.0 );
  // camera-to-world transformation
  mat3 ca = setCamera( ro, ta, 0.0 );
    
  vec3 rd = ca * normalize( vec3(p.xy,2.0) );    // ray direction
  vec3 col = render( ro, rd );    // render	
  col = pow( col, vec3(0.4545) );
  return col;
}

void main()
{
  vec3 col = liquid();
  gl_FragColor = vec4( col, 1.0 );
}

