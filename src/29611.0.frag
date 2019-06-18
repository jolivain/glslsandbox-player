precision mediump float;uniform vec2 resolution;uniform vec2 mouse;//Robert Schütze (trirop) 07.12.2015
void main(){vec3 p = vec3((gl_FragCoord.xy)/(resolution.y),mouse.x);
  for (int i = 0; i < 100; i++){
    p.xzy = vec3(1.3,0.999,0.7)*(abs((abs(p)/dot(p,p)-vec3(1.0,1.0,mouse.y*0.5))));}
  gl_FragColor.rgb = p;gl_FragColor.a = 1.0;}
