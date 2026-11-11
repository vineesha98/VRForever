// Only the uploaded MP3 plays. Try on page load and on the first scroll/swipe.
// Browsers may require an actual user gesture before allowing audible playback.
(function () {
  const audio = document.createElement("audio");
  audio.id = "weddingSoundtrack";
  audio.src = "/assets/Sakhiye.mp3";
  audio.preload = "auto";
  // Loop only the first 34 seconds of Sakhiye.
  const CLIP_SECONDS = 34;
  audio.loop = false;
  audio.addEventListener("timeupdate", () => {
    if (audio.currentTime >= CLIP_SECONDS) {
      audio.currentTime = 0;
      if (!audio.paused) {
        const replay = audio.play();
        if (replay && typeof replay.catch === "function") replay.catch(() => {});
      }
    }
  });
  audio.volume = 0.65;
  audio.playsInline = true;
  document.body.appendChild(audio);

  const button = document.getElementById("soundToggle");
  const Sound = window.Sound;
  if (!button || !Sound) return;
  let enabled = Sound.enabled;
  let failed = false;
  let pending = false;

  function paint() {
    button.classList.toggle("is-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    const label = !enabled ? "Music off — tap to unmute"
      : audio.paused ? "Music on — tap to play" : "Music playing — tap to mute";
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function start() {
    if (!enabled || failed || pending || !audio.paused || document.hidden) return;
    pending = true;
    try {
      const result = audio.play();
      if (result && typeof result.then === "function") {
        result.then(() => { pending = false; paint(); })
          .catch(() => { pending = false; paint(); });
      } else { pending = false; paint(); }
    } catch (_) { pending = false; paint(); }
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (enabled) start();
    else audio.pause();
    paint();
  }

  button.addEventListener("click", () => {
    // A first tap starts the MP3 when the browser has blocked autoplay.
    if (enabled && audio.paused) { start(); return; }
    Sound.toggle();
    setEnabled(Sound.enabled);
  });

  // Swipe/scroll to open the invitation should also request playback.
  // Touch/pointer and wheel events run during the gesture; scroll is a backup.
  function onGesture(event) {
    if (event && event.target && event.target.closest &&
        event.target.closest("#soundToggle")) return;
    start();
  }
  document.addEventListener("touchstart", onGesture, { passive: true });
  document.addEventListener("pointerdown", onGesture, { passive: true });
  document.addEventListener("touchmove", onGesture, { passive: true });
  document.addEventListener("wheel", onGesture, { passive: true });
  document.addEventListener("scroll", onGesture, { passive: true });
  document.addEventListener("click", onGesture);
  document.addEventListener("keydown", onGesture);

  audio.addEventListener("playing", paint);
  audio.addEventListener("pause", paint);
  audio.addEventListener("error", () => { failed = true; paint(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
    else start();
  });

  paint();
  start();
  window.WeddingMusic = { start, setEnabled, isPlaying: () => !audio.paused && !audio.ended };
})();
