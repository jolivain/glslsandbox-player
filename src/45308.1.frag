/*
 * Original shader from: https://www.shadertoy.com/view/Ml2SzG
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Fishing Cat
// By David Ronai / @Makio64

//------------------------------------------------------------------ VISUAL QUALITY
#define POSTPROCESS
#define SHADOW

#define RAYMARCHING_STEP 60
#define RAYMARCHING_JUMP .85

//------------------------------------------------------------------ DEBUG
//#define RENDER_DEPTH
//#define RENDER_NORMAL

//------------------------------------------------------------------ MATRIX Functions

mat2 Rot2(float a ) {
	float c = cos( a );
	float s = sin( a );
	return mat2( c, -s, s, c );
}

mat4 Rot4X(float a ) {
	float c = cos( a );
	float s = sin( a );
	return mat4( 1, 0, 0, 0,
				 0, c,-s, 0,
				 0, s, c, 0,
				 0, 0, 0, 1 );
}

mat4 Rot4Y(float a ) {
	float c = cos( a );
	float s = sin( a );
	return mat4( c, 0, s, 0,
				 0, 1, 0, 0,
				-s, 0, c, 0,
				 0, 0, 0, 1 );
}

mat4 Rot4Z(float a ) {
	float c = cos( a );
	float s = sin( a );
	return mat4(
		c,-s, 0, 0,
		s, c, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}

mat4 matRotate( in vec3 xyz )
{
	vec3 si = sin(xyz);
	vec3 co = cos(xyz);
	return mat4( co.y*co.z,                co.y*si.z,               -si.y,       0.0,
				 si.x*si.y*co.z-co.x*si.z, si.x*si.y*si.z+co.x*co.z, si.x*co.y,  0.0,
				 co.x*si.y*co.z+si.x*si.z, co.x*si.y*si.z-si.x*co.z, co.x*co.y,  0.0,
				 0.0,                      0.0,                      0.0,        1.0 );
}

mat4 Loc4( vec3 p ) {
	return mat4(
		1,  0,  0,  -p.x,
		0,  1,  0,  -p.y,
		0,  0,  1,  -p.z,
		0,  0,  0,  1
	);
}

mat4 matInverse( in mat4 m )
{
	return mat4(
		m[0][0], m[1][0], m[2][0], 0.0,
		m[0][1], m[1][1], m[2][1], 0.0,
		m[0][2], m[1][2], m[2][2], 0.0,
		-dot(m[0].xyz,m[3].xyz),
		-dot(m[1].xyz,m[3].xyz),
		-dot(m[2].xyz,m[3].xyz),
		1.0 );
}

//------------------------------------------------------------------ PRIMITIVES

float sdCappedCylinder( in vec3 p, in vec2 h ) {
	vec2 d = abs(vec2(length(p.xz),p.y)) - h;
	return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ) {
	vec3 pa = p - a, ba = b - a;
	float h = clamp( dot(pa,ba) / dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r;
}

float sdCone( in vec3 p, in vec3 c )
{
	vec2 q = vec2( length(p.xz), p.y );
	float d1 = -p.y-c.z;
	float d2 = max( dot(q,c.xy), p.y);
	return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdSphere( vec3 p, float r ) {
	return length(p) - r;
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

//------------------------------------------------------------------ OPERATIONS
float sMinP( float a, float b, float k ) {
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

float opS( float a, float b ) {
	return max( a, -b );
}

mat4 transpose(in mat4 m ) {
	vec4 r0 = m[0];
	vec4 r1 = m[1];
	vec4 r2 = m[2];
	vec4 r3 = m[3];

	mat4 t = mat4(
		vec4( r0.x, r1.x, r2.x, r3.x ),
		vec4( r0.y, r1.y, r2.y, r3.y ),
		vec4( r0.z, r1.z, r2.z, r3.z ),
		vec4( r0.w, r1.w, r2.w, r3.w )
	);

	return t;
}


vec3 opTx( vec3 p, mat4 m ) {
	return (transpose(m)*vec4(p,1.0)).xyz;
}

//------------------------------------------------------------------ MATERIALS

#define BLACK 1.
#define WHITE 2.
#define BLUE 3.
#define PINK 4.


//------------------------------------------------------------------ MAP : Create object in the scenes

vec2 opU( in vec2 v1, in vec2 v2){
	//Alternative wihout if.
	//return mix(v1,v2,clamp(sign(v1.x - v2.x),0.,1.));
	return (v1.x<v2.x)?v1:v2;
}

vec3 posFromAngle(in float phi, in float theta, in float radius){
	return vec3(
		radius * sin( phi ) * cos( theta ),
		radius * cos( phi ),
		radius * sin( phi ) * sin( theta )
	);
}

// Return distance + material ID
vec2 map( in vec3 pos )
{
	vec3 q = pos;

    vec3 headPos = pos+vec3(0.,abs(cos(iTime*2.))*.5,0.);

    q = opTx( headPos - vec3(.5,5.2,-3.), Rot4X(.3) );
	float pinkHearL = sdCone( q, vec3( 0.5, .3, 3.0 ));
	q = opTx( headPos - vec3(.5,5.2,3.), Rot4X(-.3) );
	float pinkHearR = sdCone( q, vec3( 0.5, .3, 3.0 ));
	float pinkHears = min(pinkHearL,pinkHearR);

	q = opTx( headPos - vec3(0.,6.,-3.), Rot4X(.3) );
	float hearL = sdCone( q, vec3( 0.5, .3, 3.0 ));
	q = opTx( headPos - vec3(0.,6.,3.), Rot4X(-.3) );
	float hearR = sdCone( q, vec3( 0.5, .3, 3.0 ));
	float hears = min(hearR,hearL);
	pinkHears = max(pinkHears,hears);
	hears = opS(hears,pinkHears);

	q = headPos;
	float head = min(hears,sdSphere(q,5.));
	float head2 = sdSphere(q,5.2);
	q = headPos;
	pinkHears = opS(pinkHears,head2);
	q = pos;
	float body = sdCapsule(q, vec3( 0., -12., 0. ), vec3( 0., -12., 0.), 8.2 );
	body = sMinP(body, head, 5.);
    
    q = pos - vec3(-5.,0.,0.+sin(pos.y/2.+iTime));
    float tail = sdCapsule(q, vec3( -15., -5., 0. ), vec3( 0., -15., 0.), .5+max(0.,min((pos.y+15.)/7.,3.)) );
    
    q = pos;
    float can = sdCapsule(q, vec3( 4., -10., 5. ), vec3( 13., 8.+cos(iTime/2.)*1.5, 5.+sin(7.3/2.+iTime*2.)/2.), .5 );
    float can2 = sdCapsule(q, vec3(  13., 8.+cos(iTime/2.)*1.5, 5.+sin(pos.y/2.+iTime*2.)/2. ), vec3( 16., -15., 5.), .1 );
    can = min(can,can2);
    
    vec3 bassinPos = pos-vec3(15.,-17.,5.);
    float bassin = sdTorus(bassinPos, vec2(6.,.5));
    //return vec2(bassin, WHITE);
    
    vec2 white = vec2(min(bassin,min(can,min(tail,body))),WHITE);

	float phi = sin(iTime/2.)*.3;

	q = pos - posFromAngle(phi+1.35,.3,5.);
	float eyeL = sdSphere(q,.3);

	q = pos - posFromAngle(phi+1.35,-.3,5.);
	float eyeR = sdSphere(q,.3);

    float water = sdCappedCylinder(bassinPos,vec2(6.,.25));
	float eyes = min(water,min(eyeL,eyeR));
	vec2 blue = vec2(eyes, BLUE);
	vec2 pink = vec2(pinkHears,PINK);

	q = pos - posFromAngle(phi+1.5,0.,5.1);
	float noze = sdSphere(q,.1);

	q = pos - posFromAngle(phi+1.5,.4,5.);
	q = opTx( q, Rot4X(-1.3) );
	float mustache = sdCappedCylinder(q, vec2(.05,2.5));

	q = pos - posFromAngle(phi+1.55,.4,5.);
	q = opTx( q, Rot4X(-1.4) );
	mustache = min(mustache,sdCappedCylinder(q, vec2(.05,2.5)));

	q = pos - posFromAngle(phi+1.6,.4,5.);
	q = opTx( q, Rot4X(-1.5) );
	mustache = min(mustache,sdCappedCylinder(q, vec2(.05,2.5)));

	q = pos - posFromAngle(phi+1.5,-.4,5.);
	q = opTx( q, Rot4X(1.3) );
	mustache = min(mustache,sdCappedCylinder(q, vec2(.05,2.5)));

	q = pos - posFromAngle(phi+1.55,-.4,5.);
	q = opTx( q, Rot4X(1.4) );
	mustache = min(mustache,sdCappedCylinder(q, vec2(.05,2.5)));

	q = pos - posFromAngle(phi+1.6,-.4,5.);
	q = opTx( q, Rot4X(1.5) );
	mustache = min(mustache,sdCappedCylinder(q, vec2(.05,2.5)));

	vec2 black = vec2(min(noze,mustache),BLACK);

	vec2 infos = opU(white,blue);
	infos = opU(infos,pink);
	infos = opU(infos,black);
	return infos;
}


//------------------------------------------------------------------ RAYMARCHING Stuffs

#ifdef RENDER_DEPTH
vec2 castRay( in vec3 ro, in vec3 rd, inout float depth )
#else
vec2 castRay( in vec3 ro, in vec3 rd )
#endif
{
	float tmax = 120.;
	float precis = .01;
	float t = 0.0;
	vec2 res;

	for( int i=0; i<RAYMARCHING_STEP; i++ )
	{
		vec3 pos = ro+rd*t;
		res = map( pos );
		if( res.x<precis || t>tmax ) break;
		t += res.x*RAYMARCHING_JUMP;

		#ifdef RENDER_DEPTH
		depth += 1./float(RAYMARCHING_STEP);
		#endif
	}
	return vec2( t, res.y );
}

vec3 calcNormal( in vec3 pos )
{
	vec2 e = vec2(1.0,-1.0)*0.5773*.01;
	return normalize( e.xyy*map( pos + e.xyy ).x +
					  e.yyx*map( pos + e.yyx ).x +
					  e.yxy*map( pos + e.yxy ).x +
					  e.xxx*map( pos + e.xxx ).x );
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
		if( h<0.01 || t>tmax ) break;
	}
	return clamp( res, 0.0, 1.0 );
}


//------------------------------------------------------------------ POSTEFFECTS

vec3 bw( in vec3 col )
{
	return vec3(0.299*col.r + 0.587*col.g + 0.114*col.b);
}

#ifdef POSTPROCESS

vec3 postEffects( in vec3 col, in vec2 uv, in float time )
{
	// gamma
	col = pow( clamp(col,0.0,1.0), vec3(0.45) );

	// vigneting
	col *= 0.25+0.75*pow( 16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.15 );

	//extra bright
	col+=0.05;
	return col;
}

#endif

//------------------------------------------------------------------ RENDER


vec3 render( in vec3 ro, in vec3 rd, in vec2 uv )
{
	vec3 col;

	#ifdef RENDER_DEPTH
	float depth = 0.;
	vec2 res = castRay(ro,rd,depth);
	#else
	vec2 res = castRay(ro,rd);
	#endif

	#ifdef RENDER_DEPTH
    if(mod(iTime,3.)<1.){
		return vec3(depth)*vec3(.1,.5,1.);
    }
	#endif

	float t = res.x;
	float m = res.y;

	vec3 pos = ro + t * rd;
	#ifdef RENDER_NORMAL
    if(mod(iTime,3.)<2.){
		return calcNormal( pos );
    }
    #endif

	if(t>65.){
		col = vec3(.6,.5,.35);
	}
	else if( m == WHITE )
	{
		// material
		col = vec3(1.);
		vec3 nor = calcNormal(pos);
		vec3 lig = vec3(0.6, 0.5, -0.5);
		col *= clamp( dot( nor, lig ), 0.0, 1.0 )*vec3(1.);
		vec3 ambient = vec3(.3,.3,.4);
		col += ambient*(1.-col);
        
        //Uncomment for the Little Big Planet versions
        //vec2 uv = vec2(pos.z*1.5,pos.y*1.5);
        //vec3 text = texture( iChannel0, uv, 0.0 ).rgb;
		//col*=text*1.2;
	}
	else if( m == BLACK )
	{
		col = vec3(.0);
		vec3 nor = calcNormal(pos);
		vec3 lig = vec3(0.6, 0.5, -0.5);
		col *= clamp( dot( nor, lig ), 0.0, 1.0 )*vec3(1.);
	}
	else if( m == BLUE )
	{
		col = vec3(.1,.1,.5);
		vec3 nor = calcNormal(pos);
		vec3 lig = vec3(0.6, 0.5, -0.5);
		col *= clamp( dot( nor, lig ), 0.0, 1.0 )*vec3(1.);
		vec3 ambient = vec3(.2,.2,.5+sin(iTime)*.1);
		col += ambient*(1.-col);

	}
    
	else if( m == PINK )
	{
		// material
		col = vec3(.85,0.4,.45);
		vec3 nor = calcNormal(pos);
		vec3 lig = vec3(0.6, 0.5, -0.5);
		vec3 ambient = col/3.;
		col *= clamp( dot( nor, lig ), 0.0, 1.0 )*vec3(1.);
		col += ambient*(1.-col);
	}

	return col;
}

//------------------------------------------------------------------ CAMERA

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
	return mat3( cu, cv, cw );
}

//------------------------------------------------------------------ MAIN
// setup cam
// render
// apply postEffect
//---------------------
void mainImage( out vec4 fragColor, in vec2 coords )
{
	float time = iTime;
	vec2 uv = coords.xy / iResolution.xy;

	vec2 q = coords.xy/iResolution.xy;
	vec2 p = (-iResolution.xy+2.0*coords.xy)/iResolution.y;

	float angle = 0.-time;
	float radius = 35.;
    vec3 ro = vec3(cos(angle)*radius,cos(time/3.)*4.+9.,sin(angle)*radius);
	vec3 ta = vec3(0.);

	mat3 ca = setCamera( ro, ta, 0. );
	vec3 rd = ca * normalize( vec3(p.xy,1.5) );

	vec3 color = render( ro, rd, uv );

	#ifdef POSTPROCESS
	color = postEffects( color, uv, time );
	#endif
	fragColor = vec4(color,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
