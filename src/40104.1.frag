// by @301z
// best viewed in 0.5

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;

vec3 rgb(int r, int g, int b) {
  return vec3(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0);
}

#define borderWidth (1.5 / resolution.y)
#define borderColor (rgb(32, 32, 32))
#define hairColor0 (rgb(151, 200, 234))
#define hairColor1 (rgb(77, 135, 192))
#define hairColor2 (rgb(58, 103, 151))
#define faceColor0 (rgb(247, 223, 204))
#define faceColor1 (rgb(209, 173, 159))
#define faceColor2 (rgb(183, 148, 133))
#define eyeColor0 (rgb(145, 164, 176))
#define eyeColor1 (rgb(207, 216, 218))
#define eyeColor2 (rgb(255, 255, 255))
#define eyeColor3 (rgb(0, 0, 0))
#define eyeColor4 (hairColor0)
#define eyeColor5 (hairColor2)
#define eyeColor6 (hairColor1)
#define mouthColor0 (rgb(78, 53, 40))
#define mouthColor1 (rgb(152, 78, 69))
#define mouthColor2 (rgb(170, 92, 83))
#define backgroundColor (rgb(51, 124, 221))

vec2 position() {
  return vec2((gl_FragCoord.x - resolution.x), gl_FragCoord.y) / resolution.y;
}

float cross2(vec2 v0, vec2 v1) {
  return v0.x * v1.y - v0.y * v1.x;
}

