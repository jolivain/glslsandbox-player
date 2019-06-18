/*
 * Original shader from: https://www.shadertoy.com/view/4tGBDG
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
#define TAU 6.283185307
#define PI 3.141592654
#define HALF_PI 1.5707963267948966
#define U(z,w) (mix(z,w,step(w.x,z.x)))

#define MAT_WING  1.0
#define MAT_BODY  2.0
#define MAT_STAGE 3.0

#define saturate(x) (clamp(x, 0.0, 1.0))

#define BPM (130.)

const int Iterations = 3;

float orgBeat = 0., beat = 0., sceneBeat = 0., kick = 0., hihat = 0., snare = 0.;
float stageScale = 0.;
float edgeOnly = 0.;
vec3 fogColor = vec3(0.);
mat3 sphereRot = mat3(0.), stageRot = mat3(0.), stageRot2 = mat3(0.);
vec3 ray = vec3(0.);
vec3 ro = vec3(0.), ta = vec3(0.), sp = vec3(0.);
vec3 cameraLight = vec3(0.), stageLight = vec3(0.), travelerLight = vec3(0.);
vec3 stageFlareCol, travelerFlareCol;
float stageFlareIntensity, travelerFlareIntensity, stageFlareExp, travelerFlareExp;
float shadeIntensity = 0., glowIntensity = 0., particleIntensity = 0.;
float stageFold = 0., stageRotateZ = 0.;
float particle1Intensity = 0., particle2Intensity = 0.;
float switchTraveler = 0.;
float glitchIntensity = 0.;
vec3 glitchColor = vec3(0.);

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sm(float start, float end, float t, float smo)
{
    return smoothstep(start, start + smo, t) - smoothstep(end - smo, end, t);
}

float sm2(float start, float end, float t, float bs, float es)
{
    return smoothstep(start, start + bs, t) - smoothstep(end - es, end, t);
}

vec3 hash3( vec3 p ){
    vec3 q = vec3(dot(p,vec3(127.1,311.7, 114.5)), dot(p,vec3(269.5,183.3, 191.9)), dot(p,vec3(419.2,371.9, 514.1)));
    return fract(sin(q)*43758.5453);
}

mat3 rotateMat(float roll, float pitch, float yaw)
{
    float cp = cos(pitch);
    float sp = sin(pitch);
    float sr = sin(roll);
    float cr = cos(roll);
    float sy = sin(yaw);
    float cy = cos(yaw);

    return mat3(cp * cy, (sr * sp * cy) - (cr * sy), (cr * sp * cy) + (sr * sy),
                cp * sy, (sr * sp * sy) + (cr * cy), (cr * sp * sy) - (sr * cy),
                -sp, sr * cp, cr * cp);
}

float stepUp(float t, float len, float smo)
{
    float tt = mod(t += smo, len);
    float stp = floor(t / len) - 1.0;
    return smoothstep(0.0, smo, tt) + stp;
}

float pingPong(float t, float len, float smo)
{
    t = mod(t + smo, len * 2.);
    return 1.0 - (smoothstep(0., smo, t) - smoothstep(len, len + smo, t));
}

float glowTime(vec3 p)
{
    float t = mix(beat, beat - 45.0, step(44.0, beat));
    t = mix(t, mod(beat - 53.0, 8.), step(108.0, beat));
    t = mix(t, beat - 177.0, step(176.0, beat) * step(beat, 184.0));
    t = mix(t, mod(beat - 177.0, 8.), step(184.0, beat) * step(beat, 224.0));
    t = mix(t, -1.0, saturate(step(beat, 44.0) + (step(52.0, beat) * step(beat, 108.0)) + step(224.0, beat)));
    return t;
}

float patternIntensity(vec3 p)
{
    float t = beat - 28.0;
    if (t < 0.0) {
        return 0.0;
    }
    t -= 2.5;
    float len = distance(sp, p);
    return sm(0.0, 2.5, mod(len - t * 1.5, 6.0), .5);
}

float sphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float de(vec3 p, mat3 rot, float scale) {
    vec3 offset = vec3(1,1,1);

    float freq = 64.0;
    for (int i=0; i<Iterations; i++) {
        if (i != 0) {
            p*=rot;
        }
        p = abs(p);

        // TODO: シーン4のタイミングとbeatが合わない場合はオフセット用意しよう
        // 全->横->全->縦->前->縦->ループ
        float b = mix(beat - 44., beat - 192.0, step(176.0, beat));
        b = mix(b, 0.0, step(beat, 44.0));
        b = mix(b, mod(beat, 8.0) + 64.0, step(108.0, beat) * step(beat, 176.0));
        p.yx = mix(p.yx, p.xy, (1.0 - pingPong(b, freq * 0.25, 1.0)) * step(p.x, p.y));
        p.xz = mix(p.xz, p.zx, (1.0 - pingPong(b, freq * 0.75, 1.0)) * step(p.x, p.z));
        p.yz = mix(p.yz, p.zy, (1.0 - saturate(pingPong(mod(b, freq * 0.75), freq * 0.25, 1.0) - step(freq * 0.75 - 1.0, mod(b, freq*0.75)))) * step(p.y, p.z));

        p.z -= 0.5*offset.z*(scale-1.)/scale;
        p.z = -abs(-p.z);
        p.z += 0.5*offset.z*(scale-1.)/scale;

        p.xy = scale*p.xy - offset.xy*(scale-1.);
        p.z = scale*p.z;
    }

    vec3 d = abs(p) - vec3(1.,1.,1.);
    float distance = length(vec3(max(d, vec3(0.0))));
    distance *= pow(scale, -float(Iterations));
    
    return distance;
}

mat2 rotate(in float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

// https://www.shadertoy.com/view/Mlf3Wj
vec2 foldRotate(in vec2 p, in float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = TAU / s;
    a = floor(a / n) * n;
    p *= rotate(a);
    return p;
}

vec2 distStage(vec3 p, mat3 rot, float scale)
{
    p.xy = (p.xy - 0.75) * rotate(p.z * stageRotateZ) + 0.75;
    p.xy = foldRotate(p.xy - 0.75, stageFold) + 0.75;
    p = mod(p, 1.5) - 0.75;
    float d = de(p, rot, scale);
    d = mix(d, 100., step(144.0, beat) * step(beat, 176.0));
    return vec2(d, MAT_STAGE);
}

vec2 distSphere(vec3 p)
{
    float wing = sphere(p, 0.1);
    float b1 = sdBox(p, vec3(10.0, 0.02, 10.0));
    float b2 = sdBox(p, vec3(0.02, 10.0, 10.0));
    float b3 = sdBox(p, vec3(10.0, 10.0, 0.02));
    float s = sphere(p, 0.098);
    wing = max(-b1, wing);
    wing = max(-b2, wing);
    wing = max(-b3, wing);
    wing = max(-s, wing);

    vec2 w = vec2(wing, MAT_WING);
    vec2 body = vec2(sphere(p, 0.08), MAT_BODY);
    return U(w, body);
}

mat2 rot(float x)
{
    return mat2(cos(x), sin(x), -sin(x), cos(x));
}

/*float ifs(vec3 p) {
    p *= 15.;
	for(int i = 0; i < 3; i++) {
        p.xy *= rot(0.8 + .8*stepUp(beat + 1.0, 2.0, 0.5));
        p.xz *= rot(0.4 + .4*stepUp(beat, 2.0, 0.5));
		p = abs(p);
		p = 2.0*p - 1.0;
	}
	return sdBox(p, vec3(.9))*pow(2.0, -3.0) / 15.0;
}*/

