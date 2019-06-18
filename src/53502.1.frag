/*
 * Original shader from: https://www.shadertoy.com/view/4sc3Wn
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
float pi = atan(1.0)*4.0;
float tau = atan(1.0)*8.0;

float scale = 1.0 / 6.0;

float epsilon = 1e-3;
float infinity = 1e6;

//Settings
//Uses cheaper arcs for common sweep angles (90 & 180 degrees).
#define USE_CHEAP_ARCS

#define TEXT_COLOR   vec3(1.00, 0.20, 0.10)
#define BORDER_COLOR vec3(0.05, 0.20, 1.00)

#define BRIGHTNESS 0.004
#define THICKNESS  0.002

//Checks if a and b are approximately equal.
bool ApproxEqual(float a, float b)
{
    return abs(a - b) <= epsilon;
}

//Distance to a line segment,
float dfLine(vec2 start, vec2 end, vec2 uv)
{
	start *= scale;
	end *= scale;
    
	vec2 line = end - start;
	float frac = dot(uv - start,line) / dot(line,line);
	return distance(start + line * clamp(frac, 0.0, 1.0), uv);
}

//Distance to an arc.
float dfArc(vec2 origin, float start, float sweep, float radius, vec2 uv)
{
	origin *= scale;
	radius *= scale;  
	uv -= origin;
    
	uv *= mat2(cos(start), sin(start),-sin(start), cos(start));
	
    #ifdef USE_CHEAP_ARCS
        if(ApproxEqual(sweep, pi)) //180 degrees
        {
            float d = abs(length(uv) - radius) + step(uv.y, 0.0) * infinity;
            d = min(d, min(length(uv - vec2(radius, 0)), length(uv + vec2(radius, 0))));
            return d;
        }
        else if(ApproxEqual(sweep, pi/2.0)) //90 degrees
        {
            float d = abs(length(uv) - radius) + step(min(uv.x, uv.y), 0.0) * infinity;
            d = min(d, min(length(uv - vec2(0, radius)), length(uv - vec2(radius, 0))));
            return d;
        }
        else //Others
        {
            float offs = (sweep / 2.0 - pi);
            float ang = mod(atan(uv.y, uv.x) - offs, tau) + offs;
            ang = clamp(ang, min(0.0, sweep), max(0.0, sweep));

            return distance(radius * vec2(cos(ang), sin(ang)), uv); 
        }
    #else
        float offs = (sweep / 2.0 - pi);
        float ang = mod(atan(uv.y, uv.x) - offs, tau) + offs;
        ang = clamp(ang, min(0.0, sweep), max(0.0, sweep));

        return distance(radius * vec2(cos(ang), sin(ang)), uv);
	#endif
}

float dfLogo(vec2 uv)
{
	float dist = infinity;

	dist = min(dist, dfLine(vec2(0.267,1.200), vec2(0.533,1.200), uv));
	dist = min(dist, dfLine(vec2(0.267,0.667), vec2(0.533,0.667), uv));
	dist = min(dist, dfLine(vec2(0.533,0.000), vec2(0.067,0.000), uv));
	dist = min(dist, dfLine(vec2(0.400,0.133), vec2(0.067,0.133), uv));
	dist = min(dist, dfLine(vec2(1.000,1.200), vec2(1.000,0.067), uv));
	dist = min(dist, dfLine(vec2(1.133,0.067), vec2(1.133,0.533), uv));
	dist = min(dist, dfLine(vec2(1.200,0.600), vec2(1.667,0.600), uv));
	dist = min(dist, dfLine(vec2(1.733,0.667), vec2(1.733,1.133), uv));
	dist = min(dist, dfLine(vec2(1.867,1.133), vec2(1.867,0.000), uv));
	dist = min(dist, dfLine(vec2(3.000,0.067), vec2(3.000,1.200), uv));
	dist = min(dist, dfLine(vec2(3.867,0.333), vec2(3.867,0.867), uv));
	dist = min(dist, dfLine(vec2(3.533,1.200), vec2(3.000,1.200), uv));
	dist = min(dist, dfLine(vec2(3.133,0.067), vec2(3.133,1.000), uv));
	dist = min(dist, dfLine(vec2(3.533,0.000), vec2(3.267,0.000), uv));
	dist = min(dist, dfLine(vec2(4.867,1.200), vec2(4.000,1.200), uv));
	dist = min(dist, dfLine(vec2(4.000,1.200), vec2(4.000,0.667), uv));
	dist = min(dist, dfLine(vec2(4.000,0.000), vec2(4.867,0.000), uv));
	dist = min(dist, dfLine(vec2(4.467,0.667), vec2(4.000,0.667), uv));
	dist = min(dist, dfLine(vec2(4.467,0.533), vec2(4.000,0.533), uv));
	dist = min(dist, dfLine(vec2(4.000,0.533), vec2(4.000,0.000), uv));
	dist = min(dist, dfLine(vec2(5.000,0.000), vec2(5.000,1.200), uv));
	dist = min(dist, dfLine(vec2(5.000,1.200), vec2(5.533,1.200), uv));
	dist = min(dist, dfLine(vec2(5.533,0.533), vec2(5.205,0.533), uv));
	dist = min(dist, dfLine(vec2(5.166,0.413), vec2(5.716,0.013), uv));
	dist = min(dist, dfLine(vec2(5.410,0.400), vec2(5.794,0.121), uv));
	dist = min(dist, dfLine(vec2(6.000,1.200), vec2(6.333,1.200), uv));
	dist = min(dist, dfLine(vec2(6.467,0.067), vec2(6.467,1.200), uv));
	dist = min(dist, dfLine(vec2(6.333,0.067), vec2(6.333,1.200), uv));
	dist = min(dist, dfLine(vec2(6.467,1.200), vec2(6.800,1.200), uv));
	dist = min(dist, dfLine(vec2(7.000,1.000), vec2(7.000,0.333), uv));
	dist = min(dist, dfLine(vec2(7.333,0.000), vec2(7.467,0.000), uv));
	dist = min(dist, dfLine(vec2(7.800,0.333), vec2(7.800,0.867), uv));
	dist = min(dist, dfLine(vec2(7.133,0.867), vec2(7.133,0.733), uv));
	dist = min(dist, dfLine(vec2(8.467,0.067), vec2(8.467,0.533), uv));
	dist = min(dist, dfLine(vec2(8.467,0.533), vec2(8.800,1.200), uv));
	dist = min(dist, dfLine(vec2(2.530,1.153), vec2(2.864,0.087), uv));
	dist = min(dist, dfLine(vec2(2.403,1.153), vec2(2.043,0.000), uv));
	dist = min(dist, dfLine(vec2(2.626,0.400), vec2(2.736,0.047), uv));
	dist = min(dist, dfLine(vec2(2.626,0.400), vec2(2.307,0.400), uv));
	dist = min(dist, dfLine(vec2(8.333,0.067), vec2(8.333,0.533), uv));
	dist = min(dist, dfLine(vec2(8.333,0.533), vec2(8.000,1.200), uv));

	dist = min(dist, dfArc(vec2(0.267,0.933),1.571, 3.142, 0.267, uv));
	dist = min(dist, dfArc(vec2(0.067,0.067),1.571, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(0.533,0.333),4.712, 3.142, 0.333, uv));
	dist = min(dist, dfArc(vec2(1.067,0.067),3.142, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(1.200,0.533),1.571, 1.571, 0.067, uv));
	dist = min(dist, dfArc(vec2(1.667,0.667),4.712, 1.571, 0.067, uv));
	dist = min(dist, dfArc(vec2(1.800,1.133),0.000, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(3.067,0.067),3.142, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(3.533,0.867),0.000, 1.571, 0.333, uv));
	dist = min(dist, dfArc(vec2(3.533,0.333),4.712, 1.571, 0.333, uv));
	dist = min(dist, dfArc(vec2(4.467,0.600),4.712, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(5.533,0.867),4.712, 3.142, 0.333, uv));
	dist = min(dist, dfArc(vec2(5.205,0.467),1.571, 2.513, 0.067, uv));
	dist = min(dist, dfArc(vec2(5.755,0.067),4.084, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(6.400,0.067),3.142, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(7.467,0.867),0.000, 3.142, 0.333, uv));
	dist = min(dist, dfArc(vec2(7.467,0.333),4.712, 1.571, 0.333, uv));
	dist = min(dist, dfArc(vec2(7.333,0.333),3.142, 1.571, 0.333, uv));
	dist = min(dist, dfArc(vec2(8.400,0.067),3.142, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(2.800,0.067),3.444, 3.142, 0.067, uv));
	dist = min(dist, dfArc(vec2(2.467,1.133),0.303, 2.536, 0.067, uv));

	return dist;
}

float dfBorder(vec2 uv)
{
    float dist = infinity;
    
	dist = min(dist, dfLine(vec2(0.067,1.533), vec2(8.733,1.533), uv));
	dist = min(dist, dfLine(vec2(9.133,1.133), vec2(9.133,0.067), uv));
	dist = min(dist, dfLine(vec2(8.733,-0.333), vec2(4.467,-0.333), uv));
	dist = min(dist, dfLine(vec2(-0.333,0.067), vec2(-0.333,1.133), uv));
	dist = min(dist, dfLine(vec2(0.067,1.400), vec2(4.333,1.400), uv));
	dist = min(dist, dfLine(vec2(9.000,1.133), vec2(9.000,0.067), uv));
	dist = min(dist, dfLine(vec2(8.733,-0.200), vec2(0.067,-0.200), uv));
	dist = min(dist, dfLine(vec2(-0.200,0.067), vec2(-0.200,1.133), uv));
	dist = min(dist, dfLine(vec2(4.333,-0.333), vec2(0.067,-0.333), uv));
	dist = min(dist, dfLine(vec2(4.467,1.400), vec2(8.733,1.400), uv));
	dist = min(dist, dfArc(vec2(8.733,1.133),0.000, 1.571, 0.400, uv));
	dist = min(dist, dfArc(vec2(8.733,0.067),4.712, 1.571, 0.400, uv));
	dist = min(dist, dfArc(vec2(0.067,0.067),3.142, 1.571, 0.400, uv));
	dist = min(dist, dfArc(vec2(0.067,1.133),1.571, 1.571, 0.400, uv));
	dist = min(dist, dfArc(vec2(8.733,1.133),0.000, 1.571, 0.267, uv));
	dist = min(dist, dfArc(vec2(8.733,0.067),4.712, 1.571, 0.267, uv));
	dist = min(dist, dfArc(vec2(0.067,0.067),3.142, 1.571, 0.267, uv));
	dist = min(dist, dfArc(vec2(0.067,1.133),1.571, 1.571, 0.267, uv));
    
    return dist;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
{
	vec2 aspect = iResolution.xy / iResolution.y;
	vec2 uv = fragCoord.xy / iResolution.y - aspect/2.0;
	
    vec2 offs = vec2(9.0, 1.5) * scale/2.0;
    
    float dist = 0.0;
    float shade = 0.0;
    vec3 color = vec3(0);
    
    //Flicker fade in effect.
    float t = mod(iTime, 5.0);
    float tf_text = max(epsilon, t - 0.6);
    float bright_text = BRIGHTNESS * min(1.0, 1.0 - sin(tf_text * pi * 50.0) / (tf_text * pi * 1.3));
    
    float tf_bord = max(epsilon, t - 0.5);
    float bright_bord = BRIGHTNESS * min(1.0, 1.0 - sin(tf_bord * pi * 50.0) / (tf_bord * pi * 1.3));
    
    //"Shadertoy"
	dist = dfLogo(uv + offs);
	
	shade = bright_text / max(epsilon, dist - THICKNESS);
	
	color += TEXT_COLOR * shade;
    
    //Border
    dist = dfBorder(uv + offs);
	
	shade = bright_bord / max(epsilon, dist - THICKNESS);
	
	color += BORDER_COLOR * shade;
	
	fragColor = vec4(color , 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
