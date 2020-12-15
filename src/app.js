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
      sound.freqDomainTo(space.size).forEach((t, i) => {
        form.fillOnly(colors[i % 5]).point(t, 30);
      });
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
    return;
  }
  space.background = "#ffffff";
  const audio = sharedStream.getAudioTracks();
  console.log(audio[0]);

  var audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(sharedStream);
  sound = Sound.from(source, audioCtx, "input").analyze(128);
  console.log(sound);
}
