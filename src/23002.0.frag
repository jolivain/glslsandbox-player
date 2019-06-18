//made by lucas
//---------------------------------------------------------
// Shader:   PeppermintCandyRain.glsl  
// author:   SeventySevian 2/2015
// original: https://www.shadertoy.com/view/4tsGz2
// comment:  Quite happy with my fisrt shader. Might not be 
//           optimal in any ways, but thanks to iq, T did learn a lot
// tags:     3d, raymarch, candy
//---------------------------------------------------------
#ifdef GL_ES
  precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define iGlobalTime (time*0.4)
//---------------------------------------------------------
#define MAX_STEPS 60
#define MAX_DISTANCE 30.0
#define EPSILON 0.01
#define NORMAL_EPSILON 0.1
#define CANDY_COUNT 10
#define CANDY_RADIUS 2.0
#define CANDY_HEIGHT 0.58
#define CANDY_SMOOTHNESS 0.5
#define FALL_SPEED 2.0   // Intended to be 10.0 but 2.0 for temp bug fix on Chrome

float smax(float a, float b, float k)
{
    float h = 1.0 - clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) + k*h*(1.0-h);
}

mat4 translate( float x, float y, float z )
{
    return mat4( 1.0, 0.0, 0.0, 0.0,
                 0.0, 1.0, 0.0, 0.0,
                 0.0, 0.0, 1.0, 0.0,
                   x,   y,   z, 1.0 );
}

mat4 inverse(mat4 m)
{
    return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}

vec3 rotateY(vec3 v, float angle)
{
    vec3 vo = v; 
    float cosa = cos(angle); 
    float sina = sin(angle);
    v.x = cosa*vo.x - sina*vo.z;
    v.z = sina*vo.x + cosa*vo.z;
    return v;
}

vec3 rotateX(vec3 v, float angle)
{
    vec3 vo = v; 
    float cosa = cos(angle); 
    float sina = sin(angle);
    v.y = cosa*vo.y - sina*vo.z;
    v.z = sina*vo.y + cosa*vo.z;
    return v;
}

vec4 map(vec3 p) 
{
    float dist = MAX_DISTANCE;
    vec3 local = vec3(0.0);
	
    for (int i = 0; i < CANDY_COUNT; i++) 
    {
     	float ratio = float(i) / float(CANDY_COUNT);
        vec3 q = p;
        
        // Make them fall
        q.y += (float(i) * 3.0) + (iGlobalTime * FALL_SPEED);
        
        // Duplicate along the height
        float c = 8.0 + (ratio * 10.0);
    	q = vec3(q.x, mod(q.y, c) - (0.5 * c), q.z);

        // Spread them appart
        q = (translate(cos(float(i)) * 7.0, 0.0, float(i) * -1.2) * vec4(q, 1.0)).xyz;
        
        // Apply the rotation
    	q = rotateX(q, (float(i) * 150.0) + iGlobalTime);
        q = rotateY(q, (float(i) * 150.0) + iGlobalTime);

        // Candy
        float d = length(q.xz) - CANDY_RADIUS;
        d = smax(d, abs(q.y) - CANDY_HEIGHT, CANDY_SMOOTHNESS);
        
        if (d < dist)
        {
            dist = d;
            local = q;
        }
    }
    return vec4(dist, local);
}

vec3 norm(vec3 point) 
{
    float d0 = map(point).x;
    float dX = map(point - vec3(NORMAL_EPSILON, 0.0, 0.0)).x;
    float dY = map(point - vec3(0.0, NORMAL_EPSILON, 0.0)).x;
    float dZ = map(point - vec3(0.0, 0.0, NORMAL_EPSILON)).x;
    return normalize(vec3(dX-d0, dY-d0, dZ-d0));
}

vec4 raymarch(vec3 rayOrigin, vec3 rayDir) 
{
    float d = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) 
    {
        vec3 point = rayOrigin + (rayDir * d);
        vec4 s = map(point);
        
        if (s.x < EPSILON) 
            return vec4(d, s.yzw);
        
        d += s.x;
        if (d > MAX_DISTANCE) 
            return vec4(MAX_DISTANCE, vec3(0.0));
    }
    return vec4(MAX_DISTANCE, vec3(0.0));
}

float softshadow( in vec3 ro, in vec3 rd, float mint, float maxt, float k )
{
    float res = 1.0;
    float dt = 0.1;
    float t = mint;
    for( int i=0; i<30; i++ )
    {
        float h = map(ro + rd*t).x;
        h = max(h,0.0);
        res = min( res, smoothstep(0.0,1.0,k*h/t) );
        t += dt;
        if( h<0.001 ) break;
    }
    return res;
}

void main(void)
{
    float lTime = time * mouse.x;
	// Obtain the screen uv
    vec2 uv = ((2.0 * gl_FragCoord.xy) - resolution.xy) / min(resolution.x, resolution.y);
    
    // Camera
    vec3 camPos = vec3(0.0, 2.0, -2.5);
    vec3 camLookAt = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(camLookAt - camPos);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = cross(up, forward);
    
    // Calculate a ray for each pixel
    vec3 rayDir = normalize((up * uv.y) + (right * uv.x) + (forward * 1.0));
    vec4 d = raymarch(camPos, rayDir);
    
    // Blue background
    vec4 col = mix(vec4(0.1, 0.3, 0.6, 1.0), vec4(0.15, 0.5, 1.0, 1.0), 1.0 - min(1.0, length(uv) / 1.4));
    
    if (d.x < MAX_DISTANCE) 
    {     
        // Calculate lighting
        vec4 ambient = vec4(0.1, 0.1, 0.3, 1.0);		// Blue-ish ambient light
        vec3 lightPos = vec3(0.0, 3.0, 1.0);
        vec3 point = camPos + rayDir * d.x;
        vec3 normal = norm(point);
        vec3 lightDir = -normalize(lightPos - point);
        float ndotl = max(0.0, dot(lightDir, normal));
        
        // Specular
        vec3 h = normalize(lightDir + forward);
        float nh = max(0.0, dot(normal, h));
        float spec = pow(nh, 48.0);
        
        // Add color
        vec4 red = vec4(0.9, 0.1, 0.1, 1.0);
        vec4 white = vec4(1.0, 0.96, 0.96, 1.0);
        float radius = length(d.yw);
        float angle = atan(d.w, d.y);
        float offset = 0.3 * sin(radius * 5.0) * 0.3;
        float stripe = cos((angle + offset) * 10.0) * 2.0;
        
        col = mix(white, red, max(0.0, stripe));
        col = mix(white, col, smoothstep(0.5, 2.0, radius));
        
        float shadow = softshadow(point, -lightDir, 0.06, 3.0, 3.0);
        col += spec * 0.4;
        
        col = mix(ambient, col, clamp(min(ndotl, shadow), 0.35, 1.0));
        
        // Gamma correction
        col = pow(clamp(col, 0.0, 1.0), vec4(0.45));
    }
    gl_FragColor = col; 
}
