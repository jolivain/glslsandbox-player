/*
 * Original shader from: https://www.shadertoy.com/view/4sdcz8
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

mat3 transpose(const in mat3 m){
	return mat3(
		m[0][0], m[1][0], m[2][0],
		m[0][1], m[1][1], m[2][1],
		m[0][2], m[1][2], m[2][2]);
}

// --------[ Original ShaderToy begins here ]---------- //
// created by Byumjin Kim (KimchiStorm) - 2018
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define MAX_MARCHING_STEPS 128
#define MAX_SHADOW_STEPS 128
#define MAX_REFLECTION_STEPS 30
#define MAX_RAYDISTANCE 1000.0
#define SHADOW_EPSILON 0.0001
#define USE_CHEAP_NORMAL 1

#define STEP_SIZE_SCALER 0.8

#define PI 3.1415926535897932384626422832795028841971
#define TwoPi 6.28318530717958647692
#define InvPi 0.31830988618379067154
#define Inv2Pi 0.15915494309189533577
#define Inv4Pi 0.07957747154594766788

#define DEGREE_TO_RAD 0.01745329251994329576923690768489

#define DEGREE_7_5 0.1308996938995747182692768076366
#define DEGREE_10 0.17453292519943295769236907684886
#define DEGREE_12 0.20943951023931954923084289221863
#define DEGREE_17 0.29670597283903602807702743064313
#define DEGREE_17_5 0.30543261909900767596164588448558
#define DEGREE_18_5 0.32288591161895097173088279217039
#define DEGREE_24 0.41887902047863909846168578443727
#define DEGREE_30 0.52359877559829887307710723054658
#define DEGREE_37_5 0.65449846949787359134638403818338
#define DEGREE_40 0.69813170079773183076947630739545
#define DEGREE_60 1.0471975511965977461542144610932
#define DEGREE_80 1.3962634015954636615389526147909
#define DEGREE_85 1.4835298641951801403851371532157
#define DEGREE_90 1.5707963267948966192313216916398
#define DEGREE_95 1.6580627893946130980775062300646
#define DEGREE_72 1.2566370614359172953850573533118
#define DEGREE_100 1.7453292519943295769236907684886
#define DEGREE_140 2.4434609527920614076931670758841
#define DEGREE_144 2.5132741228718345907701147066236
#define DEGREE_160 2.7925268031909273230779052295818

#define PLANE 1.0
#define DUCK_SHADOW 2.0

#define POINT_EYE 100.0
#define PEAK 101.0
#define DUCK_FOOT 102.0
#define DUCK_BODY 103.0

#define SUN 104.0
#define MOON 105.0

#define PUREDUCK 0.0 // setting this value to 1.0 will show only a duck

//----------------------------------------------- Sky Gradation ------------------------------------------------
vec3 dawnCol = vec3(0.5, 0.5, 1.0);
vec3 dawnCol2 = vec3(1.0, 1.0, 0.8);

vec3 midDayCol = vec3(0.52941176470588235294117647058824, 0.81176470588235294117647058823529, 0.90980392156862745098039215686275);
vec3 midDayCol2 = vec3(0.94901960784313725490196078431373, 1.0, 0.96862745098039215686274509803922);

vec3 twilightCol = vec3(0.09411764705882352941176470588235, 0.06274509803921568627450980392157, 0.21568627450980392156862745098039);
vec3 twilightCol2 = vec3(0.98431372549019607843137254901961, 0.49411764705882352941176470588235, 0.31372549019607843137254901960784);

vec3 midNightCol = vec3(0.0, 0.0, 0.0);
vec3 midNightCol2 = vec3(0.0, 0.0, 0.2);

//----------------------------------------------- Noise ------------------------------------------------
//From iq's procedural planet
float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
float noise(float x) { float i = floor(x); float f = fract(x); float u = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), u); }
float noise(vec2 x) { vec2 i = floor(x); vec2 f = fract(x); float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }

//----------------------------------------------- Screen Space Noise ------------------------------------------------
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


vec3 addStars(vec2 screenSize, vec2 fs_UV)
{
    float time = iTime * 80.0;
    float galaxyClump = (pow(noise(fs_UV.xy * (30.0 * screenSize.x)), 3.0) * 0.5 + pow(noise(100.0 + fs_UV.xy * (15.0 * screenSize.x)), 5.0)) / 3.5;
    
    vec3 starColor = vec3(galaxyClump * pow(hash(fs_UV.xy), 1500.0) * 80.0);

    starColor.x *= sqrt(noise(fs_UV.xy) * 1.2);
    starColor.y *= sqrt(noise(fs_UV.xy * 4.0));

    vec2 delta = (fs_UV.xy - screenSize.xy * 0.5) * screenSize.y * 1.2;  
    float radialNoise = mix(1.0, noise(normalize(delta) * 20.0 + time * 0.5), 0.12);

    float att = 0.057 * pow(max(0.0, 1.0 - (length(delta) - 0.9) / 0.9), 8.0);

    starColor += radialNoise * min(1.0, att);

    float randSeed = rand(fs_UV);

    return starColor *  (( sin(randSeed + randSeed * time* 0.05) + 1.0)* 0.4 + 0.2);
}

vec3 calBackground(vec2 fs_UV)
{
   float DayOfTime = fract(iTime / 12.0);

   vec3 dawn = mix(dawnCol, dawnCol2, fs_UV.y);
   vec3 midDay = mix(midDayCol, midDayCol2, fs_UV.y);


   float couldH = texture(iChannel3, vec2(fs_UV.x - iTime * 0.1 , fs_UV.y )).x;
    
   vec4 clouds = vec4(vec3(couldH), 1.0);

   float cloudAlpha = clouds.x * (pow(fs_UV.y, 4.0));  

   midDay = mix(midDay, clouds.xyz, cloudAlpha);

   vec3 tw = mix(twilightCol, twilightCol2, fs_UV.y);

   vec4 twclouds = clouds;
   tw = mix(tw, twclouds.xyz * vec3(1.0, 0.7, 0.2), cloudAlpha );

   vec3 midNight = mix(midNightCol, midNightCol2, fs_UV.y);

   midNight += mix(vec3(0.0), addStars(iResolution.xy, fs_UV), fs_UV.y + 0.5);

   if(DayOfTime < 0.0625)
   {
       return mix(midNight, dawn, DayOfTime / 0.0625);
   }
   else if(DayOfTime < 0.125)
   {
       return dawn;
   }
   else if(DayOfTime < 0.1875)
   {
       return mix(dawn, midDay, (DayOfTime - 0.125) / 0.0625);
   }
   else if(DayOfTime < 0.5)
   {
       return midDay;
   }
   else if(DayOfTime < 0.5625)
   {
       return mix(midDay, tw, (DayOfTime - 0.5) / 0.0625);
   }
   else if(DayOfTime < 0.625)
   {
        return tw;
   }
   else if(DayOfTime < 0.6875)
   {
       return mix(tw, midNight, (DayOfTime - 0.625) / 0.0625);
   }
   else
   {
       return midNight;
   }
}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

//----------------------------------------------- Basic SDF ------------------------------------------------
//From iq's website
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec2 opU( vec2 d1, vec2 d2 )
{
	return d1.x >= d2.x ?  d2 : d1;
}

vec2 opsU( vec2 d1, vec2 d2, float k )
{
    return vec2(smin(d1.x, d2.x, k), d1.x > d2.x ?  d2.y : d1.y);
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdEllipsoid( in vec3 p, in vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float sdCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec3 Blend_Thorn(vec3 q, float k)
{
	//Bend
	float c = cos(k*q.y);
    float s = sin(k*q.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(q.x, m*q.yz);    
}

vec3 Blend_ThornZ(vec3 q, float k)
{
	//Bend
	float c = cos(k*q.y);
    float s = sin(k*q.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*q.xy, q.z);    
}

vec2 boundingSphere( in vec4 sph, in vec3 ro, in vec3 rd )
{
    vec3 oc = ro - sph.xyz;
    
	float b = dot(oc,rd);
	float c = dot(oc,oc) - sph.w*sph.w;
    float h = b*b - c;
    
    if( h<0.0 ) return vec2(-1.0);

    h = sqrt( h );

    return -b + vec2(-h,h);
}

//----------------------------------------------- Modeling Duck ------------------------------------------------

vec2 Duck( vec3 p, vec3 ro, vec3 rd )
{

    // bounding sphere
    vec2 dis = boundingSphere( vec4(vec3(0.0), 4.0), ro, rd );

    if(dis.y < 0.0)
    return vec2(1000.0, -1.0);

    float swingSpeed = 10.5;
    float normalSwing = sin(iTime * swingSpeed);

    //Face
    vec3 headPos = p;
    mat4 head_rot = rotationMatrix(vec3(0.0, 0.0, 1.0), sin(iTime * swingSpeed - 0.15) * 0.36);
    headPos = transpose(mat3(head_rot))* headPos;

    vec2 head = vec2( sdEllipsoid(headPos - vec3(0.0, 2.8, 0.0), vec3(0.85)), DUCK_BODY );   

    //eyes
    vec2 leftEye = vec2( sdSphere(headPos - vec3(0.45, 3.0, 0.7), 0.07), POINT_EYE );
    vec2 rightEye = vec2( sdSphere(headPos - vec3(-0.45, 3.0, 0.7), 0.07), POINT_EYE );

    head = opU(head, leftEye);
    head = opU(head, rightEye); 

    //Body
    vec3 bodyPos = p + vec3(0.0, 2.2, 0.0);
    mat4 body_rot = rotationMatrix(vec3(0.0, 0.0, 1.0), normalSwing * 0.1);

    bodyPos = transpose(mat3(body_rot))* bodyPos;
    bodyPos -= vec3(0.0, 2.2, 0.0);
    vec2 body = vec2( sdEllipsoid(bodyPos - vec3(0.0, 0.0, -0.1), vec3(1.3, 1.7, 1.5)), DUCK_BODY );
    
    //Belly
    mat4 rot_02 = rotationMatrix(vec3(1.0, 0.0, 0.0), DEGREE_60 );
    vec3 q_02 = transpose(mat3(rot_02))* (bodyPos - vec3(0.0, -0.3, -1.43));
    q_02 = Blend_Thorn(q_02, 0.2);

    vec2 belly = vec2( sdEllipsoid(q_02, vec3(1.6, 2.6, 1.5)) , DUCK_BODY );

    //LeftWing_00
    mat4 rot_le00 = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_95 );
    mat4 rot_le01 = rotationMatrix(vec3(0.0, 1.0, 0.0), -DEGREE_85 ) * rot_le00;
    mat4 rot_le02 = rotationMatrix(vec3(1.0, 0.0, 0.0), -DEGREE_17 ) * rot_le01;
    vec3 le_00 = transpose(mat3(rot_le02))* (bodyPos - vec3( 1.4, 0.2, -1.1));
    le_00 = Blend_Thorn(le_00, -0.1);
    le_00 = Blend_ThornZ(le_00 - vec3(0.0, 0.0, 0.0), 0.2);
    vec2 leftWing00 = vec2( sdEllipsoid(le_00 , vec3(0.6, 1.7, 0.3)), DUCK_BODY );

    //LeftWing_01
    mat4 rot_le10 = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_85 );
    mat4 rot_le11 = rotationMatrix(vec3(0.0, 1.0, 0.0), -DEGREE_85 ) * rot_le10;
    mat4 rot_le12 = rotationMatrix(vec3(1.0, 0.0, 0.0), -DEGREE_17 ) * rot_le11;
    vec3 le_01 = transpose(mat3(rot_le12))* (bodyPos - vec3( 1.45, -0.6, -0.9));
    le_01 = Blend_Thorn(le_01, -0.2);
    le_01 = Blend_ThornZ(le_01 - vec3(0.0, 0.0, 0.0), 0.2);
    vec2 leftWing01 = vec2( sdEllipsoid(le_01 , vec3(0.4, 1.3333, 0.3)), DUCK_BODY );

    //RightWing_00
    mat4 rot_re01 = rotationMatrix(vec3(0.0, 1.0, 0.0), DEGREE_85 ) * rot_le00;
    mat4 rot_re02 = rotationMatrix(vec3(1.0, 0.0, 0.0), -DEGREE_17 ) * rot_re01;
    vec3 re_00 = transpose(mat3(rot_re02))* (bodyPos - vec3( -1.4, 0.2, -0.9));
    re_00 = Blend_Thorn(re_00, -0.15);
    re_00 = Blend_ThornZ(re_00 - vec3(0.0, 0.0, 0.0), 0.2);
    vec2 rightWing00 = vec2( sdEllipsoid(re_00 , vec3(0.6, 1.7, 0.3)), DUCK_BODY );

    //RightWing_01
    //mat4 rot_re10 = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_TO_RAD * 85.0 );
    mat4 rot_re11 = rotationMatrix(vec3(0.0, 1.0, 0.0), DEGREE_85 ) * rot_le10;
    mat4 rot_re12 = rotationMatrix(vec3(1.0, 0.0, 0.0), -DEGREE_17 ) * rot_re11;
    vec3 re_01 = transpose(mat3(rot_re12))* (bodyPos - vec3( -1.45, -0.6, -0.8));
    re_01 = Blend_Thorn(re_01, -0.2);
    re_01 = Blend_ThornZ(re_01 - vec3(0.0, 0.0, 0.0), 0.2);
    vec2 rightWing01 = vec2( sdEllipsoid(re_01 , vec3(0.4, 1.3333, 0.3)), DUCK_BODY );

    vec3 tailPos = p + vec3(0.0, 2.2, 0.0);
    mat4 tail_rot = rotationMatrix(vec3(0.0, 0.0, 1.0), sin(iTime * swingSpeed - 1.57) * 0.15);

    tailPos = transpose(mat3(tail_rot))* tailPos;

    tailPos -= vec3(0.0, 2.2, 0.0);

    mat4 rot_tail = rotationMatrix(vec3(1.0, 0.0, 0.0), DEGREE_37_5);
    tailPos = transpose(mat3(rot_tail))* (tailPos - vec3(0.0, 1.9, -2.9));
    vec2 tail = vec2( sdEllipsoid(tailPos, vec3(0.1, 0.3, 0.1)) , DUCK_BODY);

    body = opsU(body, belly, 0.2);
    body = opsU(body, tail, 0.7);    

    body = opU(body, leftWing00);
    body = opU(body, leftWing01);    
    body = opU(body, rightWing00);    
    body = opU(body, rightWing01);

    float legSeed = fract((iTime* swingSpeed) / TwoPi);

    float rightlegSwing = -sin(   pow (fract( iTime* swingSpeed / (TwoPi)) , 2.0 ) * (TwoPi) );
    

    //RightLeg
    vec3 legPos = p - vec3(0.0, -2.0, -0.5);
    vec3 rightLegPos = legPos - vec3(-0.75, 1.5, 0.0);

    mat4 rightLeg_rot = rotationMatrix(vec3(1.0, 0.0, 0.0), rightlegSwing * 1.1 + 0.1);

    rightLegPos = transpose(mat3(rightLeg_rot))* rightLegPos;
    rightLegPos += vec3(0.0, 1.5, 0.0);

    mat4 rot_rightLeg = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_7_5 );
    vec3 riLeg = transpose(mat3(rot_rightLeg))* rightLegPos;
    vec2 rightLeg =  vec2( sdCylinder( riLeg, vec2(0.1, 0.4) ), DUCK_FOOT);

    mat4 rot_rightfoot00 = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_90 );
    rot_rightfoot00 = rotationMatrix(vec3(0.0, 1.0, 0.0), DEGREE_17_5 ) * rot_rightfoot00;
    rot_rightfoot00 = rotationMatrix(vec3(1.0, 0.0, 0.0), max(-rightlegSwing , 0.0) ) * rot_rightfoot00;

    vec3 rf_00 = transpose(mat3(rot_rightfoot00))* (rightLegPos - vec3(-0.1, -0.5, 0.0)  );
    vec3 rf_01 = Blend_Thorn(rf_00, 1.7);

    vec2 rightFoot01 = vec2( sdEllipsoid(rf_01, vec3(0.1, 1.0, 0.3)), DUCK_FOOT );
    vec2 rightFoot02 = vec2( sdEllipsoid(rf_00 - vec3(0.0, 0.0, 0.8), vec3(0.1, 0.1, 0.4)), DUCK_FOOT );

    vec2 rightFoot = opsU(rightFoot01, rightFoot02, 0.5);
    rightLeg = opsU(rightLeg, rightFoot, 0.3);


    float leftlegSwing = -sin( pow (fract( (iTime* swingSpeed + PI) / (TwoPi)) , 2.0 ) * (TwoPi) );


    //LeftLeg    
    vec3 leftLegPos = legPos - vec3(0.75, 1.5, 0.0);

    mat4 leftLeg_rot = rotationMatrix(vec3(1.0, 0.0, 0.0), leftlegSwing * 1.1 + 0.1);

    leftLegPos = transpose(mat3(leftLeg_rot))* leftLegPos;
    leftLegPos += vec3(0.0, 1.5, 0.0);

    mat4 rot_leftLeg = rotationMatrix(vec3(0.0, 0.0, 1.0), -DEGREE_7_5 );
    vec3 leLeg = transpose(mat3(rot_leftLeg))* leftLegPos;
    vec2 leftLeg =  vec2( sdCylinder( leLeg, vec2(0.1, 0.4) ), DUCK_FOOT);

    mat4 rot_leftfoot00 = rotationMatrix(vec3(0.0, 0.0, 1.0), DEGREE_90 );
    rot_leftfoot00 = rotationMatrix(vec3(0.0, 1.0, 0.0), -DEGREE_17_5 ) * rot_leftfoot00;
    rot_leftfoot00 = rotationMatrix(vec3(1.0, 0.0, 0.0), max(-leftlegSwing, 0.0) ) * rot_leftfoot00;

    vec3 lf_00 = transpose(mat3(rot_leftfoot00))* (leftLegPos - vec3(0.1, -0.5, 0.0)  );
    vec3 lf_01 = Blend_Thorn(lf_00, 1.7);

    vec2 leftFoot01 = vec2( sdEllipsoid(lf_01, vec3(0.1, 1.0, 0.3)), DUCK_FOOT );
    vec2 leftFoot02 = vec2( sdEllipsoid(lf_00 - vec3(0.0, 0.0, 0.8), vec3(0.1, 0.1, 0.4)), DUCK_FOOT );

    vec2 leftFoot = opsU(leftFoot01, leftFoot02, 0.5);
    leftLeg = opsU(leftLeg, leftFoot, 0.3);


    //peak
    vec3 peakPos = headPos - vec3(0.0, 2.6, 0.8);
    vec2 peak_Body = vec2( sdEllipsoid(peakPos, vec3(0.6, 0.1, 0.5)), PEAK );
    vec2 peak_Up = vec2( sdEllipsoid(peakPos - vec3(0.0, 0.15, 0.015), vec3(0.1, 0.1, 0.2)), PEAK );
    vec2 peak = opsU(peak_Body, peak_Up, 0.45);

    //shadow
    vec3 shadowPos = p - vec3(0.0, -2.6, -0.5);
    vec2 shdowBody = vec2( sdEllipsoid(shadowPos - vec3(normalSwing * 0.3, 0.0, -0.25), vec3(0.9, 0.05, 1.2)), DUCK_SHADOW );
    vec2 shdowLeft = vec2( sdEllipsoid(shadowPos - vec3(0.9 + leftlegSwing*0.3, 0.0, 0.2 + leftlegSwing * 1.5), vec3(0.5, 0.03, 0.5)), DUCK_SHADOW );
    vec2 shdowRight = vec2( sdEllipsoid(shadowPos - vec3(-0.9 - rightlegSwing*0.3, 0.0, 0.2 + rightlegSwing * 1.5), vec3(0.5, 0.03, 0.5)), DUCK_SHADOW );
    
    vec2 result = head;
    result = opsU(result, body, 1.5);    
    result = opU(result, peak);
    
    result = opsU(result, rightLeg, 0.2);
    result = opsU(result, leftLeg, 0.2);
       
    result = opU(result, shdowBody);
    result = opU(result, shdowLeft);
    result = opU(result, shdowRight);  
    
    return result;
}

//----------------------------------------------- Modeling Land ------------------------------------------------

vec2 stage( vec3 p, vec3 ro, vec3 rd)
{
  // bounding sphere
  vec2 dis = boundingSphere( vec4(vec3(0.0), 41.0), ro, rd );

  if(dis.y < 0.0)
   return vec2(1000.0, -1.0);
  
  return vec2( sdSphere( p, 40.0 ), PLANE);

}

//----------------------------------------------- Modeling Sun and Moon ------------------------------------------------

vec2 SunMoon( vec3 p, vec3 ro, vec3 rd)
{
    vec3 center = p; 

    mat4 rot = rotationMatrix(vec3(0.0, 0.0, 1.0), fract( (iTime - 4.0) / 12.0) * TwoPi );
    vec3 sun = transpose(mat3(rot))* (center );
    sun -= vec3(0.0, 50.0, 0.0);

    vec3 moon = sun + vec3(0.0, 100.0, 0.0);
    mat4 rotMoon = rotationMatrix(vec3(0.0, 1.0, 0.0), -DEGREE_90 );
    moon = transpose(mat3(rotMoon))* (moon );
    moon = Blend_Thorn(moon, 0.7);

    return opU( vec2( sdSphere( sun, 2.0 ), SUN), vec2( sdEllipsoid( moon, vec3(1.0, 2.6, 1.0) ), MOON));
}

//----------------------------------------------- Unioning SDF ------------------------------------------------

vec2 SDF( vec3 p, vec3 ro, vec3 rd )
{
  vec2 result;

  float upDown = sin(iTime * 0.00173) * 0.5;

  vec3 pos = p;

  result = Duck(pos, ro, rd);
    
  if(PUREDUCK < 0.5)
  {
      result = opU(result, stage(p - vec3(0.0, -42.8, 0.0), ro, rd));
      result = opU(result, SunMoon(p - vec3(0.0, -42.8, -10.0), ro, rd));      
  }
    
  return result;
}


mat3 setCamera( in vec3 ro, in vec3 rt, in float cr )
{
    vec3 cw = normalize(rt-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, -cw );
}

vec3 getSurfaceNormal(vec3 endPoint, float epsilonParam, vec3 ro, vec3 rd)
{
	float epsilon = epsilonParam;

	vec2 e = vec2(1.0,-1.0)*0.5773*epsilon;
	return normalize( e.xyy*SDF( endPoint + e.xyy, ro, rd).x + 
					  e.yyx*SDF( endPoint + e.yyx, ro, rd).x + 
					  e.yxy*SDF( endPoint + e.yxy, ro, rd).x + 
					  e.xxx*SDF( endPoint + e.xxx, ro, rd).x );
}

float getAO(vec3 endPoint, vec3 normal)
{
	float stepLen = 0.12;
	float AO = 0.0;
    float att = 1.0;

    float offset = 0.02;
   
    for( int i=0; i<5; i++ )
    {
        float dist = offset + stepLen*float(i)/4.0;
        vec3 newEndpoint =  normal * dist + endPoint;
        vec2 VAL = SDF( newEndpoint, endPoint, normal );

        float gap = (dist - VAL.x);
        AO += gap*att;        

        att *= 0.95;
    }

	return 1.0 - clamp(3.5 * AO, 0.0, 1.0);
}


vec4 rayMarching(vec3 viewVec, vec3 eyePos, out bool isHit, out vec3 normal, float epsilon, out float AO)
{
	isHit = false;
	float depth = 0.1;

	int count = 0;

	vec3 endPoint;

	float radius = 1.0;
	vec3 c = vec3(10.0);

	const int maxRayStep = 128;

	for(int i=0; i<maxRayStep; i++)
	{
		endPoint = eyePos + depth * viewVec;

		vec2 result = SDF( endPoint, eyePos, viewVec);

		float dist = result.x;

		if(dist < epsilon * depth) 
		{
			isHit = true;       

			normal = getSurfaceNormal(endPoint, epsilon, eyePos, viewVec);
			AO = getAO(endPoint, normal);

			return vec4(endPoint, result.y);
		}

		depth += dist * STEP_SIZE_SCALER;// + epsilon * log(float(i) + 1.0);

		if(depth >= MAX_RAYDISTANCE)
		{			
			return vec4(endPoint, -1.0);
		}
	}

	return vec4(endPoint, -1.0);
}

void getSurfaceColor(in float materialFator, vec3 endPoint, out vec4 BasicColor, out float Roughness, float NoV, vec3 backgroundColor )
{
	if(materialFator < 0.0)
	{
		BasicColor = vec4(0.0);
		Roughness = 1.0;
	}    
	else if( materialFator < PLANE + 0.5)
	{
            vec3 rotatedPoint = vec3(endPoint);

            rotatedPoint.z += iTime * 10.5;

            vec2 UV = vec2(rotatedPoint.x, rotatedPoint.z);

            BasicColor = mix( texture(iChannel1, UV * 0.2), texture(iChannel2, UV * 0.3),  noise(UV) + 0.1 );

            if(NoV < 0.3)
                BasicColor = mix(vec4(backgroundColor, 1.0), BasicColor, NoV * 10.0 / 3.0);

            float DayOfTime = fract(iTime / 12.0);            
            
            if(DayOfTime < 0.0625)
            {
                 BasicColor.xyz *= mix(0.2, 1.0, DayOfTime / 0.0625);
            }
            else if( 0.625 <= DayOfTime && DayOfTime < 0.6875)
            {
                BasicColor.xyz *= mix(1.0, 0.2, (DayOfTime - 0.625) / 0.0625);
            }
            else if( 0.6875 <= DayOfTime )
            {
                BasicColor.xyz *= 0.2;
            }
            
            Roughness = 0.05;        
	}
    else if( materialFator < DUCK_SHADOW + 0.5)
	{
		BasicColor = vec4(0.15, 0.15, 0.15, 1.0);
		Roughness = 1.0;
	}
    else if( materialFator < POINT_EYE + 0.5)
	{
		BasicColor = vec4(0.0, 0.0, 0.0, 1.0);
		Roughness = 0.7;
	}
    else if( materialFator < PEAK + 0.5)
	{
		BasicColor = vec4(1.0, 1.0, 0.0, 1.0);
		Roughness = 0.3;
	}
    else if( materialFator < DUCK_FOOT + 0.5)
	{
		BasicColor = vec4(1.0, 0.5, 0.0, 1.0);
		Roughness = 0.3;
	}
    else if( materialFator < DUCK_BODY + 0.5)
    {
        BasicColor = vec4(1.0, 1.0, 1.0, 1.0);
		Roughness = 0.9;
    } 
    else if( materialFator < SUN + 0.5)
    {
        BasicColor = vec4(1.0, 0.7, 0.0, 1.0);
		Roughness = 0.9;
    } 
    else if( materialFator < MOON + 0.5)
    {
        BasicColor = vec4(1.0, 1.0, 0.0, 1.0);
		Roughness = 0.9;
    }   

    BasicColor = clamp(BasicColor, 0.0, 1.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    vec2  p = (-iResolution.xy+2.0*fragCoord.xy)/iResolution.y;
    vec2  q = fragCoord.xy/iResolution.xy;
    vec3  ro = vec3(-3.7, 2.83528, 12.453);
    vec3  ta = vec3(0.0,0.0,0.0);
    mat3  ca = setCamera( ro, ta, 0.0 );
    vec3  rd = normalize( ca * vec3(p,-1.8) );
    
    float epsilon = 2.0/(iResolution.y) * 0.25;

	bool isHit = false;

	vec3 normalVec;
	float AO = 0.0;
    
    vec4 endPoint = rayMarching(rd, ro, isHit, normalVec, epsilon, AO);
    
    float materialFator = endPoint.w;

		
	vec4 BasicColor = vec4(1.0, 0.5, 0.0, 1.0);
	float Roughness;

    float NoV = dot(normalVec, -rd);
    
    vec3 backgroundColor;
    
    if(PUREDUCK < 0.5)
    	backgroundColor = calBackground(uv);
    else
        backgroundColor = vec3(0.0);    
    
    getSurfaceColor(materialFator, endPoint.xyz, BasicColor, Roughness, NoV, backgroundColor);
	
    vec3 color = backgroundColor;
    
    if(materialFator > 0.0)
    {
        //ToonShading
        //edge
        if( ( materialFator > POINT_EYE - 0.5 )  &&  (NoV < 0.4 || AO < 0.3) )
        {
            color = vec3(0.0);
        }
        else
        {
            color = BasicColor.xyz;
        }
    }
    // Output to screen
    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
