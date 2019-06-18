/*
 * Original shader from: https://www.shadertoy.com/view/WslXDr
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
#define PI 3.141592

float drawRect() {
	return 0.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 R = iResolution.xy;
    vec2 uv = ( fragCoord - .5*R) / R.y;

   	float t = PI*iTime/5.0;
    
    uv += vec2(0.2*t,0.0);
    
    vec2 id = floor(5.0*uv+0.5);
    uv = fract(5.0*uv+0.5)-0.5;
    
    vec3 colorGreen = vec3(63,104,19)/255.;
    vec3 colorBlue = vec3(55.,94.,151.)/255.;
    vec3 colorRed = vec3(255,204,187)/255.;
    vec3 colorYellow = vec3(110,181.,192)/255.;

    
    float a = PI/4.;
    
	vec3 col = vec3(0.0);     
    float r = 0.5;

    for (float x = -1.; x <= 1.; x += 1.) {
        for (float y = -1.; y <= 1.; y += 1.) {
            vec2 offset = vec2(x,y);
            
            vec2 id2 = (id+offset);
            vec2 uv2 = (uv-offset);
            
            float t2 = -2.0*t+id2.x/5.+abs(id2.y)/10.;
            
            float r2 = 0.5+0.15*sin(4.0*t2);
            
            float a2 = a + PI/4.*(floor(t2)+smoothstep(0.1,.5,fract(t2)));
            
            uv2 *= mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
            
            float multiplier = 0.95;
            
            float dx = smoothstep(r2,r2*multiplier,abs(uv2.x));
            float dy = smoothstep(r2,r2*multiplier,abs(uv2.y));

            float pct = smoothstep(-.5,.5,sin(2.0*t2));


            vec3 color = mix(colorYellow, colorRed, pct);
            
            col += (dx * dy)*color;
        }
    }


    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
