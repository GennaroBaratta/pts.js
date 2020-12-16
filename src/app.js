import { CanvasSpace, UI, Sound, UIButton, Pt } from "pts";
let sound = false;
let startButton;
var colors = ["#f06", "#62e", "#fff", "#fe3", "#0c9"];

const space = new CanvasSpace("#pts").setup({
  bgcolor: "#ffb74d",
  resize: true,
  retina: true,
});
const form = space.getForm();

let radius = { current: 10, toReach: 10 };

space.add({
  start: (bound) => {
    startButton = UIButton.fromPolygon([
      [0, space.center.y - 30],
      [0, space.center.y + 30],
      [30, space.center.y],
    ]);

    let hovOn = (ui) => ui.group.scale(3, ui.group.centroid());
    let hovOff = (ui) => ui.group.scale(1 / 3, ui.group.centroid());

    startButton.onHover(hovOn, hovOff);
    startButton.onClick(startMonitor);
  },

  animate: (time, ftime) => {
    if (sound && sound.playable) {
      let fd = sound.freqDomainTo([space.size.y, space.size.x / 2]);
      let h0 = space.size.y / fd.length;
      form.font(39, "bold");
      for (let i = 0, len = fd.length; i < len; i++) {
        let f = fd[i];
        let hz = Math.floor((i * sound.sampleRate) / (sound.binSize * 2)); // bin size is fftSize/2
        let color = ["#f03", "#0c9", "#62e"][i % 3];
        let y = frequencty_to_py(hz+20);
        let h = h0+ (space.height -y)/15;
        // draw spikes
        form.fillOnly(color).polygon([
          [space.center.x, y],
          [space.center.x, y + h],
          [f.y + space.center.x, y + h / 2],
        ]);
        // draw circle
        form
          .fillOnly(color)
          .point(
            [space.center.x - f.y, y + h / 2],
            h / 2 + (30 * f.y) / space.size.x,
            "circle"
          );
        // draw text
        
      }
    }
    form.stroke("black", 1, "round", "butt");
    form.fill(false).point(space.pointer, radius.current, "circle");
    if (radius.current < radius.toReach)
      radius.current += (radius.toReach - radius.current) / 10;
    if (radius.current > radius.toReach)
      radius.current -= (radius.current - radius.toReach) / 10;

    startButton.render((g) => form.fillOnly("#fe3").polygon(g));
  },
  action: (type, px, py) => {
    UI.track([startButton], type, new Pt(px, py));
  },
});
window.onmousewheel = (e) => {
  e.deltaY > 0 ? (radius.toReach *= 1.1) : (radius.toReach /= 1.1);
  //console.log(radius.toReach);
};
space.bindMouse().bindTouch().play();

async function getSharedStream(displayMediaOptions) {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error("Error: " + err);
  }
  return captureStream;
}

async function startMonitor(e) {
  const gdmOptions = {
    video: true,
    audio: true,
  };
  const sharedStream = await getSharedStream(gdmOptions);
  if (!sharedStream) {
    space.background = "red";
    sound = null;
    return;
  }
  const audio = sharedStream.getAudioTracks();
  console.log(audio[0]);

  var audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(sharedStream);
  sound = Sound.from(source, audioCtx, "input").analyze(512, -125, 0, 0.8);
  console.log(sound);
}

function frequencty_to_py(frequency) {
  const min_f = Math.log(20) / Math.log(10),
    max_f = Math.log(24000) / Math.log(10),
    range = max_f - min_f,
    position_py =
      ((Math.log(frequency) / Math.log(10) - min_f) / range) * space.height-20;
  return position_py;
}
