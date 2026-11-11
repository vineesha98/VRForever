(function () {
  const SITE = window.SITE;
  const Sound = window.Sound;
  const Petals = window.Petals;
  const $ = (id) => document.getElementById(id);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((done) => setTimeout(done, still ? Math.min(ms, 40) : ms));

  const guest = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 40);

  /* ---------- The opening: scrolling or tapping draws the strip out of the sleeve ---------- */

  const opening = $("opening");
  const pin = $("pin");
  const sleeve = $("sleeve");
  const strip = $("strip");
  const tab = $("tab");
  const restCopy = $("restCopy");
  const enter = $("enter");
  const rsvpSeal = $("rsvpSeal");
  let replyInView = false;

  const SLIDE = [0.02, 0.9];
  const LIFT = [0, 0.5];
  const FADE = [0, 0.12];

  const clamp = (n) => Math.max(0, Math.min(1, n));
  const span = (p, [from, to]) => clamp((p - from) / (to - from));
  const mix = (a, b, k) => a + (b - a) * k;
  const glide = (k) => (1 - Math.cos(Math.PI * k)) / 2;

  if (guest) {
    $("envTo").textContent = `For ${guest}`;
    $("envTo").hidden = false;
    $("fName").value = guest;
  }

  let stage = null;

  // Works out the resting and open positions for this screen size.
  function layout() {
    const H = pin.offsetHeight;
    const u = sleeve.offsetWidth;
    const sleeveH = sleeve.offsetHeight;
    const rise = u * 1.5;

    const copyGap = H * 0.04;
    const restY = Math.max(20, (H - sleeveH - copyGap - restCopy.offsetHeight) / 2 - H * 0.06);
    restCopy.style.top = `${restY + sleeveH + copyGap}px`;

    const openY = Math.max(14, (H - sleeveH - rise - 14 - enter.offsetHeight) / 2);
    enter.style.top = `${openY + sleeveH + rise + 14}px`;

    stage = { restY, openY, rise };
  }

  function render(p) {
    sleeve.style.transform = `translate3d(0, ${mix(stage.restY, stage.openY, glide(span(p, LIFT)))}px, 0)`;
    strip.style.transform = `translate3d(0, ${stage.rise * glide(span(p, SLIDE))}px, 0)`;
    restCopy.style.opacity = 1 - span(p, FADE);
    restCopy.style.visibility = p >= FADE[1] ? "hidden" : "visible";
    tab.style.opacity = 1 - span(p, [0.02, 0.12]);
    sleeve.classList.toggle("is-open", p > 0.02);
    enter.classList.toggle("is-ready", p >= 0.86);
    rsvpSeal.classList.toggle("is-shown", p >= 1 && !replyInView);
  }

  // Sounds that play as the strip passes each moment.
  const cues = [
    [0.03, () => Sound.tick()],
    [0.05, () => Sound.paper()],
    [0.34, () => Sound.tick()],
    [0.52, () => Sound.tick()],
    [0.68, () => Sound.tick()],
  ];
  let lastP = 0;

  function progress() {
    const distance = opening.offsetHeight - pin.offsetHeight;
    return distance > 0 ? clamp(-opening.getBoundingClientRect().top / distance) : 1;
  }

  let queued = false;
  function update() {
    queued = false;
    const p = still ? 1 : progress();
    render(p);
    cues.forEach(([at, play]) => { if (lastP < at && p >= at) play(); });
    lastP = p;
  }
  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }

  if (still) opening.style.height = "100svh";
  layout();
  update();
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", () => { layout(); queue(); });
  addEventListener("load", () => { layout(); queue(); });
  document.fonts.ready.then(() => { layout(); queue(); });

  // Scroll alone can't start audio on phones, so any tap unlocks it.
  addEventListener("pointerup", () => Sound.init(), { passive: true });
  addEventListener("keydown", () => Sound.init());

  let playing = 0;
  function stopPlaying() { cancelAnimationFrame(playing); playing = 0; }
  function glideTo(to, duration, ease = (k) => k) {
    stopPlaying();
    const from = scrollY;
    const began = performance.now();
    const step = (now) => {
      const k = clamp((now - began) / duration);
      scrollTo(0, mix(from, to, ease(k)));
      playing = k < 1 ? requestAnimationFrame(step) : 0;
    };
    playing = requestAnimationFrame(step);
  }
  ["wheel", "touchstart"].forEach((type) => addEventListener(type, stopPlaying, { passive: true }));

  // A tap draws the strip for the guest at a slow, even pace.
  sleeve.addEventListener("click", () => {
    Sound.init();
    if (still || sleeve.classList.contains("is-open")) return;
    glideTo(opening.offsetTop + (opening.offsetHeight - pin.offsetHeight) * 0.92, 3400);
  });

  enter.addEventListener("click", () => {
    Sound.tick();
    const hero = document.querySelector(".hero");
    const to = hero.getBoundingClientRect().top + scrollY;
    if (still) scrollTo(0, to);
    else glideTo(to, 900);
  });

  // The floating seal: one press takes the guest straight to the reply card.
  rsvpSeal.addEventListener("click", (e) => {
    e.preventDefault();
    Sound.init();
    Sound.thud();
    rsvpSeal.classList.remove("is-pressed");
    void rsvpSeal.offsetWidth;
    rsvpSeal.classList.add("is-pressed");
    const to = $("rsvp").getBoundingClientRect().top + scrollY;
    if (still) scrollTo(0, to);
    else glideTo(to, 1100, glide);
  });
  new IntersectionObserver(
    (entries) => { replyInView = entries[0].isIntersecting; queue(); },
    { threshold: 0.2 }
  ).observe($("replyCard"));

  /* ---------- Sound toggle ---------- */

  const toggle = $("soundToggle");
  function paintToggle() {
    toggle.setAttribute("aria-pressed", String(Sound.enabled));
    toggle.setAttribute("aria-label", Sound.enabled ? "Sound on" : "Sound off");
    toggle.classList.toggle("is-off", !Sound.enabled);
  }
  // The soundtrack controller owns the speaker click so it can respond to browser autoplay blocks.
  paintToggle();

  /* ---------- Hero: map, postcard, stamp, countdown ---------- */


  const postcard = $("postcard");
  function turnPostcard() {
    Sound.init();
    Sound.paper();
    postcard.classList.toggle("is-turned");
  }
  postcard.addEventListener("click", turnPostcard);
  postcard.addEventListener("keydown", (e) => {
    if (e.target === postcard && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); turnPostcard(); }
  });

  $("stamp").addEventListener("click", (e) => {
    e.stopPropagation();
    Sound.init();
    Sound.paper();
    const peeled = e.currentTarget.classList.toggle("is-peeled");
    $("ps").hidden = !peeled;
  });

  const units = {};
  document.querySelectorAll("[data-unit]").forEach((el) => { units[el.dataset.unit] = el; });
  const start = new Date(SITE.weddingStart).getTime();
  const end = new Date(SITE.weddingEnd).getTime();

  function tickCountdown() {
    const now = Date.now();
    if (now >= start) {
      $("countdown").hidden = true;
      $("countLabel").textContent = now < end ? "The wedding is happening now" : "Thank you for celebrating with us";
      clearInterval(timer);
      return;
    }
    let left = Math.floor((start - now) / 1000);
    const parts = { d: Math.floor(left / 86400) };
    left %= 86400;
    parts.h = Math.floor(left / 3600);
    left %= 3600;
    parts.m = Math.floor(left / 60);
    parts.s = left % 60;
    for (const key in parts) units[key].textContent = String(parts[key]).padStart(2, "0");
  }
  const timer = setInterval(tickCountdown, 1000);
  tickCountdown();

  /* ---------- Colors ---------- */

  // Every section paints its own color, so its words always sit on the right one.
  // The body follows the section under the top of the screen, which keeps the
  // sound button and the phone's toolbar tint in step with what's behind them.
  const sections = [...document.querySelectorAll("main > [data-scene]")];
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let sceneQueued = false;
  function paintScene() {
    sceneQueued = false;
    const probe = 30;
    const here = sections.find((s) => s.getBoundingClientRect().bottom > probe) || sections[sections.length - 1];
    if (document.body.dataset.scene !== here.dataset.scene) {
      document.body.dataset.scene = here.dataset.scene;
      themeColor.content = getComputedStyle(here).backgroundColor;
    }
  }
  addEventListener("scroll", () => {
    if (!sceneQueued) { sceneQueued = true; requestAnimationFrame(paintScene); }
  }, { passive: true });
  addEventListener("resize", paintScene);
  paintScene();

  /* ---------- Directions: Apple Maps on iPhone and iPad, Google Maps everywhere else ---------- */

  const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.querySelectorAll(".directions").forEach((link) => {
    if (apple && link.dataset.apple) link.href = link.dataset.apple;
  });

  /* ---------- Sangeeth: the dholak and its string of lights ---------- */

  const lights = $("lights");
  for (let i = 0; i < 24; i++) {
    const bulb = document.createElement("i");
    const t = i / 23;
    bulb.style.left = `${t * 100}%`;
    bulb.style.top = `${Math.sin(t * Math.PI * 4 - Math.PI / 2) * 13 + 16}px`;
    lights.append(bulb);
  }
  const dholak = $("dholak");
  let grooveUntil = 0;
  function pulse() {
    dholak.classList.remove("is-hit");
    lights.classList.remove("is-lit");
    void dholak.offsetWidth;
    dholak.classList.add("is-hit");
    lights.classList.add("is-lit");
  }
  dholak.addEventListener("click", () => {
    Sound.init();
    const now = performance.now();
    if (now < grooveUntil) return;
    const strokes = Sound.groove();
    // With sound off the drum and the lights still keep the beat.
    grooveUntil = now + strokes[strokes.length - 1].at * 1000 + 250;
    strokes.forEach(({ at, accent }) => {
      if (accent) setTimeout(pulse, at * 1000);
    });
  });

  /* ---------- Wedding: petals, once on arrival and on request ---------- */

  let showered = false;
  new IntersectionObserver(
    (entries, observer) => {
      // Passing through on the way to the reply card shouldn't set this off.
      if (entries[0].isIntersecting && !showered && !playing) {
        showered = true;
        Petals.rain(46);
        observer.disconnect();
      }
    },
    { threshold: 0.5 }
  ).observe($("wedding"));
  $("mandap").addEventListener("click", () => { Sound.init(); Sound.paper(); Petals.rain(30); });

  /* ---------- Us, so far: prints that drift past on their own ---------- */

  const film = $("film");
  // One set only: no visibly repeated photographs.
  SITE.reel.forEach((shot) => {
    const print = document.createElement("figure");
    print.className = "print";
    print.style.setProperty("--ratio", String(shot.w / shot.h));
    print.innerHTML = '<div class="print-photo"><img loading="lazy" draggable="false"></div><figcaption></figcaption>';
    const img = print.querySelector("img");
    img.src = `/assets/photos/${shot.src}.webp`;
    img.width = shot.w * 240;
    img.height = shot.h * 240;
    img.alt = shot.alt;
    print.querySelector("figcaption").textContent = shot.caption;
    film.append(print);
  });

  // Glide through every photo, turn around at each end, and resume after swipes.
  // Keep the automatic movement predictable rather than pausing on hover/focus.
  const SPEED = 42; // pixels per second
  let pos = 0;
  let direction = 1;
  let last = 0;
  let restAt = 0;
  let running = 0;
  let dragFrom = null;
  const hold = (ms = 950) => { restAt = performance.now() + ms; };

  function drift(now) {
    running = requestAnimationFrame(drift);
    const dt = last ? Math.min(now - last, 64) : 0;
    last = now;
    const maxScroll = Math.max(0, film.scrollWidth - film.clientWidth);
    if (maxScroll < 1) return;
    if (dragFrom || now < restAt) {
      pos = film.scrollLeft;
      return;
    }

    // Respect the actual scroll position after touch swipes or window resizing.
    if (Math.abs(film.scrollLeft - pos) > 3) pos = film.scrollLeft;
    pos += direction * SPEED * dt / 1000;
    if (pos >= maxScroll) {
      pos = maxScroll;
      direction = -1;
      hold(450);
    } else if (pos <= 0) {
      pos = 0;
      direction = 1;
      hold(450);
    }
    film.scrollLeft = pos;
  }
  function startDrift() {
    if (!running && !still) {
      last = 0;
      pos = film.scrollLeft;
      running = requestAnimationFrame(drift);
    }
  }
  function stopDrift() {
    cancelAnimationFrame(running);
    running = 0;
  }
  new IntersectionObserver((entries) => (entries[0].isIntersecting ? startDrift() : stopDrift())).observe(film);

  ["touchstart", "wheel", "keydown"].forEach((type) =>
    film.addEventListener(type, () => hold(), { passive: true })
  );
  film.addEventListener("touchend", () => hold(), { passive: true });

  // Mouse dragging also releases on cancelled pointers or leaving the window.
  film.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragFrom = { x: e.clientX, left: film.scrollLeft };
  });
  addEventListener("pointermove", (e) => {
    if (!dragFrom) return;
    const moved = e.clientX - dragFrom.x;
    if (Math.abs(moved) > 4) film.classList.add("is-dragging");
    film.scrollLeft = dragFrom.left - moved;
  });
  function finishDrag() {
    if (dragFrom) hold(850);
    dragFrom = null;
    film.classList.remove("is-dragging");
  }
  addEventListener("pointerup", finishDrag);
  addEventListener("pointercancel", finishDrag);
  addEventListener("blur", finishDrag);
  film.addEventListener("dragstart", (e) => e.preventDefault());

  /* ---------- The reply card ---------- */

  const form = $("rsvpForm");
  const thanks = $("thanks");
  let party = 1;

  if (SITE.replyBy) $("replyBy").textContent = `Please reply by ${SITE.replyBy}.`;

  function setParty(n) {
    party = Math.max(1, Math.min(12, n));
    $("partyCount").textContent = party;
    Sound.init();
    Sound.tick();
  }
  $("partyMinus").addEventListener("click", () => setParty(party - 1));
  $("partyPlus").addEventListener("click", () => setParty(party + 1));

  function readForm() {
    const data = new FormData(form);
    const reply = {
      name: String(data.get("name") || "").trim(),
      haldi: data.get("haldi"),
      sangeeth: data.get("sangeeth"),
      wedding: data.get("wedding"),
      party,
      contact: String(data.get("contact") || "").trim(),
      note: String(data.get("note") || "").trim(),
    };
    reply.attending = [reply.haldi, reply.sangeeth, reply.wedding].includes("yes");
    return reply;
  }

  function remember(reply) {
    try { localStorage.setItem("reply", JSON.stringify(reply)); } catch (e) {}
  }

  function recall() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("reply")); } catch (e) {}
    if (!saved) return;
    $("fName").value = saved.name || "";
    $("fContact").value = saved.contact || "";
    $("fNote").value = saved.note || "";
    party = saved.party || 1;
    $("partyCount").textContent = party;
    ["haldi", "sangeeth", "wedding"].forEach((name) => {
      const input = form.querySelector(`[name=${name}][value=${saved[name]}]`);
      if (input) input.checked = true;
    });
  }
  recall();

  form.addEventListener("change", () => {
    const reply = readForm();
    const allNo = reply.haldi === "no" && reply.sangeeth === "no" && reply.wedding === "no";
    $("partyField").classList.toggle("is-muted", allNo);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (new FormData(form).get("website")) return;

    const reply = readForm();
    const noName = !reply.name;
    const noChoice = !reply.haldi || !reply.sangeeth || !reply.wedding;
    $("errName").hidden = !noName;
    $("errAttend").hidden = !noChoice;
    $("errSend").hidden = true;
    if (noName) { $("fName").focus(); return; }
    if (noChoice) { form.querySelector("[name=haldi]").focus(); return; }

    const send = $("send");
    send.disabled = true;
    send.textContent = "Sending";
    try {
      await window.sendReply(reply);
    } catch (error) {
      $("errSend").textContent = "Your reply didn't send. Check your connection and try again.";
      $("errSend").hidden = false;
      send.disabled = false;
      send.textContent = "Send my reply";
      return;
    }
    send.disabled = false;
    send.textContent = "Send my reply";
    remember(reply);
    showThanks(reply);
  });

  async function showThanks(reply) {
    form.hidden = true;
    thanks.hidden = false;
    thanks.classList.remove("is-stamped");
    $("rubber").textContent = reply.attending ? "Received with joy" : "Received with love";
    $("thanksTitle").textContent = reply.attending ? greeting(reply.name) : "Thank you for telling us";
    $("thanksNote").textContent = window.noteFor(reply);
    $("notSent").hidden = Boolean(SITE.rsvp.url);
    $("replyCard").scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    thanks.focus({ preventScroll: true });
    await wait(500);
    thanks.classList.add("is-stamped");
    Sound.init();
    Sound.thud();
    await wait(160);
    if (reply.attending) {
      Sound.chime();
      const box = $("rubber").getBoundingClientRect();
      Petals.burst(box.left + box.width / 2, box.top + box.height / 2, 60);
    }
  }

  // "Priya Sharma" reads well as "Thank you, Priya". Family and couple names don't.
  function greeting(name) {
    if (/family|^the\s|&|\sand\s/i.test(name)) return "Thank you";
    return `Thank you, ${name.split(" ")[0]}`;
  }

  $("editReply").addEventListener("click", () => {
    thanks.hidden = true;
    form.hidden = false;
    $("fName").focus();
  });
})();
