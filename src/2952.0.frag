// @mod* rotwang

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec4 mouse;

//float u( float x ) { return 0.5+0.5*sign(x); }
float u( float x ) { return (x>0.0)?1.0:x; }
//float u( float x ) { return abs(x)/x; }

void main(void)
{
	float td8 = time  / 8.0;
	
    vec2 p = (2.0*gl_FragCoord.xy-resolution)/resolution.y;

    float a = atan(p.x,p.y);
	a = a*a;
    float r = length(p)*0.9;

	float sides = 1.0;
	float rings = 1.0;
    float w = cos(3.1415927*td8-r);
    float h = 0.75+0.5*cos(sides*a-w*sides*rings+r*3.0);
    float d = 0.5+0.75;
	d*=pow(h,1.0*r)*(0.75+0.1*w);

    float col = u( d-r ) * sqrt(1.0-r/d)*r*1.66;
     col *= 1.25+0.25*cos((12.0*a-w*7.0+r*8.0)/2.0);
     col *= 1.0 - 0.35*(0.5+0.5*sin(r*30.0))*(0.5+0.5*cos(12.0*a-w*7.0+r*8.0));
    gl_FragColor = vec4(
        col,
        col-h*0.5+r*.2 + 0.55*h*(1.0-r),
        col-h*r + 0.1*h*(1.0-r),
        1.0);
}
