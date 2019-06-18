


// - glslfan.com --------------------------------------------------------------
// Ctrl + s or Command + s: compile shader
// Ctrl + m or Command + m: toggle visibility for codepane
// ----------------------------------------------------------------------------
precision mediump float;
uniform vec2  resolution;     // resolution (width, height)
uniform vec2  mouse;          // mouse      (0.0 ~ 1.0)
uniform float time;           // time       (1second == 1.0)
uniform sampler2D backbuffer; // previous scene

const float PI = 3.1415926;

vec3 rgb2hsv(vec3 hsv){
    vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(hsv.x) + t.xyz) * 6.0 - vec3(t.w));
    return hsv.z * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), hsv.y);
}

float dist(vec3 pos)
{
    pos.x += sin(pos.z * 0.2+ time * 10.0);
    pos.x = mod(pos.x, 4.0) - 2.0;
    return length(pos.yx) - 0.01;
}

vec3 calcNormal(vec3 pos)
{
    vec2 ep = vec2(0.001, 0.0);
    return normalize(vec3(
        dist(pos + ep.xyy) - dist(pos - ep.xyy),
        dist(pos + ep.yxy) - dist(pos - ep.yxy),
        dist(pos + ep.yyx) - dist(pos - ep.yyx)
    ));
}

vec3 calcColor(vec3 pos)
{
    return rgb2hsv(vec3(pos.x * 0.2, 1, 1));
}

void main(){
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
    
    vec3 pos = vec3(0, 5.0, -5);
    vec3 dir = normalize(vec3(p, 1.0));
    
    vec3 color = vec3(0, 0, 0) * length(p.xy) * sin(time * 10.0);
    
    float depth = 0.0;
    for (int i = 0; i < 64; ++i)
    {
        float d = dist(pos);
        pos += dir * d * 0.5;
        color += 0.005 / d * calcColor(pos);
        
        depth = float(i);
    }
    // mix(color, vec3(1.0, 1.0, 1.0), depth / 64.0)
    
    gl_FragColor = vec4(color, 1.0);
}

