#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {

    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    float r = 0., g = 0., b = 0.;
    float randT = mod(sin(time)*10.0,3.0);
    const float NUM = 2.0;
    const float ALL_NUM = NUM * 6.0;
    float rad = radians(90.0);
    for(float i = 0.0; i < ALL_NUM + 1.0; i++)
    {
        if(i>=NUM*1.0&&i<NUM*2.0)
        {
        	//緑
        	float j = i + 1.0;
	        vec2 q = p + vec2(cos(time * j), sin(time * j * 1.5)) * 0.8;
	        g += 0.05 / length(q * (2.5 + sin( time * j * 1.5 )));
	        r += (j / 5.0) * (0.025 / length(q * (2.5 + sin( time * j * 1.5 ))));
	        b += (j / 5.0) * (0.025 / length(q * (2.5 + sin( time * j * 1.5 ))));
        }else if(i>=NUM*2.0&&i<NUM*3.0)
        {
        	//青
        	float j = i + 1.0;
	        vec2 q = p + vec2(cos(time * j * 1.5), sin(time * j * 1.8)) * 0.7;
	        b += 0.05 / length(q * (2.0 + sin(time * j * 1.8 )));
	        g += (j / 5.0) * (0.025 / length(q * (2.0 + sin( time * j * 1.8 ))));
	        r += (j / 5.0) * (0.025 / length(q * (2.0 + sin( time * j * 1.8 ))));
        }
        else if(i>=NUM*3.0&&i<NUM*4.0)
        {
        	//黄
        	float j = i + 1.0;
	        vec2 q = p + vec2(cos(time * j * 0.8), sin(time * j * 0.5)) * 0.5;
	        r += 0.05 / length(q * (1.8 + sin( time * j * 0.8 ))) - 0.05*NUM;
	        g += 0.05 / length(q * (1.8 + sin( time * j * 0.8 ))) - 0.05*NUM;
	        b += (j / 5.0) * (0.025 / length(q * (1.8 + sin( time * j * 0.8 )))) - 0.05*NUM;
        }
        else if(i>=NUM*4.0&&i<NUM*5.0)
        {
        	//紫
        	float j = i + 1.0;
	        vec2 q = p + vec2(cos(time * j), sin(time * j * 1.5)) * 0.5;
	        r += 0.05 / length(q * (1.8 + sin( time * j * 1.5 )));
	        g += (j / 5.0) * (0.025 / length(q * (1.8 + sin( time * j * 1.5 ))));
	        b += 0.05 / length(q * (1.8 + sin( time * j * 1.5 )));
        }else if(i>=NUM*5.0&&i<NUM*6.0)
        {
        	//赤
	        float j = i + 1.0;
	        vec2 q = p + vec2(cos(time * j * 1.5), sin(time * j)) * 0.5;
	        r += 0.05 / length(q * (2.0 + sin( time * j * 1.5 ))) * NUM;
	        g += (j / 5.0) * (0.025 / length(q * (2.0 + sin( time * j * 1.5 ))));
	        b += (j / 5.0) * (0.025 / length(q * (2.0 + sin( time * j * 1.5 ))));
        }
        else if(i==ALL_NUM)
        {
        	//中央
	        float j = i + 1.0;
	        vec2 q = p * 0.6;
	        //destColor += 0.025 / length(q) ;
	        r += (0.05 / length(q)) - 0.1*NUM;
	        g += (0.05 / length(q)) - 0.1*NUM;
	        b += (0.05 / length(q)) - 0.1*NUM;
        }
    }
    gl_FragColor = vec4(r - 0.1*NUM,g - 0.1*NUM,b - 0.1*NUM, 1.0);

}
