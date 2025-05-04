var video;
var scaler = 10;
var preFrame;
var motionSpeed;

function setup() {
  createCanvas(640, 480);
  pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  video.hide();
  preFrame = createImage(video.width, video.height);
}

function draw() {
  video.loadPixels();
  preFrame.loadPixels();

  let totalMotion = 0;

  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      var index = (x + y * video.width) * 4;
      let pr = preFrame.pixels[index + 0];
      let pg = preFrame.pixels[index + 1];
      let pb = preFrame.pixels[index + 2];
      let pbright = (pr + pg + pb) / 3;

      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bright = (r + g + b) / 3;

      var diff = dist(r, g, b, pr, pg, pb);
      
      // Accumulate the motion speed based on pixel differences
      totalMotion += diff;

      if (diff < 15) {
        fill(bright);
      } else {
        // Apply glitch effect by changing color for higher motion speeds
        fill(random(255), random(255), random(255));
      }
      noStroke();
      rect(x * scaler, y * scaler, scaler, scaler);
    }
  }

  // Calculate motion speed as total difference in pixel brightness
  motionSpeed = totalMotion / (video.width * video.height);

  // Increase glitch effect intensity based on motion speed
  let glitchIntensity = map(motionSpeed, 0, 50, 0, 255); // Adjust '50' for sensitivity

  // Add glitch effect by adding noise or distortion depending on speed
  if (motionSpeed > 10) { // Threshold for noticeable glitch effect
    for (let y = 0; y < video.height; y++) {
      for (let x = 0; x < video.width; x++) {
        var index = (x + y * video.width) * 4;
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
}

