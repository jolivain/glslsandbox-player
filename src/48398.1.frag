#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// glowing particles
//
// original https://www.shadertoy.com/view/Ml3cWs

const int nParticles = 150;
const float size = 0.02;
const float softness = 444.0;
const vec4 bgColor = vec4(0,0,0.1,1);

float random (int i)
{ return fract(sin(float(i)*43.0)*4790.234); }

float softEdge(float edge, float amt)
{ return clamp(0.50 / (clamp(edge, 0.120/amt, 1.0)*amt), 0.,1.); }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / resolution.xy;
    float aspect = resolution.x / resolution.y;
    uv.x *= aspect;
    fragColor = bgColor;
    float np = float(nParticles);
    for(int i = 0; i < nParticles; i++)
    {
        float r1 = random(i);
        float r2 = random(i+nParticles);
        float r3 = random(i+nParticles*2);
        vec2 tc = uv - vec2(sin(time*0.125 + r1*30.0)*r1 
                           ,cos(time*0.125 + r1*40.0)*r2*0.5);
        float l = length(tc - vec2(aspect*0.5, 0.5)) - r1*size;
        vec4 orb = vec4(r1, r2, r3, softEdge(l, softness));
        fragColor = mix(fragColor, orb, orb.a);
    }
}

void main( void ) 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
