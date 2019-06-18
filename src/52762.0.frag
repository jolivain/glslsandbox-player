#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

#define HASHSCALE1 .1031

float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float NoisyStarField( in vec2 vSamplePos, float fThreshhold )
{
    float StarVal = hash12( vSamplePos );
    if ( StarVal >= fThreshhold )
        StarVal = pow( (StarVal - fThreshhold)/(1.0 - fThreshhold), 6.0 );
    else
        StarVal = 0.0;
    return StarVal;
}

float StableStarField( in vec2 vSamplePos, float fThreshhold )
{
    float fractX = fract( vSamplePos.x );
    float fractY = fract( vSamplePos.y );
    vec2 floorSample = floor( vSamplePos );    
    float v1 = NoisyStarField( floorSample, fThreshhold );
    float v2 = NoisyStarField( floorSample + vec2( 0.0, 1.0 ), fThreshhold );
    float v3 = NoisyStarField( floorSample + vec2( 1.0, 0.0 ), fThreshhold );
    float v4 = NoisyStarField( floorSample + vec2( 1.0, 1.0 ), fThreshhold );

    float StarVal = v1 * ( 1.0 - fractX ) * ( 1.0 - fractY )
                  + v2 * ( 1.0 - fractX ) * fractY
                  + v3 * fractX * ( 1.0 - fractY )
                  + v4 * fractX * fractY;
    return StarVal;
}


#define quality 17 // nr of steps taken to evaluate the density
#define illum_quality 3 // nr of steps for illumination
#define noise_use_smoothstep //different interpolation for noise functions

#define wind_speed 0.1
#define morph_speed 0.06

#define density_modifier 0.00
#define density_osc_amp 0.04
#define density_osc_freq 0.07

#define const_light_color vec3(2.8,2.3,0.7)
#define const_dark_color vec3(.5,.55,.7)
#define const_sky_color vec3( 0.08, 0.07, 0.1 )

float hash(float x)
{
    return fract(sin(x*.0127863)*17143.321);
}

float hash(vec2 x)
{
    return fract(cos(dot(x.xy,vec2(2.31,53.21))*124.123)*412.0); 
}

float hashmix(float x0, float x1, float interp)
{
    x0 = hash(x0);
    x1 = hash(x1);
    #ifdef noise_use_smoothstep
    interp = smoothstep(0.0,1.0,interp);
    #endif
    return mix(x0,x1,interp);
}

float hashmix(vec2 p0, vec2 p1, vec2 interp)
{
    float v0 = hashmix(p0[0]+p0[1]*128.0,p1[0]+p0[1]*128.0,interp[0]);
    float v1 = hashmix(p0[0]+p1[1]*128.0,p1[0]+p1[1]*128.0,interp[0]);
    #ifdef noise_use_smoothstep
    interp = smoothstep(vec2(0.0),vec2(1.0),interp);
    #endif
    return mix(v0,v1,interp[1]);
}

float hashmix(vec3 p0, vec3 p1, vec3 interp)
{
    float v0 = hashmix(p0.xy+vec2(p0.z*143.0,0.0),p1.xy+vec2(p0.z*143.0,0.0),interp.xy);
    float v1 = hashmix(p0.xy+vec2(p1.z*143.0,0.0),p1.xy+vec2(p1.z*143.0,0.0),interp.xy);
    #ifdef noise_use_smoothstep
    interp = smoothstep(vec3(0.0),vec3(1.0),interp);
    #endif
    return mix(v0,v1,interp[2]);
}

float hashmix(vec4 p0, vec4 p1, vec4 interp)
{
    float v0 = hashmix(p0.xyz+vec3(p0.w*17.0,0.0,0.0),p1.xyz+vec3(p0.w*17.0,0.0,0.0),interp.xyz);
    float v1 = hashmix(p0.xyz+vec3(p1.w*17.0,0.0,0.0),p1.xyz+vec3(p1.w*17.0,0.0,0.0),interp.xyz);
    #ifdef noise_use_smoothstep
    interp = smoothstep(vec4(0.0),vec4(1.0),interp);
    #endif
    return mix(v0,v1,interp[3]);
}

float noise(float p) // 1D noise
{
    float pm = mod(p,1.0);
    float pd = p-pm;
    return hashmix(pd,pd+1.0,pm);
}

float noise(vec2 p) // 2D noise
{
    vec2 pm = mod(p,1.0);
    vec2 pd = p-pm;
    return hashmix(pd,(pd+vec2(1.0,1.0)), pm);
}

float noise(vec3 p) // 3D noise
{
    vec3 pm = mod(p,1.0);
    vec3 pd = p-pm;
    return hashmix(pd,(pd+vec3(1.0,1.0,1.0)), pm);
}

float noise(vec4 p) // 4D noise
{
    vec4 pm = mod(p,1.0);
    vec4 pd = p-pm;
    return hashmix(pd,(pd+vec4(1.0,1.0,1.0,1.0)), pm);
}

vec3 rotate_y(vec3 v, float angle)
{
    vec3 vo = v; float cosa = cos(angle); float sina = sin(angle);
    v.x = cosa*vo.x - sina*vo.z;
    v.z = sina*vo.x + cosa*vo.z;
    return v;
}

vec3 rotate_x(vec3 v, float angle)
{
    vec3 vo = v; float cosa = cos(angle); float sina = sin(angle);
    v.y = cosa*vo.y - sina*vo.z;
    v.z = sina*vo.y + cosa*vo.z;
    return v;
}
    
vec3 cc(vec3 color, float factor,float factor2) //a wierd color modifier
{
    float w = color.x+color.y+color.z;
    return mix(color,vec3(w)*factor,w*factor2);
}

