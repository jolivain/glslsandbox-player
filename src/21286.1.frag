#ifdef GL_ES
precision highp float;
#endif


// What's the cheapest way to calculate the diffuse light contribution from the clouds to the object?



uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D bb;

// hash based 3d value noise
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

float sdBox(vec3 p, vec3 t, vec3 b)
{
    vec3 d = abs(p-t) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}

float sdf(vec3 p)
{
    vec3 center = vec3(0.0, 1.5, 0.0);
    p-=center;
    mat3 spin = rotationMatrix(vec3(1.0, 0.0, 0.0), 1.2+cos(time));
    p*= spin;
    
    //float sphere0 = distance(p, center-vec3(0.0, 1.0, 3.5)) - 2.0;
    //float sphere1 = distance(p, center-vec3(-0.5, 1.6, 0.9)) - 5.2 - abs(cos(p.x+time*2.0))*0.05;
    //return max(sphere0, -sphere1);
    return max(sdBox(p, vec3(0.0), vec3(0.9, 1.2, 0.2)), -sdBox(p, vec3(0.5, 0.0, 0.0), vec3(0.5, 0.8, 0.6)));
}

vec3 grad(vec3 p)
{
    const float eps = 0.0001;
    vec3 f = vec3(sdf(p));
    vec3 g = vec3(sdf(p+vec3(eps, 0.0, 0.0)),
                  sdf(p+vec3(0.0, eps, 0.0)),
                  sdf(p+vec3(0.0, 0.0, eps)));
    return (g-f) / eps;
}

float ambientOcclusion(const vec3 p, const vec3 N)
{
    const float k = 50.0;
    float amboDelta = 0.007;
    float ambo = 0.0;
    for (int i=1; i<=5; i++)
    {
        ambo += 1.0/pow(2.0, float(i+1)) * (float(i)*amboDelta - sdf(p+N*amboDelta*float(i)));
    }
    return 1.0 - min(1.0, k*ambo);
}

float hash( float n )
{
    return fract(sin(n)*43758.5453);
}
float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
}


vec4 cloudMap( in vec3 p)
{
	float d = 0.2 - p.y;

	vec3 q = p - vec3(1.0,0.1,0.0)*time;
	float f;
    f  = 0.5000*noise( q ); q = q*2.02;
    f += 0.2500*noise( q ); q = q*2.03;
    f += 0.1250*noise( q ); q = q*2.01;
    f += 0.0625*noise( q );

	d += 3.0 * f;

	d = clamp( d, 0.0, 1.0 );
	
	vec4 res = vec4( d );

	res.xyz = mix( 1.15*vec3(1.0,0.95,0.8), vec3(0.7,0.7,0.7), res.x );
    
	return res;
}

