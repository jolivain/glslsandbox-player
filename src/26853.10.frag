
//----------------------------------------------
// MultipleCircleInversions.glsl by THolzer 
// original by BeondTheStatic 2015-07-27 
//   https://www.shadertoy.com/view/MlXXR2
// Show how multiple conformal transformations can be added together,
// producing a result that maintains conformality.
// Tags: 2d, conformal, circle, inversion, checkerboard
//----------------------------------------------

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//----------------------------------------------
const float periodTime = 15.0;

const vec3 patternColor0 = vec3(1.0);
const vec3 patternColor1 = vec3(0.2,0.4,0.5);
const vec3 patternColor2 = vec3(0.2,0.5,0.2);
const vec3 patternColor3 = vec3(0.5,0.4,0.2);

const int circles = 4;  // number of circle inversions

//----------------------------------------------
// return rotated position p
//----------------------------------------------
vec2 rotate(vec2 p, float a)
{
	float s = sin(radians(a));
	float c = cos(radians(a));
	return vec2(p.y*c + p.x*s, -p.y*s + p.x*c);
}
//----------------------------------------------
// p = position; o = circle center, r = radius
//----------------------------------------------
vec2 cInvert(vec2 p, vec2 o, float r)
{
	vec2 po = p-o;
	return po / dot(po, po)*pow(r, 2.);
}
//----------------------------------------------
// return checkerboard pattern color
//----------------------------------------------
vec3 CheckerboardColor (in vec2 pos)
{
    return (mod(floor(pos.x * 10.0) 
               +floor(pos.y * 10.0), 2.0) 
                < 1.0 ? patternColor0 : patternColor1);
}
//----------------------------------------------
// return rounded square pattern color
//----------------------------------------------
vec3 RoundedSquaresColor (in vec2 pos)
{
  float k = smoothstep(0.0, 0.5, sin(pos.x * 10.0) +sin(pos.y * 10.0) );
  return mix(patternColor0, patternColor2, k);
}
//----------------------------------------------
// return hexagonal grid color
// http://glslsandbox.com/e#23933
//----------------------------------------------
vec3 HexagonalGridColor (in vec2 position         
	                ,in float gridSize
	                ,in float gridThickness) 
{
  vec2 pos = position / gridSize; 
  pos.x *= 0.57735 * 2.0;
  pos.y += mod(floor(pos.x), 2.0)*0.5;
  pos = abs((mod(pos, 1.0) - 0.5));
  float d = abs(max(pos.x*1.5 + pos.y, pos.y*2.0) - 1.0);
  float k = smoothstep(0.0, gridThickness, d);
  return mix(patternColor0, patternColor3, k);
}
//----------------------------------------------
// return color of circle inversions
//----------------------------------------------
vec3 CircleInversions (in vec2 pos)
{
	// adding up circle inversions
    vec2 invertSum = vec2(0.0);
    for(int i=0; i<circles; i++)
    {
        float rn = float(i) / float(circles);  
        invertSum += cInvert(pos, rotate(vec2(0.0, rn)
                            ,time * 13.0*rn), 0.5);
    }
   	pos = fract(invertSum);
    
    float border = clamp(8.*(.5-max(abs(pos.x-0.5), abs(pos.y-0.5))), 0.1, 1.0);
    vec3 col;
//  col = 2. * border * texture2D(iChannel0, uv).rgb;
    float sceneTime = periodTime / 3.0;
    int selection = int(mod(time, periodTime) / periodTime * 3.0);
    if      (selection < 1)  col = border * CheckerboardColor(pos);
    else if (selection < 2)  col = border * RoundedSquaresColor(pos);
    else                     col = border * HexagonalGridColor(pos, 0.1, 0.2);
    return col;
}
//----------------------------------------------
void main( void ) 
{
    vec2 uv = gl_FragCoord.xy / resolution.xy -0.5;
    uv.x *= resolution.x / resolution.y;
    gl_FragColor = vec4(CircleInversions(uv), 11.01);
}
