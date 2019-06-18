/*
 * Original shader from: https://www.shadertoy.com/view/lllcW4
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Author: ocb
// Title: Voxels City at sunset
	

#define PI 3.141592653589793
#define PIdiv2 1.57079632679489
#define TwoPI 6.283185307179586
#define INFINI 1000000.

// to activate prozacgod proposal
// straight path, no building traversal
// Speed is increased for fun and focal is wide to visualy push-away horizon

#define prozacgod

#define NO_TRANSPARENCY
#define BORDER

#define boxDim 100.
#define maxBoxRnge 250
#define maxReflRnge 70
#define emptyChance 30.
#define buildSize 12.

// object name
#define GND -1
#define SKY -1000
#define NONE 0
#define BOX 1
#define GLASS 2

//Global var
vec3 color = vec3(0.);
vec3 lightRay = normalize(vec3(1.,.1,.2));

// z axis rotation
mat2 rotz(in float a){ float s = sin(a); float c = cos(a); return mat2(c, s, -s,c);}


//Hash functions
float H1 (in float v) { 						
    return fract(sin(v) * 437585.);
}
float H2 (in vec2 st,in float time) { 						
    return fract(sin(dot(st,vec2(12.9898,8.233))) * 43758.5453123+time);
}
float H3 (in vec3 st,in float time) { 						
    return fract(sin(dot(st,vec3(12.9898,8.233,17.6533107))) * 43758.5453123+time);
}

//Sky light + diffuse clouds
vec3 skyGlow(in vec3 ray){
    vec3 col = vec3(0.);
    float a = dot(lightRay, ray);
    col += vec3(0.995,0.641,0.038)*(smoothstep(.98,1.,a));
    col += 1.2*vec3(.4*max(ray.x+.7,0.)*(.8-max(0.,ray.y)), .4,.4)*(1.-ray.y)*(ray.x+1.5)*.4;
    col += (1.5*texture(iChannel0,ray.yz*.3+.005*iTime).x)*vec3(.25,.15,.1);
	return col;
}

vec3 setBox(in vec3 p){
    return floor(p/boxDim + .5);	// return box coord. for a position
}

vec3 deBox(in vec3 box){
    return box*boxDim;		// return the position of the center of the box
}

// Find next box along the ray path
vec3 getNextBox(in vec3 p, in vec3 v, in vec3 box){
    vec3 d = sign(v);
	vec3 dt = ((box+d*.5)*boxDim-p)/v;
    float dmin = min(min(dt.x,dt.y),dt.z);
    d *= step(dt, vec3(dmin));
    return box+d;
}

// Construction law: here random.
bool checkBox(in vec3 box){
    float h = H3(floor(box),0.)*(emptyChance + 2.);
    return bool(int(floor( max(0.,h-emptyChance) )));
}

// Construction law for buildings
bool checkBox2(in vec3 box){
    float h = H2(floor(box.xz/buildSize+50.),0.);
    #ifdef prozacgod
    if(floor(box.z/buildSize) == 0.) 
        if(box.y <= -11.) return true;
        else return false;
    else return bool(step(min(31.,(h-.15)*float(maxBoxRnge)), -box.y+20.));
    #else
    return bool(step(min(31.,(h-.1)*float(maxBoxRnge)), -box.y+20.));
    #endif
}

// Browse all the boxes along the ray untill maxBoxRnge reached or borders of rect area.
// if a box is found, find normal vector, hilight borders of box, and
// if transparency, add a very little color (value decreasing with the number of hits)
// and find next box, as transparency means ray do not stop.
// else (if full object) break. The ray stop here. Return t parameter. 
vec4 browseBox(in vec3 box, in vec3 pos, in vec3 ray, inout int hitObj){
    float t = INFINI, tt = INFINI;
    float hitNbr = 0.;
    vec3 d;
    vec3 startBox = box;
    for(int i=0; i<maxBoxRnge;i++){
        if(int(abs(box.x-startBox.x)) > maxBoxRnge-125 || int(abs(box.z-startBox.z)) > maxBoxRnge-125) break;
    	vec3 newBox = getNextBox(pos,ray,box);
        d = box - newBox;
        
        if(checkBox2(newBox)) {
            hitNbr ++;
            
            vec3 o = deBox(newBox+.5*d);
            
            if(abs(d.x) == 1.){
                tt = (o.x-pos.x)/ray.x;
                vec3 p = pos+tt*ray;
                #ifdef BORDER
                if(box.y>-11. ) {
                    color += .02*(smoothstep(.4*boxDim, .5*boxDim ,abs(o.y-p.y)) + smoothstep(.4*boxDim, .5*boxDim ,abs(o.z-p.z)));
                }
                #endif
            }
            else if(abs(d.y) == 1.){
                tt = (o.y-pos.y)/ray.y;
                vec3 p = pos+tt*ray;
                #ifdef BORDER
                if(box.y>-11.) {
                    color += .02*(smoothstep(.4*boxDim, .5*boxDim ,abs(o.x-p.x)) + smoothstep(.4*boxDim, .5*boxDim ,abs(o.z-p.z)));
                }
                #endif
            }
            else{
                tt = (o.z-pos.z)/ray.z;
                vec3 p = pos+tt*ray;
                #ifdef BORDER
                if(box.y>-11.) {
                    color += .02*(smoothstep(.4*boxDim, .5*boxDim ,abs(o.x-p.x)) + smoothstep(.4*boxDim, .5*boxDim ,abs(o.y-p.y)));
                }
                #endif
            }
            
            
            #ifdef NO_TRANSPARENCY
            if(bool(mod(newBox.y, 2.))){
                hitObj = BOX;
                t = tt;
                break;
            }
            else{
                vec3 refl = reflect(ray,d);
                color += .15/hitNbr*((dot(d,lightRay)+1.)*.3+.4)*vec3(0.08,.1,0.3);
                color += .2/hitNbr*skyGlow(refl);
                hitObj = GLASS;
            }
            #endif
        }
        box = newBox;
    }
    color = clamp(color,0.,1.);
    return vec4(d,t);
}


// Return true only if a fulfill box is found (used for the reflect and shadow)
bool browseBoxSimple(in vec3 box, in vec3 pos, in vec3 ray){
    bool ret = false;
    for(int i=0; i<maxReflRnge;i++){
    	box = getNextBox(pos,ray,box);
        if(checkBox2(box) && bool(mod(box.y, 2.)) ){
            ret = true;
            break;
        }
    }
    return ret;
}

vec3 getCamPos(in vec3 camTarget){
    #ifdef prozacgod
    float 	rau = 100., alpha = PIdiv2, theta = -.001;
    #else
    float 	rau = 100.,
            alpha = iMouse.x/iResolution.x*4.*PI,
            theta = iMouse.y/iResolution.y*PI+(PI/2.0001);	
    		
            // to start shader
    		if (iMouse.xy == vec2(0.)){
                alpha = PIdiv2;
                theta = -.001;
            }
    #endif
    return rau*vec3(-cos(theta)*sin(alpha),sin(theta),cos(theta)*cos(alpha))+camTarget;
}

vec3 getRay(in vec2 st, in vec3 pos, in vec3 camTarget){
    #ifdef prozacgod
    st *= rotz(-.6*sin((iTime+.2)*.5));
    float 	focal = .5;
    vec3 ww = normalize( camTarget - vec3(fract((iTime-.1)*.01)*100000.,700.*sin(iTime*.1)-300.,5.*buildSize*boxDim*(.4*sin((iTime-.1)*.5)+.5)) );
    #else
    float 	focal = 2.;
    vec3 ww = normalize( camTarget - pos);
    #endif
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0)) ) ;
    vec3 vv = cross(uu,ww);
	// create view ray
	return normalize( st.x*uu + st.y*vv + focal*ww );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 st = fragCoord.xy/iResolution.xy-.5;
    st.x *= iResolution.x/iResolution.y;
    
    // camera def
    vec3 camTarget = //vec3(0.,1500.,0.);
        			 //vec3(1800);
        			 //vec3(3000.*sin(iTime*.02),1200.,2500.*cos(iTime*.03));
        			#ifdef prozacgod
        			 vec3(fract(iTime*.01)*100000.,700.*sin(iTime*.1)-300.,5.*buildSize*boxDim*(.4*sin(iTime*.5)+.5));
    				#else
    				 vec3(3000.*sin(iTime*.03),1400.*sin(iTime*.05-PIdiv2)+400.,2500.*cos(iTime*.04));
    				#endif
        		
    vec3 pos = getCamPos(camTarget);
    vec3 ray = getRay(st, pos,camTarget);
	
    float t = INFINI;
    vec3 norm;
    int hitObj = SKY;
    vec3 p = pos;
    
    vec3 box = setBox(p);

    vec4 info = browseBox(box, p, ray, hitObj);
    
    if(hitObj == SKY) {
        color += skyGlow(ray);
        if(ray.y<0.) color = mix(color,vec3(0.),sqrt(-ray.y*8.));
    }
    else if(hitObj == BOX){
        norm = info.xyz;
        t = info.w;
        p += t*.999*ray;
        box = setBox(p);
        vec3 refl = reflect(ray,norm);
        if(p.y<-1025.) color.b += .15*(smoothstep(.48,.5 ,abs(fract(p.x*.002)-.5)) +smoothstep(.48,.5,abs(fract(p.z*.002)-.5)));
        if(norm == vec3(0.,-1.,0.) && bool(step(3.,mod(box.x,3.)*mod(box.z,3.))) ){
            //color += vec3(1.,.8,.6)*smoothstep(.35,.5,abs(fract(p.x/boxDim)-.5))*smoothstep(.35,.5,abs(fract(p.z/boxDim)-.5));
			float r = length(p.xz-deBox(box).xz)/boxDim;
            color += vec3(1.,.8,.6)*.01/(r*r+.01);
            color += max(0.,.15-r);
        }
        if(!browseBoxSimple(box, p, refl)){
            if(box.y == -10.) color += .2*skyGlow(refl);
            else color += .7*skyGlow(refl)*clamp(0.,1.,refl.y+.6);
        }
    }
    else /* GLASS */ color += skyGlow(ray);
    
    fragColor = vec4(color,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
