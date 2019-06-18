/*
 * Original shader from: https://www.shadertoy.com/view/WtSGDz
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
#define asp iResolution.x/iResolution.y
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
float circle1(vec2 uv,float radius,float blur){
	float d = length(uv);
    float c = clamp(max(sqrt(radius*radius-uv.x*uv.x-uv.y*uv.y)/radius,0.000001),0.0,1.);
    //c = smoothstep(radius,radius-blur,d);
    return c;
}
float circle(vec2 uv,float radius,float blur){
	float d = length(uv);
    return smoothstep(radius,radius-blur,d);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    vec2 l = uv;
    //float pitch = texture(iChannel0,uv).r/5.;
    vec2 st = uv;
	
    uv-=vec2(0.5,1.1);
    uv.x*=asp;
    float d = length(uv);
    float radius = 0.6;
    float blur = 0.49;
    float c = smoothstep(radius+sin(iTime)*.1,radius-blur+sin(iTime)*.05,d);
    float dd = smoothstep(radius-0.3,radius-0.3-0.04,d);
    // Time varying pixel color
   
	float n = c-dd;
    // Output to screen
    fragColor +=clamp(n,0.,1.)*1.2*vec4(0.2,0.5,0.9,1.);
    fragColor += dd*vec4(0.2,0.5,(1.-dd),1.);
    fragColor+=dd;
    fragColor +=vec4( st.y)*vec4(0.2,0.5,0.9,1.)*0.6*(1.-fragColor.b);
     
    st.y+= sin(st.x*6.+iTime*3.)*0.1;
        
    float col = smoothstep(0.2,0.15,st.y);
    float factor = fract(l.x)/6.5;
    float co = smoothstep(0.25+factor,0.15+factor,st.y);
  	st.y-=0.1;
    //fragColor += vec4((co-col)*fract((1.-st.y)*3.))*vec4(0.1,0.7,0.9,1.);
     
    
    uv = fragCoord/iResolution.xy;
	uv-=vec2(0.5,1.1);
    //uv.x*=asp;
  
   
         d = length(uv);
    	 c = smoothstep(0.3,0.27,d);

 
    const float s = 0.0035;
    vec3 coll = vec3(0.0);
    float t = iTime/4.;
    float vl = 0.0;
    for(float f = 0.0;f<1.0;f+=s){
    	vec2 st = uv;
       
       st.x+=fract((sin(f*1245.))*114.)-0.5;
    st.y+=fract(t*sin(f+0.1)+f*2.)*1.2;
        //st.y*=0.4;
        
      	st*=mix(f,0.9,2.);
       
        //st.x+=sin(st.y+iTime+f)*f/2.;
        //st.y += (fract(t*.2+f*7.64)-.5)*15.;
        st.x*=asp; 
        st = rotate2d(iTime+sin(f*175.)*1854.)*st; 
        st.y*=1.82;
        //float angle = atan(st.x,st.y);
        //float r = 0.05-cos(angle*7.)/50.;
        float r = 0.05;
        st.y-=abs(st.x/3.+sin(iTime+fract(f))*0.01);
       vl =max( circle(st,r,0.027),vl);
        
        coll=vl*vec3(1.0,0.5,0.7);
    }
    fragColor=max(vec4(coll,1.),fragColor);

    
    /*
        st -=vec2(0.5,0.5);
    st.x*=asp;
        fragColor += vec4(circle(st,0.1,0.09))*vec4(0.6,0.5,0.9,1.)*1.5;
    st.x/=asp;
    st-=vec2(0.2,-0.3);
    st.y+=abs(sin(st.x*12.+1.5)*0.1);
    st.x*=asp;
    fragColor += vec4(circle(st,0.2,0.19))*vec4(0.0,0.2,0.9,1.)*0.8;
*/
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    gl_FragColor.rgb = vec3(0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