vec2 distMetaBall(vec3 p)
{
    float s1 = sphere((p + vec3(sin(beat) * 0.1, sin(beat) * 0.1, 0.)), 0.05);
    float s2 = sphere((p + vec3(0., sin(beat * 0.5) * 0.1, sin(beat * 0.5) * 0.1)) , 0.04);
    float s3 = sphere((p + vec3(sin(beat * 0.25) * 0.1, 0., sin(beat * 0.25) * 0.1)), 0.03);
    float d = smin(s3, smin(s1, s2, .1), .1);
    return vec2(d, MAT_WING);
}

vec2 distTorus(vec3 p)
{
    mat3 m1 = rotateMat(beat * 0.1, beat, beat * 0.7);
    mat3 m2 = rotateMat(beat, beat * 0.5, beat * 0.25);
    mat3 m3 = rotateMat(beat * 0.3, beat, beat * 0.8);
    float t1 = sdTorus(p * m1, vec2(0.1, 0.01));
    float t2 = sdTorus(p * m2, vec2(0.08, 0.005));
    float t3 = sdTorus(p * m3, vec2(0.06, 0.004));
    return vec2(min(t3, min(t1, t2)), MAT_WING);
}

vec2 distBox(vec3 p)
{
    float i = sdBox(p, vec3(.06));
    return vec2(i, MAT_WING);
}

vec2 distTraveler(vec3 p)
{
    return distSphere(p);
}

vec2 distTraveler2(vec3 p)
{
    vec2 d1 = distMetaBall(p);
    vec2 d3 = distTorus(p);
    vec2 d2 = distBox(p);
    float s = mod(stepUp(beat, 6.0, 3.0), 3.0);
    vec2 d = d1;
    d.x = mix(d.x, d2.x, saturate(s));
    d.x = mix(d.x, d3.x, saturate(s - 1.0));
    d.x = mix(d.x, d1.x, saturate(s - 2.0));
    return d;
}

vec2 distAll(vec3 p)
{
    vec2 st1 = distStage(p, stageRot, stageScale);
    vec2 st2 = distStage(p, stageRot2 * stageRot, stageScale);
    vec2 tr = distTraveler((p - sp) * sphereRot);
    vec2 tr2 = distTraveler2((p - sp) * sphereRot);

    vec2 trd = tr;
    trd = mix(trd, tr2, step(0.75 + switchTraveler* 0.1, p.y));
    trd.x = mix(trd.x, tr2.x, saturate(beat - 208.));
    trd.x = mix(trd.x, tr.x, saturate(beat - 224.));
    trd.x *= 0.9;

    float visibleStage = step(176.0, beat) * step(max(beat - 177.0, 0.0) * 1.7, distance(p, sp));
    st1.x = mix(st1.x, 100.0, visibleStage);
    st2.x = mix(st2.x, 100.0, visibleStage);
    return U(trd, U(st1, st2));
}

vec2 distGlow(vec3 p)
{
    vec2 st1 = distStage(p, stageRot, stageScale);
    vec2 st2 = distStage(p, stageRot2 * stageRot, stageScale);

    float gt = glowTime(p);

    float frontSp = sphere(p - sp, gt + 1.);
    float backSp = sphere(p - sp, gt);
    float cut = max(frontSp, -backSp);
    vec2 st = U(st1, st2);
    st.x = max(st.x, cut);
    return st;
}

float distCubeParticle(vec3 pos)
{
    pos.y -= beat * 0.25;
    vec3 id = floor(pos / 1.);
    pos = mod(pos, 1.) - 0.5;
    vec3 rnd = hash3(id) * 2.0 - 1.0;
    mat3 rot = rotateMat(rnd.x * beat * 2.0, rnd.y * beat * 2.0, rnd.z * beat * 2.0);
    float d = sdBox((pos + rnd * 0.25) * rot, vec3(.025));
    d = mix(d, .5, step(rnd.x, -0.7));
    return d;
}

