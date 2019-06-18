#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

vec3 rgb(int r, int g, int b) {
  return vec3(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0);
}

#define colorBlack      (vec3(0.0, 0.0, 0.0))
#define colorWhite      (vec3(1.0, 1.0, 1.0))
#define colorGray       (vec3(1.0, 1.0, 1.0))
#define colorRed        (vec3(1.0, 0.0, 0.0))

#define borderWidth     (1.5 / resolution.y)
#define backgroundColor colorWhite
#define bodyColor       (rgb(16,16,16))
#define cheekColor      colorRed

vec2 position() {
  vec2 ret = gl_FragCoord.xy; ret /= resolution; ret *= 2.0; ret -= 1.0;
  ret.x *= resolution.x / resolution.y;
  return ret;
}

float cross2(vec2 v0, vec2 v1) {
  return v0.x * v1.y - v0.y * v1.x;
}

float circle(vec2 center, float radius) {
  return distance(center, position()) - radius;
}

float ellipse(vec2 focus0, vec2 focus1, float radius) {
  vec2 p = position();
  return distance(p, focus0) + distance(p, focus1) - distance(focus0, focus1) * radius;
}

bool inside(float f) {
  return f < -borderWidth;
}

bool outside(float f) {
  return f > borderWidth;
}

bool ear(out vec3 color) {

  return false;
}

bool kumamon(out vec3 color) {
  /// nose
  if (inside(ellipse(vec2(-0.05, 0.3), vec2(0.05, 0.3), 1.1)) ||
      inside(ellipse(vec2( 0.05, 0.3), vec2(0.0, 0.28), 1.1)) ||
      inside(ellipse(vec2(-0.05, 0.3), vec2(0.0, 0.28), 1.1))) {
    color = bodyColor;
    return true;
  }
  /// mouse over
  if (inside(ellipse(vec2( 0.17, 0.15), vec2( 0.0, 0.1), 1.04)) ||
      inside(ellipse(vec2(-0.17, 0.15), vec2(-0.0, 0.1), 1.04))) {
    color = colorWhite;
    return true;
  }
  /// mouse
  if (inside(ellipse(vec2(-0.15, 0.16), vec2(0.15, 0.16), 1.04))) {
    color = bodyColor;
    return true;
  }
  /// face
  if (inside(ellipse(vec2(-0.13, 0.2), vec2(0.13, 0.2), 1.6))) {
    color = colorWhite;
    return true;
  }
  /// cheek
  if (inside(circle(vec2( 0.4, 0.3), 0.1)) ||
      inside(circle(vec2(-0.4, 0.3), 0.1))) {
    color = cheekColor;
    return true;
  }
  /// eye inner
  if (inside(ellipse(vec2( 0.21, 0.45), vec2( 0.21, 0.4), 1.2)) ||
      inside(ellipse(vec2(-0.21, 0.45), vec2(-0.21, 0.4), 1.2))) {
    color = bodyColor;
    return true;
  }
  /// eye
  if (inside(circle(vec2( 0.21, 0.42), 0.08)) ||
      inside(circle(vec2(-0.21, 0.42), 0.08))) {
    color = colorWhite;
    return true;
  }
  /// eyebrow black
  if (inside(ellipse(vec2( 0.26, 0.54), vec2( 0.25, 0.3), 1.2)) ||
      inside(ellipse(vec2(-0.26, 0.54), vec2(-0.25, 0.3), 1.2))) {
    color = bodyColor;
    return true;
  }
  /// eyebrow white
  if (inside(ellipse(vec2( 0.26, 0.56), vec2( 0.25, 0.4), 1.2)) ||
      inside(ellipse(vec2(-0.26, 0.56), vec2(-0.25, 0.4), 1.2))) {
    color = colorWhite;
    return true;
  }
  /// arms
  if (inside(ellipse(vec2( 0.3, 0.2), vec2( 0.4, -0.8), 1.1)) ||
      inside(ellipse(vec2(-0.3, 0.2), vec2(-0.4, -0.8), 1.1))) {
    color = bodyColor;
    return true;
  }
  /// body
  if (inside(ellipse(vec2(0.0, 0.5), vec2(0.0, -1.6), 1.1))) {
    color = bodyColor;
    return true;
  }
  /// head
  if (inside(ellipse(vec2(-0.3, 0.31), vec2(0.3, 0.31), 1.6))) {
    color = bodyColor;
    return true;
  }
  /// ear inner
  if (inside(circle(vec2(-0.4, 0.59), 0.06)) ||
      inside(circle(vec2( 0.4, 0.59), 0.06))) {
    color = colorWhite;
    return true;
  }
  /// ear outer
  if (inside(circle(vec2(-0.41, 0.6), 0.1)) ||
      inside(circle(vec2( 0.41, 0.6), 0.1))) {
    color = bodyColor;
    return true;
  }
  return false;
}

vec3 filter_(vec3 color) {
  return color * 0.5 *
      (2.0 - gl_FragCoord.x / resolution.x + gl_FragCoord.y / resolution.y);
}

void main() {
  vec3 color;
  gl_FragColor = vec4(filter_(kumamon(color) ? color : backgroundColor), 1.0);
}

