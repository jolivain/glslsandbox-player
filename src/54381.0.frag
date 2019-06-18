/*
 * Original shader from: https://www.shadertoy.com/view/3djSD3
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
vec2 det(vec3 p3D){
 	return vec2((p3D.x * 90.)/p3D.z + iResolution.x/2., (p3D.y * 90.)/p3D.z + iResolution.y/2.);
}

float ist(vec2 fin){
 	float w = 5.;
 	float r0 = 100.;
 	float x = 0.;
 	float y = -r0-20.;
 	float z = 90.;
	
 	float rate = 1.;
 
 	float n = 10.;
 
    float returned = 1.;
    
    vec2 cent = det(vec3(x,y+r0*1.2,z));
    if (distance(fin,cent) > r0*1.5) {
        return 1.;
    }
    
 	for (int jj = 0; jj <= 10; jj++){
        y += 20.;
        float r = sqrt(r0*r0 - y*y);
        
        for (int ii = 0; ii <= 10; ii++){
            float i = float(ii);
            vec2 dete1 = det(vec3(sin(iTime*rate + 6.28*i/n)*r+x-w,y-w,cos(iTime*rate + 6.28*i/n)*(r/2.)+z));
            vec2 dete2 = det(vec3(sin(iTime*rate + 6.28*i/n)*r+x+w,y+w,cos(iTime*rate + 6.28*i/n)*(r/2.)+z));
            
            if(fin.x > dete1.x && fin.x < dete2.x &&
               fin.y > dete1.y && fin.y < dete2.y){
                returned = min(returned,cos(iTime*rate + 6.28*i/n)*0.5+0.4);
            }
        }
    }
    
    return returned;
}

void mainImage (out vec4 fout,in vec2 fin){
    fout = vec4(ist(fin));/*
    if (ist(fin)){
        fout = vec4(0);
    }else{
        fout = vec4(1);
    }*/
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
