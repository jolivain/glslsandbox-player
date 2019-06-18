/*
 * Original shader from: https://www.shadertoy.com/view/4ddfzH
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
/*
 * Eyeball Explosion
 * 
 * Copyright (C) 2018  Alexander Kraus <nr4@z10.info>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const float pi = acos(-1.);
const vec2 c = vec2(1.,0.);

float rand(vec2 a0)
{
    return fract(sin(dot(a0.xy ,vec2(12.9898,78.233)))*43758.5453);
}

float smoothstep_noise(float x)
{
    float r1 = -1.+2.*rand(floor(x)*c.xx), r2 = -1.+2.*rand(ceil(x)*c.xx);
    return mix(r1, r2, smoothstep(.25, .75, fract(x)));
}

float mfsmoothstep_noise(float x)
{
    float sum = 0.;
    float a = 1.;
    const float phi = 0.45;
    
    float f = 1.;
    for (int i = 1; i < 6; i++)
    {
        sum = a*smoothstep_noise(f*x) + sum;
        a = a*phi;
        f *= 2.0;
    }
    
    return sum;
}

vec2 rot(vec2 x, float p)
{
    return mat2(cos(p), sin(p), -sin(p), cos(p))*x;
}

mat3 rot(vec3 p)
{
    vec3 cp = cos(p), sp = sin(p);
    mat3 m = mat3(cp.y*cp.x, cp.x*sp.z+cp.z*sp.x*sp.y, sp.x*sp.z-cp.x*cp.z*sp.y, 
           -cp.y*sp.z, cp.x*cp.z-sp.x*sp.y*sp.z, cp.z*sp.x+cp.x*sp.y*sp.z, 
           sp.y, -cp.y*sp.x, cp.x*cp.y);
    return m;
}

float rect(vec2 x, vec2 b)
{
    return length(max(abs(x)-b,0.));
}

vec3 synthcol(float scale, float phase)
{
    vec3 c2 = vec3(207.,30.,102.)/255.,
        c3 = vec3(245., 194., 87.)/255.;
    mat3 r1 = rot((5.e-1*phase)*vec3(1.1,1.3,1.5));
    return 
        (
            1.1*mix
            (
                -(cross(c2, r1*c2)),
                -(r1*c2), 
                scale
            )
        );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.yy-.5-.33*c.xy;
    uv = rot(uv, .25*iTime);
    
    vec4 sdf = vec4(0., c.yyy);
    
    float N = 128.,
        r_inner = .2;
    
    for(int i=0; i<12; ++i)
    {
        uv = rot(uv, 1.1);
        vec2 p = vec2(length(uv), atan(uv.y/uv.x)-float(i)*.1*iTime),
        q = vec2(p.x-.05*float(i), mod(p.y, 2.*pi/N)-pi/N),
        q0 = vec2(r_inner, q.y);
    
    	float index = (p-q).y;
        
        r_inner = .2+float(i)*.005+ .0005*12.;
        
        float dr = .1*mfsmoothstep_noise(index-iTime-4.*float(i)) + .05*rand(index*c.xx+.2*c.yx),
            len = abs(.005*float(i)+dr),
            width = abs(.015+.005*rand(index*c.xx+.4));

        vec4 sda = vec4(rect(q-r_inner*c.xy, len*c.xy+width*c.yx), synthcol(((q.x-r_inner)/.05+(q.y/2./pi)), iTime+sin(iTime+1.*float(i))));
        sdf = mix(sdf, sda, step(sda.x, sdf.x));
    }
    
    vec3 col = sdf.gba*step(sdf.x, 0.);

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
