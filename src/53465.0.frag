/*
 * Original shader from: https://www.shadertoy.com/view/WsXSDj
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
#define iTime time
#define iResolution resolution
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define rot(spin) mat2(cos(spin),sin(spin),-sin(spin),cos(spin))
#define pi acos(-1.0)

#define hex1 vec3(1,0,0)
#define hex2 normalize(vec3( 1,0,sqrt(3.0)))
#define hex3 normalize(vec3(-1,0,sqrt(3.0)))

#define hex4 vec2(1,0)
#define hex5 vec2(1,1)
#define hex6 vec2(0,1)

#define maxdist 500.0
#define maxheight 0.0

float map(vec2 p, vec2 ip) {
    return dot(sin(p*0.2+iTime*0.2),vec2(1))*6.0-12.0;
}

float flower(vec3 ro, vec3 rd, out vec3 n) {
    
    vec3 ird;
    ird.x = dot(rd,hex1);
    ird.y = dot(rd,hex2);
    ird.z = dot(rd,hex3);
    ird = 1.0/ird;
    
    vec3 ro2;
    ro2.x = dot(ro,hex1);
    ro2.y = dot(ro,hex2);
    ro2.z = dot(ro,hex3);
    
    vec3 ds1 = -ro2*ird-abs(ird)*0.75;
    float l1 = max(max(ds1.x,ds1.y),ds1.z);
    vec3 n1 = vec3(equal(vec3(l1),ds1));
    
    vec3 ds2 = -ro2*ird+abs(ird)*0.75;
    float l2 = min(min(ds2.x,ds2.y),ds2.z);
    
    vec3 ds3 = -ro2*ird-abs(ird)*0.25;
    vec3 ds4 = -ro2*ird+abs(ird)*0.25;
    
    vec3 a1 = step(ds4,vec3(l1))+step(ds4,vec3(0));
    ds3 += a1*1000.0;
    float l3 = min(min(ds3.x,ds3.y),ds3.z);
    vec3 n3 = vec3(equal(vec3(l3),ds3));
    
    float l4 = max(max(ds4.x,ds4.y),ds4.z);
    
    float l5;
    if (l1 > l3) {
        l5 = l1;
        n = n1;
    } else {
        l5 = l3;
        n = n3;
    }
    n *= sign(ird);
    
    float l6 = min(l2,l4);
    
    float l = l5;
    
    if (l6 < l5 || l6 < 0.0) {
        l = 100000.0;
    }
    
    return l;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord*2.0-iResolution.xy)/iResolution.y;
    
    vec3 ro = vec3(0,0,-30);
    vec3 rd = normalize(vec3(uv,1));
    
    if (length(iMouse.xy) > 40.0) {
    	rd.yz *= rot(iMouse.y/iResolution.y*3.14-3.14*0.5);
    	rd.xz *= rot(iMouse.x/iResolution.x*3.14*2.0-3.14);
    	ro.yz *= rot(iMouse.y/iResolution.y*3.14-3.14*0.5);
    	ro.xz *= rot(iMouse.x/iResolution.x*3.14*2.0-3.14);
    }
    
    ro.y *= 0.5;
    
    vec2 bh = vec2(1,3.0/sqrt(3.0));
    vec2 a = mod(ro.xz+bh,bh*2.0)-bh;
    vec2 b = mod(ro.xz   ,bh*2.0)-bh;
    
    vec2 p;
    
    if (dot(a,a) < dot(b,b)) {
        p = a;
    } else {
        p = b;
    }
    
    vec2 id = ro.xz-p;
    
    vec2 iid = id/bh*vec2(0.5,1);
    iid.x += iid.y*0.5;
    
    iid = floor(iid);
    
    vec3 rd2;
    
    rd2.x = dot(rd,hex1);
    rd2.y = dot(rd,hex2);
    rd2.z = dot(rd,hex3);
    
    rd2 = 1.0/rd2;
    
    vec3 ro2;
    
    vec3 mlens = 1.0/rd2;
    
    vec3 n;
    
    float hexlen;
    float circlen;
    
    float h = map(id, iid);
    
    ro.y = max(ro.y,h+0.1);
    
    vec3 cam = ro;
    
    float d = 0.0;
    bool hit = false;
    vec3 nor;
    for (int i = 0; i < 1000; i++) {
        
        if (rd.y >= 0.0 && ro.y > maxheight || d > maxdist) break;
        
    	vec3 p5 = ro-vec3(id,0).xzy;
        vec3 ro2;
        
        ro2.x = -dot(p5,hex1)*rd2.x+abs(rd2.x);
        ro2.y = -dot(p5,hex2)*rd2.y+abs(rd2.y);
        ro2.z = -dot(p5,hex3)*rd2.z+abs(rd2.z);
        
        vec3 mask;
        
        if (ro2.x < min(ro2.y,ro2.z)) {
            mask = vec3(1,0,0);
        } else if (ro2.y < ro2.z) {
            mask = vec3(0,1,0);
        } else {
            mask = vec3(0,0,1);
        }
        
        float len = dot(mask,ro2);
        
        float h = map(id, iid);
        
    	float e2 = length(id)*0.3+iTime;
        float r = min(mod(e2+2.5,pi*2.0),pi/3.0);
        mat2 rotm1 = rot(r);
        mat2 rotm2 = rot(-r);
        
        if (ro.y < h) {
            vec3 p = p5;
            vec3 rdr = rd;
            p.xz *= rotm1;
            rdr.xz *= rotm1;
        	float hex = flower(p,rdr,nor);
            
            p = ro+rd*hex;
            if (p.y < h && hex < 100.0) {
    			n = -(nor.x*hex1+nor.y*hex2+nor.z*hex3);
                n.xz *= rotm2;
                ro = p;
                hit = true;
                break;
            }
        }
        
        if (rd.y < 0.0) {
            float len2 = -(ro.y-h)/rd.y;
            
            vec3 p = p5+rd*len2;
            vec3 rdr = rd;
            p.xz *= rotm1;
            rdr.xz *= rotm1;
        	float hex = flower(p,rdr,nor)+len2;
            
            if (hex > len2) {
                len2 = hex;
    			n = -(nor.x*hex1+nor.y*hex2+nor.z*hex3);
                n.xz *= rotm2;
            } else {
                n = vec3(0,1,0);
            }
            
            if (len2 < len) {
                hit = true;
                ro += rd*len2;
                d += len2;
                break;
            }
        }
        
        ro += rd*len;
        d += len;
        
        nor = mask*sign(rd2);
        
        n = -(nor.x*hex1+nor.y*hex2+nor.z*hex3);
        
        iid += nor.x*hex4+nor.y*hex5+nor.z*hex6;
        
        id += -n.xz*2.0;
    }
    
    fragColor = vec4(0);
    
    if (hit) {
        //random color (sort of) (double square root for brightness)
        
        vec3 col = sqrt(sqrt(0.5+0.5*sin(iid.xxx*vec3(0.6,2.0,1.5)
                                        *(sin(iid.yyy*vec3(1.0,1.0,1.0)+2.0))
                                        +iid.xxy*vec3(0.9,1.6,0.5)
                                        +iid.yyx*vec3(0.8,1.4,1.8))));
		
    	//vec3 col = textureLod(iChannel0,iid*0.1,0.0).xyz;
        
        //vec3 col = vec3(dot(sin(id),vec2(0.25))+0.5);
        
        vec3 lightn = normalize(vec3(1));
        
        float diff = max(dot(n,lightn),0.1);
        
        col *= diff;
        
        float d2 = 1.0-d/maxdist;
        col *= d2;
        
        //col = fract(ro);
        
    	fragColor = vec4(sqrt(col),1);
    }
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
