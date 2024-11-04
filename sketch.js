

// Global state management
let flowfield;
let willReadFrequently = true;
let globalTime = 0;
let emotionalIntensity = 0;
let distortionField = [];

// Color palette
const COLORS = {
  BODY: {
    MAIN: [55, 45, 40],
    SHADOW: [40, 35, 30],
    HIGHLIGHT: [65, 55, 50]
  },
  HEAD: {
    MAIN: [235, 225, 205],
    SHADOW: [215, 205, 185],
    GLOW: [245, 235, 215]
  },
  ARMS: {
    MAIN: [65, 55, 45],
    SHADOW: [50, 45, 35]
  },
  BACKGROUND: [220, 215, 205],
  ATMOSPHERE: [200, 195, 185]
};

/**
 * FlowField class - Creates subtle movement patterns
 */
class FlowField {
  constructor(resolution) {
    this.resolution = resolution;
    this.cols = ceil(width / resolution);
    this.rows = ceil(height / resolution);
    this.field = new Array(this.cols * this.rows);
    this.particleSpeed = 0.15;
  }

  update(time) {
    let xoff = 0;
    for (let x = 0; x < this.cols; x++) {
      let yoff = 0;
      for (let y = 0; y < this.rows; y++) {
        let index = x + y * this.cols;
        let angle = noise(xoff, yoff, time * 0.015) * TWO_PI * 2 + 
                    sin(time * 0.08 + x * 0.1 + y * 0.1) * 0.3;
        this.field[index] = p5.Vector.fromAngle(angle).mult(this.particleSpeed);
        yoff += 0.1;
      }
      xoff += 0.1;
    }
  }

  getForce(x, y, intensity = 1) {
    let col = floor(constrain(x / this.resolution, 0, this.cols - 1));
    let row = floor(constrain(y / this.resolution, 0, this.rows - 1));
    let force = this.field[col + row * this.cols] || createVector(0, 0);
    return force.copy().mult(intensity);
  }
}

/**
 * Utility function for calculating complex distortions
 */
function getComplexDistortion(x, y, time) {
  let distortion = createVector(0, 0);
  distortionField.forEach(d => {
    let dx = sin(x * d.frequency + time * d.speed + d.phase) * d.amplitude;
    let dy = cos(y * d.frequency + time * d.speed + d.phase + PI/4) * d.amplitude;
    distortion.add(createVector(dx, dy));
  });
  return distortion;
}

/**
 * p5.js setup function
 */
function setup() {
  createCanvas(600, 800);
  pixelDensity(1);
  colorMode(RGB, 255, 255, 255, 1);
  
  try {
    // Initialize core components
    flowfield = new FlowField(20);
    
    // Initialize distortion field
    for (let i = 0; i < 8; i++) {
      distortionField.push({
        frequency: random(0.002, 0.003),
        amplitude: random(1.5, 3),
        phase: random(TWO_PI),
        speed: random(0.0005, 0.0008)
      });
    }

    // Performance optimizations
    frameRate(30);
    smooth();
    
    // Configure canvas rendering
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.imageRendering = 'pixelated';
    }
  } catch (error) {
    console.error('Setup failed:', error);
    noLoop();
  }
}

// Basic error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Animation error:', {
    message: msg,
    url: url,
    line: lineNo,
    column: columnNo,
    error: error
  });
  return false;
};


/**
 * Main draw loop
 */
function draw() {
  try {
    // Validate core components
    if (!flowfield || !distortionField) {
      console.error('Critical components not initialized');
      noLoop();
      return;
    }

    // Update time and emotional state
    globalTime = frameCount * 0.008;
    emotionalIntensity = map(sin(globalTime * 0.3), -1, 1, 0.5, 1);
    
    // Create the haunting background
    background(
      COLORS.BACKGROUND[0] + sin(globalTime) * 2,
      COLORS.BACKGROUND[1] + sin(globalTime * 1.1) * 2,
      COLORS.BACKGROUND[2] + sin(globalTime * 1.2) * 2
    );
    
    // Update and translate
    flowfield.update(globalTime);
    translate(width/2, height/2);
    
    // Draw the figure layers
    drawShadowLayer();
    drawMainFigure();
    addAtmosphericEffects();
    
  } catch (error) {
    console.error('Draw cycle failed:', error);
    noLoop();
  }
}

/**
 * Draws the shadow underneath the figure
 */
function drawShadowLayer() {
  push();
  let shadowOffset = createVector(
    2 + sin(globalTime * 0.7) * 1.5,
    2 + cos(globalTime * 0.7) * 1.5
  );
  translate(shadowOffset.x, shadowOffset.y);
  drawFigure(true);
  pop();
}

