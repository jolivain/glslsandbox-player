/*
 * Original shader from: https://www.shadertoy.com/view/4sVfWw
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.;
vec3  iResolution = vec3(0.);
const vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define HASHSCALE3 vec3(.1031, .1030, .0973)

#define detail 5
#define steps 300
#define time iTime*0.5
#define maxdistance 30.0

//#define drawgrid
#define fog
//#define borders
#define blackborders
//#define raymarchhybrid 100
#define objects
#define emptycells 0.5
#define subdivisions 0.95 //should be higher than emptycells

#define rot(spin) mat2(cos(spin),sin(spin),-sin(spin),cos(spin))

#define sqr(a) (a*a)

//random function from https://www.shadertoy.com/view/MlsXDf
float rnd(vec4 v) { return fract(4e4*sin(dot(v,vec4(13.46,41.74,-73.36,14.24))+17.34)); }

//hash function by Dave_Hoskins https://www.shadertoy.com/view/4djSRW
vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * HASHSCALE3);
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

//0 is empty, 1 is subdivide and 2 is full
int getvoxel(vec3 p, float size) {
#ifdef objects
    if (p.x==0.0&&p.y==0.0) {
        return 0;
    }
#endif
    
    float val = rnd(vec4(p,size));
    
    if (val < emptycells) {
        return 0;
    } else if (val < subdivisions) {
        return 1;
    } else {
        return 2;
    }
    
    return int(val*val*3.0);
}

//ray-cube intersection, on the inside of the cube
vec3 voxel(vec3 ro, vec3 rd, vec3 ird, float size)
{
    size *= 0.5;
    
    vec3 hit = -(sign(rd)*(ro-size)-size)*ird;
    
    return hit;
}

float map(vec3 p, vec3 fp) {
    p -= 0.5;
    
    vec3 flipping = floor(hash33(fp)+0.5)*2.0-1.0;
    
    p *= flipping;
    
    vec2 q = vec2(abs(length(p.xy-0.5)-0.5),p.z);
    float len = length(q);
    q = vec2(abs(length(p.yz-vec2(-0.5,0.5))-0.5),p.x);
    len = min(len,length(q));
    q = vec2(abs(length(p.xz+0.5)-0.5),p.y);
    len = min(len,length(q));
    
    
    return len-0.1666;
}

vec3 findnormal(vec3 p, float epsilon, vec3 fp)
{
    vec2 eps = vec2(0,epsilon);
    
    vec3 normal = vec3(
        map(p+eps.yxx,fp)-map(p-eps.yxx,fp),
        map(p+eps.xyx,fp)-map(p-eps.xyx,fp),
        map(p+eps.xxy,fp)-map(p-eps.xxy,fp));
    return normalize(normal);
}

void mainImage( out vec4 fragColor,  vec2 fragCoord )
{
    
    fragColor = vec4(0.0);
    vec2 uv = (fragCoord.xy * 2.0 - iResolution.xy) /iResolution.y;
    float size = 1.0;
    
    vec3 ro = vec3(0.5+sin(time)*0.4,0.5+cos(time)*0.4,time);
    vec3 rd = normalize(vec3(uv,1.0));
    
    //if the mouse is in the bottom left corner, don't rotate the camera
    if (length(iMouse.xy) > 40.0) {
    	rd.yz *= rot(iMouse.y/iResolution.y*3.14-3.14*0.5);
    	rd.xz *= rot(iMouse.x/iResolution.x*3.14*2.0-3.14);
    }
    
    vec3 lro = mod(ro,size);
    vec3 fro = ro-lro;
    vec3 ird = 1.0/max(abs(rd),0.001);
    vec3 mask = vec3(0.0);
    bool exitoct = false;
    int recursions = 0;
    float dist = 0.0;
    float fdist = 0.0;
    int ii = 0;
    float edge = 1.0;
    vec3 lastmask = vec3(0.0);
    vec3 normal = vec3(0.0);

    //the octree traverser loop
    //each iteration i either:
    // - check if i need to go up a level
    // - check if i need to go down a level
    // - check if i hit a cube
    // - go one step forward if octree cell is empty
    // - repeat if i did not hit a cube
    for (int i = 0; i < steps; i++)
    {
        if (dist > maxdistance) break;
        
        int voxelstate;
        
        
        if (!exitoct)
        {
            //checking what type of cell it is: empty, full or subdivide
            voxelstate = getvoxel(fro,size);
            if (voxelstate == 1 && recursions > detail)
            {
                voxelstate = 0;
            }
        }
        
        //i go up a level
        if (exitoct)
        {
            
            vec3 newfro = floor(fro/(size*2.0))*(size*2.0);
            
            lro += fro-newfro;
            fro = newfro;
            
            recursions--;
            size *= 2.0;
            
            exitoct = (recursions > 0) && (abs(dot(mod(fro/size+0.5,2.0)-1.0+mask*sign(rd)*0.5,mask))<0.1);
        }
        //subdivide
        else if(voxelstate == 1&&recursions<=detail)
        {
            //if(recursions>detail) break;
            
            recursions++;
            size *= 0.5;
            
            //find which of the 8 voxels i will enter
            vec3 mask2 = step(vec3(size),lro);
            fro += mask2*size;
            lro -= mask2*size;
        }
        //move forward
        else if (voxelstate == 0||voxelstate == 2)
        {
            //raycast and find distance to nearest voxel surface in ray direction
            //i don't need to use voxel() every time, but i do anyway
            vec3 hit = voxel(lro, rd, ird, size);
            
            if (hit.x < min(hit.y,hit.z)) {
                mask = vec3(1,0,0);
            } else if (hit.y < hit.z) {
                mask = vec3(0,1,0);
            } else {
                mask = vec3(0,0,1);
            }
            //mask = vec3(lessThan(hit,min(hit.yzx,hit.zxy)));
            float len = dot(hit,mask);
#ifdef objects
            if (voxelstate == 2) {
#ifdef raymarchhybrid
                //if (length(fro-ro) > 20.0*size) break;
                vec3 p = lro/size;
                if (map(p,fro) < 0.0) {
                    normal = -lastmask*sign(rd);
                    break;
                }
                float d = 0.0;
                bool hit = false;
                float e = 0.001/size;
                for (int j = 0; j < raymarchhybrid; j++) {
					float l = map(p,fro);
                    p += l*rd;
                    d += l;
                    if (l < e || d > len/size) {
                        if (l < e) hit = true;
                        d = min(len,d);
                        break;
                    }
                }
                if (hit) {
                    dist += d*size;
                    ro += rd*d*size;
                    normal = findnormal(p,e,fro);//(lro-0.5)*2.0;
                    break;
                }
#else
                break;
#endif
            }
#endif
            
            //moving forward in ray direction, and checking if i need to go up a level
            dist += len;
            fdist += len;
            lro += rd*len-mask*sign(rd)*size;
            vec3 newfro = fro+mask*sign(rd)*size;
            exitoct = (floor(newfro/size*0.5+0.25)!=floor(fro/size*0.5+0.25))&&(recursions>0);
            fro = newfro;
            lastmask = mask;
        }
#ifdef drawgrid
        vec3 q = abs(lro/size-0.5)*(1.0-lastmask);
        edge = min(edge,-(max(max(q.x,q.y),q.z)-0.5)*80.0*size);
#endif
	ii = i;
    }
    ro += rd*dist;
    if(ii < steps && dist < maxdistance)
    {
    	float val = fract(dot(fro,vec3(15.23,754.345,3.454)));
#ifndef raymarchhybrid
        vec3 normal = -lastmask*sign(rd);
#endif
        vec3 color = sin(val*vec3(39.896,57.3225,48.25))*0.5+0.5;
    	fragColor = vec4(color*(normal*0.25+0.75),1.0);
        
#ifdef borders
        vec3 q = abs(lro/size-0.5)*(1.0-lastmask);
        edge = clamp(-(max(max(q.x,q.y),q.z)-0.5)*20.0*size,0.0,edge);
#endif
#ifdef blackborders
        fragColor *= edge;
#else
        fragColor = 1.0-(1.0-fragColor)*edge;
#endif
    } else {
        #ifdef blackborders
                fragColor = vec4(edge);
        #else
                fragColor = vec4(1.0-edge);
        #endif
    }
#ifdef fog
    fragColor *= 1.0-dist/maxdistance;
#endif
    fragColor = sqrt(fragColor);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
