precision mediump float;

uniform float time;
uniform vec2 resolution;


float map(vec2 p)
{
    vec2 z = p;

    for (float i = 1.; i < 10.;i++)
    {
        float ang = -4.288 * (-sin(.4*time*0.3) + atan( z.x * cos(.63*time*0.2), z.y * sin(.53) ));
        
        float r = pow(length(z), 2.);

        z =(1.5 * vec2(r * cos(ang), r * sin(ang))) + p;

        if (length(z) > 2.) return i;
    }

    return -1.;
}

void main()
{
    vec2 p = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);
    gl_FragColor = vec4(1. - map(p), 0, 0, 1);

}//nabr
