let video;
let scaler = 10;
let preFrame;
let motionSpeed;let video;
let scaler = 20; // Less pixel resolution = faster
let preFrame;
let motionSpeed;

let noise, sawOsc, tremor;
let audioStarted = false;

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

  // Only do expensive pixel reads every second frame
  if (frameCount % 2 === 0) {
    video.loadPixels();
    preFrame.loadPixels();
  }

  let totalMotion = 0;

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

  preFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

  // Sonic chaos reacts to motion
  if (motionSpeed > 10) {
    let normSpeed = constrain(map(motionSpeed, 10, 50, 0, 1), 0, 1);

    let noiseAmp = pow(normSpeed, 2) * 0.5;
    noise.amp(noiseAmp, 0.05);

    let sawAmp = pow(normSpeed, 1.5) * 0.3;
    let sawFreq = 200 + normSpeed * 800;
    sawOsc.amp(sawAmp, 0.05);
    sawOsc.freq(sawFreq);

    let tremorFreq = map(normSpeed, 0, 1, 5, 40);
    tremor.freq(tremorFreq);
    tremor.amp(0.1 * normSpeed);
  } else {
    noise.amp(0, 0.2);
    sawOsc.amp(0, 0.2);
    tremor.amp(0);
  }
}

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
