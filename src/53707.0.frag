/*
 * Original shader from: https://www.shadertoy.com/view/WdjSWm
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
#define MAT_SPONGE 0.0
#define MAT_CREAM 1.0
#define MAT_BALL 2.0
#define MAT_CANDLE 3.0
#define MAT_DISH 4.0
#define MAT_FRAME 5.0
#define MAT_OUTSIDE 6.0
#define MAT_INSIDE 7.0
#define MAT_HEART 8.0
#define MAT_SHELF 9.0
#define MAT_FLOOR 10.0
#define MAT_CORE 11.0

vec3 RayOrigin = vec3(0.), Target = vec3(0.), Coord = vec3(0.), CoreCoord = vec3(0.);
vec4 CoreID = vec4(0.);
float CameraLight = 0., CubeLight = 0.;
float Black = 0.;

const float pi = acos(-1.);
const float pi2 = pi * 2.0;

// Grab from https://www.shadertoy.com/view/4djSRW
#define MOD3 vec3(.1031,.11369,.13787)
//#define MOD3 vec3(443.8975,397.2973, 491.1871)
float hash31(vec3 p3)
{
	p3  = fract(p3 * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return -1.0 + 2.0 * fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz+19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

vec2 hash12(float n) { return vec2(fract(sin(n) * vec2(12345.6, 78901.2))); }

float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.74));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

// ========= Noise ===========
float value_noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(hash21(ip),hash21(ip+vec2(1.0,0.0)),u.x),
		mix(hash21(ip+vec2(0.0,1.0)),hash21(ip+vec2(1.0,1.0)),u.x),u.y);
	return res * 2.0 - 1.0;
}

float simplex_noise(vec3 p)
{
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    
    // thx nikita: https://www.shadertoy.com/view/XsX3zB
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
	vec3 i1 = e * (1.0 - e.zxy);
	vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    
    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);
    
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    
    return dot(vec4(31.316), n);
}

float noise(vec3 p) {
    return simplex_noise(p);
}

float noise_sum(vec3 p)
{
    float f = 0.0;
    p = p * 4.0;
    f += 1.0000 * noise(p); p = 2.0 * p;
    f += 0.5000 * noise(p); p = 2.0 * p;
    
    return f;
}

float fbm(vec2 uv)
{
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
	float f  = 0.5000*value_noise( uv ); uv = m*uv;
	f += 0.2500*value_noise( uv ); uv = m*uv;
	f += 0.1250*value_noise( uv ); uv = m*uv;
    return f;
}

float height(vec3 p)
{
    float base = noise(p * 10.5) * 0.25 + 0.5;
    return base * 0.03;
}

mat2 rot( float th ){ vec2 a = sin(vec2(1.5707963, 0) + th); return mat2(a, -a.y, a.x); }

///////////////////// Distance Functions /////////////////////
// Rotate fold technique
// https://gam0022.net/blog/2017/03/02/raymarching-fold/
vec2 pMod(in vec2 p, in float s) {
    float a = pi / s - atan(p.x, p.y);
    float n = pi2 / s;
    a = floor(a / n) * n;
    p *= rot(a);
    return p;
}
float opRep( in float p, in float c )
{
    return mod(p,c)-0.5*c;
}
vec2 opRep( in vec2 p, in vec2 c )
{
    return mod(p,c)-0.5*c;
}
vec3 opRep( in vec3 p, in vec3 c )
{
    return mod(p,c)-0.5*c;
}

vec2 opU(vec2 d1, vec2 d2)
{
	return (d1.x<d2.x) ? d1 : d2;
}

float sdPlane(vec3 p)
{
	return p.y;
}

float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdRoundedCylinder( vec3 p, float ra, float rb, float h )
{
    vec2 d = vec2( length(p.xz)-2.0*ra+rb, abs(p.y) - h );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float smin( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float sdCream(vec3 p, float phiScale, float radiusOffset, float thickness)
{
    p.zx = vec2(atan(p.x, p.z) / pi * phiScale, length(p.zx));
    p.x -= radiusOffset;

    vec2 theta = vec2(1.6, 0.) + p.z * pi * 4.;
    float k1 = length(p.yx + sin(theta) * 2.) - thickness;
    float k2 = length(p.yx + sin(theta + pi) * 2.) - thickness;

    return smin(k1, k2, 2.5);
}

float sdDish(vec3 p)
{
    vec2 q = vec2(atan(p.z, p.x), length(p.xz));
    float d = q.y - 1.2 - sin(q.x * 16.0) * 0.02;
    vec2 w = vec2( d, abs(p.y) - 0.03);
    return min(max(w.x,w.y),0.0) + length(max(w,0.0));
}


float sdChamferedCube1( vec3 p, vec3 size, float corner)
{
    vec3 s = max(size - corner, 0.0);
    p = p - clamp( p, -s, s );
    p = abs(p);
    return (p.x+p.y+p.z-corner)*0.57735027;
}

float sdChamferedCube2( vec3 p, vec3 size, float corner)
{
    vec3 s = max(size - corner, 0.0);
    p = p - clamp( p, -s, s );
    p = abs(p);
    return max((p.z+p.y-corner) * 0.7071067, p.x);
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float sdFrame(vec3 p)
{
    vec3 q = p;
    p *= 6.0; // normalize frame size
    p=abs(p) - 4.0;
    float d = sdChamferedCube1(p, vec3(2.0), 0.5);
    
	if (p.x>p.y) {p.xy = p.yx;}
	if (p.x>p.z) {p.xz = p.zx;}
    p.x += 3.5;
    p.zy -= 0.7;
    d = min(d, sdChamferedCube2(p, vec3(1.0, 1.0, 1.0), 0.2));
    
    p = q;
    p = abs(p);
	if (p.x<p.y) {p.xy = p.yx;}
	if (p.x<p.z) {p.xz = p.zx;}
    p.x -= 2.79;
    return max(-sdSphere(p, 2.0), d/6.0);
}

float sdHeartCylinder(vec3 p)
{
    p = abs(p);
	if (p.y<p.x) {p.xy = p.yx;}
	if (p.y<p.z) {p.yz = p.zy;}
    float c = sdRoundedCylinder( p, 0.2, 0.02, 0.95 );
    return c;
}

float sdHeart(vec2 p)
{
    p.y = -0.1 - p.y*1.2 + abs(p.x)*(1.0-abs(p.x));
    return length(p) - 0.5;
}

float sdCross(vec3 p)
{
    p.xy = abs(p.xy);
    p.xy *= rot(-1.0);
    return sdRoundedCylinder(p, 0.02, 0.02, 1.8027);
}

vec2 sdDesk(vec3 p)
{
    vec3 q = p;
    q.xz = abs(q.xz) - vec2(0.8, 0.6);
    float legs = sdBox(q, vec3(0.03, 0.5, 0.03));
    p.y -= 0.5;
    float top = sdBox(p, vec3(1.1, 0.03, 0.8));
    float d = min(legs, top);
    return vec2(d, MAT_OUTSIDE);
}

vec2 sdStage(vec3 p)
{
    vec2 flor = vec2(-abs(p.y - 4.5) + 5.5, MAT_FLOOR);
    vec2 d = flor;
    vec3 q = p;
    q.y -= 9.0;
    q.xz = opRep(q.xz, vec2(8.0));
    q = abs(q) - vec3(0.4, 1.0, 0.25);
    vec2 beams = vec2((min(max(q.x, q.y), max(q.z, q.y + 0.4))), MAT_OUTSIDE);
    d = opU(d, beams);

    p.xz = pMod(p.xz, 8.0);
    p.xz = opRep(p.xz, vec2(24.0, 12.0));
    q = abs(p) - vec3(0.7);
    vec2 pillars = vec2(max(q.x, q.z), MAT_OUTSIDE);
    d = opU(d, pillars);
    return d;
}

vec2 sdShelf(vec3 p, vec2 size)
{
    float width = 1.5;
    
    /// Core
    vec3 q = p;
    q.x += 1.6;
    q.y -= 0.295;
    float id1 = (floor(q.x / 3.2));
    float id3 = (floor(q.y));
    q.xy = opRep(q.xy, vec2(3.2, 1.0));
    q.x += 0.5;
    float id2 = (floor(q.x/(3.2*0.3333)));
    q.x = opRep(q.x, 3.2*0.3333);
    float core;
    float rnd = hash31(vec3(id1, id2, id3) + CoreID.w + 1.0) * 0.5 + 0.5;
    if (rnd <= 0.5 || (id1 == 0.0 && id2 == 0.0 && id3 == 0.0)) {
    	core = 99999.9;
    } else {
        CoreID.xyz = vec3(id1, id2, id3);
        vec3 h = hash33(CoreID.xyz + CoreID.w);
        q.xz += h.xz * 0.05;
        h *= pi2;
        q.xz *= rot(h.x);
        q.xy *= rot(h.y);
        q.yz *= rot(h.z);
        core = sdSphere(q, 0.4);
        CoreCoord = q;
    }
    
    /// Shelf
    p.x += size.x * 1.6;
    vec3 o = p;
    p.y += 0.2;
    p.xy = opRep(p.xy, vec2(3.2, 1.0));
    
    q = p;
    q.xz = abs(q.xz) - vec2(width, 1.0);
    
    float legs = sdBox(q, vec3(0.05, 1.0, 0.05));
    float flor = sdBox(p, vec3(width, 0.05, 1.0)) * 0.6;
    
    float d = min(legs, flor);
    
    p = o;
    p.y += 0.7;
    p.z += 1.0;
    p.xy = opRep(p.xy, vec2(3.2, 2.0));
    float cros = sdCross(p);
    d = max(o.y - size.y + 1.0, d);
    cros = max(o.y - size.y + 1.7, cros);
    d = min(d, cros);
    //core = max(abs(o.y - 0.8) - size.y + 1.6, core);
    core = max(o.y - size.y + 0.8, core);
    core = max(-o.y - 0.8, core);
    vec2 ret = opU(vec2(d, MAT_SHELF), vec2(core, MAT_CORE));
    ret.x = max(o.x - size.x * 3.0 - size.x * 0.2, ret.x);
    ret.x = max(-o.x, ret.x);

    return ret;
}

vec2 sdCake(vec3 p)
{
    float ss = sdSphere(p, 2.0);
    if (ss > 1.0) {
    	return vec2(ss, 0.0);
    }
    p.y += 0.15;
    vec3 q = p;
    q.y = abs(p.y) - 0.2;
    vec2 sponge = vec2(sdRoundedCylinder(q, 0.5, 0.2, 0.15), MAT_SPONGE);
    
    q = p;
    q.xz = pMod(q.xz, 8.0);
    q.yz -= vec2(0.58, 0.6);
    vec3 s = vec3(50.0, 75.0, 50.0);
    vec2 cream = vec2(sdCream(q * s, 1., 3.0, 2.5) / s.y * 0.75, MAT_CREAM);
    q.y -= 0.06;
    vec2 redBall = vec2(sdSphere(q, 0.08), MAT_BALL);
    
    q = p;
    q.y -= 0.8;
    vec2 candle = vec2(sdCappedCylinder(q, vec2(0.03, 0.4)), MAT_CANDLE);
    
    q.y += 1.25;
    vec2 dish = vec2(sdDish(q), MAT_DISH);
    
    vec2 d = opU(sponge, cream);
    d = opU(redBall, d);
    d = opU(candle, d);
    d = opU(dish, d);
    
    return d;
}

vec2 sdInsideBox(vec3 p)
{
    vec2 b1 = vec2(sdBox(p, vec3(0.9)), MAT_INSIDE);
    p = abs(p) - 0.47;
    vec2 b2 = vec2(sdBox(p, vec3(.45)), MAT_OUTSIDE);
    return opU(b1, b2);
}

vec2 sdCube(vec3 p)
{
    float ss = sdSphere(p, 2.0);
    if (ss > 1.0) {
    	return vec2(ss, 0.0);
    }
    vec3 q = p;
	vec2 f = vec2(sdFrame(p), MAT_FRAME);
    vec2 b = sdInsideBox(p);
    vec2 c = vec2(sdHeartCylinder(p), MAT_HEART);
    vec2 d = opU(f, b);
    d = opU(d, c);
    
    return d;
}

vec2 map(vec3 p)
{
    vec2 pp = sdStage(p);
    vec3 cubePos = p * 2.0;
    cubePos -=  vec3(-4.5, -0.5, -13.0) * 2.0;
    cubePos.xz *= rot(1.);
    
    vec3 cakePos = p * 2.0;
    cakePos -=  vec3(0.0, 0.07, -8.0) * 2.0;
    
    vec2 d = opU(sdCube(cubePos), sdCake(cakePos)) * vec2(0.5, 1.0);
    
    Coord = cubePos;
    
    vec3 deskPos = p - vec3(0.0, -0.8, -8.0);
    deskPos.xz *= rot(0.25);
    
    vec2 desk = sdDesk(deskPos);
    d = opU(d, desk);
    d = opU(d, pp);
    
    vec3 q = p;
    p.xz = pMod(p.xz, 8.0);
    q = p;
    CoreID.w = abs(floor(p.z / 6.0));
    p.z = opRep(p.z, 6.0);
    
    vec2 size = floor(hash12(CoreID.w) * vec2(3.0, 5.0)) + vec2(5.0, 3.0);
	if (abs(CoreID.w) == 2.0) {
    	size = vec2(3.0, 3.0);
    }
    p.z *= -1.0;
    vec2 shelf = sdShelf(p, size);
    shelf.x = max(-q.z + 12.0, shelf.x) * 0.7;
    d = opU(d, shelf);
    return d;
}

float shadow(in vec3 p, in vec3 l, float ma)
{
    float t = 0.03;
    float t_max = ma;
    
    float res = 1.0;
    for (int i = 0; i < 48; ++i)
    {
        if (t > t_max) break;
        
        float d = map(p + t*l).x;
        if (d < 0.001)
        {
            return 0.0;
        }
        t += d*1.0;
        res = min(res, 20.0 * d / t);
    }
    
    return res;
}

vec3 normal( vec3 pos, float eps, vec4 h )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*eps;
    return normalize( e.xyy*(map( pos + e.xyy ).x + h.x) +
					  e.yyx*(map( pos + e.yyx ).x + h.y) +
					  e.yxy*(map( pos + e.yxy ).x + h.z) +
					  e.xxx*(map( pos + e.xxx ).x + h.w) );
}

float ndfGGX(float NdotH, float roughness)
{
	float alpha   = roughness * roughness;
	float alphaSq = alpha * alpha;

	float denom = (NdotH * NdotH) * (alphaSq - 1.0) + 1.0;
	return alphaSq / (pi * denom * denom);
}

float gaSchlickG1(float theta, float k)
{
	return theta / (theta * (1.0 - k) + k);
}

float gaSchlickGGX(float NdotL, float NdotV, float roughness)
{
	float r = roughness + 1.0;
	float k = (r * r) / 8.0;
	return gaSchlickG1(NdotL, k) * gaSchlickG1(NdotV, k);
}

vec3 fresnelSchlick_roughness(vec3 F0, float cosTheta, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - min(1.0, cosTheta), 5.0);
}

vec3 PBR(vec3 pos, vec3 albedo, float metalness, float roughness, vec3 N, vec3 V, vec3 L, vec3 Lradiance)
{
	vec3 H = normalize(L + V);
	float NdotV = max(0.0, dot(N, V));
	float NdotL = max(0.0, dot(N, L));
	float NdotH = max(0.0, dot(N, H));
		
	vec3 F0 = mix(vec3(0.04), albedo, metalness);

	vec3 F  = fresnelSchlick_roughness(F0, max(0.0, dot(H, L)), roughness);
	float D = ndfGGX(NdotH, roughness);
	float G = gaSchlickGGX(NdotL, NdotV, roughness);

	vec3 kd = mix(vec3(1.0) - F, vec3(0.0), metalness);

	vec3 diffuseBRDF = kd * albedo / pi;
	vec3 specularBRDF = (F * D * G) / max(0.0001, 4.0 * NdotL * NdotV);

	return (diffuseBRDF + specularBRDF) * Lradiance * NdotL;
}

vec3 pointLight(vec3 pos, vec3 albedo, float metalness, float roughness, vec3 N, vec3 V, vec3 L, vec3 Lradiance)
{
    vec3 lightVector = L - pos;
    float lightDistance = length(lightVector);
    vec3 lightDir = lightVector / lightDistance;
    
    float shadow = shadow(pos, lightDir, lightDistance);
    return PBR(pos, albedo, metalness, roughness, N, V, lightDir, Lradiance) * shadow / (lightDistance * lightDistance);
}
    
vec3 ambient(vec3 n, vec3 albedo)
{
    return albedo * clamp(0.5+0.5*n.y,0.0,1.0) * 0.02;
}

float linerFog(float x, float ma, float len)
{
  return pow(min(max(x - ma, 0.0) / len, 1.0), 1.7);
}

// Thanks "Candlestick" by P_Malin
// https://www.shadertoy.com/view/Xss3DH
vec3 GetFlameWander()
{
    vec3 vFlameWander = vec3(0.0, 0.0, 0.0);

	vFlameWander.x = sin(iTime * 20.0);
	vFlameWander.z = sin(iTime * 10.0) * 2.0;

    return vFlameWander;	
}

vec3 vFlameColour1 = vec3(1.0, 0.5, 0.1);
vec3 vFlameColour2 = vec3(1.0, 0.05, 0.01);

vec3 GetFlameIntensity( const in vec3 vOrigin, const in vec3 vDir, const in float fDistance )
{
	vec3 vFlamePos = vec3(0.0, 0.65, -8.0);
	vec3 vToFlame = vFlamePos - vOrigin;
	
	float fClosestDot = dot(vDir, vToFlame);
	fClosestDot = clamp(fClosestDot, 0.0, fDistance);
	
	vec3 vClosestPos = vOrigin + vDir * fClosestDot;
	vec3 vClosestToFlame = vClosestPos - vFlamePos;
	
	vClosestToFlame.xz *= (vClosestToFlame.y + 1.0) * 1.5;
	vClosestToFlame.y *= 0.5;
	vClosestToFlame *= 40.0;

	float fSwayAmount = (1.0 + vClosestToFlame.y ) * 0.05;
	vClosestToFlame += GetFlameWander() * fSwayAmount;
	
	float fClosestDist = length(vClosestToFlame);
		
	float fBrightness = smoothstep(1.0, 0.5, fClosestDist) * 2.0;
			
	float fHeightFade = (vClosestToFlame.y * 0.5 + 0.5);
	fBrightness *= clamp(dot(vClosestToFlame.xz, vClosestToFlame.xz) + fHeightFade, 0.0, 1.0);

	return mix(vFlameColour1 * 32.0, vFlameColour2, 1.0 - fBrightness) * fBrightness;
}

vec3 materialize(vec3 p, vec3 ray, float depth, vec2 mat)
{
    RayOrigin.z = opRep(RayOrigin.z, 120.0);
    vec3 col = vec3(0.0);
    vec3 sky = vec3(0.1, 0.3, 0.5) * 1.5;

    float roughness = 0.0, metalness = 0.0;
    vec3 albedo = vec3(0.0), n = vec3(0.0), emissive = vec3(0.0);
    CubeLight = 4.0;
    vec4 h = vec4(0.0);
    
    if (mat.y == MAT_SPONGE) {
    	vec3 q = p * 3.5;
    	vec2 e = vec2(1.0,-1.0)*0.5773*0.001;
        h = vec4(height(q + e.xyy), height(q + e.yyx), height(q + e.yxy), height(q + e.xxx));
        albedo = vec3(0.12, 0.04, 0.04) * 0.5;
        roughness = 0.5;
	} else if (mat.y == MAT_CREAM) {
        albedo = vec3(0.5);
        roughness = 0.4;
    } else if (mat.y == MAT_BALL) {
        albedo = vec3(0.2, 0.0, 0.0);
        roughness = 0.2;
    } else if (mat.y == MAT_CANDLE) {
		albedo = vec3(0.8);
        roughness = 0.2;
        emissive = vec3(1.0, 0.5, 0.01) * smoothstep(0.35,  0.65, p.y) * 2.0;
    } else if (mat.y == MAT_DISH) {
		albedo = vec3(0.3, 0.1, 0.01);
        roughness = 0.2;
    } else if (mat.y == MAT_FRAME) {
    	albedo = vec3(0.8);
        roughness = 0.2;
        CubeLight = 1.0;
    } else if (mat.y == MAT_OUTSIDE) {
    	albedo = vec3(0.3);
        roughness = 0.3;
        CubeLight = 1.0;
    } else if (mat.y == MAT_INSIDE) {
    	albedo = vec3(1.0, 0.2, 0.5);
        emissive = vec3(1.0, 0.2, 0.5) * 10.0 * (sin(iTime) * 0.5 + 0.5);
        roughness = 0.2;
    } else if (mat.y == MAT_HEART) {
        vec3 q = Coord * 2.0;
        float heart = min(sdHeart(q.xy), min(sdHeart(q.zx), sdHeart(q.yz))) * 0.5;
        heart = smoothstep(0.0, 0.01, heart);
    	albedo = mix(vec3(0.5, 0.1, 0.2), vec3(0.8), heart);
        emissive = mix(vec3(0.5, 0.1, 0.2) * 5.0, vec3(0.0), heart) * (sin(iTime) * 0.5 + 0.5);
        roughness = mix(0.6, 0.2, heart);
        CubeLight = 0.3;
    } else if (mat.y == MAT_SHELF) {
        float a = smoothstep(0.7, 0.9, noise(p * 3.0) * 0.5 + 0.5);
    	albedo = mix(vec3(0.5), vec3(0.5, 0.2, 0.05), a);
        roughness = mix(0.6, 0.9, a);
        metalness = 1.0;
    } else if (mat.y == MAT_FLOOR) {
    	float checker = mod(floor(p.x) + floor(p.z), 2.0);
        float c = mix(0.2, 0.3, checker);
        float dirty = smoothstep(0.5, 1.0, noise_sum(p * 0.25) * 0.5 + 0.5);
        float wet = smoothstep(0.2, 1.0, noise_sum(p *0.1) * 0.5 + 0.5);
        c = mix(c, 0.6, dirty);
        c = mix(c, c * 0.2, wet);
        albedo = vec3(c);
        
    	vec3 q = p * 1.0;
    	vec2 e = vec2(1.0,-1.0)*0.5773*0.001;
        h = vec4(noise_sum(q + e.xyy), noise_sum(q + e.yyx), noise_sum(q + e.yxy), noise_sum(q + e.xxx)) * 0.01;
        roughness = mix(0.5, 0.8, checker);
        roughness = mix(roughness, 0.6, dirty);
        roughness = mix(roughness, 0.2, wet);
    } else if (mat.y == MAT_CORE) {
        albedo = vec3(1.0);
        
        float len = length(CoreCoord.xy);
        float corePattern = mix(0.4, 1.0, smoothstep(0.2, 0.21, len));
        corePattern = mix(0.4, corePattern, smoothstep(0.01, 0.02, abs(CoreCoord.y)));
        corePattern = mix(1.0, corePattern, smoothstep(0.17, 0.175, len));
        corePattern = mix(0.4, corePattern, smoothstep(0.11, 0.12, len));

        roughness = mix(0.2, 0.5, corePattern);
        albedo = vec3(corePattern);
        
        float hash = hash31(CoreID.xyz + CoreID.w);
        float wave = max(0.0, sin(iTime * 0.3 + hash * pi2));
        emissive += mix(vec3(1.0, 0.01, 0.01) * 3.0, vec3(0.0), smoothstep(0.0, 0.22, len)) * wave;
        emissive += mix(vec3(1.0, 0.5, 0.1) * 40.0, vec3(0.0), smoothstep(0.0, 0.15, len)) * wave;
    }
    n = normal(p, 0.001, h);
    vec3 l1 = vec3(0.0, 1.0, -8.0) + vec3(fbm(vec2(0.0, iTime)), fbm(vec2(iTime, 0.0)), fbm(vec2(iTime))) * 0.1;
    vec3 l2 = vec3(sin(iTime * 1.0)*5., 1.0, cos(iTime * 1.0)*5.) + vec3(0.0, 0.0, -8.0);

    col = pointLight(p, albedo, metalness, roughness, n, -ray, l1, vec3(1.0, 0.5, 0.1) * 20.0 * mix(0.8, 1.0, sin(iTime * 20.0) * 0.5 + 0.5));
    col += pointLight(p, albedo, metalness, roughness, n, -ray, RayOrigin + vec3(0.0, -0.05, 0.0), vec3(0.5) * CameraLight);
    col += pointLight(p, albedo, metalness, roughness, n, -ray, vec3(-4.1, -0.5, -12.35), vec3(0.5, 0.1, 0.2) * CubeLight * (sin(iTime) * 0.5 + 0.5));
    col += ambient(n, albedo);
    col += emissive;

    float fo = linerFog(depth, 9.0, 50.0);
    vec3 fco = 0.65*vec3(0.4,0.65,1.0);
    col = mix( col, sky, fo ) + GetFlameIntensity(RayOrigin, ray, depth);
    return col;
}

vec3 trace(vec3 p, vec3 ray)
{
    float t = 0.0;
    vec3 pos;
    vec2 mat;
    for (int i = 0; i < 150; i++) {
        pos = p + ray * t;
        pos.z = opRep(pos.z, 120.0);
        mat = map(pos);
        if (mat.x < 0.00001 || t > 50.0) {
        	break;
        }
        t += mat.x;
    }
    return materialize(pos, ray, t, mat);
}

mat3 camera(vec3 ro, vec3 ta, float cr )
{
	vec3 cw = normalize(ta - ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float luminance(vec3 col)
{
    return dot(vec3(0.298912, 0.586611, 0.114478), col);
}

vec3 reinhard(vec3 col, float exposure, float white) {
    col *= exposure;
    white *= exposure;
    float lum = luminance(col);
    return (col * (lum / (white * white) + 1.0) / (lum + 1.0));
}

float sm(float start, float end, float t, float smo)
{
    return smoothstep(start, start + smo, t) - smoothstep(end - smo, end, t);
}

float quadraticInOut(float t) {
  float p = 2.0 * t * t;
  return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
}

float exponentialOut(float t) {
	return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);
}

void cameraPath()
{
    float t = mod(iTime, 51.0);
    vec3 origin = vec3(0.0, 0.0, -60.0);
    vec3 cube = origin + vec3(-4.5, -0.5, -13.0);
    vec3 cake = origin + vec3(0.0, 0.07, -8.0);
    CameraLight = 0.0;
    Black = 1.0;
    if (t < 10.0) {
    	// far camera
    	RayOrigin =  vec3(sin(-t * 0.1) * 24.0, 6.0, cos(-t * 0.1) * 24.0) + vec3(0.0, 0.0, -60.0);
    	Target = vec3(-0.0, 1.0, -68.0);
        Black = sm(0.0, 10.0, t, 1.0);
    } else if(t < 16.0) {
    	// core camera
    	t -= 10.0;
    	RayOrigin =  vec3(-t, 1.0, 0.0) + vec3(0.0, 0.0, -72.0);
    	Target = RayOrigin + vec3(1.0, 0.0, -1.0);
        Black = sm(0.0, 6.0, t, 1.0);
    } else if(t < 26.0) {
    	// companion cube camera
        t -= 16.0;
    	RayOrigin = cube + vec3(-t * 0.5 + 3.0, 1.0, 3.0);
    	Target = cube;
        Black = sm(0.0, 10.0, t, 1.0);
    } else if(t < 36.0) {
    	// cake camera
        t -= 26.0;
    	float dist = t * 0.2 + 0.5;
    	RayOrigin = cake + vec3(sin(t*0.2) * dist, 1.0 - t * 0.05, cos(t*0.2) * dist);
    	Target = cake + vec3(0.0, 0.4 - t * 0.03, 0.0);
    	CameraLight = 3.0;
        Black = sm(0.0, 10.0, t, 1.0);
    } else if(t < 51.0) {
    	// the cake is a lie
    	t -= 36.0;
        RayOrigin = mix(vec3(0.0, 1.0, 52.0), vec3(0.0, 1.0, -62.0), exponentialOut(min(1.0, t*0.06)));
        RayOrigin.y = mix(1.0, 1.3, quadraticInOut(clamp((t-4.0)*0.2, 0.0, 1.0)));
    	Target = vec3(-0.0, 1.0, -68.0);
    	CameraLight = 30.0;
        Black = sm(0.0, 15.0, t, 1.0);
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

    cameraPath();

    mat3 c = camera(RayOrigin, Target, 0.0);
    vec3 ray = c * normalize(vec3(p, 3.0));
    vec3 col = trace(RayOrigin, ray);
    
    col = reinhard(col, 1.0, 5.0);
    col = pow(col, vec3(1.0/2.2));

    p = fragCoord.xy / iResolution.xy;
    p *=  1.0 - p.yx;
    float vig = p.x*p.y * 200.0;
    vig = pow(vig, 0.1);
    
    fragColor = vec4(col * vig * Black,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
