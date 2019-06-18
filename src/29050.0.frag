#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float EPS = 0.001;

vec2 onRep(vec2 p, float interval) {
  return mod(p, interval) - interval * 0.5;
}

float distBar(vec2 p, float interval, float width) {
  return length(max(abs(onRep(p, interval)) - width, 0.0));
}

float distTube(vec2 p, float interval, float width) {
  return length(onRep(p, interval)) - width;
}

// distance function
float distScene(vec3 p) {
  float bar_x = distBar(p.yz, 1.0, 0.1);
  float bar_y = distBar(p.xz, 1.0, 0.1);
  float bar_z = distBar(p.xy, 1.0, 0.1);

  float tube_x = distTube(p.yz, 0.1, 0.025);
  float tube_y = distTube(p.xz, 0.1, 0.025);
  float tube_z = distTube(p.xy, 0.1, 0.025);

  return max(max(max(min(min(bar_x, bar_y),bar_z), -tube_x), -tube_y), -tube_z);
}

vec3 getNormal(vec3 p) {
  return normalize(vec3(
    distScene(p + vec3(  EPS, 0.0, 0.0)) - distScene(p + vec3( -EPS, 0.0, 0.0)),
    distScene(p + vec3(0.0,   EPS, 0.0)) - distScene(p + vec3(0.0,  -EPS, 0.0)),
    distScene(p + vec3(0.0, 0.0,   EPS)) - distScene(p + vec3(0.0, 0.0,  -EPS))
  ));
}

void main(void) {
  // fragment position
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  // camera and ray
  vec3 cPos = vec3(0.0, 0.0, time);
  vec3 cUp  = normalize(vec3(0.1, 0.4, 0.0));
  vec3 cDir = cross(cUp, vec3(-1.0, 0.0, 0.0));
  vec3 cSide = cross(cDir, cUp);
  float targetDepth = 1.0;
  vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);

  // direction light
  vec3 lightDir = normalize(vec3(1, 1, -2));

  // marching loop
  float dist;
  float depth = 0.0;
  vec3 dPos = cPos;
  for(int i = 0; i < 64; i++){
    dist = distScene(dPos);
    depth += dist;
    dPos = cPos + depth * ray;
    if (abs(dist) < EPS) break;
  }

  // hit check
  vec3 color;
  if (abs(dist) < EPS) {
    vec3 normal = getNormal(dPos);
    float diffuse = clamp(dot(lightDir, normal), 0.1, 1.0);
    color = vec3(1.0, 0.1, 0.1) * diffuse;
  } else {
    color = vec3(0.0);
  }
  gl_FragColor = vec4(color + 0.05 * depth, 1.0);
}