void main() 
{
    // coordinate system with origin in the center and y-axis goes up
    // y-range is [-1.0, 1.0] and x-range is based on aspect ratio.
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = (-resolution.xy + 2.0 * gl_FragCoord.xy) / resolution.y;
    vec2 m = 2.0*(mouse * 2.0 - 1.0) * vec2(resolution.x / resolution.y, 1.0);
        
    // MAGIC GOES HERE...
    vec3 lightDir = normalize(vec3(-m.x, m.y, -0.5));
    vec3 lightColor = vec3(0.6, 0.71, 0.75);
    
    vec3 rayOrigin = 4.0*normalize(vec3(cos(2.75-3.0*1.5), 0.7+(.0), sin(1.0)));
	vec3 ta = vec3(0.0, 1.0, 0.0);
    vec3 ww = normalize( ta - rayOrigin);
    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));
    vec3 vv = normalize(cross(ww,uu));
    vec3 rayDir = normalize( p.x*uu + p.y*vv + 1.5*ww );
    
    vec3 rayPos = rayOrigin;
    float sd;
    float travel = 0.0;
    
    vec3 cloudColor = vec3(0.0);
    vec3 objColor = vec3(0.0);
    vec3 sp = vec3(0.0);
    bool hit = false;
    for (int i=0; i<128; i++)
    {
        sd = sdf(rayPos);
        
        if (abs(sd) < 0.0001)
        {
            hit = true;
            break;
        }
        
        rayPos += rayDir * sd;
        travel += sd;
    }
    travel = min(10.0, travel);
    
    vec4 sum = vec4(0, 0, 0, 0);
	float t = 0.0;
    vec3 lin = vec3(0.0);
    float minStep = travel/64.0;
	for(int i=0; i<64; i++)
	{
		if( sum.a > 0.99 || t >= travel) break;
        
		vec3 pos = rayOrigin + t*rayDir;
		vec4 col = cloudMap(pos);
		
		#if 1
		float dif =  clamp((col.w - cloudMap(pos+0.3*lightDir).w)/0.6, 0.0, 1.0 );
        lin = vec3(0.65,0.68,0.7)*1.35 + 0.45*vec3(0.7, 0.5, 0.3)*dif;
		col.xyz *= lin;
		#endif
		
		col.a *= 0.95;
		col.rgb *= col.a;

		sum = sum + col*(1.0 - sum.a);       

		t += max(minStep, 0.025*t);
        
	}

    // clouds
	sum.xyz /= sum.w;
	sum = clamp( sum, 0.0, 1.0 );
    
    float sun = clamp( dot(lightDir, rayDir), 0.0, 1.0 );
	cloudColor = vec3(0.6, 0.71, 0.75) - rayDir.y*0.2*vec3(1.0, 0.5, 1.0) + 0.15*0.5;
	cloudColor += 0.2*vec3(1.0,.6,0.1)*pow( sun, 8.0 );
	cloudColor *= 0.95;
	cloudColor = mix( cloudColor, sum.xyz, sum.w );
	cloudColor += 0.1*vec3(1.0,0.4,0.2)*pow( sun, 3.0 );

    // object
    if (hit)
    {
        vec3 N = normalize(grad(rayPos));
        float ambo = ambientOcclusion(rayPos, N);
        float NdotL = max(0.0, dot(N, lightDir));
        float specular = 0.0;
        float F0 = 0.5;
        float roughness = 0.35;
        float k = roughness;
        vec3 specColor = vec3(0.0);
        vec3 basecolor = vec3(0.4, 0.0, 0.0);
        if (NdotL > 0.0)
        {
            // calculate intermediary values
            vec3 H = normalize(lightDir-rayDir);
            float NdotH = max(dot(N, H), 0.0);
            float NdotV = max(dot(N, -rayDir), 0.0); // note: this could also be NdotL, which is the same value
            float VdotH = max(dot(-rayDir, H), 0.0);
            float mSquared = roughness * roughness;
            
            // geometric attenuation
            float NH2 = 2.0 * NdotH;
            float g1 = (NH2 * NdotV) / VdotH;
            float g2 = (NH2 * NdotL) / VdotH;
            float geoAtt = min(1.0, min(g1, g2));
            
            // roughness (or: microfacet distribution function) - beckmann distribution function
            float r1 = 1.0 / ( 4.0 * mSquared * pow(NdotH, 4.0));
            float r2 = (NdotH * NdotH - 1.0) / (mSquared * NdotH * NdotH);
            roughness = r1 * exp(r2);
            
            // fresnel - Schlick approximation
            float fresnel = pow(1.0 - VdotH, 5.0);
            fresnel *= (1.0 - F0);
            fresnel += F0;
            
            specular = (fresnel * geoAtt * roughness) / (NdotV * NdotL * 3.14);
            specColor = ambo * basecolor * lightColor * NdotL * (k + specular * (1.0 - k));
        }
        
        float nearDens = cloudMap(rayPos+N*0.5).w;
        specColor *= 1.0-nearDens;
        vec3 diffColor = ambo*basecolor*NdotL + ambo*basecolor*(1.0-nearDens) + ambo*basecolor;
        
        gl_FragColor = vec4(mix(diffColor+specColor, cloudColor*0.95, sum.w), 1.0);
        //gl_FragColor = vec4(cloudColor*0.95, 1.0);
    }
    else
    {
        gl_FragColor = vec4(cloudColor, 1.0);
    }
    
    
}
