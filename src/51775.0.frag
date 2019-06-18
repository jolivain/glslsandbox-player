/*
 * Original shader from: https://www.shadertoy.com/view/wdsGRj
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
vec4 calcLight(vec4 color, vec2 pos, vec2 coord) {
	return color * 0.04/distance(pos / iResolution.y, coord / iResolution.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragColor = vec4(0, 0, 0, 0);

    fragColor += calcLight(
        vec4(abs(cos(iTime)), abs(sin(iTime)), abs(sin(iTime/2.0)), 0.5),
        vec2(abs(sin(iTime/1.3)) * iResolution.x, 200.0 + 10.0 * sin(iTime*12.0)),
        fragCoord
    );
    
    fragColor += calcLight(
        vec4(abs(cos(iTime)), abs(sin(iTime)), 0, 0.5),
        vec2(200.0 + 15.0 * sin(iTime*6.0), abs(sin(iTime*3.4))* iResolution.y),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(cos(iTime*2.0)), abs(sin(iTime/0.75)), abs(sin(iTime/2.0)), 0.5),
        vec2(200.0 + 5.0 * sin(iTime*30.0), abs(sin(iTime*1.5))* iResolution.y),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(sin(iTime*3.0)), abs(cos(iTime/0.75)), abs(sin(iTime/2.0)), 0.5),
        vec2(300.0 + 90.0 * sin(iTime*2.0), abs(sin(iTime))* iResolution.y),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(cos(iTime)/2.0), abs(sin(iTime*0.5)), abs(sin(iTime*1.3)), 0.5),
        vec2(45.0 + 15.0 * cos(iTime*3.33), abs(sin(iTime*4.0))* iResolution.y),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(cos(iTime)*0.3) + sin(iTime)*0.7, abs(sin(iTime/2.2)), abs(sin(iTime/3.3)), 0.5),
        vec2(abs(sin(iTime/3.0))* iResolution.x, 100.0 + 5.0 * sin(iTime*6.0)),
        fragCoord
    );
    
    fragColor += calcLight(
        vec4(abs(cos(iTime*12.0)),abs(sin(iTime*15.0)),abs(cos(iTime*10.0)), 1.0),
        vec2(abs(sin(iTime/2.0))* iResolution.x, 300.0 + 60.0 * sin(iTime*0.5)),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(cos(iTime*3.0)), abs(sin(iTime*4.0)), abs(sin(iTime*5.0)), 0.5),
        vec2(abs(sin(iTime))* iResolution.x, abs(cos(iTime/3.0) * iResolution.y)),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(sin(iTime*3.0)), abs(cos(iTime*4.0)), abs(sin(iTime*5.0)), 0.5),
        vec2(abs(cos(iTime))* iResolution.x, abs(sin(iTime/3.0) * iResolution.y)),
        fragCoord
    );


    fragColor += calcLight(
        vec4(abs(sin(iTime*2.22)), abs(cos(iTime*12.0)), abs(sin(iTime*2.20)), 0.5),
        vec2(abs(cos(iTime*2.27))* iResolution.x, abs(sin(iTime*4.31) * iResolution.y)),
        fragCoord
    );

    fragColor += calcLight(
        vec4(abs(cos(iTime*2.22)), abs(cos(iTime*12.0)), abs(cos(iTime*2.20)), 0.5),
        vec2(abs(sin(iTime*2.27))* iResolution.x, abs(sin(iTime*3.3) * iResolution.y)),
        fragCoord
    );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
