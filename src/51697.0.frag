/*
 * Original shader from: https://www.shadertoy.com/view/tsfGDM
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
//EDIT: Thanks to FabriceNyret2 for this nice rotation tip
#define ROTATE_VEC2(angle) vec2(cos(angle), sin(angle)) 

//Comment to enable previus shader version
#define ONLY_CIRCULAR_CELLS


const int iterations = 5;
const float pi = 3.141592;
const float doublePi = 6.283185;

vec2 randomNumber(in vec2 v)
{
    //EDIT: Thanks to FabriceNyret2 for optimization tip 
    //return vec2(fract(sin(dot(v, vec2(12.1215, 23.02751))) * 541.9283),
    //            fract(sin(dot(v, vec2(23.02751, 12.1215))) * 632.6047));
    return fract(sin(v * mat2(0.7400775, -0.6725215, 0.1241045, 0.9922691)) * vec2(541.9283, 638.1429));
}

vec2 cellCenter(in vec2 uv)
{
 	vec2 rand = randomNumber(uv);
    
    //EDIT: Removed code redundancy pointed by FabriceNyret2, thanks again!
    //return uv + vec2(cos(iTime * rand.x * 0.3), sin(iTime * rand.x * 0.3)) * rand.y * float(iterations - 1);
	float time = iTime * rand.x * 0.3;
	return uv + ROTATE_VEC2(time) * rand.y * float(iterations - 1);
}

vec4 cellularNoise(in vec2 uv)
{
    //xy - floor uv (root point), zw - cell center
 	vec4 uvData = vec4(floor(uv), 0.0, 0.0);
    uvData.zw = cellCenter(uvData.xy);
    
    //xy - point coordinates, z - distance from point to uv
    vec3 firstPointData = vec3(0.0, 0.0, 99999.0);
    for(int x = -iterations; x <= iterations; x++)
    {
        for(int y = -iterations; y <= iterations; y++)
        {
            vec4 tempUVData = vec4(uvData.xy + vec2(x, y), 0.0, 0.0);
            tempUVData.zw = cellCenter(tempUVData.xy);
            vec2 v = uv - tempUVData.zw;
     		float distToTemp = v.x * v.x + v.y * v.y;
            
            //changed () ? : into if statement, thanks to Fabrice again!
           	if(firstPointData.z > distToTemp)
            {
                firstPointData.z = distToTemp;
            	firstPointData.xy = tempUVData.zw;
            }
            else
            {
                firstPointData.z = firstPointData.z;
            	firstPointData.xy = firstPointData.xy;
            }   
        } 
    }
    
    vec3 secondPointData = vec3(0.0, 0.0, 99999.0);
    for(int x = -iterations; x <= iterations; x++)
    {
        for(int y = -iterations; y <= iterations; y++)
        {
            vec4 tempUVData = vec4(uvData.xy + vec2(x, y), 0.0, 0.0);
            tempUVData.zw = cellCenter(tempUVData.xy);
            vec2 v = uv - tempUVData.zw;
     		float distToTemp = v.x * v.x + v.y * v.y;
            
            //changed () ? : into if statement
            if (secondPointData.z > distToTemp && distToTemp > firstPointData.z)
            {
                secondPointData.z = distToTemp;
                secondPointData.xy = tempUVData.zw;
            }
            else
            {
                secondPointData.z = secondPointData.z;
                secondPointData.xy = secondPointData.xy;
            }
            
            
        } 
    }
    
    firstPointData.z = sqrt(firstPointData.z);
    secondPointData.z = sqrt(secondPointData.z);
    vec3 centralPoint = (firstPointData + secondPointData) / 2.0;
    
    //Added this line to remove all not circular cells
#ifdef ONLY_CIRCULAR_CELLS
    centralPoint.z = clamp(centralPoint.z, 0.0, 0.5);
#endif
    
    float effect = pow(sin(fract(centralPoint.z) * doublePi) * 0.5 + 0.5, 4.0);
    vec3 col = vec3(0.8, 0.0, 0.0) * effect;
    
    return vec4(col + vec3(0.1, 0.0, 0.0), 0.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //EDIT: Removed useless mousePos
	//float mousePos = iMouse.y / iResolution.y;

    vec2 uv = fragCoord / min(iResolution.x, iResolution.y);
    uv -= vec2(0.0, 1.5);
    float time = iTime * 0.1;
    mat2 mat = mat2(	cos(time), 	sin(time),
    					-sin(time), cos(time));
    uv = mat * uv;

    fragColor = cellularNoise(uv * 10.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
