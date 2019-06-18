/*
 * Original shader from: https://www.shadertoy.com/view/ltX3Dr
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
vec4 color = vec4(0.,0.,0.,1.);
       
float addCircle(in vec2 uv, in vec2 p,float r,float a,float b) {

    float t = 0.;
	 vec2 rel = uv-mix(p,vec2(0.25,0.4), t);
        float r1 = r;//mix(r, 0.2, t);
    if(length(rel)<r1) {
      
        float angle = atan(rel.y,rel.x);
        if(angle>3.141*0.95) { 
       //     angle-=2.*3.141;
        }
        if(angle>a && angle<b) {
			return 1.;
        } else {
      //   outColor.g+=0.015;   
        }
    }
    
	return 0.;
}



bool isInApple(in vec2 uv) {
    
    float location = 
    addCircle(uv, vec2(0.234, 0.285), 0.067, -3.4,3.2)+
    -2.75*addCircle(uv, vec2(0.222, 0.135), 0.099, -3.4,3.2)+
    addCircle(uv, vec2(0.000, 0.399), 0.591, 0.15,0.76)+
    addCircle(uv, vec2(0.075, 0.385), 0.195, -4.0,5.4)+
    addCircle(uv, vec2(0.117, 0.424), 0.252, -3.5,-2.3)+
    addCircle(uv, vec2(0.364, 0.385), 0.190, -3.4,3.2)+
    addCircle(uv, vec2(0.452, 0.399), 0.588, 2.38,3.1)-

    //bite
  2.*addCircle(uv, vec2(0.630, 0.432), 0.189, -3.4,3.25)+ 
        
    addCircle(uv, vec2(0.091, 0.720), 0.106, -3.4,3.2)+
    addCircle(uv, vec2(0.220, 0.663), 0.169, -3.4,3.2)-
   4.* addCircle(uv, vec2(0.223, 0.963), 0.17, -3.4,3.2)+
        
        
    addCircle(uv, vec2(0.360, 0.720), 0.109, -3.4,3.2 ) +

        
     //leaf

        9.* min(
    addCircle(uv, vec2(0.193, 0.000), 0.180, -3.4,3.2),
    addCircle(uv, vec2(0.388, 0.168), 0.180, -3.4,3.2));
    
    return location>=1.;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.y = 0.9-uv.y;
    
	uv.x *= iResolution.x/iResolution.y;
	uv.x -=0.7;
    
    
 //   uv.y = mod(uv.y+iTime/13.,1.)-0.1;
    
    
    
    bool isIn = isInApple(uv);
    fragColor = vec4(1.);
    
    
    
    uv.y+=0.05*(sin(iTime*uv.x*0.1+uv.y*iTime*0.1));//,0.0);
    


    
    
    float frac = 0.3;
    float bandHeight = 0.105;
    if(isIn&&uv.y<frac) { 
        fragColor= vec4(.38, .73,.28,1.); 

    } else if(isIn) {
        fragColor= vec4(.98, .72,.15,1.); 
        
    }
    frac+=bandHeight;
    if(isIn&&uv.y>frac) {
	    fragColor=vec4(.95,0.52,0.18,1.);    
    }
    frac+=bandHeight;
    if(isIn&&uv.y>frac) {
	    fragColor=vec4(0.92,0.22,0.24,1.);    
    }
    
	frac+=bandHeight;
    if(isIn&&uv.y>frac) {
	    fragColor=vec4(0.58,0.24,0.59,1.);    
    }
    frac+=bandHeight;
    if(isIn&&uv.y>frac) {
	    fragColor=vec4(0.04,0.55,0.9,1.);    
    }
    if(!isIn) {
        fragColor = vec4(1.);
    }
   
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
