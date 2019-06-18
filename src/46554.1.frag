/*
 * Original shader from: https://www.shadertoy.com/view/Ms3BzN
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
// The MIT License
// Copyright Â© 2018 Charles Durham, 2014 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// Stolen hsl2rgb function from https://www.shadertoy.com/view/lsS3Wc

//========================================================================

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

vec3 color(in vec2 p)
{
    float pi = 3.141593;
    float theta = atan(p.y,p.x);
    float h = theta/(2.0*pi);
    float s = 0.5;
    float v = 0.6*length(p);
    vec3 hsv = vec3 (h,s,v);
    return hsl2rgb(hsv);
}

vec2 func(in vec3 p)
{
    float x = p.x;
    float y = p.y;
    float t = p.z;
    float f = sin(2.0*sin(0.02*t)*y - 3.0*cos(0.03*t)*x)*exp(-abs (sin(0.11*t)*sin (3.0*x+1.0-2.0*y) - sin(0.19*t)*cos(x-3.0*y+1.0)));
    float g = cos(2.0*sin(0.07*t)*y - 3.0*cos(0.05*t)*x)*exp(-abs (cos(0.13*t)*cos (3.0*x+1.0-2.0*y) - cos(0.17*t)*cos(x-3.0*y+1.0)));
    return vec2(f,g);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    //Stretch to be between from -4 to 4
    float h = 4.0;
    uv = vec2(h*2.0)*uv - vec2(h);
    
    //Scale time by 10
    float t = iTime * 10.0;
    
    uv = func(vec3(uv,t));

    vec3 col = color(uv);

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
