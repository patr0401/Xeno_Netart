let video;
let scaler = 10;
let preFrame;
let motionSpeed;

let noise, sawOsc, tremor;
let audioStarted = false;

let motionHistory = []; // Array to track recent motion values
let particles = [];     // Array of glitch particles

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  video.hide();
  preFrame = createImage(video.width, video.height);
}

function draw() {
  if (!audioStarted) {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Click anywhere to start audio", width / 2, height / 2);
    return;
  }

  video.loadPixels();
  preFrame.loadPixels();

  let totalMotion = 0;

  // Loop through webcam pixels and compare frames
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let index = (x + y * video.width) * 4;

      let pr = preFrame.pixels[index + 0];
      let pg = preFrame.pixels[index + 1];
      let pb = preFrame.pixels[index + 2];

      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      let diff = dist(r, g, b, pr, pg, pb);
      totalMotion += diff;

      if (diff < 15) {
        fill((r + g + b) / 3);
      } else {
        fill(random(255), random(255), random(255));
      }

      noStroke();
      rect(x * scaler, y * scaler, scaler, scaler);
    }
  }

  motionSpeed = totalMotion / (video.width * video.height);

  // Track recent motion speeds in an array
  motionHistory.push(motionSpeed);
  if (motionHistory.length > 30) {
    motionHistory.shift(); // keep last 30 values
  }
  let avgMotion = motionHistory.reduce((a, b) => a + b, 0) / motionHistory.length;

  // Trigger visual glitch if movement is high
  let glitchIntensity = map(motionSpeed, 0, 50, 0, 255);
  if (motionSpeed > 10) {
    for (let y = 0; y < video.height; y++) {
      for (let x = 0; x < video.width; x++) {
        let index = (x + y * video.width) * 4;
        let glitchOffset = random(-glitchIntensity, glitchIntensity);
        let r = video.pixels[index + 0] + glitchOffset;
        let g = video.pixels[index + 1] + glitchOffset;
        let b = video.pixels[index + 2] + glitchOffset;
        r = constrain(r, 0, 255);
        g = constrain(g, 0, 255);
        b = constrain(b, 0, 255);
        preFrame.pixels[index + 0] = r;
        preFrame.pixels[index + 1] = g;
        preFrame.pixels[index + 2] = b;
      }
    }
  }

  // Copy current frame to buffer
  preFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

  // Add glitch particles using a class
  if (motionSpeed > 20) {
    for (let i = 0; i < 5; i++) {
      particles.push(new GlitchParticle(random(width), random(height)));
    }
  }

  // Draw and update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // Add recursive glow effect during high chaos
  if (motionSpeed > 30) {
    drawRecursiveGlow(random(width), random(height), 100, 5);
  }

  // Sound responds to motion intensity
  if (motionSpeed > 10) {
    let normSpeed = constrain(map(motionSpeed, 10, 50, 0, 1), 0, 1);
    noise.amp(pow(normSpeed, 2) * 0.5, 0.05);
    sawOsc.amp(pow(normSpeed, 1.5) * 0.3, 0.05);
    sawOsc.freq(200 + normSpeed * 800);
    tremor.freq(map(normSpeed, 0, 1, 5, 40));
    tremor.amp(0.1 * normSpeed);
  } else {
    noise.amp(0, 0.2);
    sawOsc.amp(0, 0.2);
    tremor.amp(0);
  }
}

// Resume audio on user click
function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    noise = new p5.Noise('white');
    noise.start();
    noise.amp(0);
    sawOsc = new p5.Oscillator('sawtooth');
    sawOsc.start();
    sawOsc.amp(0);
    tremor = new p5.Oscillator('sine');
    tremor.start();
    tremor.amp(0);
    audioStarted = true;
  }
}

// Resize canvas on browser resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Class to create floating chaotic glitch particles
class GlitchParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(5, 20);
    this.life = 255;
  }

  update() {
    this.x += random(-2, 2);
    this.y += random(-2, 2);
    this.life -= 5;
  }

  display() {
    noStroke();
    fill(random(255), random(255), random(255), this.life);
    rect(this.x, this.y, this.size, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Recursively draw layered glow rings during extreme motion
function drawRecursiveGlow(x, y, s, depth) {
  if (depth <= 0) return;
  fill(random(255), 50);
  noStroke();
  ellipse(x, y, s);
  drawRecursiveGlow(x + random(-s / 2, s / 2), y + random(-s / 2, s / 2), s * 0.8, depth - 1);
}