float distSphereParticle(vec3 pos)
{
    pos.y -= beat * 0.4;
    vec3 id = floor(pos / 0.4);
    pos = mod(pos, 0.4) - 0.2;
    vec3 rnd = hash3(id) * 2.0 - 1.0;
    mat3 rot = rotateMat(rnd.x * beat * 2.0, rnd.y * beat * 2.0, rnd.z * beat * 2.0);
    float d = sphere((pos * rot + rnd * 0.1), 0.01);
    d = mix(d, .1, step(rnd.x, 0.0));
    return d;
}

/*
vec3 normal(vec3 pos, float e)
{
    vec3 eps = vec3(e,0.0,0.0);

    return normalize( vec3(
           distAll(pos+eps.xyy).x - distAll(pos-eps.xyy).x,
           distAll(pos+eps.yxy).x - distAll(pos-eps.yxy).x,
           distAll(pos+eps.yyx).x - distAll(pos-eps.yyx).x ) );
}
*/

vec3 normal( in vec3 pos, float eps )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*eps;
    return normalize( e.xyy*distAll( pos + e.xyy ).x +
					  e.yyx*distAll( pos + e.yyx ).x +
					  e.yxy*distAll( pos + e.yxy ).x +
					  e.xxx*distAll( pos + e.xxx ).x );
    /*
	vec3 eps = vec3( 0.0005, 0.0, 0.0 );
	vec3 nor = vec3(
	    map(pos+eps.xyy).x - map(pos-eps.xyy).x,
	    map(pos+eps.yxy).x - map(pos-eps.yxy).x,
	    map(pos+eps.yyx).x - map(pos-eps.yyx).x );
	return normalize(nor);
	*/
}

mat3 createCamera(vec3 ro, vec3 ta, float cr )
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k)
{
    float res = 1.0;
    float t = mint;
    for( int i=0; i<8; i++ )
    {
        float h = distAll( ro + rd*t).x;
        res = min( res, k*h/t );
        t += clamp( h, 0.05, 0.2 );
        if( res<0.001 || t>maxt ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

float sdRect( vec2 p, vec2 b )
{
    vec2 d = abs(p) - b;
    return min(max(d.x, d.y),0.0) + length(max(d,0.0));
}

float tex(vec2 p, float z)
{
    vec2 q = (fract(p / 10.0) - 0.5) * 10.0;
    float d = 9999.0;
    for (int i = 0; i < 3; ++i) {
        q = abs(q) - 0.5;
        q *= rot(0.785398);
        q = abs(q) - 0.5;
        q *= rot(z * 0.5);
        float k = sdRect(q, vec2(1.0, 0.55 + q.x));
        d = min(d, k);
    }
    float f = 1.0 / (1.0 + abs(d));
    return pow(f, 16.0) + smoothstep(0.95, 1.0, f);
}

vec3 light(vec3 pos, vec3 normal, vec3 ray, vec3 col, vec3 lpos, vec3 diffuse, vec3 specular, float smoothness)
{
    vec3 lvec = normalize(lpos - pos);
    vec3 hvec = normalize(lvec - ray);
    float llen = length(lpos - pos);
    vec3 diff = diffuse * col * (dot(normal, lvec) * 0.5 + 0.5)  * (1.0 / PI);

    float bpnorm = ( smoothness + 2.0 ) / ( 2.0 * PI );
    vec3 spec = specular * col * bpnorm * pow( max( 0.0, dot( normal, hvec ) ), smoothness );

    return vec3(diff + spec) / (llen * llen);
}

vec3 shade(vec3 pos, vec3 normal, vec3 ray, vec3 diffuse, vec3 specular, float smoothness)
{
    vec3 col = light(pos, normal, ray, cameraLight * 2.0, ro, diffuse, specular, smoothness);
    col += light(pos, normal, ray, stageLight, ro + vec3(0.0, 0.0, 2.0), diffuse, specular, smoothness);
    return col;
}

vec3 rgb2hsv(vec3 hsv)
{
	vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(vec3(hsv.x) + t.xyz) * 6.0 - vec3(t.w));
	return hsv.z * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), hsv.y);
}

vec3 materialize(vec3 ro, vec3 ray, float depth, vec2 mat)
{
    vec3 pos = ro + ray * depth;
    vec3 nor = normal(pos, 0.0025);
    vec3 spLocalNormal = normalize((pos - sp) * sphereRot);
    vec3 col = vec3(0.);

    vec3 coord = mix(19.3602379925 * spLocalNormal, pos * 9.3602379925, step(MAT_BODY, mat.y));
    vec3 pattern = vec3(tex(coord.zy, 113.09),  tex(coord.xz, 113.09),  tex(coord.xy, 113.09));

    if (mat.y == MAT_WING) {
        float wing_pattern = saturate(pattern.x + pattern.y + pattern.z);
        vec3 cameraLightCol = light(pos, nor, ray, cameraLight * 2.0, ro, vec3(.1), vec3(.1), mix(5.0, 100.0, wing_pattern));
        vec3 stageLightCol = light(pos, nor, ray, stageLight, ro + vec3(0.0, 0.0, 2.0), vec3(.1), vec3(.1), mix(5.0, 100.0, wing_pattern));
        col += cameraLightCol + stageLightCol;

        col += vec3(1.0, 0.25, 0.35) * 1.3 * wing_pattern * (cos(beat * 0.5) * 0.5 + 1.0);
    } else if (mat.y == MAT_BODY) {
        col += vec3(1.0, 0.25, 0.35) * 1. * saturate(cos(beat * 0.5) * 0.5 + 1.0);
    } else if (mat.y == MAT_STAGE) {
        vec3 lpos = ro + vec3(0.0, 0.0, 2.0);
        vec3 lvec = normalize(lpos - pos);

        vec3 cameraLightCol = light(pos, nor, ray, cameraLight * 2.0, ro, vec3(1.), vec3(1.), 25.);
        vec3 stageLightCol = light(pos, nor, ray, stageLight, ro + vec3(0.0, 0.0, 2.0), vec3(1.), vec3(1.), 25.);
        float sha = (softshadow(pos, lvec, 0.01, length(lpos - pos), 4.0) + mix(.2, .4, step(160.0, beat)));

        // ステージが出現する演出
        float noShade = 0.0;
        noShade = step(distance(pos, sp), sceneBeat) * step(45.0, beat);

        float wing_pattern = pow(saturate(pattern.x + pattern.y + pattern.z), 1.5) * 1.2;
        col += ((cameraLightCol + stageLightCol * sha + light(pos, nor, ray, travelerLight, sp, vec3(1.), vec3(1.), mix(25., 100., step(176.0, beat)))) * edgeOnly * noShade + max(wing_pattern, 0.0) * (mix(vec3(0.1,0.2,0.4), rgb2hsv(vec3(pos.z * 1.0 + beat * 0.1, .85, 1.5)), step(160.0, beat))) * 4.0 * patternIntensity(pos)) * glowIntensity;
    }

    return mix(col, fogColor, pow(depth * 0.018, 2.1));
}

