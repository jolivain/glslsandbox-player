/*
 * Original shader from: https://www.shadertoy.com/view/wsSGRd
 *
 * Music:
 * Oceanvs Orientalis feat. Idil Mese - The Cube
 * https://soundcloud.com/bar25/oceanvs-orientalis-the-cube-original-mix-promo-snippetbar25-042
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
//Generation settings
#define NOISE_ALPHA_MULTIPLIER 0.5
#define NOISE_SIZE_MULTIPLIER 1.8

//Uncomment to disable fog shape animation over time
#define MUTATE_SHAPE

//Rendering settings

//Uncoment to get high quality version (if you have good PC)
//#define HIGH_QUALITY

#ifdef HIGH_QUALITY
    #define RAYS_COUNT 150
    #define STEP_MODIFIER 1.007
    #define SHARPNESS 0.009
	#define NOISE_LAYERS_COUNT 5.0
	#define JITTERING 0.03
#else
    #define RAYS_COUNT 54
    #define STEP_MODIFIER 1.0175
    #define SHARPNESS 0.02
	#define NOISE_LAYERS_COUNT 4.0
	#define JITTERING 0.08
#endif

#define DITHER 0.3
#define NEAR_PLANE 0.6
#define RENDER_DISTANCE 2.0

//Colors
#define BRIGHTNESS 5.0
#define COLOR1 vec3(0.0, 1.0, 1.0)
#define COLOR2 vec3(1.0, 0.0, 0.9)

//Camera and time
#define TIME_SCALE 1.0
#define CAMERA_SPEED 0.04
#define CAMERA_ROTATION_SPEED 0.06
#define FOG_CHANGE_SPEED 0.02

float hash(vec3 v)
{
 	return fract(sin(dot(v, vec3(11.51721, 67.12511, 9.7561))) * 1551.4172);   
}

float getNoiseFromVec3(vec3 v)
{
	vec3 rootV = floor(v);
    vec3 f = smoothstep(0.0, 1.0, fract(v));
    
    //Cube vertices values
    float n000 = hash(rootV);
    float n001 = hash(rootV + vec3(0,0,1));
    float n010 = hash(rootV + vec3(0,1,0));
    float n011 = hash(rootV + vec3(0,1,1));
    float n100 = hash(rootV + vec3(1,0,0));
    float n101 = hash(rootV + vec3(1,0,1));
    float n110 = hash(rootV + vec3(1,1,0));
    float n111 = hash(rootV + vec3(1,1,1));
    
    //trilinear interpolation
    vec4 n = mix(vec4(n000, n010, n100, n110), vec4(n001, n011, n101, n111), f.z);
    n.xy = mix(vec2(n.x, n.z), vec2(n.y, n.w), f.y);
    return mix(n.x, n.y, f.x);
}

float volumetricFog(vec3 v, float noiseMod)
{
    float noise = 0.0;
    float alpha = 1.0;
    vec3 point = v;
    for(float i = 0.0; i < NOISE_LAYERS_COUNT; i++)
    {
        noise += getNoiseFromVec3(point) * alpha;
     	point *= NOISE_SIZE_MULTIPLIER;
        alpha *= NOISE_ALPHA_MULTIPLIER;
    }
    
    //noise = noise / ((1.0 - pow(NOISE_ALPHA_MULTIPLIER, NOISE_LAYERS_COUNT))/(1.0 - NOISE_ALPHA_MULTIPLIER));
    noise *= 0.575;

    //edge + bloomy edge
#ifdef MUTATE_SHAPE
    float edge = 0.1 + getNoiseFromVec3(v * 0.5 + vec3(iTime * 0.03)) * 0.8;
#else
    float edge = 0.5;
#endif
    noise = (0.5 - abs(edge * (1.0 + noiseMod * 0.05) - noise)) * 2.0;
    return (smoothstep(1.0 - SHARPNESS * 2.0, 1.0 - SHARPNESS, noise * noise) + (1.0 - smoothstep(1.3, 0.6, noise))) * 0.2;
}


vec3 nearPlanePoint(vec2 v, float time)
{
 	return vec3(v.x, NEAR_PLANE * (1.0 + sin(time * 0.2) * 0.4), v.y);   
}

vec3 fogMarch(vec3 rayStart, vec3 rayDirection, float time, float disMod)
{
    float stepLength = RENDER_DISTANCE / float(RAYS_COUNT);
 	vec3 fog = vec3(0.0);   
    vec3 point = rayStart;
    
    for(int i = 0; i < RAYS_COUNT; i++)
    {
     	point += rayDirection *stepLength;
        fog += volumetricFog(point, disMod) //intensity
            * mix(COLOR1, COLOR2 * (1.0 + disMod * 0.5), getNoiseFromVec3((point + vec3(12.51, 52.167, 1.146)) * 0.5)) //coloring
            * mix(1.0, getNoiseFromVec3(point * 40.0) * 2.0, DITHER)	//Dithering
            * getNoiseFromVec3(point * 0.2 + 20.0) * 2.0;	//Cutting big holes
        
        stepLength *= STEP_MODIFIER;
    }
    
    //There is a trick
    //Cutting mask in result, it will fake dynamic fog change, cover imperfections and add more 3D feeling
   	fog = (fog / float(RAYS_COUNT)) * (pow(getNoiseFromVec3((rayStart + rayDirection * RENDER_DISTANCE)), 2.0) * 3.0 + disMod * 0.5);
	
    return fog;
}

//Getting kick volume from spectrum
float getBeat()
{
 	float sum = 0.0;
    for (float i = 0.0; i < 16.0; i++)
    {
     	sum += texture(iChannel0, vec2(i * 0.001 + 0.0, 0.0)).r;   
    }
    return smoothstep(0.6, 0.9, pow(sum * 0.06, 2.0));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float time = iTime;
    float musicVolume = getBeat();
    vec2 res = iResolution.xy;
    vec2 uv = (2.0 * fragCoord - res) / res.x;
    
    //Random camera movement
    vec3 cameraCenter = vec3(sin(time * CAMERA_SPEED) * 10.0, time * CAMERA_SPEED * 10.0, cos(time * 0.78 * CAMERA_SPEED + 2.14) * 10.0);
    
    //Creating random rotation matrix for camera
    float angleY = sin(time * CAMERA_ROTATION_SPEED * 2.0);
    float angleX = cos(time * 0.712 * CAMERA_ROTATION_SPEED);
    float angleZ = sin(time * 1.779 * CAMERA_ROTATION_SPEED);
    mat3 rotation =   mat3(1, 0, 			0,
                           0, sin(angleX),  cos(angleX),
                           0, -cos(angleX), sin(angleX))
        			* mat3(sin(angleZ),  cos(angleZ), 0,
                           -cos(angleZ), sin(angleZ), 0,
                           0, 			 0, 		  1)
        			* mat3(sin(angleY),  0, cos(angleY),
                           0, 			 1, 0,
                           -cos(angleY), 0, sin(angleY));
    
    vec3 rayDirection = rotation * normalize(nearPlanePoint(uv, time));
    vec3 rayStart = rayDirection * 0.2 + cameraCenter;	//Ray start with little clipping
    
    //Thanks to adx for jittering tip, looks and works really better with this line:
    rayStart += rayDirection * (hash(vec3(uv + 4.0, fract(iTime) + 2.0)) - 0.5) * JITTERING;
    
    vec3 fog = fogMarch(rayStart, rayDirection, time, musicVolume);
    
    //postprocess
    fog *= 2.5 * BRIGHTNESS;
    fog += 0.07 * mix(COLOR1, COLOR2, 0.5);	//Colouring the darkness
    fog = sqrt(smoothstep(0.0, 1.5, fog)); //Dealing with too bright areas (sometimes it happen)
    
    fragColor = vec4(fog * smoothstep(0.0, 10.0, iTime), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
