// Inspired from: https://www.shadertoy.com/view/3dBGWG

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec3 rotate(vec3 p,vec3 axis,float theta)
{
    vec3 v = cross(p, axis), u = cross(v, axis);
    return u * cos(theta) + v * sin(theta) + axis * dot(p, axis);   
}
    
vec2 rotate(vec2 p, float theta)
{
    return p * cos(theta) + vec2(-p.y, p.x) * sin(theta);
}

float deLineBox(vec3 p)
{
    p=mod(p,4.0)-2.0;
    float de = 1e5;
    for(float j=1.0; j<4.0;j++)
    {
        p = abs(p)-1.0;
        for(int i=0; i<3;i++)
        {
            vec3 q =p;
            q[i]=max(0.0,q[i]);
            de= min(de,length(q)-0.03*j);
        }
        p*=2.0;
    }
    return de;
}

float dstepf = 0.0;

float map(vec3 p)
{
	dstepf += 0.003;
    float t = floor(time/5.5)*3.5 + min(8.0, mod(time,10.0));
    p =  rotate(p,normalize(vec3(rotate(vec2(1,2),sin(t/3.)),3)),t*0.35);
    return deLineBox(p);
}

void main()
{
    vec2 uv = (gl_FragCoord.xy*2.0-resolution.xy)/resolution.y;
    vec3 ro = vec3(3.5)*sin(time*0.02+ 0.2*sin(time*0.1));
    vec3 rd0 = normalize(vec3(uv, -1.0));
    vec3 rd1 = normalize(vec3(uv, (1.0-dot(uv, uv)*0.5)*0.5));
    vec3 rd = mix(rd0, rd1, step(6.0,mod(time,12.0)));

    vec3 col = vec3(0);
    float t=0.1, layers=0.0, d, aD;
    float thD = 0.03;
    
    for(float i=0.; i<80.; i++)	
    {
        if(layers>10. || col.x > 1.0 || t>6.0) break;
        vec3 p = ro + rd*t;
        d = map(p); 
        aD = (thD-abs(d))/thD;
        if(aD>0.)
        { 
            col += aD*aD*(3.0-2.0*aD)/(1.0 + t*t*0.5)*0.15; 
            layers++; 
        }
        t += max(d, thD*1.5) * dstepf; 
    }
    col = mix(col, vec3(min(col.x*1.5, 1.), pow(col.x, 2.5), pow(col.x, 12.)), 
              dot(sin(rd.yzx*8. + sin(rd.zxy*8.)), vec3(.1666))+0.4);
    col = mix(col, vec3(col.x*col.x*.85, col.x, col.x*col.x*0.3), 
             dot(sin(rd.yzx*4. + sin(rd.zxy*4.)), vec3(.1666))+0.25);
    gl_FragColor = vec4( clamp(col, 0., 1.), 1.0 );
}