vec3 glowTrace(vec3 ro, vec3 ray, float maxDepth)
{
    float t = 0.0;
    vec3 col = vec3(0.);
    for (int i = 0; i < 16; i++) {
        vec3 p = ro+ray*t;
        float len = distance(sp, p);
        float gt = glowTime(p);

        // 光らせたくないときは-1.0を返してる
        if (gt < 0.0) {
            break;
        }

        vec3 h = hash3(floor(p * 30.0) / 30.0) * 2.0 - 1.0;
        float val = 1.0 - sm(gt, gt + 2.0, len, .25);
        // TODO: smでバラバラ感を制御しているが思った挙動じゃないので調査する
        vec2 res = distGlow(p + h * 0.15 * val);
        col += saturate(0.002 / res.x) * rgb2hsv(vec3(p.x * 1., 0.8, 1.0));
        t += res.x;
        if (maxDepth < t) {
            break;
        }
    }
    return col;
}


vec4 particleTrace(vec3 ro, vec3 ray, float maxDepth)
{
    float t = 0.0;
    vec3 col = vec3(0.0);
	for (int i = 0; i < 48; i++)
	{
        vec3 p = ro+ray*t;
        float d = distSphereParticle(p);
        col += max(vec3(0.0), particle1Intensity / d * vec3(1.0, 0.5, 0.5));
        t += d * 0.5;
        if (maxDepth < t) {
            break;
        }
	}
	return vec4(saturate(col), t);
}

vec4 particle2Trace(vec3 ro, vec3 ray, float maxDepth)
{
    float t = 0.0;
    vec3 col = vec3(0.0);
	for (int i = 0; i < 48; i++)
	{
        vec3 p = ro+ray*t;
        float d = distCubeParticle(p);
        col += max(vec3(0.0), particle2Intensity / d * vec3(0.0, 0.5, 1.0));
        t += d * 0.25;
        if (maxDepth < t) {
            break;
        }
	}
	return vec4(saturate(col), t);
}

vec4 trace(vec3 ro, vec3 ray)
{
    float t = 0.0;
    float stepIntensity = 0.0;
    vec2 res;
    for (int i = 0; i < 80; i++) {
        vec3 p = ro+ray*t;
        res = distAll(p);
        if( res.x < 0.0001 || t > 100.0) {
            stepIntensity = float(i) / 64.0;
            break;
        }
        t += res.x;
    }
    vec3 p = ro + ray * t;
    float val = patternIntensity(p);
    vec3 sg1 = pow(stepIntensity * 1.0, 5.0) * vec3(.2, .4, .8) * val * 5.;
    vec3 sg2 = pow(stepIntensity * 1.0, 1.0) * vec3(1., 0., 0.) - pow(stepIntensity * 1.0, 2.0) * vec3(0., 1., 1.);
    vec3 sg3 = pow(stepIntensity * 1.0, 1.0) * vec3(0., 0.5, .75);
    float v = saturate((beat - 236.0) / 4.0);
    float v2 = 1.0 - saturate((beat - 239.5) / 1.5);
    float v3 = saturate((beat - 232.0) / 8.0);
    return vec4(saturate(materialize(ro, ray, t, res) + sg1 * shadeIntensity - mix(vec3(0.), sg3 * 2.0 * v2, v3) + mix(vec3(0.), sg2 * 2.0 * v2, v)), t);
}

void initBeat(float b)
{
    sceneBeat = b;

    kick = mod(sceneBeat, 1.);
    hihat = sceneBeat < 16.0 ? 0.0 : pingPong(sceneBeat + 0.5, 1.0, 0.1) * 0.1;
    snare = sceneBeat < 32.0 ? 0.0 : stepUp(sceneBeat - 32.5, 2.0, 0.5);
}

vec2 hash( vec2 p ){
    p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
    return fract(sin(p)*43758.5453) * 2.0 - 1.0;
}

