#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


// Yet Another Christmas Tree by Ruslan Shestopalyuk, 2014/15
// Many thanks to iq, eiffie and paolofalcao for the insight and the code

#define PI                      3.14159265

#define NORMAL_EPS              0.001

#define NEAR_CLIP_PLANE         1.0
#define FAR_CLIP_PLANE          100.0
#define MAX_RAYCAST_STEPS       200
#define STEP_DAMPING 0.7
#define DIST_EPSILON            0.001
#define MAX_RAY_BOUNCES         3.0

#define GLOBAL_LIGHT_COLOR      vec3(0.8,1.0,0.9)
#define SPEC_COLOR              vec3(0.8, 0.90, 0.60)
#define MINERS_LIGHT_OFFSET      vec3(-0.2, -0.1, -0.3)
#define BACKGROUND_COLOR        vec3(0.3, 0.342, 0.5)

#define CAM_DIST                13.5
#define CAM_H                   3.0
#define CAM_FOV_FACTOR 2.5
#define LOOK_AT_H               4.5
#define LOOK_AT                 vec3(0.0, LOOK_AT_H, 0.0)

#define MTL_BACKGROUND          -1.0
#define MTL_GROUND              1.0
#define MTL_NEEDLE              2.0
#define MTL_STEM                3.0
#define MTL_TOP_DEC             4.0
#define MTL_DEC_BINDING         5.0
#define MTL_DEC                 6.0

#define DEC_REFL_FACTOR         0.7

#define TREE_H                  4.0
#define TREE_R                  3.0
#define DEC_R                   0.5
#define V_DEC_SPACING           1.9
#define STAR_SCALE              0.5

#define NEEDLE_LENGTH           0.35
#define NEEDLE_SPACING          0.15
#define NEEDLE_THICKNESS        0.05
#define NEEDLES_RADIAL_NUM      17.0
#define NEEDLE_BEND             0.99
#define NEEDLE_TWIST            1.0
#define NEEDLE_GAIN             0.7
#define STEM_THICKNESS          0.02
#define BRANCH_ANGLE            0.423
#define BRANCH_SPACING          1.7

// Primitives
float plane(vec3 p, vec3 n, float offs) {
  return dot(p, n) + offs;
}

float sphere(vec3 p, float r) {
    return length(p) - r;
}

float cone(in vec3 p, float r, float h) {
    return max(abs(p.y) - h, length(p.xz)) - r*clamp(h - abs(p.y), 0.0, h);
}


float cylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float torus(vec3 p, float ri, float ro) {
    vec2 q = vec2(length(p.xz) - ri, p.y);
    return length(q) - ro;
}


// Boolean operations
float diff(float d1, float d2) {
    return max(-d2, d1);
}

float add(float d1, float d2) {
    return min(d2, d1);
}

float intersect(float d1, float d2) {
    return max(d2, d1);
}


// Boolean operations (with material ID in second component)
void diff(inout vec2 d1, in vec2 d2) {
    if (-d2.x > d1.x) {
        d1.x = -d2.x;
        d1.y = d2.y;
    }
}

void add(inout vec2 d1, in vec2 d2) {
    if (d2.x < d1.x) d1 = d2;
}

void intersect(inout vec2 d1, in vec2 d2) {
    if (d1.x < d2.x) d1 = d2;
}


// Affine transformations
vec3 translate(vec3 p, vec3 d) {
    return p - d;
}

vec2 rotate(vec2 p, float ang) {
    float c = cos(ang), s = sin(ang);
    return vec2(p.x*c-p.y*s, p.x*s+p.y*c);
}


//  Repetition
float repeat(float coord, float spacing) {
    return mod(coord, spacing) - spacing*0.5;
}

vec3 repeatAng(vec2 p, float n) {
    float ang = 2.0*PI/n;
    vec2 ret = rotate(p, -ang*0.5);
    float sector = floor(atan(ret.x, ret.y)/ang);
    p = rotate(p, sector*ang);
    return vec3(p.x, p.y, sector);
}

//  Complex primitives
float star(vec3 p) {
    p.xy = (repeatAng(p.xy, 5.0)).xy;
    p.xz = abs(p.xz);
    return plane(p, vec3(0.5, 0.25, 0.8), -0.09);
}

//  Scene elements
vec2 ground(in vec3 p) {
    p.y += (sin(sin(p.z*0.1253) - p.x*0.371)*0.31 + cos(p.z*0.553 + sin(p.x*0.127))*0.12)*1.7 + 0.2;
    return vec2(p.y, MTL_GROUND);
}