/**
 * Coordinates drawing the main figure
 */
function drawMainFigure() {
  drawFigure(false);
}

/**
 * Main figure drawing function
 */
function drawFigure(isShadow) {
  let baseDistortion = getComplexDistortion(0, 0, globalTime);
  drawBody(isShadow, baseDistortion);
  
  if (!isShadow) {
    drawArms(baseDistortion);
    drawHead(baseDistortion);
  }
}

/**
 * Draws the main body shape
 */
function drawBody(isShadow, baseDistortion) {
  push();
  noStroke();
  
  let bodyColor = isShadow ? COLORS.BODY.SHADOW : COLORS.BODY.MAIN;
  fill(
    ...bodyColor, 
    isShadow ? 0.25 : 0.95 + sin(globalTime * 0.5) * 0.05
  );

  beginShape();
  // Left side of body
  for (let t = 0; t <= 1; t += 0.02) {
    let y = map(t, 0, 1, -120, 180);
    let width = map(sin(t * PI), 0, 1, 30, 40);
    
    let distortion = baseDistortion.copy().mult(1 - t * 0.3);
    let sway = sin(t * PI + globalTime) * (2 + emotionalIntensity);
    let xLeft = -width + sway + distortion.x;
    vertex(xLeft, y + distortion.y);
  }
  
  // Right side of body
  for (let t = 1; t >= 0; t -= 0.02) {
    let y = map(t, 0, 1, -120, 180);
    let width = map(sin(t * PI), 0, 1, 30, 40);
    
    let distortion = baseDistortion.copy().mult(1 - t * 0.3);
    let sway = sin(t * PI + globalTime) * (2 + emotionalIntensity);
    let xRight = width + sway + distortion.x;
    vertex(xRight, y + distortion.y);
  }
  
  endShape(CLOSE);
  pop();
}

/**
 * Draws the arms with characteristic curved shape
 */
function drawArms(baseDistortion) {
  for (let side = -1; side <= 1; side += 2) {
    push();
    let startX = side * 32;
    let startY = -90;
    
    drawArmConnection(side, startX, startY);
    
    // Main arm shape
    stroke(COLORS.ARMS.MAIN);
    strokeWeight(9);
    noFill();
    
    beginShape();
    for (let i = 0; i < 8; i++) {
      let t = i / 7;
      let y = startY + t * 120;
      
      let curve = sin(t * PI) * (35 + emotionalIntensity * 4);
      let wave = sin(y * 0.02 + globalTime) * 3;
      
      let distortion = baseDistortion.copy().mult(0.4 * (1 - t));
      let x = startX + side * (curve + wave) + distortion.x;
      y += distortion.y;
      
      if (i === 0 || i === 7) curveVertex(x, y);
      curveVertex(x, y);
    }
    endShape();
    pop();
  }
}

/**
 * Creates smooth connection between arms and body
 */
function drawArmConnection(side, startX, startY) {
  noStroke();
  fill(...COLORS.BODY.MAIN);
  beginShape();
  vertex(startX - side * 10, startY - 5);
  vertex(startX + side * 10, startY - 5);
  vertex(startX + side * 12, startY + 15);
  vertex(startX - side * 6, startY + 15);
  endShape(CLOSE);
}


function addAtmosphericEffects() {
  // Will be implemented in Part 3
}


function drawHead(baseDistortion) {
  // Will be implemented in Part 3
}


/**
 * Draws the complete head
 */
function drawHead(baseDistortion) {
  push();
  translate(0, -130);
  
  drawHeadAura();
  drawSkullShape(baseDistortion);
  drawFacialFeatures(baseDistortion);
  pop();
}

/**
 * Creates ethereal glow around the head
 */
function drawHeadAura() {
  for (let i = 3; i > 0; i--) {
    let alpha = map(i, 3, 0, 0.04, 0.12);
    let size = map(i, 3, 0, 110, 85);
    
    let auraDistortion = getComplexDistortion(0, -130, globalTime + i).mult(0.5);
    
    fill(...COLORS.HEAD.GLOW, alpha);
    noStroke();
    ellipse(
      auraDistortion.x,
      auraDistortion.y,
      size + sin(globalTime * 1.5) * 3,
      size * 1.2 + sin(globalTime * 1.5) * 3
    );
  }
}

/**
 * Draws the skull shape with characteristic elongation
 */
