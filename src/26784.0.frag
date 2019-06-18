// VoronoiAura by Ethan Alexander Shulman 2015-7-25  https://twitter.com/EthanShulman
// This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
// http://creativecommons.org/licenses/by-nc-sa/4.0/
// a variation by I.G.P.

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float voronoi(in vec2 uv) 
{
    vec2 lp = abs(uv)*10.;
    vec2 sp = fract(lp)-.5;
    lp = floor(lp);
    
    float d = 1.;
    for (int x = -1; x < 2; x++)
    {
        for (int y = -1; y < 2; y++)
        {
            vec2 mp = vec2(float(x),float(y));
            vec2 p = lp+mp;
            
            d = min(d,length(sp+(cos(p.x+time)+cos(p.y+time))*.3-mp));
        }
    }
    return 0.1 * d / pow(length(uv),1.5);
}

void main( void )
{
    vec2 uv = 2. * (gl_FragCoord.xy / resolution.xy - vec2(.5));
    uv.y *= resolution.y / resolution.x;
    
    float ang = atan(uv.y, uv.x);
    float dst = length(uv);
    float cfade = clamp(dst*40.-3.+cos(ang*1.+cos(ang*6.)*1.+time*2.)*.68,0.,1.);
    
    float a = 0.;
    for (int i = 3; i < 7; i++) 
    {
        float fi = float(i);
        vec2 luv = uv+cos((ang-dst)*fi+time+uv+fi)*.3;
    	a += voronoi(luv)*(.7+(cos(luv.x*14.234)+cos(luv.y*16.234))*.4);
    }
    vec3 color = vec3(0.86, .6 ,0.139);
    gl_FragColor = vec4(color*a*cfade,1.);
}

