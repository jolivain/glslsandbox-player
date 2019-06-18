/*
 * Original shader from: https://www.shadertoy.com/view/4sGyzt
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
float iTime = 0.0;
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Time simplification and easier overall speed control.
#define time iTime * 0.5

const vec3 FogColor = vec3(1.6, 0.80, 0.00);

// Rotation matrix, to add more variety to FBM.
const mat2 m = mat2( 1.4,  1.0, -1.0,  1.4 );

// Check without any rotation.
//const mat2 m = mat2( 1.0,  1.0, -1.0,  1.0 );

vec2 hash( vec2 p ) 
{ 
    p = vec2( dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5,183.3))); 
    return fract(cos(p) * 12.5453); 
}


float voronoi2D(in vec2 n)
{
    float dis = 2.0;
    for (int y= -1; y <= 1; y++) 
    {
        for (int x= -1; x <= 1; x++) 
        {
            // Neighbor place in the grid
            vec2 p = floor(n) + vec2(x,y);

            float d = length(hash(p) + vec2(x, y) - fract(n));
            
            if (dis > d)
            {
             	dis = d;
            }
        }
    }
    
    return dis * dis;
}

// Four octave voronoi FBM.
float fbm4( vec2 p )
{
    float f = 0.0;
    f += 0.5000 * voronoi2D( p ); p = p * 2. * m;
    f += 0.2500 * voronoi2D( p ); p = p * 2. * m;
    f += 0.1250 * voronoi2D( p ); p = p * 2. * m;
    f += 0.0625 * voronoi2D( p );
    return f;
}

float map(vec3 p) 
{
    float pattern = voronoi2D(p.xz) * fbm4(p.xz) + p.y;
     
    // Return the height hit point.
    return pattern;
}

float trace(vec3 ro, vec3 rd)
{
    float t = 0., d;

    for (int i = 0; i < 64; i++)
    { 
        d = map(ro + rd * t);
        if (abs(d) < .001 * (t * .125 + 2.) || t > 20.) break;

        t += d *.5;
    }
	
    // We either hit something, or exceeded the drawdist.
    return min(t, 20.);
}

// Main color mixing function.
vec3 GetColor(vec3 p, float t)
{
    float f = voronoi2D(p.xz) + fbm4(p.xz) + p.y * 0.5;
    
    f = mix( f, f * f * f * 3.5, f * abs(p.y));
    
    vec3 col = vec3(0.0);
    
    col = mix( vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 2.0), f * f);
    
    // Ridges color animation.
    col = mix( col, vec3( 1.74, 0.95, 0.0), 2.5 * smoothstep(0.2, 1.8, 2.5 * fbm4(p.xz) + 0.3 * sin(time) * sin(time)));
    
	// Gamma correction.
    return col * col * 0.4545;
}

// Using the hit point, unit direction ray, etc, to color the scene. Diffuse, specular, shadows etc.
// Personally i'm not yet very familiar with all the lighting techniques, so making the basics only.
vec3 doColor(in vec3 ro, in vec3 rd, in vec3 lp, float t)
{
    // Initiate the scene (for this pass) to zero.
    vec3 sceneCol = vec3(0.18, 0., 0.35) - rd.y;

    if (t < 20.)
    {
        // Advancing the ray origin, "ro," to the new hit point.
        vec3 sp = ro + rd * t;    
        sceneCol = GetColor(sp, t);
    }

    // Return the color. Done once for each pass.
    return sceneCol;
}

vec3 applyFog(in vec3  rgb,    // original color of the pixel
				in float dist, // camera to point distance
				in vec3  ro,   // camera position
				in vec3  rd)   // camera to point vector
{
	float fogAmount = 0.025 * exp(sin(ro.y) * 0.5) * (1.0 - exp(-dist * rd.y * 0.5)) / rd.y;
    
    // We leave some minumum, to always have some horizon 'fire'.
	return mix(rgb, 0.75 * FogColor + FogColor * sin(time) * sin(time), fogAmount);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Aspect ratio - UV normalization.
   	vec2 uv = (2. * fragCoord - iResolution.xy ) / iResolution.y;
    
    // Camera setup and movement.
	vec3 ro = vec3(-5.9, 0.75, 1. + iTime * 0.5); 
	vec3 lk = ro + vec3(0., -1.0, 2.);
    
    // FOV - Field of view.
    float FOV = 3.14159 / 3.; 
    vec3 forward = normalize(lk - ro);
    vec3 right = normalize(vec3(forward.z, 0., -forward.x )); 
    vec3 up = cross(forward, right);

    // rd - Ray direction.
    vec3 rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
    
    // Main tracing func.
    float t = trace(ro, rd);
    
    // Adding color.
    vec3 sceneColor = doColor(ro, rd, lk, t);
    
    // Adding background fog.
    sceneColor = applyFog(sceneColor, t - ro.y, ro, rd);

    // Output to screen.
    fragColor = vec4(sceneColor, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //
#undef time

void main(void)
{
    iTime = time;

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