function drawSkullShape(baseDistortion) {
  fill(...COLORS.HEAD.MAIN);
  noStroke();
  
  beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.1) {
    let r = 42;
    
    if (angle < PI) {
      r += sin(angle * 2) * 7;
      // Temple indentations
      if (angle > PI/4 && angle < PI/2) r -= 3;
      if (angle > PI/2 && angle < 3*PI/4) r -= 3;
    } else {
      r += sin(angle * 1.5) * 5;
    }
    
    let x = cos(angle) * r;
    let y = sin(angle) * r * 1.35;
    
    let distortion = baseDistortion.copy().mult(0.4);
    vertex(x + distortion.x, y + distortion.y);
  }
  endShape(CLOSE);
}

/**
 * Draws facial features
 */
function drawFacialFeatures(baseDistortion) {
  // Draw eyes
  for (let side = -1; side <= 1; side += 2) {
    push();
    translate(side * 15, -10);
    
    // Eye sockets
    fill(0, 0, 0, 0.35);
    let socketSize = 18 + emotionalIntensity * 2;
    ellipse(0, 0, socketSize, socketSize * 1.15);
    
    // Main eye shape
    fill(0);
    let eyeDistortion = baseDistortion.copy().mult(0.3);
    ellipse(
      eyeDistortion.x,
      eyeDistortion.y,
      13,
      17
    );
    
    // Animated pupil
    fill(0);
    let pupilOffset = createVector(
      sin(globalTime) * emotionalIntensity,
      cos(globalTime) * emotionalIntensity
    );
    ellipse(pupilOffset.x, pupilOffset.y, 5, 5);
    pop();
  }
  
  drawMouth(baseDistortion);
}

/**
 * Draws the characteristic oval mouth
 */
function drawMouth(baseDistortion) {
  fill(0);
  beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.1) {
    let r = 9 + sin(angle * 3 + globalTime) * (1 + emotionalIntensity * 0.5);
    let x = cos(angle) * r;
    let y = sin(angle) * r * 1.4 + 20;
    
    let distortion = baseDistortion.copy().mult(0.2);
    vertex(x + distortion.x, y + distortion.y);
  }
  endShape(CLOSE);
  
  // Inner mouth
  fill(0);
  let mouthDistortion = baseDistortion.copy().mult(0.3);
  ellipse(
    mouthDistortion.x,
    20 + mouthDistortion.y,
    12 + emotionalIntensity * 2,
    20 + emotionalIntensity * 3
  );
}

/**
 * Adds all atmospheric effects
 */
function addAtmosphericEffects() {
  drawVignette();
  addNoiseToFigure();
  addEmotionalGlow();
}

/**
 * Adds noise texture only to the figure
 */
function addNoiseToFigure() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (x + y * width) * 4;
      let brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      
      if (brightness < 180) {  // Only affect darker areas (the figure)
        let noiseAmount = random(-6, 6) * emotionalIntensity;
        pixels[index] = constrain(pixels[index] + noiseAmount, 0, 255);
        pixels[index + 1] = constrain(pixels[index + 1] + noiseAmount, 0, 255);
        pixels[index + 2] = constrain(pixels[index + 2] + noiseAmount, 0, 255);
      }
    }
  }
  updatePixels();
}

/**
 * Creates subtle vignette effect
 */
function drawVignette() {
  let innerRadius = 150 + sin(globalTime) * 5;
  let outerRadius = 400 + sin(globalTime * 0.5) * 10;
  
  let gradient = drawingContext.createRadialGradient(
    0, 0, innerRadius,
    0, 0, outerRadius
  );
  
  let maxOpacity = 0.08 + emotionalIntensity * 0.04;
  
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, `rgba(0,0,0,${maxOpacity * 0.3})`);
  gradient.addColorStop(1, `rgba(0,0,0,${maxOpacity})`);
  
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(-width/2, -height/2, width, height);
}

/**
 * Adds subtle color variations for mood
 */
function addEmotionalGlow() {
  push();
  blendMode(OVERLAY);
  noStroke();
  
  let glowColor = color(
    200 + sin(globalTime) * 8,
    200 + sin(globalTime * 1.1) * 8,
    190 + sin(globalTime * 1.2) * 8,
    emotionalIntensity * 0.04
  );
  
  fill(glowColor);
  rect(-width/2, -height/2, width, height);
  pop();
}

/**
 * Mouse interaction handler
 */
function mouseMoved() {
  let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
  emotionalIntensity = constrain(
    emotionalIntensity + speed * 0.0008,
    0.5,
    1
  );
  return false;
}

/**
 * Window resize handler
 */
function windowResized() {
  resizeCanvas(
    min(windowWidth * 0.8, 600),
    min(windowHeight * 0.8, 800)
  );
}