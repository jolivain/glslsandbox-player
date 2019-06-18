/*
 * Original shader from: https://www.shadertoy.com/view/wsSSWR
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

// --------[ Original ShaderToy begins here ]---------- //
#define rot(spin) mat2(cos(spin),sin(spin),-sin(spin),cos(spin))
#define pi acos(-1.0)
#define FAR 200.0
#define STEPS 500
#define LINES 40.0

float ray(vec2 ro, vec2 rd) {
    float a = max(dot(ro,rd),0.0);
    return length(ro-rd*a);
}

float map(vec2 c) {
    float angle = c.y/LINES*2.0*pi;
    vec2 p = vec2(sin(angle),cos(angle))*c.x;
    
    float twist = sin(angle*4.0+sin(c.x*0.2)*4.0*sin(iTime))*2.0;
    float wave = sin(c.x*0.1+iTime)*4.0;
    
    return twist+wave;
    
    //return (sin(c.x-iTime)+sin(c.y+iTime))*0.5-1.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord*2.0-iResolution.xy)/iResolution.y;

    vec3 ro = vec3(0.01,0,-19.5);
    vec3 rd = normalize(vec3(uv,1));

    if (length(iMouse.xy) > 40.0) {
        rd.yz *= rot(iMouse.y/iResolution.y*3.14-3.14*0.5);
        rd.xz *= rot(iMouse.x/iResolution.x*3.14*2.0-3.14);
        ro.yz *= rot(iMouse.y/iResolution.y*3.14-3.14*0.5);
        ro.xz *= rot(iMouse.x/iResolution.x*3.14*2.0-3.14);
    } else {
        rd.yz *= rot(-0.5);
        ro.yz *= rot(-0.5);
    }

    float e = 1.0/dot(rd.xz,rd.xz);

    float a = dot(-ro.xz,rd.xz)*e;
    vec2 p = ro.xz+rd.xz*a;
    float b = dot(p,p);
    
    float ang = atan(ro.x,ro.z)/pi*0.5*LINES;
    
    vec2 cell = floor(vec2(length(ro.xz),ang));
    
    float h = map(cell);
    
    ro.y = max(ro.y,h+0.1);
    
    float angle = (ang)/LINES*2.0*pi;
    vec3 pln = vec3(cos(angle),0,-sin(angle));
    
    vec2 dir = vec2(-1,sign(dot(pln,rd)));
    
    vec2 lens = vec2(0);
    
    float d = 0.0;
    
    vec3 n = vec3(0);
    vec3 n1 = vec3(0.);
    vec3 n2 = vec3(0.);
    for (int i = 0; i < STEPS; i++) {
        float f = d;
        
        if (lens.x < lens.y) {
            if (lens.x > 0.0) {
                cell.x += dir.x;
                n = n1;
            }
            float cell2 = cell.x+dir.x*0.5+0.5;
            if (b <= cell2*cell2 || dir.x == 1.0) {
                float c = sqrt((cell2*cell2-b)*e);
                if (c+a > 0.0 || dir.x == 1.0) {
                    lens.x = a+c*dir.x;
                    n1 = vec3(-normalize(ro.xz+rd.xz*lens.x)*dir.x,0).xzy;
                } else {
                    lens.x = 0.0;
                    dir.x = 1.0;
                }
            } else {
                lens.x = 0.0;
                dir.x = 1.0;
            }
        } else {
            if (lens.y > 0.0) {
                cell.y += dir.y;
                n = n2;
            }
            
            float angle = (cell.y+dir.y*0.5+0.5)/LINES*2.0*pi;
            
            vec3 pln = vec3(cos(angle),0,-sin(angle));
            
            if (dot(pln,rd)*dir.y < 0.0) {
                lens.y = 10000.0;
            } else {
                lens.y = -dot(ro,pln)/dot(rd,pln);
                n2 = -pln*dir.y;
            }
            
        }
        
        cell.y = mod(cell.y,LINES);
        float h = map(cell);
        
        if (ro.y+rd.y*d < h && d > 0.0) {
            //if (d == 0.0) return;
            break;
        }
        
        d = min(lens.x,lens.y);
        
        if (rd.y < 0.0) {
            float pln = -(ro.y-h)/rd.y;
            
            if (pln < d) {
                n = vec3(0,1,0);
                d = max(pln,f);
                break;
            }
        }
        
        if (d > FAR) break;
    }
    
    //cell -= dir;
    
    
    
    // Output to screen
    vec3 background = vec3(0);
    vec3 col = background;
    if (d < FAR) {
        float h = (map(cell)+8.0)/10.0;
        
        col = vec3(h,1.0-h,sin(h*2.0)*0.1+0.1);
        
        float diff = max(0.1,dot(n,normalize(vec3(1))));
        
        col *= diff;
    }
    fragColor = vec4(sqrt(col),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
