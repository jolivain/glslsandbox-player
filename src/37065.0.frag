// https://twitter.com/FMS_Cat

// ------

#define MARCH_ITER 100
#define INIT_LEN 0.01

#define material float
#define MTL_NONE 0.0
#define MTL_BASE 1.0
#define MTL_SALAMI 2.0
#define MTL_HAPPA 3.0
#define MTL_OLIVE 4.0

#define V vec2(0.,1.)
#define PI 3.14159265
#define HUGE 1E9
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,d) floor(i/d)*d

// ------

// 浮動小数点の精度の設定
precision mediump float;

// JSから渡される変数の定義
uniform float time;
uniform vec2 resolution;

// ------

// 二次元回転行列
mat2 rotate2D( float _t ) {
  return mat2(
    cos( _t ), sin( _t ),
    -sin( _t ), cos( _t )
  );
}

// smooth minimum : http://iquilezles.org/www/articles/smin/smin.htm
float smin( float _a, float _b, float _k, out float h ) {
  h = clamp( 0.5 + 0.5 * ( _b - _a ) / _k, 0.0, 1.0 );
  return mix( _b, _a, h ) - _k * h * ( 1.0 - h );
}

float random( vec2 _uv ) {
  return fract( sin( dot( vec2( 12.563, 21.864 ), _uv ) ) * 19934.54 );
}

float iRandom( vec2 _uv ) {
  float v00 = random( floor( _uv + V.xx ) );
  float v10 = random( floor( _uv + V.yx ) );
  float v01 = random( floor( _uv + V.xy ) );
  float v11 = random( floor( _uv + V.yy ) );
  return mix(
    mix( v00, v10, smoothstep( 0.0, 1.0, fract( _uv.x ) ) ),
    mix( v01, v11, smoothstep( 0.0, 1.0, fract( _uv.x ) ) ),
    smoothstep( 0.0, 1.0, fract( _uv.y ) )
  );
}

float noise( vec2 _uv ) {
  float sum = 0.0;
  for ( int i = 0; i < 4; i ++ ) {
    float p = pow( 2.0, float( i ) + 1.0 );
    sum += iRandom( _uv * p * 4.0 ) / p;
  }
  return sum;
}

vec3 rainbow( vec3 _i, float _p ) {
  float p = fract( _p );
  return mix(
    mix(
      mix(
        _i.xyz,
        _i.yzx,
        saturate( p * 3.0 )
      ),
      _i.zxy,
      saturate( p * 3.0 - 1.0 )
    ),
    _i.xyz,
    saturate( p * 3.0 - 2.0 )
  );
}

// ------

// カメラの構造体
struct Camera {
  vec3 pos;
  vec3 dir;
  vec3 sid;
  vec3 top;
  float fov;
};

// レイの構造体
struct Ray {
  vec3 dir;
  vec3 ori;
};

// ------

// カメラの初期化
Camera camInit( in vec3 _pos, in vec3 _tar, in float _fov ) {
  Camera cam;
  cam.pos = _pos;
  cam.dir = normalize( _tar - _pos );
  cam.sid = normalize( cross( cam.dir, V.xyx ) );
  cam.top = normalize( cross( cam.sid, cam.dir ) );
  cam.fov = _fov;

  return cam;
}

// レイの初期化
Ray rayInit( in vec3 _ori, in vec3 _dir ) {
  Ray ray;
  ray.dir = _dir;
  ray.ori = _ori;
  return ray;
}

// カメラから出るレイを求める
Ray rayFromCam( in vec2 _p, in Camera _cam ) {
  vec3 dir = normalize(
    _p.x * _cam.sid
    + _p.y * _cam.top
    + _cam.dir / tan( _cam.fov * PI / 360.0 ) // Is this correct?
  );
  return rayInit( _cam.pos, dir );
}

// ------

// 球体の距離関数
float distFuncSphere( vec3 _p, float _r ) {
  return length( _p ) - _r;
}

// 箱の距離関数
float distFuncBox( vec3 _p, vec3 _s ) {
  vec3 d = abs( _p ) - _s;
  return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) );
}

// トーラスの距離関数
float distFuncTorus( vec3 _p, float _r, float _R ) {
  vec2 q = vec2( length( _p.xz ) - _R, _p.y );
  return length( q ) - _r;
}

// 円柱の距離関数
float distFuncPillar( vec3 _p, float _r, float _t ) {
  return max( abs( _p.y ) - _t, length( _p.xz ) - _r );
}

// xz円状にRepetition
vec3 circleRep( vec3 _p, float _r, float _c ) {
  vec3 p = _p;
  float intrv = PI * 2.0 / _c;
  p.zx = rotate2D( floor( atan( p.z, p.x ) / intrv ) * intrv ) * p.zx;
  p.zx = rotate2D( intrv / 2.0 ) * p.zx;
  p.x -= _r;
  return p;
}

