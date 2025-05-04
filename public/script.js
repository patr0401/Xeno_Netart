let video;
let scaler = 10;
let preFrame;
let motionSpeed;

// Sound components
let noise, sawOsc, tremor;

function setup() {
  createCanvas(640, 480);
  pixelDensity(1);

  // Set up webcam
  video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  video.hide();
  preFrame = createImage(video.width, video.height);

  // White noise generator for glitchy ambiance
  noise = new p5.Noise('white');
  noise.amp(0);
  noise.start();

  // Sawtooth oscillator for harsher, machine-like tone
  sawOsc = new p5.Oscillator('sawtooth');
  sawOsc.freq(200);
  sawOsc.amp(0);
  sawOsc.start();

  // Fast sine wave to modulate amplitude and add instability
  tremor = new p5.Oscillator('sine');
  tremor.freq(20);
  tremor.amp(0);
  tremor.start();
}

function draw() {
  video.loadPixels();
  preFrame.loadPixels();

  let totalMotion = 0;

  // Loop through every pixel and compare brightness between current and previous frame
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let index = (x + y * video.width) * 4;

      // Previous frame pixel
      let pr = preFrame.pixels[index + 0];
      let pg = preFrame.pixels[index + 1];
      let pb = preFrame.pixels[index + 2];

      // Current frame pixel
      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      // Difference between current and previous pixel colors
      let diff = dist(r, g, b, pr, pg, pb);
      totalMotion += diff;

      // Visual feedback based on motion
      if (diff < 15) {
        fill((r + g + b) / 3);
      } else {
        fill(random(255), random(255), random(255));
      }

      noStroke();
      rect(x * scaler, y * scaler, scaler, scaler);
    }
  }

  // Calculate average motion across the frame
  motionSpeed = totalMotion / (video.width * video.height);
  let glitchIntensity = map(motionSpeed, 0, 50, 0, 255);

  // If motion is high, create distorted glitch colors
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

  // Store current frame to use as previous frame next time
  preFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

  // Sonification based on motion intensity
  if (motionSpeed > 10) {
    let normSpeed = constrain(map(motionSpeed, 10, 50, 0, 1), 0, 1);

    // Noise becomes louder as motion increases
    let noiseAmp = pow(normSpeed, 2) * 0.5;
    noise.amp(noiseAmp, 0.05);

    // Saw oscillator gets louder and shifts higher in pitch
    let sawAmp = pow(normSpeed, 1.5) * 0.3;
    let sawFreq = 200 + normSpeed * 800;
    sawOsc.amp(sawAmp, 0.05);
    sawOsc.freq(sawFreq);

    // Tremor increases in speed to reflect instability
    let tremorFreq = map(normSpeed, 0, 1, 5, 40);
    tremor.freq(tremorFreq);
    tremor.amp(0.1 * normSpeed);
  } else {
    // Calm state: fade out sound
    noise.amp(0, 0.2);
    sawOsc.amp(0, 0.2);
    tremor.amp(0);
  }
}
