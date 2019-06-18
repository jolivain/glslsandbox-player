/*
 * Original shader https://www.shadertoy.com/view/4tccDX
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


// --------[ Original ShaderToy begins here ]---------- //
#define time iTime

#define R(p, a) p = cos(a) * p + sin(a) * vec2(p.y, -p.x)
#define eps 1e-3


float map(vec3 p) 
{
    vec3 _ = p;
    
    float speed = mod(iTime * 1.20, 200.);// reset timer to avoid artifacts
    
    float cammove = (sin( _.z * 0.01) * sin(_.y +  speed + _.z ));
    
    // ------------------ base structure
 	
    float t =  cammove + abs( 0.1 / 0.5 * 0.5 + cos( _.x * 0.5 ) )
    		
              // arc 
        	  * abs(5.0 / (  _.y + _.z ) * cos( _.y * .15 ) )
		  	  * abs(0.4 / 1.0 + cos( _.x * .15 ) ) + eps;
    
    // ceiling
    t = min(t, 0.01/abs(sin(_.x * 0.5  ) * sin(_.y * 0.04 * _.y )) ) + eps;
	
    // floor
    t = min(t,  2.0 - dot( _ ,vec3(0.0, 1.0, 0.0) ) );
    
    // music
    // t = min(t, 0.5 * music( abs(_) / 22.0 ) ) + eps;
    
    // music
    t = min(t, sin(mod(fract(time) , .5 ) + .07 ) * 2.  ) + eps;
    		
	
    // switch betweet different shaping func. / modes
    
    float theta = eps * ( 0.5 - (atan(cammove-p.z, p.x) / 6.28318));
    
    /* // will course some artifacts w/o music texture
    if( mod(iTime, 3.0)/3. > 0. && sin(iTime*.2) > .5 )
    theta =  eps * 0.5 + cammove;
    */
    
    t = max(t,  theta ) + eps;    	  	  
    
    
    return t;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // setup scene
    vec2 uv = (fragCoord.xy * 2.0 - iResolution.xy)/min(iResolution.x,-iResolution.y);
    
    vec3 ro = vec3(0.0,0.0, 5.);
    vec3 rd = normalize(vec3(uv, 1));
    
    R(rd.xy, iTime * .051 );
    
    
    // raymarch
    
    float t = 0.0;	
    
    for(int i = 0; i<64*2; i++) 
    {
        t += map( ro + rd * t);
		if(t <  0.01) break;
    }
    
    
    // ------- shade
    vec3 ip = ro + rd * t;
    
    fragColor.rgb = (t * vec3( 0.12, 0.2, 0.24)) * map(ip - 0.2) + t * 0.02;
    
    fragColor.a = 1.0;
}
// --------[ Original ShaderToy ends here ]---------- //
#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
