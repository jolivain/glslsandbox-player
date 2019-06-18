/*
 * Original shader from: https://www.shadertoy.com/view/ls3Bzf
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

// --------[ Original ShaderToy begins here ]---------- //
#define M_PI 3.1415926535897932384626433832795

float sphere(vec3 rayPosition, vec3 position, float radius) {
    return distance(rayPosition, position) - radius;
}

float scene(out vec3 color, in vec3 rayPosition) {
    const float sphereRadius = 0.6;
    float sceneDistance = 1.0 / 0.0;
    for (int i = 0; i < 6; ++i) {
        float degree = (2.0 * M_PI) / float(6) * float(i);
	    vec3 spherePosition = vec3(1.5 * cos(iTime*1.2 + degree), 0.5 * (2.0 * abs(cos(iTime*6.0 + degree)) - 1.0), 5.0 + 1.5 * sin(iTime*1.2 + degree));
        float distance = sphere(rayPosition, spherePosition, sphereRadius);
        if (distance < sceneDistance) {
            sceneDistance = distance;
#if __VERSION__ >= 300
            float r = float((i+1)&1);
            float g = float(((i+1)>>1)&1);
            float b = float(((i+1)>>2)&1);
            color = vec3(r, g, b);
#else
            color = vec3(0.0, 0.7, 0.4);
#endif
        }
    }
    
    float containerDistance = -sphere(rayPosition, vec3(0.0, 0.0, 5.0), 15.0);
    if (containerDistance < sceneDistance) {
        sceneDistance = containerDistance;
        color = vec3(0.5);
    }
    
    float floorDistance = distance(rayPosition.y, -sphereRadius-0.5);
    if (floorDistance < sceneDistance) {
        sceneDistance = floorDistance;
        color = vec3(1.0);
    }
    
    return sceneDistance;
}

vec3 surfaceNormal(vec3 p) { // ray position
    float e = 0.001;
    vec3 color;
    return normalize(vec3(scene(color, vec3(p.x+e, p.y, p.z)) - scene(color, vec3(p.x-e, p.y, p.z)),
                          scene(color, vec3(p.x, p.y+e, p.z)) - scene(color, vec3(p.x, p.y-e, p.z)),
                          scene(color, vec3(p.x, p.y, p.z+e)) - scene(color, vec3(p.x, p.y, p.z-e))));
}

float shadow(vec3 rayPosition, vec3 lightPosition, vec3 surfaceNormal) {
    const int maxSteps = 256;
    
    vec3 rayDirection = normalize(lightPosition - rayPosition);
    float distanceLeft = distance(lightPosition, rayPosition);
    
    rayPosition += rayDirection * 0.02;
    
    for (int i = 0; i < maxSteps; ++i) {
        vec3 sceneColor;
        float distance = scene(sceneColor, rayPosition);
        if (distance < 0.001) {
            return 0.5;
        }
        rayPosition += rayDirection * distance;
        distanceLeft -= distance;
        if (distanceLeft <= 0.0) {
            break;
        }
    }
    
    return 1.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    const int maxSteps = 256;
    
	vec2 screenPosition = fragCoord / iResolution.xy - vec2(0.5);
	screenPosition.x *= iResolution.x / iResolution.y;
    
    const float cameraDistance = 1.0;
    
    vec3 rayPosition = vec3(0.0);
    vec3 rayDirection = normalize(vec3(screenPosition, cameraDistance));
    
    const vec3 backgroundColor = vec3(0.0, 0.0, 0.0);//vec3(1.0, 0.01, 0.35);
    
    const vec3 sphereColor = vec3(0.0, 0.7, 0.4);
    
    vec3 lightPosition = vec3(8.0 * sin(iTime), 8.0 /** cos(iTime)*/, -4.0);
    
    vec3 color = backgroundColor;
    
    for (int i = 0; i < maxSteps; ++i) {
        vec3 sceneColor;
        float distance = scene(sceneColor, rayPosition);
        if (distance < 0.001) {
            vec3 surfaceNormal = surfaceNormal(rayPosition);
		    vec3 lightDirection = normalize(lightPosition - rayPosition);
            vec3 shadowColor = vec3(shadow(rayPosition, lightPosition, surfaceNormal));
	        color = sceneColor * shadowColor * (0.0 + 1.0 * dot(surfaceNormal, lightDirection));
            
            break;
        }
        rayPosition += rayDirection * distance;
    }
    
    fragColor = vec4(color,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