vec2 decoration(in vec3 pos, float matID) {
    float decType = mod(matID, 5.0);
    float d = sphere(pos, DEC_R);
    if (decType <= 0.0) {
        // bumped sphere
        d += cos(atan(pos.x, pos.z)*30.0)*0.01*(0.5 - pos.y) + sin(pos.y*60.0)*0.01;
    } else if (decType <= 1.0) {
        // dented sphere
        d = diff(d, sphere(pos + vec3(0.0, 0.0, -0.9), 0.7));
    } else if (decType <= 2.0) {
        // horisontally distorted sphere
        d  += cos(pos.y*28.0)*0.01;
    } else if (decType <= 3.0) {
        // vertically distorted sphere
        d += cos(atan(pos.x, pos.z)*20.0)*0.01*(0.5-pos.y);
    }

    vec2 res = vec2(d, matID);
    // binding
    float binding = cylinder(pos - vec3(0.0, 0.5, 0.0), vec2(0.08, 0.1));
    binding = add(binding, torus(pos.xzy - vec3(0.0, 0.0, 0.62), 0.05, 0.015));
    vec2 b = vec2(binding, MTL_DEC_BINDING);
    add(res, b);
    return res;
}


vec2 decorations(in vec3 p) {
    vec3 pos = p;
    float h = abs(-floor(pos.y/V_DEC_SPACING)/TREE_H + 1.0)*TREE_R;
    vec3 r = repeatAng(pos.xz, max(1.0, 2.5*h));
    float matID = h*113.0 + r.z*7.0 + 55.0;
    // pick the material ID
    pos.y -= mod(matID, 11.0)*0.03;
    pos.xz = r.xy;
    pos.y = mod(pos.y, V_DEC_SPACING) - 0.5;
    pos += vec3(0.0, 0.0, -h + 0.2);
    vec2 res = decoration(pos, matID);
    res.x = intersect(res.x, sphere(p, TREE_H*2.0 - 0.5));
    return res;
}


vec2 topDecoration(vec3 pos) {
    pos.y -= TREE_H*2.0 + 0.8;
    pos *= STAR_SCALE;
    float d = add(star(pos), cylinder(pos - vec3(0.0, -0.2, 0.0), vec2(0.04, 0.1)))/STAR_SCALE;
    return vec2(d, MTL_TOP_DEC);
}


float needles(in vec3 p) {
    p.xy = rotate(p.xy, -length(p.xz)*NEEDLE_TWIST);
    p.xy = repeatAng(p.xy, NEEDLES_RADIAL_NUM).xy;
    p.yz = rotate(p.yz, -NEEDLE_BEND);
    p.y -= p.z*NEEDLE_GAIN;
    p.z = min(p.z, 0.0);
    p.z = repeat(p.z, NEEDLE_SPACING);
    return cone(p, NEEDLE_THICKNESS, NEEDLE_LENGTH);
}

vec2 branch(in vec3 p) {
    vec2 res = vec2(needles(p), MTL_NEEDLE);
    float s = cylinder(p.xzy + vec3(0.0, 100.0, 0.0), vec2(STEM_THICKNESS, 100.0));
    vec2 stem = vec2(s, MTL_STEM);
    add(res, stem);
    return res;
}

vec2 halfTree(vec3 p) {
    float section = floor(p.y/BRANCH_SPACING);
    float numBranches =  max(2.0, 9.0 - section*1.2);
    p.xz = repeatAng(p.xz, numBranches).xy;
    p.z -= TREE_R*1.27;
    p.yz = rotate(p.yz, BRANCH_ANGLE);
    p.y = repeat(p.y, BRANCH_SPACING);
    return branch(p);
}


vec2 tree(vec3 p) {
    vec2 res = halfTree(p);
    // repeat it again, to hide the regularity
    p.xz = rotate(p.xz, 0.7);
    p.y -= BRANCH_SPACING*0.4;
    vec2 t1 = halfTree(p);
    add(res, t1);

    // trunk    
    vec2 trunk = vec2(cone(p.xyz, 0.02, TREE_H*2.0), MTL_STEM);
    add(res, trunk);
    res.x = intersect(res.x, sphere(p - vec3(0.0, TREE_H, 0.0), TREE_H + 1.7));
    return res;
}

vec2 distf(in vec3 pos) {
    vec2 tr = tree(pos);
    vec2 tdec = topDecoration(pos);
    vec2 dec = decorations(pos);
    vec2 res = ground(pos);
    add(res, tr);
    add(res, tdec);
    add(res, dec);
    return res;
}

