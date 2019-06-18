/*
 * Original shader from: https://www.shadertoy.com/view/XdyBzz
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
//////////////////////////////////////////////////////////////////////////////////
// Infinite Yin Yang Zoom - Copyright 2017 Frank Force
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//////////////////////////////////////////////////////////////////////////////////

const float zoomSpeed			= 0.6;	// how fast to zoom (negative to zoom out)
const float zoomScale			= 0.01;	// how much to multiply overall zoom (closer to zero zooms in)
const float saturation			= 0.0;	// how much to scale saturation (0 == black and white)
const float turnSpeed			= 0.6;	// how fast to rotate (0 = no rotation)
//const float dotSize 			= 0.3;	// how much to scale recursion at each step
//const int   recursionCount	= 6;	// how deep to recurse
//const float blur				= 4.0;	// how much blur
//const float outline			= 0.015; // how thick is the outline

//#define dotSize (iMouse.x/iResolution.x)

//////////////////////////////////////////////////////////////////////////////////
    
const float pi = 3.14159265359;
const float e = 2.718281828459;
float RandFloat(int i) { return (fract(sin(float(i)) * 43758.5453)); }
vec2 Rotate(vec2 p, float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return vec2((p.x*c - p.y*s), (p.x*s + p.y*c));
}
vec4 HsvToRgb(vec4 c) 
{
    float s = c.y * c.z;
    float s_n = c.z - s * .5;
    return vec4(s_n) + vec4(s) * cos(2.0 * pi * (c.x + vec4(1.0, 0.6666, .3333, 1.0)));
}

float GetFocusRotation(int i, bool side) 
{ 
    //float theta =  pi/2.0 + (pi/8.0)*float(i)*float(i);
    //return theta + turnSpeed*iTime; 
        
    //if (side)
    //   i += 1;
    
    float theta = 2.0*pi*RandFloat(i);
    return theta + turnSpeed*mix(-1.0, 1.0, RandFloat(30+i))*iTime; 
}

bool GetFocusSide(int i)
{
    return (RandFloat(50+i) < 0.5);
}

vec2 GetFocusPos(int i )
{ 
    bool side = GetFocusSide(i);
    vec2 p = vec2(0.0, side? -0.5 : 0.5); 
    return Rotate(p, GetFocusRotation(i, side));
}

//////////////////////////////////////////////////////////////////////////////////

float YinYang2( vec2 p, out float dotDistance, float co, float scale, float dotSize, float blur)
{
   	float b = blur*scale/min(iResolution.y, iResolution.x);
    float d = dotSize;
    
    float c = 1.0;
    float r;
    
    // bottom
    r = length(2.0*p + vec2(0, 1));
    if (p.x < 0.0)
    {
       if (r > 1.0)
           c = 0.0;
    }
    dotDistance = r;
    
    // top
    r = length(2.0*p - vec2(0, 1));
    if (p.x >= 0.0)
    {
       if (r < 1.0)
           c = 0.0;
    }
    if (p.y >= 0.0)
         dotDistance = r;
    
    // outline
    //r = length(p);
    //c = mix(c, co, smoothstep(1.0-b, 1.0, r));
    
    return c;
}

vec4 RecursiveYinYang(vec2 p, int iterations, float scale, float dotSize)
{
    int recursionCount = int(mix(4.0, 18.0, dotSize));
    float outline	= 0.;//mix(0.015, 0.0, dotSize);
    float blur		= 0.0;//mix(4.0, 0.0, dotSize);
    
    bool side = (p.y > 0.0);
    // recursive iteration
    float co = 0.0;
    for (int r = 0; r < 18; ++r)
    {
        // apply rotation
  		float theta = -GetFocusRotation(iterations + r, side);
        p = Rotate(p, theta);
        
        float dotDistance = 0.0;
        co = YinYang2(p, dotDistance, co, scale, dotSize, blur);
        
        if (dotDistance > dotSize || r == recursionCount)
        {
            float co2 = (p.y < 0.0)? 0.0 : 1.0;
   			float b = 0.0;//blur*scale/min(iResolution.y,iResolution.x);
            
            //co = mix(co2, co, smoothstep(dotSize+outline,dotSize+outline+b,dotDistance));
            int i2 = (dotDistance < dotSize+outline+b && p.y > 0.0)? 1 : 0;
            float hue = 0.233*float(iterations + r + i2);
            return vec4(hue, saturation*co, co, 1.0); // stop if outside or reached limit
        }
        
		// check if top or bottom
        side = (p.y > 0.0);
        co = side? 1.0 : 0.0;
        p.y += mix(0.5, -0.5, co);
        
        scale *= 2.0/dotSize;
        p *= 2.0/dotSize;		// apply recursion scale
        p = Rotate(p, -theta);	// cancel out rotation
    }
    return vec4(0);
}

//////////////////////////////////////////////////////////////////////////////////

void mainImage( out vec4 color, in vec2 uv )
{
    // fixed aspect ratio
    
	uv = (2.0*uv-iResolution.xy)/min(iResolution.y,iResolution.x);
    
	vec2 p = uv;
    vec2 p2 = p;
    
    // wander center
	p.x += 0.3*sin(0.234*iTime);
	p.y += 0.3*sin(0.2*iTime);
    
	// get time 
	float timePercent = iTime*zoomSpeed;
	int iterations = int(timePercent);
	timePercent -= floor(timePercent);
    
    float dotSize = 1.0;
    //float dotSize = iMouse.x/iResolution.x;
    
	// update zoom, apply pow to make rate constant
    float recursionSize = 2.0 / dotSize;
	float zoom = pow(e, -log(recursionSize)*timePercent);
	zoom *= zoomScale;
    
	// get focus offset
	vec2 offset = GetFocusPos(iterations);
	for (int i = 0; i < 20; ++i)
        offset += (GetFocusPos(iterations+i+1) / recursionSize) * pow(1.0 / recursionSize, float(i));
    
    // apply zoom and offset
	p = p*zoom + offset;
    
    // make the yin yang
    color = RecursiveYinYang(p, iterations, zoom, dotSize);

    //vec4 color1 = vec4(0.0,0.0,0.4,1.0);
    //vec4 color2 = mix(vec4(0.0,1.0,1.0,1.0), vec4(1.0,1.0,1.0,1.0), uv.y);
    //color = mix(color1, color2, color.z);
    
    //color.x = 0.0;
    //color.y = 0.1;
    
    // wander hue
    //color.x += (0.1*p2.y + 0.1*p2.x + 0.05*iTime);
    
    // map to rgp space
    color = HsvToRgb(color);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