vec3 plane(vec3 p, vec3 d) //returns the intersection with a predefined plane
{
    //http://en.wikipedia.org/wiki/Line-plane_intersection
    vec3 n = vec3(.0,1.0,.0);
    vec3 p0 = n*4.8;
    float f=dot(p0-p,n)/dot(n,d);
    if (f>.0)
     return p+d*f;
    else
        return vec3(.0,.0,.0);
}

vec3 ldir = normalize(vec3(-1.0,-1.0,-1.0)); //light direction

float density(vec3 p) //density function for the cloud
{
    if (p.y>15.0) return 0.0; //no clouds above y=15.0
    p.x+=time*float(wind_speed);
    vec4 xp = vec4(p*0.4,time*morph_speed+noise(p));
    float nv=pow(pow((noise(xp*2.0)*.5+noise(xp.zx*0.9)*.5),2.0)*2.1,    2.);
    nv = max(0.1,nv); //negative density is illegal.
    nv = min(0.6,nv); //high density is ugly for clouds
    return nv;
}

float illumination(vec3 p,float density_coef)
{
    vec3 l = ldir;
    float il = 1.0;
    float ill = 1.0;
    
    float illum_q_coef = 10.0/float(illum_quality);
        
    for(int i=0; i<int(illum_quality); i++) //illumination
    {
        il-=density(p-l*hash(p.xy+vec2(il,p.z))*0.5)*density_coef*illum_q_coef;
        p-=l*illum_q_coef;
        
        if (il <= 0.0)
        {
            il=0.0;
            break; //light can't reach this point in the cloud
        }
        if (il == ill)
        {
            break; //we already know the amount of light that reaches this point
            //(well not exactly but it increases performance A LOT)
        }
        ill = il;
    }
    
    return il;
}

void main()
{
    vec3 vColor = vec3( 0.1, 0.1, 0.2 ) * gl_FragCoord.y / resolution.y;

    // Note: Choose fThreshhold in the range [0.99, 0.9999].
    // Higher values (i.e., closer to one) yield a sparser starfield.
    float StarFieldThreshhold = 0.99;

    // Stars with a slow spin.
    float marchRate = 0.01;
    vec2 vInputPos = ( 2.0 * gl_FragCoord.xy/resolution.y ) - vec2( 1.0, 1.0 );
    float fSampleAngle = atan( vInputPos.y, vInputPos.x );
    vec2 vSamplePos = ( 0.6 * length( vInputPos ) * vec2( cos( fSampleAngle ), sin( fSampleAngle ) ) + vec2( 0.5, 0.5 ) ) * resolution.x + (time * 1.5);
    float StarVal = StableStarField( vSamplePos, StarFieldThreshhold );
    vColor += vec3( StarVal );
    
    //---
    
    vec2 uv = gl_FragCoord.xy / resolution.xy - 0.5;
    uv.x *= resolution.x/resolution.y; //fix aspect ratio
    vec3 mouse = vec3(mouse.xy/resolution.xy - 0.5,.5);
    
   
    vec3 p = vec3(.0,.0,.0); //ray position
    vec3 d = vec3(uv,1.0);
    d.z-=length(d)*.2;
    
    d = rotate_x(d,-1.19-1.0);
    d = rotate_y(d,1.5+-7.0);
    
    d = normalize(d); //ray direction
    
    float acc = .0;
    
    p = plane(p,d);
    
    float illum_acc = 0.0;
    float dense_acc = 0.0;
    float density_coef =0.13+float(density_modifier)
        +sin(time*float(density_osc_freq))*float(density_osc_amp);
    float quality_coef = 20.0/float(quality);
    
    for (int i=0; i<quality; i++)
    {
        p+=d*quality_coef*.5;
        
        float nv = density(p+d*hash(uv+vec2(time,dense_acc))*0.25)*density_coef*quality_coef;
        //evaluate the density function
        
        vec3 sp = p;
        dense_acc+=nv;
        
        if (dense_acc>1.0)
        {
            dense_acc=1.0; //break condition: following steps do not contribute 
            break; //to the color because it's occluded by the gas
        }
        
        float il = illumination(p,density_coef);
        
        illum_acc+=max(0.0,nv*il*(1.0-dense_acc)); 
        //nv - alpha of current point
        //il - illumination of current point
        //1.0-dense_acc - how much is visible of this point
    }

    d=normalize(d);
    
    //color mixing follows
    
    vec3 illum_color = const_light_color*illum_acc*0.50;
    
    float sun = dot(d,-ldir); sun=.5*sun+.501; sun = pow(sun,400.0);
    sun += (pow(dot(d,-ldir)*.5+.5,44.0))*.2;
    vec3 sky_color = const_sky_color*(1.1-d.y*.3)*1.1;
    
    vec3 dense_color = mix(illum_color,const_dark_color,.6)*1.4; //color of the dark part of the cloud
    
    sky_color=sky_color*(1.0-uv.y*0.2)+vec3(.9,.9,.9)*sun;

    vec3 color = mix(sky_color,(dense_color+illum_color*0.33)*1.0,smoothstep(0.0,1.0,dense_acc)); color-=length(uv)*0.2;

    color+=hash(color.xy+uv)*0.01; //kill all color banding
    color =cc(color,0.42,0.45);
    
    vec3 endColor = mix(vColor, color, smoothstep(0.8,1.0,0.94));


    // Vignetting
    vec2 xy2 = gl_FragCoord.xy / resolution.xy;
    vColor *= vec3(.5, .5, .5) + 0.25*pow(100.0*xy2.x*xy2.y*(1.0-xy2.x)*(1.0-xy2.y), .5 );
    
    gl_FragColor = vec4(vColor, 1.0);
}
