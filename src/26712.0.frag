#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float f(vec2 p, vec2 centre, float mult)
{
    float radius = 0.09;
    
    float power = 0.5 + 3.5 * mult;
    power = clamp(power, 0.0, 4.0);
    vec3 a = vec3(p, radius);
    vec3 b = vec3(centre, 0.0);
    return dot(pow(abs(a-b), vec3(power)), vec3(1.0, 1.0, -1.0));
}

vec2 grad(in vec2 x, in vec2 centre, in float mult)
{
    vec2 h = vec2( 0.01, 0.0 );
    return vec2( f(x+h.xy, centre, mult) - f(x-h.xy, centre, mult),
                 f(x+h.yx, centre, mult) - f(x-h.yx, centre, mult) ) / (2.0*h.x);
}

void main()
{
	vec2 uv = gl_FragCoord.xy/resolution.xy;
    uv = -1.0+2.0*uv;
	uv.x *= resolution.x/resolution.y;    

    const float gridSize = 5.0;
   
    vec2 grid = vec2(gridSize);
    vec2 coord = floor(uv * grid) / grid;
    
    vec2 c = vec2(1.0/gridSize);
    vec2 p = mod(uv, c) - c*0.5;
    
    vec2 centre = vec2(0,0);
    
    float t = sin(abs(coord.x * coord.y) + time*2.0) * 0.5 + 0.5;
    t *= t;
    
    float v = f(p, centre, t);
    vec2  g = grad(p, centre, t);
    float de = v / length(g);
    
    vec2 mixVal = coord;
    mixVal*= mixVal;
    vec3 sCol = vec3(0.2 + mixVal * 0.8, 0.0) + vec3(0,0,1) * (1.0 - dot(abs(coord), vec2(1.0)));
    
    float edge = 5.0 / resolution.x;
    float border = smoothstep(0.0, edge * 2.0, abs(de));
    sCol *= border;

    vec3 col = vec3(0.3);
    col = mix( col, sCol, 1.0-smoothstep(0.0, edge, de));
    
    gl_FragColor = vec4(col,  1.0); 
}
