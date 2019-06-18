/*
 * Original shader from: https://www.shadertoy.com/view/4sj3zK
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
const vec3  iMouse = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//#define SHADOWS
#define PI 3.14159


float sdPlane( vec3 p )
{
   return p.y;
}

float sdCylinder( vec3 p, vec2 h )
{
  return max( length(p.xz)-h.x, abs(p.y)-h.y );
}

//----------------------------------------------------------------------

float opS( float d1, float d2 )
{
    return max(-d2,d1);
}

vec2 opU( vec2 d1, vec2 d2 )
{
   return (d1.x<d2.x) ? d1 : d2;
}

vec3 opTwist( vec3 p, float a )
{
    float  c = cos(a*p.y+a);
    float  s = sin(a*p.y+a);
    mat2   m = mat2(c,-s,s,c);
	return vec3(m*p.xz,p.y);
}

mat3 makeRotateX(float a)
{
  float  c = cos(a); float  s = sin(a);
  return mat3(1.0, c, -s,
              0.0,  s, c,
              0.0, 0.0, 1.0);
}
mat3 makeRotateY(float a)
{
  float  c = cos(a); float  s = sin(a);
  return mat3(c,    0.0, s,
              0.0,  1.0, 0.0,
              -s,   0.0, c);
}
mat3 makeRotateZ(float a)
{
  float  c = cos(a); float  s = sin(a);
  return mat3(c, -s, 0.0,
              s,  c, 0.0,
              0.0, 0.0, 1.0);
}

//----------------------------------------------------------------------

vec3 DomainRotateSymmetry( const in vec3 vPos, const in float fSteps )
{
	float angle = atan( vPos.x, vPos.z );
	
	float fScale = fSteps / (PI * 2.0);
	float steppedAngle = (floor(angle * fScale + 0.5)) / fScale;
	
	float s = sin(-steppedAngle);
	float c = cos(-steppedAngle);
	
	vec3 vResult = vec3( c * vPos.x + s * vPos.z, 
			     vPos.y,
			     -s * vPos.x + c * vPos.z);
	
	return vResult;
}



float gear(vec3 pos, float inner_diamenter, float outer_diameter, float width, int numTeeth, float toothDepth, float spinAngle)
{
  width *= 0.5;
  pos = makeRotateZ(0.5*PI)*pos;
  pos = makeRotateY(spinAngle)*pos;

  float cylToothMax = sdCylinder( pos-vec3( 0.0, 0.0, 0.0), vec2(outer_diameter+0.5*toothDepth,width) ); //w h
  float cylToothMin = sdCylinder( pos-vec3( 0.0, 0.0, 0.0), vec2(outer_diameter-0.5*toothDepth,width) ); //w h
  float cylInner = sdCylinder( pos-vec3( 0.0, 0.0, 0.0), vec2(inner_diamenter,width+0.1*width) ); //w h

  vec3 vToothDomain = DomainRotateSymmetry(pos, float(numTeeth));
  vToothDomain.xz = abs(vToothDomain.xz);
  // spacing, height, width ???
  float co = outer_diameter / float(numTeeth);
  float fGearDist = dot(vToothDomain.xz,
  normalize(vec2(outer_diameter+co/toothDepth, 30.0*co*toothDepth))) -  2.5*outer_diameter / float(numTeeth);

  //return max(cylToothMax,fGearDist);
  return max(opS(cylToothMax,cylInner),min(cylToothMin ,fGearDist));
}

vec2 map( in vec3 pos )
{
  vec2 res=vec2(1000.0, 0.0);
//  res = vec2(sdPlane(pos), 0);
  float gy = 0.0;
  vec3 gear1_pos = 0.1 * vec3(-3.0, -2.0+gy, 0.0);
  vec3 gear2_pos = 0.1 * vec3(3.1, -2.0+gy, 0.0);
  vec3 gear3_pos = 0.1 * vec3(-3.1, 4.2+gy, 0.0);
  float gearAnim = 0.7 * iTime;
  float twistDir = sin(-3.0*gearAnim);
  float twistAmount = 0.5 * cos(-3.0*gearAnim);
  float g1 = gear(opTwist(pos - gear1_pos.zyx, -twistAmount*twistDir ), 0.10, 0.4, 0.10, 20, 0.07, gearAnim);
  float g2 = gear(opTwist(pos - gear2_pos.zyx, twistAmount*twistDir ), 0.05, 0.2, 0.20, 10, 0.07, -2.0*gearAnim-0.0*PI);
  float g3 = gear(opTwist(pos - gear3_pos.zyx, 2.0*twistAmount*twistDir ), 0.13, 0.2, 0.05, 10, 0.07, -2.0*gearAnim+0.5*PI);
  res = opU(res, vec2(g1, 28.0) ); //red
  res = opU(res, vec2(g2, 5.5) ); // green
  res = opU(res, vec2(g3, 31.5) ); //blue
  return res;
}

vec2 castRay( in vec3 ro, in vec3 rd, in float maxd )
{
   float precis = 0.0001;
    float h=precis*2.0;
    float t = 0.0;
    float m = -1.0;
    for( int i=0; i<128; i++ )
    {
       if( abs(h)<precis||t>maxd ) break;
       t += h;        
       vec2 res = map( ro+rd*t );
       h = res.x;
       m = res.y;
    }

    if( t>maxd ) m=-1.0;
    return vec2( t, m );
}


float shadow( in vec3 ro, in vec3 rd, float mint, float maxt )
{
	float precis = 0.001;
	float t = mint;
	for( int i=0; i<128; i++ )
    {
        float h = map(ro + rd*t).x;
		
        if( h<precis )
            return 0.0;
        t += h;
    }
    return 1.0;
}


vec3 calcNormal(vec3 p) {
   vec2 e = vec2(0.0001, 0.0);
        vec3 n = vec3( map(p+e.xyy).x, map(p+e.yxy).x, map(p+e.yyx).x ) - map(p).x;
   return n/e.x;
}

float calcAO( in vec3 pos, in vec3 nor )
{
   float totao = 0.0;
    float sca = 1.0;
    for( int aoi=0; aoi<5; aoi++ )
    {
        float hr = 0.01 + 0.05*float(aoi);
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        totao += -(dd-hr)*sca;
        sca *= 0.75;
    }
    return clamp( 1.0 - 4.0*totao, 0.0, 1.0 );
}

vec3 render( in vec3 ro, in vec3 rd )
{
  vec3 col = vec3(0.0);
  vec2 res = castRay(ro,rd,10.0);
  float t = res.x;
  float m = res.y;
  if( m>-0.5 )
  {
    vec3 pos = ro + t*rd;
    vec3 nor = calcNormal( pos );

    col = vec3(0.6) + 0.4*sin( vec3(1.,1.8,1.10)*(m-1.0) );

    float ao = calcAO( pos, nor );
    //float ao = 0.0;

    vec3 lig = normalize( vec3(-5., 5., -10.));
    float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
    float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
    float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);

    float sh = 1.0;
	#ifdef SHADOWS
    if( dif>0.02 ) { sh = shadow( pos, lig, 0.02, 10.0); dif *= sh; }
    #endif
    vec3 brdf = vec3(0.0);
    brdf += 0.20*amb*vec3(0.10,0.11,0.13)*ao;
    brdf += 0.20*bac*vec3(0.15,0.15,0.15)*ao;
    brdf += 1.20*dif*vec3(1.00,0.90,0.70);

    float pp = clamp( dot( reflect(rd,nor), lig ), 0.0, 1.0 );
    float spe = sh*pow(pp,16.0);
    float fre = ao*pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );

    col = col*brdf + vec3(1.0)*col*spe + 0.2*fre*(0.5+0.5*col);
  }

  col *= exp( -0.01*t*t );


  return vec3( clamp(col,0.0,1.0) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 q = fragCoord.xy/iResolution.xy;
  vec2 p = -1.0+2.0*q;
  p.x *= iResolution.x/iResolution.y;
  vec2 mo = iMouse.xy/iResolution.xy;

  // camera
  float camFactorX = mix(0.0, mo.x, clamp(iMouse.z, 0.0, 1.0));
  float camFactorY = mix(0.0, mo.y, clamp(iMouse.z, 0.0, 1.0));
  float zoom = 3.2 * 0.6 - 3.2 * camFactorY + 2.5*clamp(iMouse.z, 0.0, 1.0);
  float ang = PI*1.2 + 2.0*PI*camFactorX;
  vec3 ro = vec3( zoom*cos(ang), 0.5, zoom*sin(ang) );
  vec3 ta = vec3( 0.0, 0.0, 0.0 );

  // camera tx
  vec3 cw = normalize( ta-ro );
  vec3 cp = vec3( 0.0, 1.0, 0.0 );
  vec3 cu = normalize( cross(cw,cp) );
  vec3 cv = normalize( cross(cu,cw) );
  vec3 rd = normalize( p.x*cu + p.y*cv + 2.5*cw );

  vec3 col = render( ro, rd );
  col = sqrt( col );
  fragColor=vec4( col, 1.0 );
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
