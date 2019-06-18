/*
 * Original shader from: https://www.shadertoy.com/view/tlX3Rl
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
//Based on:
//https://andreashackel.de/tech-art/stripes-shader-1/

vec2 rotatePosition(vec2 pos, vec2 centre, float angle) {
	float sinAngle = sin(angle);
	float cosAngle = cos(angle);
	pos -= centre;
	vec2 rotatedPos;
	rotatedPos.x = pos.x * cosAngle - pos.y * sinAngle;
	rotatedPos.y = pos.x * sinAngle + pos.y * cosAngle;
	rotatedPos += centre;
	return rotatedPos;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    
    const float PI = 3.14;
    float aplitude = 0.9;
    float frequency = 0.4;
        
    //Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    //The ratio of the width and height of the screen
    float widthHeightRatio = iResolution.x/iResolution.y;

   	//Repetition of stripe unit
    float tilingFactor = 10.0;
    
    vec2 pos = vec2(uv.x, uv.y);

    //Adjust vertical pos to make the width of the stripes 
    //transform uniformly regardless of orientation
    pos.y /= widthHeightRatio;
  
    //Centre of the screen
    vec2 centre = vec2(0.5, 0.5);
    //Adjust centre to match the pos transform
    centre.y /= widthHeightRatio;
    
    //Rotate pos around centre by specified radians
    float angle = -PI/4.0;
    pos = rotatePosition(pos, centre, angle);
    
    //Move frame along rotated y direction
    pos.y -= 0.75*iTime;

    vec2 position = vec2(pos.x, pos.y) * tilingFactor;
    position.x += aplitude * sin(frequency * position.y);
    
    vec3 col_1 = vec3(1.0, 0.2, 0.2);
    vec3 col_2 = vec3(1.0, 1.64, 0.0);    
    vec3 col_3 = vec3(0.5, 1.0, 0.5);
    vec3 col_4 = vec3(0.6, 0.6, 1.0);
    vec3 col; 
    //Set stripe colours
    int value = int(floor(fract(position.x) * 4.0));
    if (value == 0)
		col = col_1;
    else if (value == 1)
		col = col_2;
    else if (value == 2)
		col = col_3;
    else if (value == 3)
		col = col_4;
    else
		col = vec3(0.0,0.0,0.0);

    //Fragment colour
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