vec2 fbm_hash( vec2 x )
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );

	vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( fbm_hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( fbm_hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( fbm_hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( fbm_hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(vec2 uv, float s)
{
    uv *= s;
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
	float f  = 0.5000*noise( uv ); uv = m*uv;
	f += 0.2500*noise( uv ); uv = m*uv;
	f += 0.1250*noise( uv ); uv = m*uv;
	f += 0.0625*noise( uv ); uv = m*uv;
    return f * 0.5 + 0.5;
}

float quadraticInOut(float t) {
  float p = 2.0 * t * t;
  return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
}

float elasticOut(float t) {
	return sin(-13.0 * (t + 1.0) * HALF_PI) * pow(2.0, -10.0 * t) + 1.0;
}

float exponentialInOut(float t) {
	return t == 0.0 || t == 1.0
		? t
		: t < 0.5
		? +0.5 * pow(2.0, (20.0 * t) - 10.0)
		: -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

float exponentialIn(float t) {
	return t == 0.0 ? t : pow(2.0, 10.0 * (t - 1.0));
}

float exponentialOut(float t) {
	return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);
}

vec3 scene(vec2 p)
{

    float cameraF = sin(beat * 0.25);
    float scene0Beat = beat;
    float scene1Beat = beat - 12.;
    float scene2Beat = beat - 44.;
    float scene3Beat = beat - 124.;
    float scene4Beat = beat - 176.;

    float cscene0to1 = step(12.0, beat);
    float cscene1to2 = exponentialOut(saturate(beat - 44.));
    float cscene2_1to2_2 = saturate((beat - 108.0) / 16.0);
    cscene2_1to2_2 = quadraticInOut(cscene2_1to2_2 * cscene2_1to2_2);
    float cscene3to4 = quadraticInOut(saturate((beat - 172.0) / 4.0));
    float cscene3to4_2 = exponentialOut(saturate((beat - 176.0) / 1.0));

    float scene2to3FadeOut = saturate((beat - 140.0) / 4.0 );

    ////// Traveler //////
    float toffset = max(0.0, beat - 239.5) * 0.7;
    sp = mix(vec3(0.75, 0.75, mix(-20.0, 20.0, beat / 16.0)), vec3(0.75, 0.75, 0.2 + beat * 0.25 + toffset), cscene0to1);
    //travelerInit(vec3(0.75, 0.75, 0.2 + beat * 0.25 + toffset));
    //////////////////////

    ////// Camera //////
    vec3 scene0CameraPos = vec3(0.9, 0.8, 0.0);
    vec3 scene1CameraPos = sp + vec3(sin(scene1Beat * 0.475) * 0.3 + cameraF * 0.05, .15 + cameraF * 0.05, cos(scene1Beat * 0.475) * 0.3 + cameraF * 0.05);
    vec3 scene2CameraPos = sp + vec3(sin(scene2Beat * 0.2) * 0.15, cos(scene2Beat * 0.4) * 0.05 + 0.05, cos(scene2Beat * 0.15 + PI) * 0.05 - 0.2);
    vec3 scene3CameraPos = sp + vec3(cos(scene1Beat * 0.25) * 0.7 + cameraF * 0.05, .15 + cameraF * 0.05, sin(scene1Beat * 0.25) * 0.5 + cameraF * 0.05);

    float cb = scene1Beat - 4.0;
    vec3 scene4CameraPos = sp + vec3(sin(cb * 0.2) * 0.15, cos(cb * 0.4) * 0.05 + 0.05, cos(cb * 0.15 + PI) * 0.05 - 0.2);

    vec3 scene0CameraTarget = vec3(0.75, 0.75, 1.0);
    vec3 scene1CameraTarget = sp;
    vec3 scene2CameraTarget = sp + vec3(0.0, 0.0, (sin(scene2Beat * 0.05) * 0.5 + 0.5) * 3.0);
    vec3 scene3CameraTarget = sp;
    vec3 scene4CameraTarget = sp + vec3(0.0, 0.0, (sin(scene2Beat * 0.05) * 0.5 + 0.5) * 3.0);

    float scene0CameraAngle = 0.0;
    float scene1CameraAngle = sin(beat * 0.5) * 0.1;

    float scene0CameraFov = 3.0;
    float scene1CameraFov = 2.5;
    float scene2_1CameraFov = 1.0;
    float scene2_2CameraFov = 3.5;
    float scene3_1CameraFov = 1.0;
    float scene3_2CameraFov = 3.5;
    float scene3_3CameraFov = 3.5;
    float scene3_4CameraFov = 1.5;
    float scene4CameraFov = 0.45;

    vec2 rnd = hash(vec2(beat * 0.5)) * 0.05;
    rnd *= saturate(max(0.0, 1.0 - distance(scene0CameraPos, sp) / 3.0) * (1.0 - cscene0to1) +
                     saturate((beat - 234.0) / 6.0) * (1.0 - saturate(beat - 240.0)));

    ro = mix(scene0CameraPos + vec3(rnd, 0.0), scene1CameraPos, cscene0to1);
    ro = mix(ro, scene2CameraPos, cscene1to2);

    // scene2 side camera
    float cscene2to2_1 = exponentialInOut(saturate((beat - 61.0) / 4.0));
    float cscene2to2_2 = exponentialInOut(saturate((beat - 65.0) / 9.0));
    float cscene2to2_3 = exponentialInOut(saturate((beat - 67.0) / 8.0));
    float cscene2to2_3_2 = exponentialInOut(saturate((beat - 67.0) / 12.0));
    vec3 scene2_1SidePos = sp + mix(vec3(30.0, 1.0, -10.0), vec3(1.0, .0, 1.0), cscene2to2_1);
    vec3 scene2_2SidePos = sp + mix(vec3(1.0, 0.0, 1.0), vec3(sin(-beat * 3. + 0.8) * 1.25, 0.0, cos(-beat * 3. + 0.8)), cscene2to2_2);
    ro = mix(ro, scene2_1SidePos, cscene2to2_1);
    ro = mix(ro, scene2_2SidePos, cscene2to2_2);
    ro = mix(ro, scene2CameraPos, cscene2to2_3);
    ////

    // scene2 vertical camera
    float cscene2to2_4 = exponentialInOut(saturate((beat - 96.0) / 4.0));
    float cscene2to2_5 = exponentialInOut(saturate((beat - 100.0) / 8.0));
    vec3 scene2VerticalPos = sp + mix(vec3(1.0, 30.0, -10.0), vec3(0.1, sin(-beat * 0.5) * 2., cos(-beat * 0.5)) * 2., cscene2to2_4);
    ////

    ro = mix(ro, scene2VerticalPos, cscene2to2_4);
    ro = mix(ro, scene2CameraPos, cscene2to2_5);

    ro = mix(ro, scene3CameraPos, cscene2_1to2_2);
    ro = mix(ro, scene4CameraPos + vec3(rnd * 2.0, 0.0) - vec3(0., 0., toffset), cscene3to4);

    ta = mix(scene0CameraTarget + vec3(rnd * 2.0, 0.0), scene1CameraTarget, cscene0to1);
    ta = mix(ta, scene2CameraTarget, cscene1to2);

    // scene2 side camera
    ta = mix(ta, sp, cscene2to2_1);
    ta = mix(ta, scene2CameraTarget, cscene2to2_3_2);
    ////

    // scene2 vertical camera
    ta = mix(ta, sp, cscene2to2_4);
    ta = mix(ta, scene2CameraTarget, cscene2to2_5);
    ////

    ta = mix(ta, scene3CameraTarget, cscene2_1to2_2);
    ta = mix(ta, scene4CameraTarget + vec3(rnd, 0.0), cscene3to4_2);

    float fov = mix(scene0CameraFov, scene1CameraFov, cscene0to1);
    fov = mix(fov, scene2_1CameraFov, cscene1to2);

    // scene2 vertical camera
    fov = mix(fov, 1.0, cscene2to2_4);
    fov = mix(fov, scene2_1CameraFov, cscene2to2_5);
    ////

    fov = mix(fov, scene2_2CameraFov, cscene2_1to2_2);

    float scene2_2to3_1FovAnim = elasticOut(quadraticInOut(saturate((beat - 144.0) / 1.0)));
    fov = mix(fov, scene3_1CameraFov, scene2_2to3_1FovAnim);

    float scene3_1to3_2FovAnim = exponentialInOut(saturate((beat - 148.0) / 12.0));
    fov = mix(fov, scene3_2CameraFov, scene3_1to3_2FovAnim);
    fov = mix(fov, scene3_3CameraFov, cscene3to4);
    fov = mix(fov, scene3_4CameraFov, cscene3to4);
    fov = mix(fov, scene4CameraFov, cscene3to4_2);

    float cameraAng = mix(scene0CameraAngle, scene1CameraAngle, cscene0to1);

    mat3 cm = createCamera(ro, ta, cameraAng);
    ray = cm * normalize(vec3(p, fov));
    ////////////////////

    ////// Fog //////
    vec3 scene0Fog = vec3(0.0);
    vec3 scene2Fog = vec3(8., 16., 32.);
    vec3 scene3Fog = vec3(0.0);
    vec3 scene4Fog = vec3(8., 16., 32.);

    float scene0to1Fog = saturate((beat - 46.0) * 0.5);
    float scene3to4Fog = saturate((beat - 184.0) * 0.5);
    fogColor = mix(scene0Fog, scene2Fog, scene0to1Fog);
    fogColor = mix(fogColor, scene3Fog, scene2to3FadeOut);
    fogColor = mix(fogColor, scene4Fog, scene3to4Fog);
    /////////////////

    ////// Flare //////
    float scene0StageFlareIntensity = 0.0;
    float scene2StageFlareIntensity = 0.5;
    float scene3StageFlareIntensity = 0.0;
    float scene4StageFlareIntensity = 0.45;

    float scene0StageFlareExp = 1.0;
    float scene2StageFlareExp = 7.5;
    float scene4StageFlareExp = 2.0;

    float scene0TravelerFlareIntensity = max(0.2, cos(sceneBeat * 0.5) * 0.5 + 0.5);
    float scene1TravelerFlareIntensity = max(0.2, cos(beat * 0.5) * 0.5 + 0.5);

    float scene0TravelerFlareExp = mix(1.0, 800.0, distance(ro, sp) / 10.0);
    float scene1TravelerFlareExp = 8.0;

    stageFlareCol = vec3(.3, .6, 1.2);
    travelerFlareCol = vec3(1., .25, .35);

    float scene3to4Flare = saturate((beat - 176.0) / 4.0);

    stageFlareIntensity = mix(scene0StageFlareIntensity, scene2StageFlareIntensity, scene0to1Fog);
    stageFlareIntensity = mix(stageFlareIntensity, scene3StageFlareIntensity, scene2to3FadeOut);
    stageFlareIntensity = mix(stageFlareIntensity, scene4StageFlareIntensity, scene3to4Flare);

    stageFlareExp = mix(scene0StageFlareExp, scene2StageFlareExp, cscene0to1);
    stageFlareExp = mix(stageFlareExp, scene4StageFlareExp, scene3to4Flare);

    travelerFlareIntensity = mix(scene0TravelerFlareIntensity, scene1TravelerFlareIntensity, cscene0to1);

    travelerFlareExp = mix(scene0TravelerFlareExp, scene1TravelerFlareExp, cscene0to1);
    ///////////////////

    ////// Light //////
    vec3 scene0CameraLight = vec3(.005);
    vec3 scene4CameraLight = vec3(0.04, 0.06, 0.08) * 0.2;

    vec3 scene0StageLight = vec3(.0);
    vec3 scene2StageLight = vec3(0.2, 0.4, 0.8);
    vec3 scene3StageLight = vec3(0.);
    vec3 scene4StageLight = vec3(0.4, 0.8, 1.6) * 2.;

    cameraLight = mix(scene0CameraLight, scene4CameraLight, cscene3to4_2);

    stageLight = mix(scene0StageLight, scene2StageLight, cscene1to2);
    stageLight = mix(stageLight, scene3StageLight, scene2to3FadeOut);
    stageLight = mix(stageLight, scene4StageLight, cscene3to4_2);
    ///////////////////

    ////// Edge //////
    edgeOnly = mix(0.0, 1.0, cscene1to2);
    //////////////////

    ////// Particle //////
    particleIntensity = mix(0.0, 1.0, saturate((beat - 145.0) * 10.0));

    float particleAnim = saturate((beat - 145.0) / 4.0 );
    particle1Intensity = mix(0.003, 0.0002, particleAnim);
    particle2Intensity = mix(0.016, 0.0007, particleAnim);
    //////////////////////

    ////// Shade //////
    shadeIntensity = mix(1.0, 0.0, scene2to3FadeOut);
    shadeIntensity = mix(shadeIntensity, 1.0, cscene3to4);
    ///////////////////

    ////// Glow //////
    glowIntensity = mix(1.0, 0.0, scene2to3FadeOut);
    glowIntensity = mix(glowIntensity, 1.0, cscene3to4);
    //////////////////

    ////// Last Stage //////
    stageFold = mix(1.0, stepUp(scene4Beat, 64. * 0.25, 1.0) * 4.0 + 5.0 + stepUp(max(0.0, beat - 244.0), 1.0, 0.2) * 10.0, cscene3to4_2);
    stageRotateZ = mix(0.0, 1.0 - pingPong(scene4Beat, 64. * 0.25, 1.0), cscene3to4_2);
    ////////////////////////

    ////// Traveler Light //////
    travelerLight = mix(vec3(.02, 0.004, 0.004) * 0.8, vec3(.02, .004, .004) * 1.5, cscene3to4_2);
    ////////////////////////////

    ////// Beat //////
    float bb = mix(scene1Beat, scene2Beat, cscene1to2);
    initBeat(bb);
    /////////////////

    ////// stage //////
    stageScale = 3.4 - mix(0.00, 0.25, clamp(kick, 0.0, 1.0));
    stageRot = rotateMat(0.1-hihat,-hihat, 0.4-hihat);
    vec3 angle = mod(vec3(snare * 1.3, snare * 0.27, snare * 0.69), vec3(TAU) * 0.5);
    stageRot2 = rotateMat(angle.x, angle.y, angle.z);
    sphereRot = rotateMat(sin(beat * 0.5),cos(beat * 0.5), sin(beat * 0.5 * .33));
    ///////////////////

    vec4 c = trace(ro, ray);
    c.rgb += glowTrace(ro, ray, c.w + 0.01) * glowIntensity;
    vec4 p1 = particleTrace(ro, ray, c.w);
    vec4 p2 = particle2Trace(ro, ray, c.w);
    c.rgb += p1.rgb * particleIntensity;
    c.rgb = mix(c.rgb + p2.rgb * particleIntensity, mix(p2.rgb, fogColor, pow(p2.w * 0.04, 2.1)), saturate(p2.g) * particleIntensity);
    return c.rgb;
}

float Bokeh(vec2 p, vec2 sp, float size, float mi, float blur)
{
    float d = length(p - sp);
    float c = smoothstep(size, size*(1.-blur), d);
    c *= mix(mi, 1., smoothstep(size*.8, size, d));
    return c;
}

vec3 dirt(vec2 uv, float n)
{
    vec2 p = fract(uv * n);
    vec2 st = (floor(uv * n) + 0.5) / n;
    vec2 rnd = hash(st);
    float c = Bokeh(p, vec2(0.5, 0.5) + vec2(0.3) * rnd, 0.2, abs(rnd.y * 0.4) + 0.3, 0.25 + rnd.x * rnd.y * 0.2);
    
    return vec3(c) * exp(rnd.x * 4.0);
}

vec3 postProcess(vec2 uv, vec3 col)
{   
    uv *= 0.5;
    
    vec3 di = dirt(uv, 3.5);
    di += dirt(uv - vec2(0.17), 3.0);
    di += dirt(uv- vec2(0.41), 2.75);
    di += dirt(uv- vec2(0.3), 2.5);
    di += dirt(uv - vec2(0.47), 3.5);
    di += dirt(uv- vec2(0.21), 4.0);
    di += dirt(uv- vec2(0.6), 4.5);

    float flare = pow(max(0.0, dot(vec3(0.0, 0.0, 1.0), ray)), stageFlareExp * 1.25);
    float flare2 = pow(max(0.0, dot(vec3(0.0, 0.0, 1.0), ray)), stageFlareExp);
    vec3 f = flare * stageFlareCol + flare2 * di * stageFlareCol * 0.05;
    
    float sflare = pow(max(0.0, dot(normalize(sp - ro), ray)), travelerFlareExp * 1.25);
    float sflare2 = pow(max(0.0, dot(normalize(sp - ro), ray)), travelerFlareExp);
    vec3 s = sflare * travelerFlareCol + sflare2 * di * travelerFlareCol * 0.05;
    
    return col + f * stageFlareIntensity + s * travelerFlareIntensity;
}

float triPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float Logo1(vec3 p)
{
    float d = 99999.9;
    d = min(d, triPrism((p + vec3(2.75, -8.0, 0.0)) * vec3(0.76, 1.0, 1.0), vec2(11.45, 0.0)));
    d = min(d, triPrism((p + vec3(-11.6, -13.8, 0.0)) * vec3(0.76, -1.0, 1.0), vec2(11.45, 0.0)));
    d = min(d, triPrism((p + vec3(16.9, -13.8, 0.0)) * vec3(0.76, -1.0, 1.0), vec2(11.45, 0.0)));
    return d;
}


float Logo2(vec3 p)
{
    float d = 99999.9;
    d = min(d, triPrism((p + vec3(5.7, -10.05, 0.0)) * vec3(0.76, 1.0, 1.0), vec2(6.85, 0.0)));
    d = min(d, triPrism((p + vec3(-17.0, -10.8, 0.0)) * vec3(0.76, -1.0, 1.0), vec2(8.45, 0.0)));
    return d;
}

float gage(vec2 p)
{
    float d = 99999.9;
    p.x += 2.8;
    p.y += 0.1;
    d = min(d, sdRect(p, vec2(14.0, 1.0)));

    float t = clamp((iTime + 30.0) / 30.0 * 13.8, 0.0, 13.8);
    p.x -= t;
    d = max(d, -sdRect(p, vec2(13.8 - t, 0.8)));
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    float t = iTime - 0.;
    orgBeat = t * BPM / 60.0;
    
    float b = orgBeat;
    b = mix(b, 226.0 + mod(orgBeat * 2.0, 0.5), step(228.0, orgBeat) * step(orgBeat, 228.5));
    b = mix(b, 229.0 + mod(orgBeat * 2.0, 0.5), step(231.0, orgBeat) * step(orgBeat, 231.5));
    b = mix(b, 227.0 + mod(orgBeat * 2.0, 0.5), step(232.0, orgBeat) * step(orgBeat, 232.5));
    b = mix(b, 238.3 + mod(orgBeat * 4.0, 1.0), step(238.0, orgBeat) * step(orgBeat, 244.0));
    t = b * 60.0 / BPM;
    
    beat = (t + hash(p).x * 0.0065 * (1.0 - saturate((orgBeat - 230.0) / 4.0)) * step(12., orgBeat)) * BPM / 60.0;

    switchTraveler = mix(2.0, -2.0, saturate(sm(126.0, 172.0, orgBeat, 8.0)));
    glitchIntensity = step(44.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 44.0)) +
                                 step(144.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 144.0)) +
                                 step(176.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 176.0)) +
                                 step(228.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 228.0)) +
                                 step(231.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 231.0)) +
                                 step(232.0, orgBeat) * exp(-3.0 * max(0.0, orgBeat - 232.0)) +
                                 sm2(234.0, 242.65, orgBeat, 4.0, 0.5);
    glitchColor = vec3(1.0);

    //// Glitch ////

    vec2 block = floor((p * vec2(100, 400.0)) / vec2(16));
    vec2 uv_noise = block / vec2(64);
    uv_noise += floor(vec2(t) * vec2(1234.0, 3543.0)) / vec2(64);

    float block_thresh = pow(fract(t * 1236.0453), 2.0) * .5;
    float line_thresh = pow(fract(t * 2236.0453), 3.0) * .6;

    vec2 noise1 = hash(uv_noise) * 0.5 + 0.5;
    vec2 noise2 = hash(vec2(uv_noise.y, 0.0)) * 0.5 + 0.5;

    if  (noise1.r < block_thresh ||
        noise2.g < line_thresh) {
        float intensity = 1.0 - smoothstep(0.3, 1.0, length(p));
        intensity *= sm(-0.4 + switchTraveler, 0.4 + switchTraveler, p.y, 0.1);
        intensity = saturate(intensity + glitchIntensity);
        vec2 dist = (fract(uv_noise) - 0.5) * intensity;
        fragCoord.x -= dist.x * 350.1 * intensity;
        fragCoord.y -= dist.y * 350.2 * intensity;
        vec3 h = hash3(vec3(fract(uv_noise) - 0.5, 0.0)) * 2.0;
        glitchColor = mix(vec3(1.0), h, intensity);
    }
    ////////////////

    p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

    //// shutdown effect ////
    float ttt = (orgBeat - 242.0) * 4.;
    float val = min(150.0, mix(mix(mix(1.0, 5.0, saturate(exponentialIn(ttt))), 1.1, saturate(exponentialOut(ttt - 1.0))), 2000.0, saturate(exponentialIn(ttt - 2.0))));
    val = mix(val, 2000.0, saturate(ttt - 3.00));
    p.y *= val;
    p.x *= mix(mix(1.0, 3.0, saturate(exponentialOut(ttt - 1.0))), 0.1, saturate(exponentialOut(ttt - 2.0)));
    ////////////////////////

    vec2 size = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 pp = p + (vec2(fbm(vec2(beat * 0.1), 1.0), fbm(vec2(beat * 0.1 + 114.514), 1.0)) * 2.0 - 1.0) * .65;
    vec3 col =  scene(pp) * glitchColor;

    col = postProcess(p, col);
    col = saturate(col);
    
    //// Nega-Posi ////
    col = mix(col, 1.0 - col, step(228.0, orgBeat) * step(orgBeat, 228.5));
    col = mix(col, 1.0 - col, step(231.0, orgBeat) * step(orgBeat, 231.5));
    col = mix(col, 1.0 - col, step(232.0, orgBeat) * step(orgBeat, 232.5));
    col = mix(col, 1.0 - col, step(242.0, orgBeat) * step(orgBeat, 244.0));
    ///////////////////

    //// vignet ////
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv *=  1.0 - uv.yx;
    float vig = uv.x*uv.y * 200.0;
    vig = pow(vig, 0.1);
    col = saturate(pow(col, vec3(1.0 / 2.2))) * vig;
    ///////////////
    
    col = mix(col, vec3(1.), saturate((beat - 251.0) / 4.0));
    col = mix(col, vec3(0.), saturate((beat - 256.0) / 2.0));

    //// loading screen ////
    vec2 ppp = p;
    p *= 12.5 * 1.33333333;
    p+= vec2(-1.55, 9.5);

    float logo1 = 1.0 - smoothstep(0.0, 0.1, Logo1(vec3(p, 0.0)));
    float logo2 = 1.0 - smoothstep(0.0, 0.1, Logo2(vec3(p, 0.0)));
    float g = 1.0 - smoothstep(0.0, 0.1, gage(p));

    col = mix(col, vec3(1.0), 1.0 - smoothstep(1.0, 1.5, t));
    col = mix(col, vec3(0.23), logo1 * (1.0 - smoothstep(2.0, 3.3, t)));
    col = mix(col, vec3(0.85, 0.35, 0.35), logo2 * (1.0 - smoothstep(2.0, 3.3, t)));
    col = mix(col, vec3(0.85, 0.35, 0.35), g * (1.0 - smoothstep(1.0, 1.5, t)));
    ///////////////////////

    col = mix(col, vec3(1.), smoothstep(1.9, 2.0, ttt));
    col = mix(col, vec3(0.), saturate(step(size.y, ppp.y) + step(ppp.y, -size.y) + step(size.x, ppp.x) + step(ppp.x, -size.x) + step(3.3, ttt)));
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