float circle(vec2 centre, float radius) {
  return distance(centre, position()) - radius;
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

bool hair0(out vec3 color) {
  float upper = circle(vec2(-1.06, 0.795), 0.64);
  float lower = circle(vec2(-0.851, -0.011), 1.001);
  float right = circle(vec2(-0.84, 0.74), 0.5);
  if (outside(upper) || inside(lower) || inside(right))
    return false;
  if (!inside(upper) || !outside(lower))
    color = borderColor;
  else {
    float upper = circle(vec2(-1.01, 0.74), 0.6);
    float lower = circle(vec2(-1.07, 0.13), 0.77);
    color = (inside(upper) && outside(lower)) ? hairColor1 : hairColor0;
  }
  return true;
}

bool hair1(out vec3 color) {
  float upper = circle(vec2(-0.84, 0.74), 0.5);
  float lower = circle(vec2(-1.8, 1.62), 0.9);
  if (outside(upper) || outside(lower))
    return false;
  color = (inside(upper) && inside(lower)) ? hairColor1 : borderColor;
  return true;
}

bool hair2(out vec3 color) {
  float upper = circle(vec2(-0.695, 0.74), 0.5);
  float lower = circle(vec2(-3.5, 8.46), 8.1);
  if (outside(upper) || outside(lower))
    return false;
  if (!inside(upper) || !inside(lower))
    color = borderColor;
  else {
    float left = circle(vec2(-0.675, 0.78), 0.502);
    if (outside(left))
      color = hairColor0;
    else {
      float right = circle(vec2(-1.77, 2.99), 2.4);
      color = inside(right) ? hairColor1 : hairColor2;
    }
  }
  return true;
}

bool hair3a(out vec3 color) {
  float left = circle(vec2(-2.77, 1.86), 2.5);
  float right = circle(vec2(-1.544, 1.777), 1.44);
  if (inside(left) || outside(right))
    return false;
  color = hairColor1;
  return true;
}

bool hair3b(out vec3 color) {
  float upper = circle(vec2(-2.654, 1.92), 2.39);
  float lower = circle(vec2(-1.44, 1.777), 1.388);
  float right = circle(vec2(-0.5, 0.5), 0.515);
  if (inside(upper) || outside(lower) || outside(right))
    return false;
  color = (outside(upper) && inside(lower)) ? hairColor2 : borderColor;
  return true;
}

bool hair4a(out vec3 color) {
  vec2 p0 = vec2(1.332, 0.8), p1 = vec2(-1.5, 0.36);
  float r0 = 1.7, r1 = distance(p0, p1) - r0;
  float left0 = circle(p0, r0), left1 = circle(p1, r1);
  float right = circle(vec2(-0.5, 0.97), 0.78);
  bool upper = cross2(position() - p1, p0 - p1) < 0.0;
  if ((upper && outside(left0)) || (!upper && inside(left1)) || outside(right))
    return false;
  color = ((upper && inside(left0)) || (!upper && outside(left1))) && inside(right) ? hairColor2 : borderColor;
  return true;
}

bool hair4b(out vec3 color) {
  vec2 p0 = vec2(0.504, 0.91), p1 = vec2(-1.7, 0.25);
  float r0 = 0.79, r1 = distance(p0, p1) - r0;
  float left0 = circle(p0, r0), left1 = circle(p1, r1);
  float right = circle(vec2(-0.62, 0.98), 0.78);
  bool upper = cross2(position() - p1, p0 - p1) < 0.0;
  if ((upper && outside(left0)) || (!upper && inside(left1)) || outside(right))
    return false;
  color = hairColor1;
  return true;
}

bool hair5(out vec3 color) {
  float left = circle(vec2(1.13, -1.07), 2.02);
  float right = circle(vec2(-1.505, 1.15), 1.66);
  if (outside(left) || outside(right))
    return false;
  if (!inside(left) || !inside(right))
    color = borderColor;
  else {
    float upper = circle(vec2(1.205, 0.28), 1.58);
    float lower = circle(vec2(-0.57, 0.78), 0.69);
    float right = circle(vec2(-1.52, 1.10), 1.6);
    color = ((inside(upper) && inside(lower)) || outside(right)) ? hairColor2 : hairColor1;
  }
  return true;
}

bool layer0(out vec3 color) {
  if (hair3a(color))
    return true;
  if (hair2(color))
    return true;
  if (hair3b(color))
    return true;
  if (hair4b(color))
    return true;
  if (hair4a(color))
    return true;
  if (hair5(color))
    return true;
  if (hair1(color))
    return true;
  return hair0(color);
}

bool face0(out vec3 color) {
  if (inside(circle(vec2(-0.7, 0.0), 0.2)))
    color = faceColor1;
  else {
    vec2 p3 = vec2(-1.02, 0.25);
    float r3 = 0.41, c3 = circle(p3, r3);
    vec2 p2 = vec2(-1.12, 0.203);
    float r2 = r3 - distance(p2, p3), c2 = circle(p2, r2);
    vec2 p1 = vec2(-2.7, 0.87);
    float r1 = distance(p1, p2) - r2, c1 = circle(p1, r1);
    vec2 p0 = vec2(-0.5, 0.66);
    float r0 = distance(p0, p1) - r1, c0 = circle(p0, r0);
    if (cross2(position() - p0, p1 - p0) > 0.0) {
      if (outside(c0))
        return false;
      color = inside(c0) ? (inside(circle(vec2(-1.8, 1.57), 0.9)) ? faceColor2 : faceColor1) : borderColor;
   } else if (cross2(position() - p1, p2 - p1) < 0.0) {
      if (inside(c1))
        return false;
      color = outside(c1) ? (((inside(circle(vec2(-0.95, 0.31), 0.49))) && (c1 < 0.035)) ? faceColor0 : faceColor1) : borderColor;
    } else if (cross2(position() - p2, p3 - p2) < 0.0) {
      if (outside(c2))
        return false;
      color = inside(c2) ? ((c2 > -0.035) ? faceColor0 : faceColor1) : borderColor;
    } else {
      if (outside(c3))
        return false;
      color = inside(c3) ? ((c3 > -0.035) ? faceColor0 : faceColor1) : borderColor;
    }
  }
  return true;
}

bool face1(out vec3 color) {
  float upper = circle(vec2(-0.6, 0.72), 0.5);
  float lower = circle(vec2(-3.5, 8.004), 7.7);
  if (outside(upper) || outside(lower))
    return false;
  color = faceColor2;
  return true;
}

bool face2(out vec3 color) {
  float upper = circle(vec2(-3.182, 1.75), 2.8);
  float lower = circle(vec2(-1.44, 1.777), 1.388);
  if (inside(upper) || outside(lower))
    return false;
  color = faceColor2;
  return true;
}

bool face3(out vec3 color) {
  vec2 p0 = vec2(1.332-0.044, 0.8), p1 = vec2(-1.5, 0.36);
  float r0 = 1.7, r1 = distance(p0, p1) - r0;
  float left0 = circle(p0, r0), left1 = circle(p1, r1);
  bool upper = cross2(position() - p1, p0 - p1) < 0.0;
  if ((upper && outside(left0)) || (!upper && inside(left1)))
    return false;
  color = faceColor2;
  return true;
}

bool layer1(out vec3 color) {
  if (outside(circle(vec2(-1.2, 0.7), 1.0)))
    return false;
  if (face3(color))
    return true;
  if (face2(color))
    return true;
  if (face1(color))
    return true;
  return face0(color);
}

bool layer2(out vec3 color) {
  if (inside(circle(vec2(0.0, 0.0), 0.5))) {
    color = hairColor1;
    return true;
  }
  vec2 p2 = vec2(-0.42, -0.1);
  float r2 = 1.14, c2 = circle(p2, r2);
  vec2 p1 = vec2(-3.5, 1.56);
  float r1 = distance(p1, p2) - r2, c1 = circle(p1, r1);
  bool b1 = inside(circle(vec2(-0.847, 0.5), 0.55));
  bool b2 = inside(circle(vec2(-0.94, -0.06), 0.56));
  if (cross2(position() - p1, p2 - p1) < 0.0) {
    if (inside(c1))
      return false;
    color = outside(c1) ? (b1 ? hairColor1 : hairColor0) : borderColor;
  } else {
    if (outside(c2))
      return false;
    color = inside(c2) ? ((b1 || b2) ? hairColor1 : hairColor0) : borderColor;
  }
  return true;
}

bool leftEye0(out vec3 color) {
  float top = circle(vec2(-0.866, 0.4899), 0.428);
  float left = circle(vec2(-0.986, 0.6), 0.3);
  float bottom = circle(vec2(-1.14, 0.604), 0.2);
  float right = circle(vec2(-1.54, 0.7), 0.51);
  if (outside(top) || outside(left) || outside(bottom) || outside(right))
    return false;
  if (outside(circle(vec2(-0.919, 0.53), 0.344)))
    color = borderColor;
  else if (outside(circle(vec2(-0.918, 0.5), 0.338)))
    color = eyeColor0;
  else if (inside(circle(vec2(-1.05, 0.77), 0.1)) && outside(circle(vec2(-1.101, 0.67), 0.08)))
    color = eyeColor0;
  else
    color = eyeColor1;
  return true;
}

bool leftEye1(out vec3 color) {
  if (outside(circle(vec2(-1.0, 0.7), 0.08))
      || inside(circle(vec2(-1.092, 0.667), 0.1))
        || inside(circle(vec2(-0.919, 0.8), 0.1)))
    return false;
  if (outside(circle(vec2(-1.101, 0.69), 0.1)) && outside(circle(vec2(-0.879, 0.9), 0.2)))
    return false;
  color = borderColor;
  return true;
}

bool leftEye2(out vec3 color) {
  if (outside(ellipse(vec2(-1.156, 0.435), vec2(-1.091, 0.75), 1.074)))
    return false;
  if (inside(ellipse(vec2(-1.156, 0.636), vec2(-1.122, 0.726), 1.16))) {
    color = eyeColor2;
    return true;
  }
  if (inside(ellipse(vec2(-1.121, 0.593), vec2(-1.116, 0.614), 1.168))
     || inside(ellipse(vec2(-1.113, 0.488), vec2(-1.111, 0.505), 1.23))) {
    color = eyeColor4;
    return true;
  }
  if (inside(ellipse(vec2(-1.154, 0.45), vec2(-1.1, 0.75), 1.05))
      && inside(ellipse(vec2(-1.163, 0.445), vec2(-1.121, 0.552), 1.3))
        && outside(ellipse(vec2(-1.13, 0.501), vec2(-1.116, 0.614), 1.177))) {
    color = eyeColor6;
    return true;
  }  if (inside(ellipse(vec2(-1.152, 0.445), vec2(-1.091, 0.75), 1.067))
      && inside(ellipse(vec2(-1.163, 0.445), vec2(-1.121, 0.565), 1.3))
        && outside(ellipse(vec2(-1.128, 0.52), vec2(-1.116, 0.614), 1.177))) {
    color = eyeColor5;
    return true;
  }
  color = eyeColor3;
  return true;
}

bool leftEye(out vec3 color) {
  if (leftEye2(color))
    return true;
  if (leftEye1(color))
    return true;
  return leftEye0(color);
}

bool rightEye0(out vec3 color) {
  if (outside(circle(vec2(-0.609, 0.542), 0.129))
    && inside(circle(vec2(-0.61, 0.584), 0.101))) {
    color = borderColor;
    return true;
  }
  if (inside(circle(vec2(-2.654, 1.92), 2.39))
    || outside(circle(vec2(-0.685, 0.42), 0.285))
      || inside(circle(vec2(-0.683, 0.432), 0.262))
        || outside(circle(vec2(-0.638, 0.516), 0.3)))
    return false;
  color = borderColor;
  return true;
}

bool rightEye1(out vec3 color) {
  if (outside(circle(vec2(-2.654, 1.92), 2.39))
    || outside(circle(vec2(-0.627, 0.583), 0.11))
      || inside(circle(vec2(-0.65, 0.582), 0.11)))
    return false;
  color = borderColor;
  return true;
}

bool rightEye2(out vec3 color) {
  if (outside(circle(vec2(-0.57, 0.38), 0.3))
    || outside(circle(vec2(-0.166, 0.34), 0.59))
      || outside(circle(vec2(-0.34, 0.6), 0.505))
        || outside(circle(vec2(-0.47, 0.763), 0.54))
          || outside(circle(vec2(-0.638, 0.52), 0.3))
            || outside(circle(vec2(-0.685, 0.42), 0.285)))
    return false;
  color = inside(ellipse(vec2(-0.625, 0.23), vec2(-0.59, 0.576), 1.38)) ? eyeColor1 : eyeColor0;
  return true;
}

bool rightEye3(out vec3 color) {
  if (outside(ellipse(vec2(-0.61, 0.29), vec2(-0.538, 0.5844), 1.23)))
    return false;
  if (outside(ellipse(vec2(-0.584, 0.355), vec2(-0.56, 0.518), 1.24))
      && inside(ellipse(vec2(-0.611, 0.31), vec2(-0.574, 0.42), 1.575))
        && inside(ellipse(vec2(-0.701, 0.09), vec2(-0.58, 0.38), 1.17))) {
    color = eyeColor6;
    return true;
  }
  if (outside(ellipse(vec2(-0.584, 0.367), vec2(-0.546, 0.518), 1.2))
      && inside(ellipse(vec2(-0.611, 0.299), vec2(-0.56, 0.48), 1.37))
        && inside(ellipse(vec2(-0.68, 0.09), vec2(-0.58, 0.42), 1.17))) {
    color = eyeColor5;
    return true;
  }
  color = eyeColor3;
  return true;
}

bool rightEye4(out vec3 color) {
  if (inside(ellipse(vec2(-0.627, 0.49), vec2(-0.589, 0.583), 1.35))) {
    color = eyeColor2;
    return true;
  }
  if (inside(circle(vec2(-0.576, 0.445), 0.01)) || inside(circle(vec2(-0.54, 0.32), 0.01))) {
    color = eyeColor4;
    return true;
  }
  return false;
}

bool rightEye(out vec3 color) {
  if (rightEye0(color))
    return true;
  if (rightEye1(color))
    return true;
  if (rightEye4(color))
    return true;
  if (rightEye3(color))
    return true;
  return rightEye2(color);
}

bool layer3(out vec3 color) {
  if (leftEye(color))
    return true;
  return rightEye(color);
}

bool mouth(out vec3 color) {
  if (outside(ellipse(vec2(-1.01, -0.04), vec2(-1.095, 0.02), 1.44)))
    return false;
  if (inside(ellipse(vec2(-1.01, -0.04), vec2(-1.095, 0.02), 1.4))
     && inside(circle(vec2(-1.04, -0.045), 0.102))) {
    color = inside(ellipse(vec2(-1.0, -0.09), vec2(-1.092, 0.002), 1.34)) ? mouthColor2 : mouthColor1;
    return true;
  }
  color = mouthColor0;
  return true;
}

bool nose(out vec3 color) {
  if (inside(circle(vec2(-1.061, 0.228), 0.1))
    && inside(circle(vec2(-1.107, 0.304), 0.019))
      && outside(circle(vec2(-1.058, 0.29), 0.045))) {
    color = (inside(circle(vec2(-1.007, 0.31), 0.1)) && outside(circle(vec2(-1.176, 0.379), 0.1))) ? borderColor : faceColor2;
    return true;
  }
  return false;
}

bool leftEyebrow(out vec3 color) {
  float c = circle(vec2(-0.85, 0.586), 0.502);
  if (outside(c) || inside(c) || !inside(circle(vec2(-1.1, 1.072), 0.202)))
    return false;
  color = borderColor;
  return true;
}

bool rightEyebrow(out vec3 color) {
  if (inside(circle(vec2(-0.77, 0.42), 0.56)))
    return false;
  vec2 p0 = vec2(-0.66, 0.601), p1 = vec2(-0.57, 0.742);
  float r0 = 0.397, r1 = r0 - distance(p0, p1);
  float c0 = circle(p0, r0), c1 = circle(p1, r1);
  float f = cross2(position() - p0, p1 - p0);
  if ((f < 0.0) ? (outside(c1) || inside(c1)) : (outside(c0) || inside(c0)))
    return false;
  color = borderColor;
  return true;
}

bool layer4(out vec3 color) {
  if (leftEyebrow(color))
    return true;
  if (rightEyebrow(color))
    return true;
  if (mouth(color))
    return true;
  return nose(color);
}

bool ear0(out vec3 color) {
  vec2 p0 = vec2(-0.249, 0.192), p1 = vec2(-0.09, 0.25);
  float r0 = 0.202, r1 = r0 - distance(p0, p1);
  float c0 = circle(p0, r0), c1 = circle(p1, r1);
  float c = (cross2(position() - p0, p1 - p0) < 0.0) ? c1 : c0;
  if (outside(c))
    return false;
  color = inside(c) ? faceColor1 : borderColor;
  return true;
}

bool ear1(out vec3 color) {
  vec2 p1 = vec2(-0.155, 0.23), p2 = vec2(-0.11, 0.21);
  float c1 = circle(vec2(-0.14, 0.397), 0.204);
  float c2 = circle(p1, 0.06);
  float e = ellipse(vec2(-0.144, 0.16), vec2(-0.099, 0.235), 1.18);
  if (outside(c1) || outside(e))
    return false;
  if (!inside(e))
    color = borderColor;
  else {
    if (outside(c2))
      return false;
    color = (inside(c1) && ((cross2(position() - p1, p2 - p1) < 0.0) || inside(c2))) ? faceColor2 : borderColor;
  }
  return true;
}

bool ear2(out vec3 color) {
  vec2 p1 = vec2(-0.2, -0.155);
  float r1 = 0.2, c1 = circle(p1, r1);
  vec2 p2 = vec2(-0.2, 0.1);
  float r2 = distance(p1, p2) - r1, c2 = circle(p2, r2);
  if (cross2(position() - p1, p2 - p1) < 0.0) {
    if (inside(c1))
      return false;
    color = outside(c1) ? faceColor2 : borderColor;
  } else {
    vec2 p = vec2(-0.144, 0.156);
    bool e = inside(ellipse(p, vec2(-0.36, -0.1), 1.04)) || inside(ellipse(p, vec2(-0.36, 0.1), 1.04));
    if ((cross2(position() - p2, vec2(-0.15, 0.075) - p2) < 0.0)) {
      if (!e)
        return false;
      color = faceColor2;
    } else if (inside(c2)) {
      if (!e)
        return false;
      color = faceColor2;
    } else {
      if (outside(c2))
        return false;
      color = borderColor;
    }
  }
  return true;
}

bool ear3(out vec3 color) {
  if (inside(circle(vec2(-0.2, -0.155), 0.2)))
    return false;
  vec2 p1 = vec2(-0.64, 0.28);
  float r1 = 0.5, c1 = circle(p1, r1);
  vec2 p2 = vec2(-0.172, 0.144);
  float r2 = r1 - distance(p1, p2), c2 = circle(p2, r2);
  float c = (cross2(position() - p1, p2 - p1) < 0.0) ? c2 : c1;
  if (inside(c) || outside(c))
    return false;
  color = borderColor;
  return true;
}

bool layer5(out vec3 color) {
  if (inside(circle(vec2(-1.505, 1.15), 1.66)))
    return false;
  if (ear3(color))
    return true;
  if (ear2(color))
    return true;
  if (ear1(color))
    return true;
  return ear0(color);
}

bool ikachan(out vec3 color) {
  if (layer4(color))
    return true;
  if (layer0(color))
    return true;
  if (layer5(color))
    return true;
  if (layer3(color))
    return true;
  if (layer1(color))
    return true;
  return layer2(color);
}
	
vec3 filter_(vec3 color) {
  return color * 0.5 * (2.0 - gl_FragCoord.x / resolution.x + gl_FragCoord.y / resolution.y);
}

void main() {
  vec3 color;
  gl_FragColor = vec4(filter_(ikachan(color) ? color : backgroundColor), 1.0);
}

