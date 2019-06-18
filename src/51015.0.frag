/*
 * Original shader from: https://www.shadertoy.com/view/ltyfDd
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

// --------[ Original ShaderToy begins here ]---------- //
#define SPHERE 0
#define PLANE 1
#define NO_INTERSECT 2
#define BOX 3
#define HEX 4
#define SW 5

#define STORY 0.125
#define BUILD_R 0.32
#define MID_SEC 0.1

//Section Heights
#define MAX_S1 8.0
#define MAX_S2 6.0
#define MAX_S3 6.0
    
//Road Mapping
#define SIDEWALK_H 0.001
#define SIDEWALK_W 0.01

#define YELLOW_MIN 0.48
#define YELLOW_MAX 0.49

#define DASH_MIN 0.36
#define DASH_MAX 0.39
#define DASH_LEN 0.03

#define CROSS_MIN 0.25
#define CROSS_MAX 0.35
#define CROSS_LEN 0.08


#define M_PI 3.14159265358979323846264338327950288
//Noise Funcs
//2D func adapted from terrain
float rand_2_1(vec2 v) {
    return fract(sin(v.x * 127.1 + v.y * 311.7) * 43758.5453123);
}
float rand_1_1(float f) {
    return fract(sin(f * 435.23) * 5489.9847);
}
struct PrimitiveDist {
    float dist;
    int primitive; // Can be SPHERE, PLANE, or NO_INTERSECT
};
    
// If you want, you can play around with the textures in iChannels 0 and 1
// The textures should show no distortion
vec3 texCube(sampler2D sam, in vec3 p, in vec3 n )
{
    vec4 x = texture(sam, p.yz);
    vec4 y = texture(sam, p.xz);
    vec4 z = texture(sam, p.xy);
    x *= abs(n.x);
    y *= abs(n.y);
    z *= abs(n.z);
    vec3 projections = vec3(x + y + z);

   return projections;
}

//From TheBookOfShaders Rotation article
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

//http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
mat3 rotate3d(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}


float sdFloor(vec3 p) {
    return p.y;
}

//From http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdHexPrism(vec3 pos, vec2 h)
{
    vec3 p = rotate3d(vec3(1.0, 0.0, 0.0), M_PI/2.0) * pos;
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdBox(vec3 p, vec3 b)
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0);
}

//Compare pd by distance
PrimitiveDist compPD(PrimitiveDist d1, PrimitiveDist d2)
{
    if(d1.dist<d2.dist){
        return d1;
    } else {
        return d2;
    }
}

PrimitiveDist section(vec3 p, float rad, int stories, vec2 id){
    float side = rad*0.75;
    float randForShape = rand_1_1(rand_2_1(id));
    if(randForShape < 0.6){
        float box = sdBox(p, vec3(side, float(stories) * STORY, side));
		PrimitiveDist boxPD = PrimitiveDist(box, BOX);
        
        float randForTower = rand_1_1(rand_1_1(id.x) + rand_1_1(id.y));
        if(randForTower > 0.7){
            float randTower = rand_1_1(randForTower);
            vec3 offsetPos;
            if(randTower < 0.25){
                offsetPos = p + vec3(side * 0.5, 0.0, 0.0);
            } else if((randTower > 0.25) && (randTower < 0.5)) {
                offsetPos = p + vec3(-side * 0.5, 0.0, 0.0);
            } else if((randTower > 0.5) && (randTower < 0.75)) {
                offsetPos = rotate3d(vec3(0.0, 1.0, 0.0), M_PI/2.0) * (p + vec3(0.0, 0.0, side * 0.5));
            } else {
                offsetPos = rotate3d(vec3(0.0, 1.0, 0.0), M_PI/2.0) * (p + vec3(0.0, 0.0, -side * 0.5));
            }
            float tower = sdHexPrism(offsetPos, vec2(side, float(stories) * STORY));
            PrimitiveDist towerPD = PrimitiveDist(tower, HEX);
            return compPD(boxPD, towerPD);
        } else {
            return boxPD;
        }
    } else {
        float hex = sdHexPrism(p, vec2(side, float(stories) * STORY));
		PrimitiveDist hexPD = PrimitiveDist(hex, HEX);
        
        float randForTower = rand_1_1(rand_1_1(id.x) + rand_1_1(id.y));
        if(randForTower > 0.5){
            float randTower = 0.9 * rand_1_1(randForTower); // Scale to make probabilities nicer
            vec3 offsetPos;
            mat3 rot = rotate3d(vec3(0.0, 1.0, 0.0), M_PI/3.0);
            vec3 dir1 = vec3(cos(M_PI/6.0),0.0, sin(M_PI/6.0));
            vec3 dir2 = vec3(cos(M_PI*5.0/6.0),0.0, sin(M_PI*5.0/6.0));
            float mag = side * sqrt(3.0)/2.0;
            if(randTower > 0.5){
                offsetPos = rot * (p + mag * dir1);
            } else if((randTower > 0.15) && (randTower < 0.3)) {
                offsetPos = rot * (p + mag * -dir1);
            } else if((randTower > 0.3) && (randTower < 0.45)) {
                offsetPos = rot * (p + mag * dir2);
            } else if((randTower > 0.45) && (randTower < 0.6)){
                offsetPos = rot * (p + mag * -dir2);
            } else if((randTower > 0.6) && (randTower < 0.75)){
                offsetPos = p + mag * vec3(0.0, 0.0, 1.0);
            } else {
                offsetPos = p - mag * vec3(0.0, 0.0, 1.0);
            }
    		float tower = sdBox(offsetPos, vec3(side * 0.5, float(stories) * STORY, side * 0.5));
            PrimitiveDist towerPD = PrimitiveDist(tower, BOX);
            return compPD(hexPD, towerPD);
        } else {
            return hexPD;
        }
    }
}

PrimitiveDist building(vec3 p){
    vec2 block = floor(p.xz);
    vec3 blockPos = vec3(fract(p.x) - 0.5, p.y, fract(p.z)- 0.5);
    float randSections = rand_2_1(block);
    
    float sf1 = 2.0 + floor(rand_1_1(randSections) * MAX_S1);
    PrimitiveDist s1 = section(blockPos, BUILD_R, int(sf1), block);
    PrimitiveDist outSh = s1;
    if(randSections > 0.25) {
        //2nd section
        float sf2 = 2.0 + floor(rand_1_1(sf1) * MAX_S2);
        PrimitiveDist s2 = section(blockPos + vec3(0.0, -sf1 * STORY, 0.0), 0.5 * BUILD_R, int(sf2), 2.0 * block);
        outSh = compPD(outSh, s2);
        //Third section
        if(randSections > 0.40){
            float sf3 = 2.0 + floor(rand_1_1(sf2) * MAX_S3);
            PrimitiveDist s3 = section(blockPos + vec3(0.0, -(sf1 + sf2 )* STORY, 0.0), 0.25 * BUILD_R, int(sf3), 3.0 * block);
            outSh = compPD(outSh, s3);
        }
    }
    float sideWalk = sdBox(blockPos, vec3(BUILD_R, SIDEWALK_H, BUILD_R));
    PrimitiveDist sw = PrimitiveDist(sideWalk, SW);
    return compPD(outSh, sw);
}


PrimitiveDist map(vec3 p) {
	PrimitiveDist building = building(p);
    float plane = sdFloor(p);
    PrimitiveDist outSh = building;
    outSh = compPD(outSh, PrimitiveDist(plane, 1));
    return outSh;
}
// TODO [Task 4] Calculate surface normals
const float epsilon = 0.001;
vec2 e = vec2(epsilon, 0.0); // For swizzling
vec3 calcNormal(vec3 p) {
    float xCom = map(p + e.xyy).dist - map(p - e.xyy).dist;
    float yCom = map(p + e.yxy).dist - map(p - e.yxy).dist;
    float zCom = map(p + e.yyx).dist - map(p - e.yyx).dist;

    return normalize(vec3(xCom, yCom, zCom));
//    return normalize(vec3(0.5));

}
float shadow(vec3 ro, vec3 rd, float k) {
    float marchDist = 0.001;
    float boundingVolume = 25.0;
    float darkness = 1.0;
    float threshold = 0.001;

    for(int i = 0; i < 30; i++) {
        if(marchDist > boundingVolume) continue;
        float h = map(ro + rd * marchDist).dist;
        // TODO [Task 7] Modify the loop to implement soft shadows
        darkness = min(darkness, k*h/marchDist);
        marchDist += h * 0.7;
    }
    return darkness;
}
PrimitiveDist raymarch(vec3 ro, vec3 rd) {

    // Fill in parameters
    float marchDist = 0.001;
    float boundingDist = 50.0;
    float threshold = 0.001;

    // Fill in the iteration count
    for (int i = 0; i < 1000; i++) {
        // Fill in loop body
        vec3 currPos = ro + rd*(marchDist);
        PrimitiveDist dist2Geo = map(currPos);

        if(dist2Geo.dist < threshold){
            return PrimitiveDist(marchDist, dist2Geo.primitive);
        }if(marchDist > boundingDist){
            return PrimitiveDist(-1.0, NO_INTERSECT);

        }
        marchDist += dist2Geo.dist*0.1;
    }

    return PrimitiveDist(-1.0, NO_INTERSECT);
}

vec3 roadColor(vec3 blockPos){
    vec3 material = vec3(0.0);
    if(abs(blockPos.x) > CROSS_MIN && abs(blockPos).z > CROSS_MIN) {
        //Intersections
        if(abs(blockPos.x) > CROSS_MIN && abs(blockPos.x) < CROSS_MAX){
            //Crosswalk
            material = vec3(0.8, 0.8, 0.8);
            float linePos = fract((blockPos.z + 0.5)/CROSS_LEN);
            if(linePos < 0.5 && 
               !(abs(blockPos.z) > CROSS_MIN && abs(blockPos.z) < CROSS_MAX)){
                material = vec3(0.8, 0.8, 0.8);
            } else {
                material = vec3(0.2, 0.2, 0.2);
            }                                                            
        } else if(abs(blockPos.z) > CROSS_MIN && abs(blockPos.z) < CROSS_MAX){
            //Crosswalk
            material = vec3(0.8, 0.8, 0.8);
            float linePos = fract((blockPos.x + 0.5)/CROSS_LEN);
            if(linePos < 0.5 &&
              !(abs(blockPos.x) > CROSS_MIN && abs(blockPos.x) < CROSS_MAX)){
                material = vec3(0.8, 0.8, 0.8);
            } else {
                material = vec3(0.2, 0.2, 0.2);
            } 
        }else {
            material = vec3(0.2, 0.2, 0.2);
        }
    }else if(abs(blockPos.x) > DASH_MIN && abs(blockPos.x) < DASH_MAX){
        //White Dashes
        float linePos = fract((blockPos.z + 0.5)/DASH_LEN);
        if(linePos < 0.5){
            material = vec3(0.8, 0.8, 0.8);
        } else {
            material = vec3(0.2, 0.2, 0.2);
        } 
    } else if(abs(blockPos.z) > DASH_MIN && abs(blockPos.z) < DASH_MAX){
        //White Dashes
        float linePos = fract((blockPos.x + 0.5)/DASH_LEN);
        if(linePos < 0.5){
            material = vec3(0.8, 0.8, 0.8);
        } else {
            material = vec3(0.2, 0.2, 0.2);
        }
    } else if((abs(blockPos.z) > YELLOW_MIN && abs(blockPos.z) < YELLOW_MAX)||
              (abs(blockPos.x) > YELLOW_MIN  && abs(blockPos.x)< YELLOW_MAX)){
        //Yellow Line(s)
        material = vec3(0.8, 0.6, 0.2);
    } else {
        material = vec3(0.2, 0.2, 0.2);
    }
    return material;
}
vec3 texCol(vec2 uv, vec2 id){
    float r1 = rand_2_1(id);
    float g1 = rand_1_1(r1);
    float b1 = rand_1_1(g1);
    
    float r2 = rand_1_1(b1);
    float g2 = rand_1_1(r2);
    float b2 = rand_1_1(g2);
    
    vec3 colFrom = vec3(0.4, 0.4, 0.4);
    vec3 colTo = vec3(1.0, 0.6, 0.5);
    vec3 col1 = colFrom + colTo*vec3(r1, g1, b1);
    vec3 col2 = colFrom + colTo*vec3(r2, g2, b2);
    if(uv.y < 0.333){
        return col1;
    } else if (uv.y < 0.999 && uv.y > 0.666){
        return col1;
    } else if(uv.x > 0.333 && uv.x < 0.666){
        return vec3(0.2, 0.2, 0.2);
    } else {
        return col2;
    }
}
//We assume a STORYxSTORY texMap
vec3 buildTex(vec3 pos, vec2 id, vec3 nor){
    vec2 uv;
    vec3 dir1 = vec3(cos(M_PI/6.0),0.0, sin(M_PI/6.0));
    vec3 dir2 = vec3(cos(M_PI*5.0/6.0),0.0, sin(M_PI*5.0/6.0)); 
    
    if(nor == vec3(0.0, 1.0, 0.0)){
        return vec3(0.1, 0.4, 0.8);
    }
    //CubeGriding
    
    else if (abs(nor) == vec3(1.0, 0.0, 0.0)){
        float yFr = fract(pos.y/STORY);
        float zFr = fract(pos.z/STORY);
        uv = vec2(zFr, yFr);
    }else if (abs(nor) == vec3(0.0, 0.0, 1.0)){
        float yFr = fract(pos.y/STORY);
        float xFr = fract(pos.x/STORY);
        uv = vec2(xFr, yFr);
    }
    //ExtraChecks for Hex
    else if (length(nor - dir1) < 0.001 || length(-nor - dir1) < 0.001){
        vec2 posRot = rotate2d(-M_PI/3.0) * vec2(pos.x, pos.z);
        float yFr = fract(pos.y/STORY);
        float xFr = fract(posRot.x/STORY);
        float zFr = fract(posRot.y/STORY);
        uv = vec2(xFr, yFr);
    } else if (length(nor - dir2) < 0.001 || length(-nor - dir2) < 0.001){
        vec2 posRot = rotate2d(M_PI/3.0) * vec2(pos.x, pos.z);
        float yFr = fract(pos.y/STORY);
        float xFr = fract(posRot.x/STORY);
        float zFr = fract(posRot.y/STORY);
        uv = vec2(xFr, yFr);
    }
    return texCol(uv, id);
}
vec3 render(vec3 ro, vec3 rd, float t, int which) {

    // Col is the final color of the current pixel.
    vec3 col = vec3(0.);
    vec3 pos = ro + rd * t;
    // Light vector
    vec3 lig = normalize(vec3(1.0,0.6,0.5));

    // Normal vector
    vec3 nor = calcNormal(pos);

    // Ambient
    float ambient = 0.1;
    // Diffuse
    float diffuse = clamp(dot(nor, lig), 0.0, 1.0);
    // Specular
    float shineness = 32.0;
    float specular = pow(clamp(dot(rd, reflect(lig, nor)), 0.0, 1.0), 32.0);

    float darkness = shadow(pos, lig, 18.0);
    // Applying the phong lighting model to the pixel.
    col += vec3(((ambient + diffuse + specular) * darkness));

    // TODO [Task 5] Assign different intersected objects with different materials
    // Make things pretty!
    
    vec2 block = floor(pos.xz);
    vec3 blockPos = vec3(fract(pos.x) - 0.5, pos.y, fract(pos.z)- 0.5);
    
    vec3 material = vec3(0.0);
    if (which == PLANE) {
        material = roadColor(blockPos);
    } else if (which == SW){
        material = vec3(0.8, 0.8, 0.6);
    } else if (which == HEX || which == BOX) {
        material = buildTex(blockPos, block, nor);
    } else {
        material = vec3(0.5);
    }
    // Blend the material color with the original color.
    col = mix(col, material, 0.4);
    return col;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec3 rayOrigin = vec3(3.0 * sin(iTime * .3), 2.8, 3.0 * cos(iTime * .3));

    float focalLength = 2.0;

    // The target we are looking at
    vec3 target = vec3(0.0);
    // Look vector
    vec3 look = normalize(rayOrigin - target);
    // Up vector
    vec3 up = vec3(0.0, 1.0, 0.0);

    // Set up camera matrix
    vec3 cameraForward = -look;
    vec3 cameraRight = normalize(cross(cameraForward, up));
    vec3 cameraUp = normalize(cross(cameraRight, cameraForward));

    // TODO [Task 1] Construct the ray direction vector
    vec2 uv = vec2(0.0);
    vec3 rayDirection = vec3(0.0);
    float u = gl_FragCoord.x/iResolution.x;
    float v = gl_FragCoord.y/iResolution.y;
    u= 2.0*u - 1.0;
    v= 2.0*v - 1.0;
    u= u*(iResolution.x/iResolution.y);
    uv = vec2(u, v);

    rayDirection = vec3(uv, focalLength);

    cameraRight *= rayDirection.x;
    cameraUp *= rayDirection.y;
    cameraForward *= rayDirection.z;
    rayDirection = normalize(cameraRight + cameraUp + cameraForward);

    PrimitiveDist rayMarchResult = raymarch(rayOrigin, rayDirection);
    vec3 col = vec3(0.0);
    if (rayMarchResult.primitive != NO_INTERSECT) {
        col = render(rayOrigin, rayDirection, rayMarchResult.dist, rayMarchResult.primitive);
    }
    fragColor = vec4(col, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
