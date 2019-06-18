/*
 * Original shader from: https://www.shadertoy.com/view/4dVfzW
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
const vec3  iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //

#define MAX_STEPS 512
#define CLOSE_CLIP 0.1
#define FAR_CLIP 100.0
#define EPSILON 0.0001

mat2 rotmat(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

vec2 mouse()
{
    vec2 m = iMouse.xy / iResolution.xy-.5; 
    m.x *= iResolution.x/iResolution.y;
	return m;
}

float sdSphere(vec3 rayPos, float radius)
{
 	return length(rayPos) - radius;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

vec2 rotate(vec2 k,float t)
{
	return vec2(cos(t) * k.x - sin(t) * k.y, sin(t) * k.x + cos(t) * k.y);
}

vec2 map(vec3 pos)
{
 	
    vec3 b = vec3(0.9 , 4.5, 0.70);
    float p = sin(pos.z * 0.1) * 2.0;
  
    pos = vec3(rotate(pos.xy, p), pos.z);
    
    pos.y += iTime * 1.2;
    pos = mod(pos, b) -0.5 * b;
    
    pos.x *= sin(length(pos * 1.8) * 2.0) * 1.4;
    
    float boxScale = 0.4;
    
    vec2 result = vec2(sdBox(pos - vec3(0.0, 0.0, 0.0), vec3(boxScale)), 1.0);
  
    return result;
}



vec2 sdScene(vec3 pos)
{
    
    vec2 scene = map(pos);
    
    return scene;
    
}

vec2 raymarch(vec3 rayStartPos, vec3 ray_direction)
{
    float depth = CLOSE_CLIP;
 	
    for(int i = 0; i < MAX_STEPS; i++)
    {
    	vec2 result = sdScene(rayStartPos + ray_direction * depth);
            
        if(result.x < EPSILON)
            return vec2(depth, result.y);
        
        depth += result.x;
        
        if(depth > FAR_CLIP)
            return vec2(FAR_CLIP, 0.0);;
        
    }
    
    return vec2(FAR_CLIP, 0.0);
}


vec3 normal(vec3 ray_hit_position, float smoothness)
{  
    vec3 n;
    vec2 dn = vec2(smoothness, 0.0);
    
    float d = sdScene(ray_hit_position).x;
    
    n.x = sdScene(ray_hit_position + dn.xyy).x - d;
    n.y = sdScene(ray_hit_position + dn.yxy).x - d;
    n.z = sdScene(ray_hit_position + dn.yyx).x - d;
    
    return normalize(n);
}


float softshadow( vec3 ray_origin, vec3 ray_direction, float mint, float tmax )
{
	float res = 1.0;
    float t = mint;
    
    for( int i=0; i<8; i++ )
    {
		float h = map( ray_origin + ray_direction * t ).x;
        
        res = min( res, 8.0*h/t );
        
        t += clamp( h, 0.02, 0.10 );
        
        if( h<0.001 || t > tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<6; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

vec3 render(vec3 ray_pos, vec3 ray_direction)
{
 	   
    vec2 result = raymarch(ray_pos, ray_direction);
    
    vec3 col = vec3(0.0, 0.0, 0.0);
    
   	float d = result.x;
    float m = result.y;
    
    vec3 pos = ray_pos + d * ray_direction;
    
    vec3 nrml = normal(pos, 0.001);
    float occ = calcAO( pos, nrml ); // ambient occlusion
    
   
    vec3  lig = normalize( vec3(-0.5, 0.5, -0.5) ); // sunlight
   
    if(m == 1.0)
        col = vec3(0.3, 0.3, 0.45);
    
    vec3 lin = vec3(0.0);
    vec3 ref = reflect( ray_direction, nrml ); // reflected ray
   
	float amb = clamp( 0.5 + 0.5 * nrml.y, 0.0, 1.0 ); // ambient light
    float dif = clamp( dot( nrml, lig ), 0.0, 1.0 ); // diffuse reflection from sunlight
    float spec = pow(clamp( dot( ref, lig ), 0.0, 1.0 ),16.0); // specular reflection
    float fre = pow( clamp(1.0 + dot(nrml,ray_direction),0.0,1.0), 2.0 ); // fresnel
    float dom = smoothstep( -0.1, 0.1, ref.y ); // dome light
    
    dif *= softshadow( pos, lig, 0.3, 4.5 );
    dom *= softshadow( pos, ref, 0.3, 2.5 ) ;
    
    lin += 2.30 * dif * vec3(1.00,0.80,0.55) ;
    lin += 2.00 * spec * vec3(1.00,0.90,0.70) * dif ;
    lin += 0.20 * amb * vec3(0.40,0.60,1.00) * occ ;
    lin += 0.45 * fre * vec3(1.00,1.00,1.00) * occ ;
    lin += 0.20 * dom * vec3(0.40,0.60,1.00) ;
   
    col = col * lin;
    
    col = mix( col, vec3(0.6,0.9,1.0), 1.0 - exp( -0.00035*d*d*d ) );
    
    return vec3( clamp(col, 0.0, 1.0));    
    
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = 2.0*vec2(fragCoord.xy - 0.5*iResolution.xy)/iResolution.y; 
   
    vec3 camera = vec3(0.0, 0.0, 0.0);
    camera.z += iTime * 3.0;
    //camera.y = mouse().y * 20.0;
    vec3 ray_direction = normalize(vec3(uv, 2.0));
   
    //ray_direction.xz *= rotmat(-mouse().x * 10.0);
    //ray_direction.yz *= rotmat(mouse().y * 10.0);
    
    vec3 col = render(camera, ray_direction);
    
    float o = smoothstep(0.99, 0.2, length(uv));
  
    fragColor = vec4(col, 1.0) ;
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
