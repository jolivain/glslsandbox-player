
//---------------------------------------------------------
// Shader:   SierpinskiPyramide.glsl  
// original: created by inigo quilez - iq/2013-10-26
//           https://www.shadertoy.com/view/4dl3Wl
//           License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// tags:     sierpinski, pyramide, raymarcher, spheres
//---------------------------------------------------------

#ifdef GL_ES
  precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define ITERATIONS 7
#define ROTATE true

//---------------------------------------------------------

const vec3 va = vec3(  0.0,  0.57735,  0.0 );
const vec3 vb = vec3(  0.0, -1.0,  1.15470 );
const vec3 vc = vec3(  1.0, -1.0, -0.57735 );
const vec3 vd = vec3( -1.0, -1.0, -0.57735 );

//---------------------------------------------------------
// return distance of sierpinksi pyramide
vec2 map( vec3 p )                 
{
  float a = 0.0;
  float s = 1.0;
  float r = 1.0;
  float dm;
  vec3 v;
  for( int i=0; i<ITERATIONS; i++ )
  {
    float d, t;
    d = dot(p-va,p-va);              v=va; dm=d; t=0.0;
    d = dot(p-vb,p-vb); if( d<dm ) { v=vb; dm=d; t=1.0; }
    d = dot(p-vc,p-vc); if( d<dm ) { v=vc; dm=d; t=2.0; }
    d = dot(p-vd,p-vd); if( d<dm ) { v=vd; dm=d; t=3.0; }
    p = v + 2.0*(p - v); r*= 2.0;
    a = t + 4.0*a; s*= 4.0;
  }
  return vec2( (sqrt(dm)-1.0)/r, a/s );
}
//---------------------------------------------------------
const float precis = 0.0002;

vec3 intersect( in vec3 ro, in vec3 rd )
{
  vec3 res = vec3( 1e20, 0.0, 0.0 );
	
  float maxd = 5.0;

  // sierpinski
  float h = 1.0;
  float t = 0.5;
  float m = 0.0;
  vec2 r;
  for( int i=0; i<100; i++ )
  {
    r = map( ro+rd*t );
    if( r.x<precis || t>maxd ) break;
    m = r.y;
    t += r.x;
  }

  if( t<maxd && r.x<precis )
    res = vec3( t, 2.0, m );
  return res;
}
//---------------------------------------------------------
vec3 calcNormal( in vec3 pos )
{
  vec3 eps = vec3(precis,0.0,0.0);
  return normalize( vec3(
           map(pos+eps.xyy).x - map(pos-eps.xyy).x,
           map(pos+eps.yxy).x - map(pos-eps.yxy).x,
           map(pos+eps.yyx).x - map(pos-eps.yyx).x ) );
}
//---------------------------------------------------------
float calcOcclusion( in vec3 pos, in vec3 nor )
{
  float ao = 0.0;
  float sca = 1.0;
  for( int i=0; i<8; i++ )
  {
    float h = 0.001 + 0.5*pow(float(i)/7.0,1.5);
    float d = map( pos + h*nor ).x;
    ao += -(d-h)*sca;
    sca *= 0.95;
  }
  return clamp( 1.0 - 0.8*ao, 0.0, 1.0 );
}
//---------------------------------------------------------
vec3 lig = normalize(vec3(1.0,0.7,0.9));
//---------------------------------------------------------
vec3 render( in vec3 ro, in vec3 rd )
{
  vec3 col = vec3(0.0);

  // raymarch
  vec3 tm = intersect(ro,rd);
  if( tm.y>0.5 )
  {
    // geometry
    vec3 pos = ro + tm.x*rd;
    vec3 nor = calcNormal( pos );
    vec3 maa = vec3( 0.0 );
		
    maa = 0.5 + 0.5*cos( 6.2831*tm.z + vec3(0.0,1.0,2.0) );

    float occ = calcOcclusion( pos, nor );

    // lighting
    float amb = (0.5 + 0.5*nor.y);
    float dif = max(dot(nor,lig),0.0);

    // lights
    vec3 lin = 1.5*amb*vec3(1.0) * occ;

    // surface-light interacion
    col = maa * lin;    
  }

  // gamma
  col = pow( clamp(col,0.0,1.0), vec3(0.45) );

  return col;
}
//---------------------------------------------------------
vec3 rotx(vec3 p, float a)
{
    float s = sin(a), c = cos(a);
    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
}
//---------------------------------------------------------
vec3 roty(vec3 p, float a)
{
    float s = sin(a), c = cos(a);
    return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
}
//---------------------------------------------------------
void main( )
{
  vec2 p = gl_FragCoord.xy / resolution.xy * 2.0 - 1.0;
  float ratio = resolution.x / resolution.y;
  p.x *= ratio;
  vec2 mo = mouse.xy ; /// resolution.xy*0.5 -0.75;

  // camera
  vec3 ro = vec3(0.0, 0.0,-4.5 + mouse.y);
  vec3 rd = vec3(p, 1.2);
  mo.x *= ratio;
  ro = roty(ro, +mo.x * 0.2);
  ro = rotx(ro, -mo.y * 0.1); 

  vec3 col = render( ro + vec3(0.0,-0.1,2.0), rd );
    
  gl_FragColor = vec4( col, 1.0 );
}

