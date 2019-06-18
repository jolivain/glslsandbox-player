/*
 * Original shader from: https://www.shadertoy.com/view/td23zV
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

// --------[ Original ShaderToy begins here ]---------- //
// Impossible Chainmail by Martijn Steinrucken aka BigWings - 2019
// countfrolic@gmail.com
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// Inspired by:
// https://twitter.com/anniek_p/status/1092632749423370240
//
// After playing with it for a bit I realized that with the right settings, 
// this turns into a neat impossible knot
//
// Code is a bit of a mess, I know ;)

#define S(a, b, t) smoothstep(a, b, t)
#define R3 1.73205080757

vec2 s = vec2(1, R3);
vec4 red = vec4(1, .3, .3,1);
vec4 blue = vec4(.3, .3, 1,1);


vec4 HexCoords(vec2 uv, float angle) {
    
    vec2 h = .5*s;
    
    vec2 a = mod(uv, s)-h;
    vec2 b = mod(uv+h, s)-h;
    
    vec2 ab = dot(a,a)<dot(b,b) ? a : b;
    
    
    vec2 id = uv-ab;
    
    float d = length(s);
    vec2 hc = abs(ab);

    float x = min(hc.x, min( abs(dot(ab, s/d)), abs(dot(ab, vec2(1,-R3)/d))));
    float y = min(1.-2.*hc.x, 1.-dot(hc, s));
    
    return vec4(x, y, id.x, id.y);
}

vec4 HexCol(vec2 uv, vec2 offs, float waveSpeed, float size) {

    vec4 hc = HexCoords(uv, 1.);
	
    float cd = length(hc.zw-offs);
    if(cd>1.75)  return vec4(0);
    
    
    float center = size;//mix(.2, .37, sin(iTime)*.5+.5);
    float c = abs(hc.y-center);
    //cd = length(uv-offs);
    float w = .15;//-sin(cd*3.+iTime*0.)*.05;
    float mainMask = S(w, w*.9, c);
    
    vec4 col = vec4(1.);
    
    
    vec2 hv = uv-hc.zw;
    float x = atan(hv.x, hv.y);
    float swap = sign(cos(x*3.))*.01;
    float corners = S(.01, .0, hc.x);
    corners *= S(center, center+swap, hc.y);

    float edges = S(.01, .03, abs(c-w*.9))*S(.01, .02, c);
    
    float side = step(center, hc.y);
    
    float wave = sin(x*3.+iTime*waveSpeed);
    
    x = x/6.2831+.5;
    
    float sector = x;
    
    x = fract(x+.333+ .333*1.5*side)*3.;		// three sectors
    float shade = floor(x)/2.;
    shade = shade*.7+.3 +(wave*.5+.5)*step(.75, shade);
    //shade *= 1.+S(0., .5, wave)*step(shade, .75);
    
    col.r = shade*edges;
    col.g = sector;
    col.b = corners;
    col.a = mainMask;
    

    return col;
}

float SS(float x) { return S(0.,1.,S(0.,1.,S(0.,1.,x)));}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //vec2 m = iMouse.xy/iResolution.xy;
    
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    float t = iTime*2.;
    
    float fade = SS(cos(t)*.5+.5);
    float fade2 = SS(cos(t*.5));
    
    float size = .3+fade*.2;
    
    vec3 col = vec3(.25,.2,.2)*3.-length(uv)*.5;
	
    float grid = 4.;
   	
    vec2 UV = uv*grid+vec2(.5,-.3);
    
    vec2 offs = (1.-fade)*vec2(sin(t), cos(t))*.03;
    
    vec4 hex1 = HexCol(UV+offs, vec2(.3,-.3), 1., size);
    vec4 hex2 = HexCol(UV+vec2(.5,-.2886)-offs, vec2(1.,-.3), -1.,size);
    
    float sector = mod(floor(hex1.g*6.)+1., 2.);
    
    vec4 col1 = mix(red, blue, fade2);
    col1-=hex1.b*step(sin((hex1.g+.1)*6.*3.1415), 0.);
    
    vec4 col2 = mix(blue, col1, fade);
    //col2 = mix(col2, col1, colSwap);
    col2-=hex2.b*step(sin((hex2.g+.2)*6.*3.1415), 0.);
    
    col1.a=col2.a=1.;
    vec4 hexCol = mix(
        hex1.x*col1, 
        hex2.x*col2, 
        hex2.a*max(sector, (1.-hex1.a))
    );
    hexCol.a = max(hex1.a, hex2.a);
    //hexCol = hex1.x*vec4(1., .3, .3,1); hexCol.a = hex1.a; 
    col = mix(col, hexCol.rgb, hexCol.a);
  
    //if(abs(uv.x)<.002 || abs(uv.y)<.002) col += 1.;
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
