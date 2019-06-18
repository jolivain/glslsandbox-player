
// See http://www.iquilezles.org/articles/menger/menger.htm for the
// full explanation of how this was done

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;

float maxcomp(in vec3 p ) { return max(p.x,max(p.y,p.z));}
float sdBox( vec3 p, vec3 b )
{
  vec3  di = abs(p) - b;
  float mc = maxcomp(di);
  return min(mc,length(max(di,0.0)));
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
} 

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

vec4 map( in vec3 p )
{
   //float d = sdBox(p,vec3(1.0));
   //float d = sdSphere(p, 1.4);
   float d = sdTorus(p, vec2(1.0));
   vec4 res = vec4( d, 1.0, 0.0, 0.0 );

   float s = 1.0;
   for( int m=0; m<5; m++ )
   {
      vec3 a = mod( p*s, 2.0 )-1.0;
      s *= 3.0;
      vec3 r = abs(1.0 - 3.0*abs(a));

      float da = max(r.x,r.y);
      float db = max(r.y,r.z);
      float dc = max(r.z,r.x);
      float c = (min(da,min(db,dc))-1.0)/s;
	   
      //float c = (length(r)-1.0)/s;

      if( c>d )
      {
          d = c;
          res = vec4( d, 0.2*da*db*dc, (1.0+float(m))/4.0, 0.0 );
       }
   }

   return res;
}

vec4 intersect( in vec3 ro, in vec3 rd )
{
    float t = 0.0;
    for(int i=0;i<128;i++)
    {
        vec4 h = map(ro + rd*t);
        if( h.x<0.002 )
            return vec4(t,h.yzw);
        t += h.x;
    }
    return vec4(-1.0);
}

vec3 calcNormal(in vec3 pos)
{
    vec3  eps = vec3(.001,0.0,0.0);
    float d = map(pos).x;
    vec3 nor;
    nor.x = d-map(pos-eps.xyy).x;
    nor.y = d-map(pos-eps.yxy).x;
    nor.z = d-map(pos-eps.yyx).x;
    return normalize(nor);
}

void main(void)
{
    vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
    p.x *= 1.33;

    // light
    vec3 light = normalize(vec3(1.0,0.8,-0.6));

    float ctime = time;
    // camera
    vec3 ro = 1.1*vec3(2.5*cos(0.5*ctime),1.5*cos(ctime*.23),2.5*sin(0.5*ctime));
    vec3 ww = normalize(vec3(0.0) - ro);
    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));
    vec3 vv = normalize(cross(ww,uu));
    vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );

    vec3 col = vec3(0.0);
    vec4 tmat = intersect(ro,rd);
    if( tmat.x>0.0 )
    {
        vec3 pos = ro + tmat.x*rd;
        vec3 nor = calcNormal(pos);

        float dif1 = max(dot(nor,light),0.0);
        float dif2 = max(0.4 + 0.6*dot(nor,vec3(-light.x,light.y,-light.z)),0.0);

        // shadow
        float ldis = 4.0;
        vec4 shadow = intersect( pos + light*ldis, -light );
        if( shadow.x>0.0 && shadow.x<(ldis-0.01) ) dif1=0.0;

        float ao = tmat.y;
        col  = 1.0*ao*vec3(0.2,0.2,0.2);
        col += 2.0*(0.5+0.5*ao)*dif1*vec3(1.0,0.97,0.85);
        col += 0.3*(0.5+0.5*ao)*dif2*vec3(1.0,0.97,0.85);
        col += 1.0*(0.5+0.5*ao)*(0.5+0.5*nor.y)*vec3(0.1,0.15,0.2);
    }


    gl_FragColor = vec4(col,1.0);
}

