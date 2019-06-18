/*
 * Based on original shader from: https://www.shadertoy.com/view/3dj3Wm
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

// --------[ Original ShaderToy begins here ]---------- //
void mainImage( out vec4 O, vec2 u )
{
    vec2 R = resolution.xy, U = u/R;
    float x = 2.*U.x, y = U.y*5., i=floor(y), v,e; 
    
    if (i==0.) v = sqrt(x),      e = (v*v-x) * 1e6;
    if (i==1.) v = sqrt(1.-x*x), e = ( sqrt(1.-v*v) - x ) * 1e6;
    if (i==2.) v = atan(x),      e = ( tan(v)  - x ) * 1e6;
    if (i==3.) v = log(x),       e = ( exp(v)  - x ) * 1e6;
    if (i==4.) v = sin(x),       e = ( asin(v) - x ) * 1e6;
    
    O = vec4( fract(y) < .5 + e ); //O.x += float(isnan(e));
    
    if (int(mod(floor(u.y),floor(resolution.y/5.))) == 0)
        O = vec4(1,0,0,1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