vec3 calcNormal(in vec3 p)
{
    vec2 d = vec2(NORMAL_EPS, 0.0);
    return normalize(vec3(
        distf(p + d.xyy).x - distf(p - d.xyy).x,
        distf(p + d.yxy).x - distf(p - d.yxy).x,
        distf(p + d.yyx).x - distf(p - d.yyx).x));
}


vec2 rayMarch(in vec3 ro, in vec3 rd) {
    float t = NEAR_CLIP_PLANE;
    float m = MTL_BACKGROUND;
    for (int i=0; i < MAX_RAYCAST_STEPS; i++) {
        vec2 res = distf(ro + rd*t);
        if (res.x< DIST_EPSILON || t>FAR_CLIP_PLANE) break;
        t += res.x*STEP_DAMPING;
        m = res.y;
    }

    if (t > FAR_CLIP_PLANE) m = MTL_BACKGROUND;
    return vec2(t, m);
}


vec3 applyFog(vec3 col, float dist) {
    return mix(col, BACKGROUND_COLOR, 1.0 - exp(-0.001*dist*dist));
}


vec3 getMaterialColor(float matID) {
    vec3 col = BACKGROUND_COLOR;
    if (matID <= MTL_GROUND) col = vec3(3.3, 3.3, 4.5);
    else if (matID <= MTL_NEEDLE) col = vec3(0.152,0.36,0.18);
    else if (matID <= MTL_STEM) col = vec3(0.79,0.51,0.066);
    else if (matID <= MTL_TOP_DEC) col = vec3(1.6,1.0,0.6);
    else if (matID <= MTL_DEC_BINDING) col = vec3(1.2,1.0,0.8);
    else col = 0.3 + 0.7*sin(vec3(0.7, 0.4, 0.41)*(matID - MTL_DEC));
    return col;
}


float shadow( in vec3 ro, in vec3 rd, in float tmin, in float tmax) {
    float res = 1.0;
    float t = tmin;
    for (int i = 0; i < MAX_RAYCAST_STEPS; i++) {
        float h = distf( ro + rd*t ).x*STEP_DAMPING;
        res = min(res, 8.0*h/t);
        t += clamp(h, 0.01, 0.25);
        if (h < DIST_EPSILON || t > tmax) break;
    }

    return clamp(res, 0.0, 1.0);
}


vec3 render(in vec3 ro, in vec3 rd) {
    vec3  lig = normalize(-rd + MINERS_LIGHT_OFFSET);
    vec3 resCol = vec3(0.0);
    float alpha = 1.0;
    for (float i = 0.0; i < MAX_RAY_BOUNCES; i++) {
        vec2 res = rayMarch(ro, rd);
        float t = res.x;
        float mtlID = res.y;
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);
        vec3 ref = reflect(rd, nor);
        vec3 mtlColor = getMaterialColor(mtlID);
        float ambient = 0.03;
        float diffuse = clamp(dot(nor, lig), 0.0, 1.0);
        float specular = pow(clamp( dot(ref, lig), 0.0, 1.0), 10.0);
        diffuse *= shadow(pos, lig, 0.01, 1.0);
        vec3 col = mtlColor*(ambient + GLOBAL_LIGHT_COLOR*(diffuse + 1.20*specular*SPEC_COLOR));
        col = applyFog(col, t);
        //  blend in (a possibly reflected) new color 
        resCol += col*alpha;
        if (mtlID <= MTL_DEC) break;
        ro = pos + ref*DIST_EPSILON;
        alpha *= DEC_REFL_FACTOR;
        rd = ref;
    }

    return vec3(clamp(resCol, 0.0, 1.0));
}


vec3 getRayDir(vec3 camPos, vec3 viewDir, vec2 pixelPos) {
    vec3 camRight = normalize(cross(viewDir, vec3(0.0, 1.0, 0.0)));
    vec3 camUp = normalize(cross(camRight, viewDir));
    return normalize(pixelPos.x*camRight + pixelPos.y*camUp + CAM_FOV_FACTOR*viewDir);
}


void main(void) {
    vec2 q = gl_FragCoord.xy/resolution;
    vec2 p = -1.0+2.0*q;
    p.x *= resolution.x/resolution.y;
    float ang = 0.1*(40.0 + time);
    vec3 camPos = vec3(CAM_DIST*cos(ang), CAM_H, CAM_DIST*sin(ang));
    vec3 rayDir = getRayDir(camPos,normalize(LOOK_AT - camPos), p);
    vec3 color = render(camPos, rayDir);
    gl_FragColor=vec4(color, 1.0);
}




