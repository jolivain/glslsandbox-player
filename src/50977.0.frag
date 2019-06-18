/*
 * Original shader from: https://www.shadertoy.com/view/3dfGzr
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define FARCLIP 100.0
#define NEARCLIP 0.001
#define EPSILON 0.001
#define MARCHSTEPS 500

#define NO_MATERIAL 0
#define MATERIAL_DEFAULT 1
#define MATERIAL_CHEESE 2
#define MATERIAL_PLATE 3
#define MATERIAL_KNIFE 4
#define SSS_STEPS 30

struct Material
{
    int type;
};

const vec4 kAmbientColor = vec4(0.0);
const vec3 kDirLight = vec3(0.23253024,0.4140824,-0.21309763);

float mapScene(vec3 p, out Material material);

void opRotate(inout vec2 v, float r)
{
    float c = cos(r);
    float s = sin(r);
    float vx = v.x * c - v.y * s;
    float vy = v.x * s + v.y * c;
    v.x = vx;
    v.y = vy;
}

vec3 opNormal(in vec3 p)
{
    Material material;
    vec2 e = vec2(0.0, EPSILON);
    return normalize(vec3(
        mapScene(p + e.yxx, material) - mapScene(p - e.yxx, material),
        mapScene(p + e.xyx, material) - mapScene(p - e.xyx, material),
        mapScene(p + e.xxy, material) - mapScene(p - e.xxy, material)
    ));
}

vec3 opRepeate(in vec3 p, in vec3 c)
{
    return mod(p,c)-0.5*c;
}

float opDisp(vec3 p)
{
    return sin(20.0*p.x)*sin(20.0*p.y)*sin(20.0*p.z);
}


// iq's sdf functions :3
float sdBox(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);
}

float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}

float sdRoundedCylinder( vec3 p, float ra, float rb, float h )
{
    vec2 d = vec2( length(p.xz)-2.0*ra+rb, abs(p.y) - h );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float opUnion(float a, float b, in Material matA, in Material matB, out Material mat)
{
    if (a < b) 
    {
        mat = matA;
        return a;
    }
    mat = matB;
    return b;
}

// MAP 
float mapCheese(in vec3 p, out Material material)
{
    float value = 0.0;
    opRotate(p.xz, 0.5);
    
    // base shape
    float cyl0 = sdRoundedCylinder(p, 0.30, 0.04, 0.3);
    vec3 triP0 = p + vec3(0.0, 0.0, -0.2);
    opRotate(triP0.zy, -3.14/2.0);
    float tri0 = sdTriPrism(triP0, vec2(.8, 0.4)) - 0.001;
    material.type = MATERIAL_CHEESE;
    value = max(tri0, cyl0);
    
    // holes
    vec3 holesP = p + vec3(-0.1119641, -0.6300012, 0.1603024);
    holesP = opRepeate(holesP, vec3(0.45));
    float sp = sdSphere(holesP, 0.12);
    sp += opDisp(p * 0.3) * 0.15;
    value = max(-sp, value);
    
    //cut
    vec3 cutP = p + vec3(0.0, 0.0, 0.62);
    opRotate(cutP.xz, -0.4);
    opRotate(cutP.yz, -0.2);
    cutP = opRepeate(cutP, vec3(0.09, 0.01, 0.0));
    float ct = sdSphere(cutP, 0.07);
    
    value = max(-ct, value);
    
    return value;
}

float mapPlate(in vec3 p, out Material material)
{
    material.type = MATERIAL_PLATE;
    float base = sdBox(p, vec3(0.8, -0.001, 0.8)) - 0.1;
    float handle = sdBox(p + vec3(-1.0, 0.0, 0.0), vec3(0.5, 0.0, 0.04 * sin(-0.1 + -p.x * 2.0))) - 0.1;
    return min(base, handle);
}

float mapKnife(in vec3 p, out Material material)
{
    material.type = MATERIAL_KNIFE;
    
    p*=0.6;
    float handle = sdCappedCylinder(p, vec2(0.0, 0.24)) - abs(0.05 * cos(0.2 +p.y * -4.0));
    float blade = sdBox(p + vec3(0.05, -0.6, 0.0), vec3(0.1 * sqrt(abs(cos(p.y * 1.57))), 0.4, 0.002));
    return min(handle, blade);
}

float mapScene(vec3 p, out Material material)
{
    if (iMouse.z > 0.0)
    {
		opRotate(p.xz, (iMouse.x / iResolution.x - 0.5) * -6.28);
        opRotate(p.yz, (iMouse.y / iResolution.y - 0.5) * -1.25);
    }
    else
    {
        opRotate(p.xz, sin(iTime) * 0.03 * 3.14);
    }
    Material cheeseMaterial;
    Material plateMaterial;
    Material knifeMaterial;
    p = p + vec3(0.2, 0.0, 0.0);
    vec3 cheeseP = p + vec3(0.3, 0.0, -0.1);
    vec3 plateP = p + vec3(0.0, 0.456, 0.0);
    vec3 knifeP = p + vec3(-0.7742586, 0.2902968, -0.11406922);
    
    opRotate(knifeP.yz, 3.14/2.0+0.015);
    opRotate(knifeP.xy, -3.14/4.0);
    opRotate(knifeP.xz, -0.28);
    float cheese = mapCheese(cheeseP, cheeseMaterial);
    float plate = mapPlate(plateP, plateMaterial);
    float knife = mapKnife(knifeP, knifeMaterial);
    
    return opUnion(knife, opUnion(cheese, plate, cheeseMaterial, plateMaterial, material), knifeMaterial, material, material);
}

float rayMarch(in vec3 ro, in vec3 rd, out Material material)
{
    float total = NEARCLIP;
    
    for (int i = 0; i < MARCHSTEPS; ++i)
    {
        float dist = mapScene(ro + rd * total, material);
        if (dist < EPSILON)
        {
            return total;
        }
        total += dist * 0.7;
        if (total > FARCLIP) break;
    }
    
    return FARCLIP;
}

float opSSS(in vec3 ro, in vec3 rd, in vec3 n, float dist, float factor)
{
    Material material;
    float value = 0.0;
    vec3 nrd = refract(rd, n, 1.0);
    float s = 1.0;
    #if __VERSION__ == 100
    const int steps = SSS_STEPS;
    #else
    int steps = int(factor);
    #endif
    for (int i = 0; i < steps; ++i)
    {
        float stepSize = (float(i) / float(steps));
        float d = mapScene(ro + nrd * stepSize, material);
        value += (stepSize - d) * s;
        s *= 0.6;
    }
    value = pow(value, 0.2);
    value = clamp(abs(1.0 - value), 0.0, 1.0000001);
    return value;
}

vec3 opReflection(float dist, in vec3 p, in vec3 dir, in vec3 n)
{
    vec3 color = vec3(0.1);
    vec3 rd = normalize(reflect(dir, n));
    float ft = max(0.0, dot(rd, n));
    Material material;
    float d = 0.0;
        
    for (int i = 0; i < 50; ++i)
    {
        float x = mapScene(p + rd * d, material);
        if (dist < EPSILON)
        {
            break;
        }
        d += x*1.2;
        if (d > FARCLIP) break;
    }
   
    if (d < FARCLIP && ft > 0.0)
    {
        vec3 hitPoint = p + rd * d;
        vec3 n = opNormal(hitPoint);
        vec3 nld = normalize(kDirLight);
        vec3 h = normalize(n + nld);
        float diff = max(0.0, dot(n, nld));
        
        if (material.type == MATERIAL_CHEESE)
        {
            float sss = opSSS(hitPoint, nld, n, dist, 80.0);
            
            color = (vec3(0.9,0.5,0.) + kAmbientColor.rgb) * 0.5; 
            color += diff * vec3(0.5);
            color += sss * ((vec3(1.5) + kAmbientColor.rgb * 5.8) * 0.7);
        }
        else if (material.type == MATERIAL_PLATE)
        {
            color = (vec3(0.9,0.9,0.9) + kAmbientColor.rgb) * 0.5; 
            color += diff * vec3(0.89);
        }
        else if (material.type == MATERIAL_KNIFE)
        {
            color = (vec3(0.01) + kAmbientColor.rgb) * 0.5;
            color += diff * vec3(0.1);
        }
        return (color) * 0.4;
    }
    return texture(iChannel0, reflect(dir, n)).rgb;
}

float opAO(in vec3 p, in vec3 n)
{
    Material material;
    float value = 0.0;
    float s = 1.0;
    for (int i = 0; i < 3; ++i)
    {
        float stepSize = 0.05;
        float dist = mapScene(p + n * stepSize, material);
        value += (stepSize - dist) * s;
        s *=0.8;
    }
    value = value;
    return clamp(sqrt((0.8 - value) * sqrt(1.0)), -1.0, 1.0);
}

float opShadow(in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
    Material material;
    float res = 1.0;
    float t = mint;
    for( int i=0; i<32; i++ )
    {
        float h = mapScene( ro + rd * t, material );
        res = min( res, 2.0*h/t );
        t += clamp( h, 0.002, 0.010 );
        if( h<0.0001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

vec3 shade(float dist, in vec3 rd, in vec3 p, in Material material)
{
    vec3 n = opNormal(p);
    vec3 l = normalize(kDirLight);
    vec3 h = normalize(l + n);
    vec3 color = vec3(1, 0, 1);
    float ao = opAO(p, n);
    float shadow = opShadow(p, l, 0.01, 10.1);
    float diff = max(0.0, dot(l, n));

    if (material.type == MATERIAL_CHEESE)
    {
        float sss = opSSS(p, l, n, dist, 30.0);
        float spec = pow(max(0.0, dot(l, n)), 4096.0);
        float oc = clamp(shadow, 0.0, 1.0);
        color = (vec3(0.9,0.5,0.) + kAmbientColor.rgb) * 0.5; 
        color += oc * diff * vec3(0.5);
        color += oc * spec * vec3(1.0);
        color += clamp(oc, 0.89,1.0) * sss * ((vec3(1.5)));
        color -= 0.13 * vec3(0.8, 0.8, 0.3) * clamp(1.0 - shadow, 0.0, 1.0);
        color *= pow(ao, 2.1);
    }
    else if (material.type == MATERIAL_PLATE)
    {
        vec3 ref = opReflection(dist, p, rd, n);
        color = (vec3(0.9,0.9,0.9) + kAmbientColor.rgb) * 0.5; 
        color += ref * 0.5;
        color += diff * vec3(0.89);
        color *= pow(ao, 3.2);
        color -= 0.3 *vec3(0.4, 0.4, 0.4) * clamp(1.0 - shadow, 0.0, 1.0);
    }
    else if (material.type == MATERIAL_KNIFE)
    {
        vec3 ref = opReflection(dist, p, rd, n);
        float oc = clamp(shadow, 0.0, 1.0);
        color = (vec3(0.01) + kAmbientColor.rgb) * 0.5;
        color += clamp(ref, 0.0, 1.0) * 1.0;
        color += oc * diff * vec3(0.1);
        color -= 0.3 * vec3(0.4, 0.4, 0.4) * clamp(1.0 - shadow, 0.0, 1.0);
    }
    
    return color;
} 



void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float ar = iResolution.x / iResolution.y;
    vec2 uv = (fragCoord.xy / iResolution.xy - 0.5) * vec2(ar, 1.0);
    vec3 ro = vec3(0.0, 1.1, -2.2);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 color = vec3(0.15);

    opRotate(rd.yz, 0.59);
    
    Material material = Material(NO_MATERIAL);
    float dist = rayMarch(ro, rd, material);
    if (dist < FARCLIP)
    {
        vec3 point = ro + rd * dist;
        color = shade(dist, rd, point, material);
    }
    
    color = pow(color, vec3(1.0/1.2));
    color = mix(color, 1.0 - (color * 10.2), max(0.0, pow(length(1.0 * uv / vec2(ar, 1.0)), 5.9)));
    fragColor = vec4(color, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 1.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
