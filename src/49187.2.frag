#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 texture(vec2 pos)
{
    vec2 uv = pos.xy*2.0-1.0;
    uv.x*=resolution.x/resolution.y;
    uv*=1.3;
    
    vec2 ov = uv;
    
    float r=atan(uv.x,uv.y) - 0.2;// + 0.025*sin(iTime);
    float l=length(uv);
    
    uv=vec2(sin(r),cos(r))*l;
    
    uv.y+=sin(uv.x*acos(-1.))/10.;
    vec3 col = vec3(0);
    
 
    
	if (max(uv,vec2(-1,-1))==uv&&min(uv,vec2(1,1))==uv)
    {
        if (abs(uv.x)>.03&&abs(uv.y)>.03) {
            if (uv.x>0.)
            {
                if (uv.y<0.)
                {
                    col=vec3(242,123,0);
                }
                else
                {
                    col=vec3(41,98,26);
                }
            }
            else
            {
                if (uv.y<0.)
                {
                    col=vec3(51,89,155);
                }
                else
                {
                    col=vec3(190,8,2);
                }
            }
            col/=255.;
            col*=1.+(1.3-length(uv))/1.5;
            col+=(1.3-length(uv))/2.;
        }
    }
    
    return vec4(col*mix(0.,1.,-cos(clamp(time,0.,1.)*acos(-1.))/2.+.5),1.0);
}
void main(void){
	 vec2 uv = gl_FragCoord.xy/resolution.xy;
	vec2 px = 1./resolution.xy;
    
    vec4 v = texture(uv);
    
    vec4 r = texture(uv+px*vec2(1,0));
    vec4 tr = texture(uv+px);
    vec4 t = texture( uv+px*vec2(0,1));
    
    
    vec4 b = texture(uv-px*vec2(1,0));
    vec4 bl = texture( uv-px);
    vec4 l = texture(uv-px*vec2(0,1));
    
    vec4 br = texture(uv+px*vec2(1,-1));
    vec4 tl = texture(uv-px*vec2(1,-1));
    gl_FragColor = v/3.+((r+l+b+t)/4.)/3.+((tl+tr+bl+br)/4.)/3.;
}
