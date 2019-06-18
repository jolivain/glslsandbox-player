/*
 * Original shader from: https://www.shadertoy.com/view/XsKfDW
 */

#extension GL_OES_standard_derivatives : enable

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
// standard GLSL 3D simplex noise
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float simplex(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;
  i = mod(i, 289.0); 
  vec4 p = permute(permute(permute(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = 1.0/sqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float T = iTime-1.0;
    vec2 R = iResolution.xy;
    float xr = -1.+(3.14159/2.0)*0.0;
    
    float col = 0.0;
    for(int i = 0; i < 40; i++)
    {
        // coordinates
        vec2 uv = (2.0*fragCoord - R) / R.y;
        
        // 3d projection
    	vec3 u3 = vec3(uv, 5.0)*mat3(1,0,0,0,cos(xr), -sin(xr), 0,sin(xr), cos(xr));
    	u3.y -= 3.5;
    	uv.x = (u3.x*R.x)/(u3.z*R.x)*2.5;
    	uv.y = (u3.y*R.y)/(u3.z*R.y)*sqrt(R.x/R.y)*2.5;
        
        float scale = 3.0+3.0*pow(0.5+0.5*cos(T*0.41),2.0);
        uv *= pow(1.002+mix(0.03, 0.0, scale/10.0), float(i));
        float rf = length(fwidth(uv*vec2(R.y/R.x,1.0)));
        
        uv += 2.0;
        
        // rotate
        float a = (T)*0.19;
        uv *= mat2(cos(a),sin(a),-sin(a),cos(a));

        // zoom
        uv *= scale;

        // repeat & pattern
        float repeat = 1.75+1.25*(0.5+0.5*sin(1.0+T*0.61));
        float r = pow(max(0.0, 0.5+0.5*simplex(vec3( (0.5+uv/repeat)*(1.0/scale), 0.05*float(i)+T*0.77))),3.0);
        uv = mod(uv,repeat)-repeat/2.0;

        float aa = 1.8*scale*rf*sqrt(r);
        
        // circle equation, uv.x^2 + uv.y^2
        float shape = dot(uv,uv);
        // extract outline
        float circle = 1.0-smoothstep(0.0, aa, abs(shape-r));
        col += circle*pow(1.0-smoothstep(0.0, 40.0, float(i)), 2.0);
    }
    
    fragColor = vec4(pow(col*0.5, 1.0/2.2));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
