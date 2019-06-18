/*
 * Original shader from: https://www.shadertoy.com/view/tsBSDd
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emuulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.1415926
#define HAIR_LEN 4.
#define SKIN_COL vec3(226,204,190)/255.
#define HAIR_COL vec3(35,33,28)/255.

// Simplex noise from https://www.shadertoy.com/view/4sdGD8
lowp vec3 permute(in lowp vec3 x) { return mod( x*x*34.+x, 289.); }
lowp float snoise(in lowp vec2 v) {
  lowp vec2 i = floor((v.x+v.y)*.36602540378443 + v),
      x0 = (i.x+i.y)*.211324865405187 + v - i;
  lowp float s = step(x0.x,x0.y);
  lowp vec2 j = vec2(1.0-s,s),
      x1 = x0 - j + .211324865405187, 
      x3 = x0 - .577350269189626; 
  i = mod(i,289.);
  lowp vec3 p = permute( permute( i.y + vec3(0, j.y, 1 ))+ i.x + vec3(0, j.x, 1 )   ),
       m = max( .5 - vec3(dot(x0,x0), dot(x1,x1), dot(x3,x3)), 0.),
       x = fract(p * .024390243902439) * 2. - 1.,
       h = abs(x) - .5,
      a0 = x - floor(x + .5);
  return .5 + 65. * dot( pow(m,vec3(4.))*(- 0.85373472095314*( a0*a0 + h*h )+1.79284291400159 ), a0 * vec3(x0.x,x1.x,x3.x) + h * vec3(x0.y,x1.y,x3.y));
}

float rand(vec2 co) { 
    return fract(sin(dot(co.xy , vec2(12.9898, 78.233))) * 43758.5453);
} 

float hairLine(vec2 p, float len, float thickness, float blur, float bendFactor){    
        
    p.x += sin(p.y*3. + iTime*10. + bendFactor)*.025;
    float result = smoothstep(thickness, thickness - blur, abs(p.x));    
    result *= (1. - step(.0, p.y));
    
    // Limit length
    float d = length(p);
    result*= (1. - step(len, d));
    return result;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
    vec2 uv = fragCoord/iResolution.x;
    vec2 ouv = uv;
    
    float SIZE = floor(iResolution.x/15.);
    
    float sm = 1./iResolution.y * SIZE*0.80;
       
    
    uv *= SIZE;
    vec2 id = floor(uv);
    uv = fract(uv);           
          
    float mask = 0.;
    vec3 col = vec3(0.);
    for(float y=-3.; y<=3.; y+=1.){
        for(float x=-3.; x<=3.; x+=1.){
            
            vec2 rid = id;
            rid.x-=x;
            rid.y-=y;
            
            vec2 orid = rid;
            
            // Random thickness for realistic
            float thickness = rand(rid)*0.015 + 0.05;
            float ra = rand(rid);
            float ra2 = rand(rid+1.);
            
            rid/=SIZE;
            rid.x+=iTime*0.2;
                                    
            float a = snoise(rid*2.)*PI; // not 2*PI for one side rotation only            
            a+=ra*0.40;                       
            
            vec2 ruv = uv;            
            ruv.x+=x + (ra - .5)*.5; //+some randomness
            ruv.y+=y + (ra2 - .5)*.5;             
            
            float rotaDir = (floor(mod(orid.x+orid.y, 2.))*2.-1.);
            float rotaForce = rand(orid)*1.0;
            float rota = a+(length(ruv*0.1)*0.8)*rotaDir*rotaForce;
            
            float ca = cos(rota);
            float sa = sin(rota);
            mat2 rot = mat2(ca, -sa, sa, ca);                       
                                   
            ruv *= rot;
                        
            float hairLen = HAIR_LEN + ((ra + ra2)*0.5 - 0.5); //+some randomness
            float bendFactor = id.x+id.y;
    		mask += hairLine(ruv, hairLen, thickness, sm, bendFactor);
            
            col = mix(SKIN_COL, HAIR_COL, mask);
            
            // Make light depending angle
            col += a*0.03;
        }
    }
                         
    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
