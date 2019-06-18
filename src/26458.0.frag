#ifdef GL_ES
precision mediump float;
#endif


// i'm searching for a nice way to animate that texture instead of just panning it from upper right to lower left

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Created by S.Guillitte 


float hash( in vec2 p ) 
{
    return fract(sin(p.x*15.32+p.y*35.78) * 43758.23);
}

vec2 hash2(vec2 p)
{
	return vec2(hash(p*.754),hash(1.5743*p.yx+4.5891))-.5;
}


vec2 add = vec2(1.0, 0.0);

vec2 noise2(vec2 x)
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    
    return mix(mix( hash2(p),          hash2(p + add.xy),f.x ),
                    mix( hash2(p + add.yx), hash2(p + add.xx),f.x),f.y);
    
}



vec2 fbm2(vec2 x)
{
    vec2 r = x;
    float a = 1.;
    
    for (int i = 0; i < 4; i++)
    {
        r += noise2(r*a)/a;
	r += noise2(r*sin(time * 0.005));

    }     
    return (r-x)*sqrt(a);
}




void main( void ) 
{
    vec2 uv = 2.*gl_FragCoord.xy / resolution.yy;
    uv*=20.;
    vec2 p = fbm2(uv+1.*time)+2.;
    float c = length(p);
    vec3 col;
    col=vec3(0.6,0.7,0.8+.05*p.y)*c/5.;
	gl_FragColor = vec4(col,1.0);
}