// 距離関数
float distFunc( vec3 _p, out material mtl ) {
  vec3 p = _p;
  float dist = HUGE;
  
  { // base
    vec3 p = p;
    p.y += ( noise( p.xz * 0.1 - 0.4 ) - 0.5 ) * 0.4;
    float distt = distFuncPillar( p, 0.95, 0.02 );
    p.y -= 0.02;
    float h;
    distt = smin( distt, distFuncTorus( p, 0.07, 1.0 ), 0.1, h );
    mtl = distt < dist ? MTL_BASE + h * 0.99 : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // sarami
    vec3 p = p;
    float limit = length( p.xz ) - 0.9;
    p.y += ( noise( p.xz * 0.1 - 0.4 ) - 0.5 ) * 0.4;
    p.xz = rotate2D( 1.0 ) * p.xz;
    p.xz = mod( p.xz, 0.36 ) - 0.18;
    p.y -= 0.03;
    float distt = distFuncPillar( p, 0.12, 0.01 );
    distt = max( distt, limit );
    mtl = distt < dist ? MTL_SALAMI : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // happa
    vec3 p = p;
    p.y += ( noise( p.xz * 0.1 - 0.4 ) - 0.5 ) * 0.4;
    p = circleRep( p, 0.6, 7.0 );
    p.y -= 0.05;
    p.xz = rotate2D( 1.0 ) * p.xz;
    p.x *= max( pow( abs( sin( atan( p.z, p.x ) ) ), 0.12 ), 0.6 );
    float distt = distFuncPillar( p, 0.15, 0.003 );
    mtl = distt < dist ? MTL_HAPPA : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // olive
    vec3 p = p;
    float limit = length( p.xz ) - 0.9;
    p.y += ( noise( p.xz * 0.1 - 0.4 ) - 0.5 ) * 0.4;
    p = circleRep( p, 0.4, 5.0 );
    p.y -= 0.03;
    float distt = distFuncSphere( p, 0.07 );
    distt = max( distt, limit );
    mtl = distt < dist ? MTL_OLIVE : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // cut
    p = circleRep( p, 0.0, 8.0 );
    p.z += ( noise( p.xx ) - 0.5 ) * 0.04;
    dist = max( dist, -distFuncBox( p, vec3( 1E9, 1E9, 0.01 ) ) );
  }
  
  return dist;
}

float distFunc( vec3 _p ) {
  material dummy = MTL_NONE;
  return distFunc( _p, dummy );
}

// 距離関数から法線を求める
vec3 normalFunc( in vec3 _p ) {
  vec2 d = V * 1E-3;
  return normalize( vec3(
    distFunc( _p + d.yxx ) - distFunc( _p - d.yxx ),
    distFunc( _p + d.xyx ) - distFunc( _p - d.xyx ),
    distFunc( _p + d.xxy ) - distFunc( _p - d.xxy )
  ) );
}

// ------

void main() {
  // カメラとレイを定義
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.x;
  Camera cam = camInit(
    vec3( cos( time ) * 2.0, 2.0, sin( time ) * 2.0 ),
    vec3( 0.0, -0.2, 0.0 ),
    50.0
  );
  Ray ray = rayFromCam( p, cam );

  // ------

  float rayLen = INIT_LEN; // 探索レイの長さ
  vec3 rayPos = ray.ori + rayLen * ray.dir; // 探索レイの位置
  float rayDist = 0.0; // 探索レイ到達点から物体までの距離
  material mtl = MTL_NONE;

  // raymarch
  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    rayDist = distFunc( rayPos, mtl );
    rayLen += rayDist * 0.8;
    rayPos = ray.ori + rayLen * ray.dir;
  }

  vec4 col = V.xxxx; // 出力する色
  if ( rayDist < 1E-2 ) { // もし物体に衝突したなら
    // 各ベクトルを求める
    vec3 normal = normalFunc( rayPos );
    vec3 camDir = normalize( rayPos - cam.pos );
    vec3 ligPos = cam.pos + cam.sid + cam.top * 1.0 - cam.dir;
    vec3 ligDir = normalize( rayPos - ligPos );

    // 拡散反射・光源の鏡面反射を求める
    float dif = 0.5 + 0.5 * dot( -normal, ligDir );
    float spe = pow( dot( normalize( camDir - normal ), ligDir ), 40.0 );
    
    // 材質に応じて色と反射率を変化させる
    vec3 mtlCol = vec3( 0.0 );
    float mtlSpe = 0.0;
    if ( floor( mtl ) == MTL_BASE ) {
      float cheese = fract( mtl );
      float yaki = pow( noise( rayPos.xz * 1.3 + 0.7 - 0.4 * cheese ) * 1.2, 3.0 );
      mtlCol = mix(
        mix( vec3( 1.0, 0.4, 0.1 ), vec3( 1.0, 0.9, 0.4 ), cheese ),
        vec3( 0.5, 0.1, 0.0 ),
        yaki * 0.8
      );
      mtlSpe = mix( mix( 0.2, 0.3, cheese ), 0.1, yaki );
    } else if ( floor( mtl ) == MTL_SALAMI ) {
      float abura = smoothstep( 0.4, 0.8, noise( rayPos.xz * 4.0 ) );
      mtlCol = mix( vec3( 0.9, 0.3, 0.2 ), vec3( 0.9 ), abura * 0.4 );
      mtlSpe = mix( 0.4, 0.8, abura );
    } else if ( floor( mtl ) == MTL_HAPPA ) {
      float yaki = smoothstep( 0.4, 0.9, noise( rayPos.xz * 2.0 ) );
      mtlCol = mix( vec3( 0.5, 0.6, 0.2 ), vec3( 0.2, 0.1, 0.0 ), yaki * 0.8 );
      mtlSpe = mix( 0.5, 0.2, yaki );
    } else if ( floor( mtl ) == MTL_OLIVE ) {
      mtlCol = vec3( 0.2, 0.14, 0.1 );
      mtlSpe = 0.6;
    }

    // 色を決定
    col.xyz += mtlCol * dif;
    col.xyz += mtlSpe * spe;
    col.w = 1.0;
  } else { // 物体に当たらなかったら
    col = vec4( 0.0, 0.0, 0.0, 1.0 );
  }
  
  gl_FragColor = col;
}

