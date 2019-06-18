// attempt to do something with minkowski space
// based on: https://www.shadertoy.com/view/ll2XRD
// nabr

precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;



// generalized distance fields using minkowski space
// https://pdfs.semanticscholar.org/fa9c/b8957468892bf660f3afda3c002f6d468a81.pdf <<origional paper
// http://glslsandbox.com/e#48340.2 < simplified example
// sphinx
#define minkowski(v,m) pow(dot(pow(v, v*0.+m), v*0.+1.), 1./m)


float map(in vec3 p)
{ 

    float x = 2.0 * (cos(p.x) * sin(time-p.y));
    float y = cos(time -p.z);
    
    float m = minkowski(abs(p), ( 12.0 + cos(time) * 10.0) ) - .51;
    float disk = 0.005 + sqrt(x * x + y * y ); 
    
    return min(m, disk);
}


mat3 rmat(float a, float b) 
{	
	float c = cos(a), s = sin(a), c1 = cos(b), s1 = sin(b);
	return mat3(1, 0, 0, 0, c1, -s1, 0, s1, c1) * mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

void main()
{
 	
    // ----------------------- CAMERA
    
    vec2 st = 2.0 * gl_FragCoord.xy / resolution.xy - 1.0;
    float aspect = (resolution.x / resolution.y);
    
    vec3 ro = vec3( 0.001, 0.001, -3.0);
    
    vec3 lookAt = vec3(0.001);
    vec3 up = vec3(0.001, 1.001, 0.001);
    float fov = 95.001;
    vec3 g = normalize(lookAt - ro.xyz);
    vec3 u = normalize(cross(g, up));
    vec3 v = normalize(cross(u, g));
    u = u * tan(radians(fov * 0.501)); 
    v = v * tan(radians(fov * 0.501)) / aspect;
    vec3 rd = normalize(g + st.x * u + st.y * v);
    
     
    // mouse and basic rotation
    vec2 mouse = 2.5 * atan(( 3.14 * (mouse.xy) -1.) * vec2(aspect, 1.0) );
    // 
    mat3 rot = rmat(mouse.x , mouse.y );
    rd = rot * rd;
    ro = rot * ro;
    
    
    // ----------------------- RAYMARCH

    vec3 color = vec3(0.0);
    float t = 0.0; float d = 0.0;
    
    for (float i= 0.;i < 1.0; i += 0.013 )
    {
        
        if (d >= 0.001 && t > 100.0 ) break;
        d = map(ro+t*rd) * 0.85;
        d = max(d, 0.003);
        t += d;
        
    }
    
    // ----------------------- SHADE
    
    if(-(st.y) < 0.95)
    {
        color = (t * vec3(0.12, 0.2, 0.24)) *  t * 0.0012;
    };
    
        
    //
    gl_FragColor.rgb = rd+sqrt(color);
    gl_FragColor.a = 1.0;
}
