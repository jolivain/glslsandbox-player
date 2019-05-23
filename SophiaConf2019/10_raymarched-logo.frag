// Raymarched NXP Logo
// Reusing Inigo Quilez primitives and rendering functions
// from: https://www.shadertoy.com/view/Xds3zN

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float PI = 4.0 * atan(1.0);

vec3 rotateX(vec3 p, float a) {
  float sa = sin(a);
  float ca = cos(a);
  return vec3(p.x, ca * p.y - sa * p.z, sa * p.y + ca * p.z);
}

vec3 rotateY(vec3 p, float a) {
  float sa = sin(a);
  float ca = cos(a);
  return vec3(ca * p.x + sa * p.z, p.y, -sa * p.x + ca * p.z);
}

vec3 rotateZ(vec3 p, float a) {
  float sa = sin(a);
  float ca = cos(a);
  return vec3(ca * p.x - sa * p.y, sa * p.x + ca * p.y, p.z);
}


//---------------------------------------------------------
// primitives
//---------------------------------------------------------

float sdPlane( vec3 p ) {
  return p.y;
}

float sdSphere( vec3 p, float radius ) {
  return length(p) - radius;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float udRoundBox( vec3 p, vec3 b, float r ) {
  return length(max(abs(p)-b, 0.0))-r;
}


//----------------------------------------------------------------------
// distance operations
//----------------------------------------------------------------------

vec2 opU( vec2 d1, vec2 d2 ) {
  return (d1.x < d2.x) ? d1 : d2;
}

// Letters
const float lineWidth = 0.02;
const float border = 0.05;
const float scale = 0.07;

float line(vec2 p, vec2 s, vec2 e) {
      s *= scale;
      e *= scale;
      float l = length(s - e);
      vec2 d = vec2(e - s) / l;
      p -= vec2(s.x, -s.y);
      p = vec2(p.x * d.x + p.y * -d.y, p.x * d.y + p.y * d.x);
      return length(max(abs(p - vec2(l / 2.0, 0.)) - vec2(l / 2.0, lineWidth / 2.0), 0.0)) - border;
}

float N_(vec2 p) {
      float d = 1.0;
      d=min(d, line(p, vec2(1, 8), vec2(1, 1.5)));
      d=min(d, line(p, vec2(1, 1.5), vec2(5, 8)));
      d=min(d, line(p, vec2(5, 8), vec2(5, 1.5)));
      return d;
}

float N(vec3 pos) {
  return max( N_(pos.xy), udRoundBox( pos, vec3(1., 1., 0.05), 0.001) );
}

float X_(vec2 p) {
      float d = 1.0;
      d=min(d, line(p, vec2(1, 1.5), vec2(5, 8)));
      d=min(d, line(p, vec2(5, 8), vec2(3, 4.75)));
      d=min(d, line(p, vec2(3, 4.75), vec2(5, 1.5)));
      d=min(d, line(p, vec2(5, 1.5), vec2(1, 8)));
      return d;
}

float X(vec3 pos) {
  return max( X_(pos.xy), udRoundBox( pos, vec3(1., 1., 0.05), 0.001) );
}

float P_(vec2 p) {
      float d=1.0;
      d=min(d,line(p,vec2(1,8),vec2(1,1.5)));
      d=min(d,line(p,vec2(1,1.5),vec2(5,1.5)));
      d=min(d,line(p,vec2(5,1.5),vec2(5,5)));
      d=min(d,line(p,vec2(5,5),vec2(1,5)));
      return d;
}

float P(vec3 pos) {
  return max( P_(pos.xy), udRoundBox( pos, vec3(1., 1., 0.05), 0.001) );
}

vec2 map( in vec3 pos ) {
  pos = rotateY(pos, PI/2.);
  vec2 res = vec2( sdPlane(pos - vec3(0,0,0)), 1.0 );

  float t = time * 0.5;
  const float rperiod = 3.;

  float nangle = clamp(mod(t, rperiod), 0., 1.) * 2.0 * PI;
  vec3 npos = vec3(-.25, .3, 0.0);
  npos = rotateY(pos - vec3(-.75, 0.5, 0.0), nangle) - npos;
  res = opU( res, vec2( N( npos ), 45. ) );

  float xangle = clamp(mod(t - 0.2, rperiod), 0., 1.) * 2.0 * PI;
  vec3 xpos = vec3(-.25, .3, 0.0);
  xpos = rotateZ(pos - vec3(-.25, 0.5, 0.0) , xangle) - xpos;
  res = opU( res, vec2( X( xpos ), 80. ) );

  float pangle = clamp(mod(t - 0.4, rperiod), 0., 1.) * 2.0 * PI;
  vec3 ppos = vec3(-.25, .3, 0.0);
  ppos = rotateY(pos - vec3(.25, 0.5, 0.0) , pangle) - ppos;
  res = opU( res, vec2( P( ppos ), 96. ) );

  return res;
}

vec2 castRay( in vec3 ro, in vec3 rd ) {
  float tmin = 1.0;
  float tmax = 20.0;

  float precis = 0.002;
  float t = tmin;
  float m = -1.0;
  for (int i = 0; i < 50; i++) {
    vec2 res = map( ro + rd * t );
    if ( res.x < precis || t > tmax ) break;
    t += res.x;
    m = res.y;
  }

  if ( t > tmax ) m =- 1.0;
  return vec2( t, m );
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax ) {
  float res = 1.0;
  float t = mint;
  for ( int i=0; i<16; i++ ) {
    float h = map( ro + rd * t ).x;
    res = min( res, 8.0 * h / t );
    t += clamp( h, 0.02, 0.10 );
    if ( h < 0.001 || t > tmax ) break;
  }
  return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal( in vec3 pos ) {
  vec3 eps = vec3( 0.001, 0.0, 0.0 );
  vec3 nor = vec3(
  map(pos+eps.xyy).x - map(pos-eps.xyy).x, 
  map(pos+eps.yxy).x - map(pos-eps.yxy).x, 
  map(pos+eps.yyx).x - map(pos-eps.yyx).x );
  return normalize(nor);
}

float calcAO( in vec3 pos, in vec3 nor ) {
  float occ = 0.0;
  float sca = 1.0;
  for ( int i=0; i<5; i++ )
  {
    float hr = 0.01 + 0.12*float(i) / 4.0;
    vec3 aopos =  nor * hr + pos;
    float dd = map( aopos ).x;
    occ += -(dd-hr)*sca;
    sca *= 0.95;
  }
  return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

vec3 render( in vec3 ro, in vec3 rd ) { 
  vec3 col = vec3(0.8, 0.9, 1.0);
  vec2 res = castRay(ro, rd);
  float t = res.x;
  float m = res.y;
  if ( m > -0.5 )
  {
    vec3 pos = ro + t * rd;
    vec3 nor = calcNormal( pos );
    vec3 ref = reflect( rd, nor );

    // material
    col = 0.45 + 0.3 * sin( vec3(0.05, 0.08, 0.10) * (m - 1.0) );

    if (m < 1.5) {
      float f = mod( floor(5.0 * pos.z) + floor(5.0 * pos.x), 2.0);
      col = 0.4 + 0.1 * f * vec3(1.0);
    }

    // lighting        
    float occ = calcAO( pos, nor );
    vec3  lig = normalize( vec3(-0.6, 0.7, -0.5) );
    float amb = clamp( 0.5 + 0.5 * nor.y, 0.0, 1.0 );
    float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
    float bac = clamp( dot( nor, normalize(vec3(-lig.x, 0.0, -lig.z))), 0.0, 1.0 ) * clamp( 1.0 - pos.y, 0.0, 1.0);
    float dom = smoothstep( -0.1, 0.1, ref.y );
    float fre = pow( clamp(1.0+dot(nor, rd), 0.0, 1.0), 2.0 );
    float spe = pow(clamp( dot( ref, lig ), 0.0, 1.0 ), 16.0);

    dif *= softshadow( pos, lig, 0.02, 2.5 );
    dom *= softshadow( pos, ref, 0.02, 2.5 );

    vec3 brdf = vec3(0.0);
    brdf += 1.20 * dif * vec3(1.00, 0.90, 0.60);
    brdf += 1.20 * spe * vec3(1.00, 0.90, 0.60) * dif;
    brdf += 0.30 * amb * vec3(0.50, 0.70, 1.00) * occ;
    brdf += 0.40 * dom * vec3(0.50, 0.70, 1.00) * occ;
    brdf += 0.30 * bac * vec3(0.25, 0.25, 0.25) * occ;
    brdf += 0.40 * fre * vec3(1.00, 1.00, 1.00) * occ;
    brdf += 0.02;

    col = col * brdf;
    col = mix( col, vec3(0.8, 0.9, 1.0), 1.0 - exp( -0.005 * t * t ) );
  }

  return vec3( clamp(col, 0.0, 1.0) );
}

void main(void) {
  vec2 p = 2.0 * (gl_FragCoord.xy / resolution.xy) - 1.0;
  p.x *= resolution.x / resolution.y;

  // camera  
  float rx = -0.5 + 3.2 * cos(6.0 * mouse.x);
  float rz =  0.5 + 3.2 * sin(6.0 * mouse.x);
  vec3 ro = vec3( rx, 1.0 + 2.0 * mouse.y, rz );
  vec3 ta = vec3( -0.5, -0.4, 0.5 );

  // camera tx
  vec3 cw = normalize( ta - ro );
  vec3 cp = vec3( 0.0, 1.0, 0.0 );
  vec3 cu = normalize( cross(cw, cp) );
  vec3 cv = normalize( cross(cu, cw) );
  vec3 rd = normalize( p.x * cu + p.y * cv + 2.5 * cw );

  // pixel color
  vec3 col = render( ro, rd );
  col = pow( col, vec3(0.6) );
  gl_FragColor = vec4( col, 1.0 );
}
