/*
 * Original shader from: https://www.shadertoy.com/view/Ws2XRK
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
//Created By Seyed Morteza Kamali

#define accurate 10.

vec3 hsv2rgb( in vec3 c ) {
  vec3 rgb = clamp( abs(mod(c.x*1.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
  return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 getCol(vec3 n){
  return hsv2rgb(vec3(mod(n.z*100.,1.0),1.,0.8));
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec3 pixelColor(vec2 p)
{
    
    
    p = vec2(p.x, -p.y) / length((p*p)) ;

    
    
  vec2 z = vec2(p);  
  for (float i = 1.; i <= accurate; i++)
    {  

    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + p; 
    z.x *= mix(1.,atan(i,i)/2.9,abs(cos(iTime)));
   
   // z += vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);     

    if (504.0 + 300.0 < dot(z, p))
        {
      return getCol(vec3(0.,0.,z.x));
    }
  }

    
    
    return vec3(1.);
    
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    
    
    
  vec2 c = 1.8*(-2.0*fragCoord.xy/iResolution.xy + 0.9)*vec2(iResolution.x/iResolution.y, 1.0) + vec2(0.25, 0.2);
    
	c = rotate2d(4.705)*c;
    
    const float a = 2.0;
    float e = 1.0/min(iResolution.x, iResolution.y);    
    vec3 col = vec3(0.0);
    
    for (float j = -a; j < a; j++)
        for (float i = -a; i < a; i++)
            col += pixelColor(c + 2.1*vec2(i, j) * (e/a)) / (4.0*a*a);

  fragColor = vec4(col, 1.0);
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
