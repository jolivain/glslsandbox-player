/*
 * Original shader from: https://www.shadertoy.com/view/MdGfWm
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


#define mul(a,b) ((b)*(a))
#define saturate(a) clamp(a,0.0,1.0)

struct ObjectData
{
    float     distance;
    float     materialId;
    mat4      world2LocalMatrix;
};

#define Degree2Raduis(a) ((a) * 3.1415926 / 180.0)
#define Raduis2Degree(a) ((a) * 180.0 / 3.1415926)

float max2(vec2 a)
{
    return max(a.x,a.y);
}

float min2(vec2 a)
{
    return min(a.x,a.y);
}

float max3(vec3 a)
{
    return max(a.x,max(a.y,a.z));
}

float min3(vec3 a)
{
    return min(a.x,min(a.y,a.z));
}

float max4(vec4 a)
{
    return max(a.x,max(a.y,max(a.z,a.w)));
}

float min4(vec4 a)
{
    return min(a.x,min(a.y,min(a.z,a.w)));
}

vec3 RGBtoHSV(vec3 arg1)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 P = mix(vec4(arg1.bg, K.wz), vec4(arg1.gb, K.xy), step(arg1.b, arg1.g));
    vec4 Q = mix(vec4(P.xyw, arg1.r), vec4(arg1.r, P.yzx), step(P.x, arg1.r));
    float D = Q.x - min(Q.w, Q.y);
    float E = 1e-10;
    return vec3(abs(Q.z + (Q.w - Q.y) / (6.0 * D + E)), D / (Q.x + E), Q.x);
}

vec3 HSVtoRGB(vec3 arg1)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 P = abs(fract(arg1.xxx + K.xyz) * 6.0 - K.www);
    return arg1.z * mix(K.xxx, clamp(P - K.xxx,0.0,1.0), arg1.y);
}

void sincos(float a,out float si,out float co)
{
    si = sin(a);
    co = cos(a);
}

mat3 FromEuler(vec3 ang) 
{   
    vec2 a1,a2,a3;
    sincos(Degree2Raduis(ang.x),a1.x,a1.y);
    sincos(Degree2Raduis(ang.y),a2.x,a2.y);
    sincos(Degree2Raduis(ang.z),a3.x,a3.y);

    mat3 m;
    m[0] = vec3(a3.y*a2.y,-a3.x*a2.y,a2.x);
    m[1] = vec3(a3.x*a1.y + a1.x*a2.x*a3.y,a3.y*a1.y - a1.x*a2.x*a3.x,-a1.x*a2.y);
    m[2] = vec3(a1.x*a3.x - a1.y*a2.x*a3.y,a3.y*a1.x + a1.y*a2.x*a3.x,a1.y*a2.y);
    return m;
}

vec3 RotateEuler(vec3 p,vec3 ang,vec3 scale)
{   
    mat3 rot = FromEuler(ang);
    rot[0] *= 1.0/scale.x;
    rot[1] *= 1.0/scale.y;
    rot[2] *= 1.0/scale.z;

    return mul(rot,p);
}

vec3 RotateEuler(vec3 p,vec3 ang)
{
    return mul(FromEuler(ang),p);
}

mat3 SetCamera(vec3 ro,vec3 ta)
{
    vec3 rz = normalize(ta - ro);
    vec3 p = vec3(0.0, 1.0, 0.0);
    vec3 rx = normalize(cross(rz,p));
    vec3 ry = normalize(cross(rz,rx));

    return mat3(-rx,ry,rz);
}

//Union
float OpU(float o1,float o2)
{
    return min(o1,o2);
}

//Smooth Union
float OpSU(float o1,float o2,float k)
{
    float h = clamp( 0.5+0.5*(o2-o1) / k, 0.0, 1.0 );
    return mix( o2, o1, h ) - k*h*(1.0-h);
}

//Smooth Intersection
float OpSI(float o1,float o2,float k)
{
    return -OpSU(-o1,-o2,k);
}

//subtract
float OpS(float o1,float o2)
{
    return max(o1,-o2);
}

//Intersection
float OpI(float o1,float o2)
{   
    return max(o1,o2);
}

//Union
vec2 OpU2(vec2 o1,vec2 o2)
{
    return o1.x < o2.x ? o1 : o2;
}

ObjectData OpU_OD(ObjectData o1,ObjectData o2)
{
    if(o1.distance < o2.distance)
    {
        return o1;
    }
    return o2;
}

float sdSphere(vec3 p,float r)
{
    return length(p) - r;
}

float sdEllipsoid( vec3 p, vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float sdCone3( vec3 p,vec2 h)
{
    float apy = p.y;
    float st = (apy + h.y) / (h.y*2.0);

    st = smoothstep(0.0,h.y,apy);

    float  d = p.y;
    d = clamp(d,-h.y,h.y);
    p.y -= d;
    return (length(p) - h.x * mix(0.0,1.0,st))* 0.8;
}


mat4 trs(vec3 translate,vec3 angle,vec3 scale)
{
    mat3 rot = FromEuler(angle);
    mat4 mat;

    rot[0] *= 1.0/scale.x;
    rot[1] *= 1.0/scale.y;
    rot[2] *= 1.0/scale.z;

    mat[0] = vec4(rot[0],translate.x);
    mat[1] = vec4(rot[1],translate.y);
    mat[2] = vec4(rot[2],translate.z);
    mat[3] = vec4(0.0,0.0,0.0,1.0);

    return mat;
}

vec3 mulMat(mat4 mat,vec3 p)
{
    vec4 p2 = mul(mat,vec4(p.xyz,1.0));
    return p2.xyz;
}

ObjectData createObject(float d,float m,mat4 w2l)
{
    ObjectData od;
    od.distance = d;
    od.materialId = m;
    od.world2LocalMatrix = w2l;

    return od;
}

ObjectData createObject(float d,float m)
{
    mat4 w2l;
    w2l[0] = vec4(1.0,0.0,0.0,0.0);
    w2l[1] = vec4(0.0,1.0,0.0,0.0);
    w2l[2] = vec4(0.0,0.0,1.0,0.0);
    w2l[3] = vec4(0.0,0.0,0.0,1.0);
    
    return createObject(d,m,w2l);
}

ObjectData SlimeObjective(vec3 p)
{
    vec3 rotate = vec3(0.0,0.0,0.0);
    mat4 w2l = trs(vec3(0.0,0.0,0.0),rotate,vec3(2.1,1.0,2.1));

    vec3 localPos = mulMat(w2l,p);

    vec3 p1 = localPos;
    vec3 offset = vec3(0.0);
    offset.x = 0.05*sin(iTime*10.0/2.0)*((0.8 - localPos.y)/0.8);
    offset.y = 0.2*sin(iTime*10.0)*((0.8 - localPos.y)/0.8);
    offset.z = offset.x;
    p1 += offset;

    vec3 p2 = p1 + vec3(0.049,-0.25,-0.11);
    vec3 p3 = p1 + vec3(-0.049,-0.25,-0.11);

    vec3 o1 = localPos;
    vec3 o2 = localPos;

    o1.y += 1.7*sin(o1.x/8.0);
    o1.y += sin(iTime*10.0)*0.01;
    o1.x += cos(iTime*10.0)*0.01;

    vec3 p4 = o1 + offset + vec3(0.049,-0.24,-0.16);
    vec3 p5 = o1 + offset + vec3(-0.049,-0.24,-0.16);
    vec3 p6 = o2 + offset + vec3(0.0,-0.4,-0.18);

    p6.y += 5.0*pow(p6.x,2.0);
    p6.y -= offset.y*0.2;

    ObjectData obj1_0 = createObject(sdCone3(p1,vec2(0.2,0.4)),11.0,w2l);
    ObjectData obj2_0 = createObject(sdSphere(p2,0.05),3.0,w2l);
    ObjectData obj2_1 = createObject(sdSphere(p3,0.05),3.0,w2l);
    ObjectData obj3_0 = createObject(sdSphere(p4,0.02),10.0,w2l);
    ObjectData obj3_1 = createObject(sdSphere(p5,0.02),10.0,w2l);
    ObjectData obj4_1 = createObject(sdEllipsoid(p6,vec3(0.1,0.05,0.04)),12.0,w2l);

    ObjectData obj = obj1_0;
    obj4_1.distance = OpI(obj.distance,obj4_1.distance);
    obj = OpU_OD(obj,obj4_1);
    obj = OpU_OD(obj,obj2_0);
    obj = OpU_OD(obj,obj2_1);
    obj = OpU_OD(obj,obj3_0);
    obj = OpU_OD(obj,obj3_1);

    return obj;
}


ObjectData ObjectsGroup(vec3 p)
{   
    ObjectData slime = SlimeObjective(p);
    return slime;
}

#define RAYMARCH_STEP_NUM 256
ObjectData Raymarching(vec3 ro, vec3 rd)
{
    float tmin = 1.0;
    float tmax = 10.0;
    
    float t = tmin;
    float m = -1.0;
    float n = 0.5e-8;
    mat4 w2l;

    for( int i = 0; i < RAYMARCH_STEP_NUM; i++ )
    {
        float precis = n*t;
        ObjectData res = ObjectsGroup( ro + rd*t );
        if( res.distance < precis || t > tmax ) break;
        t += res.distance;
        m = res.materialId;
        w2l = res.world2LocalMatrix;
    }

    if(t > tmax) m = -1.0;

    ObjectData data = createObject(t,m,w2l);

    return data;
}

vec3 CalcNormal(vec3 pos)
{
    vec3 eps = vec3( 0.0005, 0.0, 0.0 );
    vec3 nor = vec3(
        ObjectsGroup(pos+eps.xyy).distance - ObjectsGroup(pos-eps.xyy).distance,
        ObjectsGroup(pos+eps.yxy).distance - ObjectsGroup(pos-eps.yxy).distance,
        ObjectsGroup(pos+eps.yyx).distance - ObjectsGroup(pos-eps.yyx).distance );

    return normalize(nor);
}

vec4 RenderMaterial0(vec3 localPos,vec3 position,vec3 normal,vec3 lightDir,vec3 viewDir,vec3 diffuseColor,float shadow)
{
    float aa = 1.0 - saturate(pow(1.0 - max(0.0,dot(normal,viewDir)),16.0));

    return vec4(diffuseColor,1.0);
}

vec4 RenderMaterial4(vec3 localPos,vec3 position,vec3 normal,vec3 lightDir,vec3 viewDir,vec3 diffuseColor,float shadow)
{
    viewDir = normalize(viewDir);
    
    float ndl = dot(normal,lightDir)*0.5+0.5;

    float rampSmooth = 0.005;
    float threshold1 = 0.5;
    float threshold2 = 0.2;
    float rampThresholdBlend = 0.7;
    float spec = 0.6;

    float ramp1 = smoothstep(threshold1 - rampSmooth, threshold1,ndl);
    float ramp2 = smoothstep(threshold2 - rampSmooth, threshold2,ndl);

    float ramp = mix(0.0,mix(mix(threshold2,threshold1,rampThresholdBlend) ,1.0,ramp1),ramp2);


    vec3 diffuseHsv = RGBtoHSV(diffuseColor);
    vec3 shadowHsv = RGBtoHSV(vec3(0.1,0.3,0.3));

    diffuseColor = HSVtoRGB(vec3(diffuseHsv.rg,mix(shadowHsv.b,diffuseHsv.b,ramp)));

    vec3 ref = reflect(lightDir,normal);

    float rdv = max(0.0,dot(ref,-viewDir));
    float specular = smoothstep(spec - rampSmooth,spec,pow(rdv,35.0));

    float aa = 1.0 - saturate(pow(1.0 - max(0.0,dot(normal,viewDir)),16.0));

    float outline = smoothstep(0.09,0.18,pow(max(0.0,dot(normal,viewDir)*0.9+0.1),1.4478));

    vec3 finalColor = mix(vec3(0.0,0.0,0.0),diffuseColor + 0.15*specular,outline);

    return vec4(finalColor*max(shadow,0.4),aa);
}

vec4 RenderMaterial6(vec3 localPos,vec3 position,vec3 normal,vec3 lightDir,vec3 viewDir,vec3 diffuseColor,float shadow)
{
    viewDir = normalize(viewDir);
    
    float ndl = dot(normal,lightDir)*0.5+0.5;

    float rampSmooth = 0.005;
    float threshold1 = 0.5;
    float threshold2 = 0.2;
    float rampThresholdBlend = 0.7;
    float spec = 0.2;

    float ramp1 = smoothstep(threshold1 - rampSmooth, threshold1,ndl);
    float ramp2 = smoothstep(threshold2 - rampSmooth, threshold2,ndl);

    float ramp = mix(0.0,mix(mix(threshold2,threshold1,rampThresholdBlend) ,1.0,ramp1),ramp2);


    vec3 diffuseHsv = RGBtoHSV(diffuseColor);
    vec3 shadowHsv = RGBtoHSV(vec3(0.03,0.03,0.05));

    diffuseColor = HSVtoRGB(vec3(diffuseHsv.rg,mix(shadowHsv.b,diffuseHsv.b,ramp)));

    vec3 ref = reflect(lightDir,normal);

    float rdv = max(0.0,dot(ref,-viewDir));
    float specular = smoothstep(spec - rampSmooth,spec,pow(rdv,6.0));

    float aa = 1.0 - saturate(pow(1.0 - max(0.0,dot(normal,viewDir)),16.0));

    float outline = smoothstep(0.09,0.18,pow(max(0.0,dot(normal,viewDir)*0.9+0.1),1.4478));

    vec3 finalColor = mix(vec3(0.0,0.0,0.0),diffuseColor + specular,outline);

    return vec4(finalColor*max(shadow,0.4),aa);
}

vec4 RenderMaterial7(vec3 localPos,vec3 position,vec3 normal,vec3 lightDir,vec3 viewDir,vec3 diffuseColor,float shadow)
{
    viewDir = normalize(viewDir);
    float aa = 1.0 - saturate(pow(1.0 - max(0.0,dot(normal,viewDir)),16.0));

    float rim = smoothstep(0.8 - 0.01,0.8,pow(max(0.0,dot(normal,viewDir)*0.72+0.28),1.4478));

    vec3 finalColor = mix(vec3(0,0,0),diffuseColor,rim);

    return vec4(finalColor*max(shadow,0.4),aa);
}

vec4 Render(vec3 orgPos,vec3 rayDir)
{
    vec4 color = vec4(0,0,0,0) ;

    ObjectData result = Raymarching(orgPos, rayDir);
    float  dist = result.distance;
    float  material = result.materialId;

    if(material >= 0.0)
    {
        mat4 w2l = result.world2LocalMatrix;
        vec3 position = orgPos + rayDir * dist;
        vec3 normal = CalcNormal(position);
        vec3 lightDir = normalize(vec3(-1.9,-0.7,0.75));
        vec3 diffColor = vec3(1,1,1);
        vec3 uViewDir = -rayDir * dist;
        vec3 localPos = mulMat(w2l,position);
        float  shadow = 1.2;

        mat4 w2l_2nd;
        w2l_2nd[0]=vec4(1,0,0,w2l[0].w);
        w2l_2nd[1]=vec4(0,1,0,w2l[1].w);
        w2l_2nd[2]=vec4(0,0,1,w2l[2].w);
        w2l_2nd[3]=vec4(0,0,0,1);
        

        vec3 localPos_2nd = mulMat(w2l_2nd,position);


        if(material == 3.0)
        {
            diffColor = vec3(1,1,1);
            color = RenderMaterial0(localPos,position,normal,lightDir,uViewDir,diffColor,shadow);   
        }
        else if(material == 10.0)
        {
            diffColor = vec3(0,0,0);
            color = RenderMaterial6(localPos,position,normal,lightDir,uViewDir,diffColor,shadow);   
        }
        else if(material == 11.0)
        {
            diffColor = vec3(0,0.248,0.5);
            color = RenderMaterial4(localPos,position,normal,lightDir,uViewDir,diffColor,shadow);   
        }
        else if(material == 12.0)
        {
            diffColor = vec3(1,0.1,0.1);
            color = RenderMaterial7(localPos,position,normal,lightDir,uViewDir,diffColor,shadow);   
        }
    }

    return color;
}

vec3 pow3(vec3 a,float b)
{
    return vec3(pow(a.x,b),pow(a.y,b),pow(a.z,b));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 canvasPos = fragCoord / iResolution.xy;
    vec2 screenSize = iResolution.xy;
    vec2 pos = canvasPos * screenSize;
    vec2 orgPos = canvasPos * 2.0 - 1.0;
    orgPos.y *= screenSize.y/screenSize.x;

    vec3 cameraPos = vec3(0,0,3);
    vec3 lookAtPos = vec3(0,0,0);

    mat3 cameraMatrix = SetCamera(cameraPos,lookAtPos);

    vec3 rayDir = mul(cameraMatrix,normalize(vec3(orgPos,1)));

    vec4 skyBox = mix(vec4(1,1,1,1),vec4(0,0.3,1,1),pow(canvasPos.y,0.4));

    vec4 color = Render(cameraPos,rayDir);

    vec4 finialColor = vec4(mix(skyBox.rgb,color.rgb,color.a),skyBox.a);
    finialColor.rgb = pow3(finialColor.rgb,1.1) + 0.55 * finialColor.rgb;
    fragColor = finialColor;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
