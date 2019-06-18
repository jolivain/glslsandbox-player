// https://twitter.com/FMS_Cat

// ------

#define MARCH_ITER 50
#define INIT_LEN 0.01
#define MARCH_MULT 0.8

#define material float
#define MTL_NONE 0.0
#define MTL_BASE 1.0
#define MTL_MEAT 2.0
#define MTL_HAPPA 3.0
#define MTL_CHEESE 4.0
#define MTL_TOMATO 5.0

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
uniform vec2 mouse;

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

float smin( float _a, float _b, float _k ) {
  float h;
  return smin( _a, _b, _k, h );
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
    p.y -= -0.3;
    vec3 ps = p;
    ps.y += ( noise( p.xz * 0.2 - 0.7 ) - 0.5 ) * 0.1;
    float distt = distFuncPillar( p, 0.85, 0.02 );
    distt = smin( distt, distFuncTorus( ps, 0.1, 0.9 ), 0.1 );
    mtl = distt < dist ? MTL_BASE : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // top
    vec3 p = p;
    p.y *= 2.5;
    p.y -= 0.3;
    vec3 ps = p;
    ps.y += ( noise( p.xz * 0.2 - 0.7 ) - 0.5 ) * 0.2;
    float distt = max(
      distFuncSphere( ps, 1.0 ),
      -p.y
    );
    mtl = distt < dist ? MTL_BASE : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // niku
    vec3 p = p;
    p.y += ( noise( p.zx * 0.4 - 0.4 ) - 0.5 ) * 0.1;
    p.x += ( noise( p.yz * 0.4 - 0.4 ) - 0.5 ) * 0.1;
    p.z += ( noise( p.xy * 0.4 - 0.4 ) - 0.5 ) * 0.1;
    p.y -= -0.15;
    float distt = distFuncPillar( p, 1.0, 0.05 );
    distt = smin( distt, distFuncTorus( p, 0.05, 1.0 ), 0.1 );
    mtl = distt < dist ? MTL_MEAT : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // happa
    vec3 p = p;
    p += vec3(
      noise( p.yz * 0.4 - 0.7 ) - 0.5,
      noise( p.zx * 0.4 - 0.7 ) - 0.5,
      noise( p.xy * 0.4 - 0.7 ) - 0.5
    ) * 0.5 * smoothstep( 1.0, 1.2, length( p.xz ) );
    p.y -= 0.1;
    p.xz = rotate2D( 1.0 ) * p.xz;
    float distt = distFuncPillar( p, 1.15, 0.01 );
    mtl = distt < dist ? MTL_HAPPA : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // cheese
    vec3 p = p;
    p.y -= -0.05;
    p.y -= -0.2 * smoothstep( 1.0, 1.5, length( p.xz ) );
    p.xz = rotate2D( 1.0 ) * p.xz;
    float distt = distFuncBox( p, vec3( 0.95, 0.02, 0.95 ) );
    mtl = distt < dist ? MTL_CHEESE : mtl;
    dist = distt < dist ? distt : dist;
  }
  
  { // tomato
    vec3 p = p;
    p.y -= 0.02;
    p = circleRep( p, 0.6, 3.0 );
    p.xz = rotate2D( 1.0 ) * p.xz;
    float distt = distFuncPillar( p, 0.5, 0.05 );
    float fresh = 0.99 * smoothstep( 0.15, 0.4, length( p ) ) * smoothstep( 0.45, 0.4, length( p ) );
    fresh *= 0.5 + 0.5 * sin( atan( p.z, p.x ) * 16.0 );
    mtl = distt < dist ? ( MTL_TOMATO + fresh ) : mtl;
    dist = distt < dist ? distt : dist;
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

vec4 draw( vec2 p, float time ) { 
  // カメラとレイを定義
  Camera cam = camInit(
    vec3( cos( time ) * 4.0, 1.0, sin( time ) * 4.0 ),
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
    rayLen += rayDist * MARCH_MULT;
    rayPos = ray.ori + rayLen * ray.dir;
    if ( 10.0 < rayLen ) { return vec4( 0.0 ); }
    if ( rayLen < 1E-4 ) { break; }
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
      mtlCol = vec3( 1.0, 0.4, 0.1 );
      mtlSpe = 0.5;
	  
    } else if ( floor( mtl ) == MTL_MEAT ) {
      float yaki = smoothstep( 0.4, 0.8, noise( rayPos.xz * 4.0 ) );
      mtlCol = mix( vec3( 0.6, 0.4, 0.2 ), vec3( 0.1 ), yaki * 0.4 );
      mtlSpe = 0.2;
	    
    } else if ( floor( mtl ) == MTL_HAPPA ) {
      mtlCol = vec3( 0.6, 0.8, 0.2 );
      mtlSpe = 0.5;
	    
    } else if ( floor( mtl ) == MTL_CHEESE ) {
      mtlCol = vec3( 0.9, 0.7, 0.1 );
      mtlSpe = 0.4;
	    
    } else if ( floor( mtl ) == MTL_TOMATO ) {
      float fresh = fract( mtl );
      mtlCol = mix( vec3( 0.9, 0.2, 0.2 ), vec3( 1.0, 0.9, 0.7 ), fresh );
      mtlSpe = mix( 0.5, 0.8, fresh );
    }

    // 色を決定
    col.xyz += mtlCol * dif;
    col.xyz += mtlSpe * spe;
    col.w = 1.0;
	  
    return col;
  } else { // 物体に当たらなかったら
    return vec4( 0.0 );
  }
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.x;
  gl_FragColor = draw( p, time );
}

