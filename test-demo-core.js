// Mesa Fiscal - the deterministic core, under fake time. The lesson this pins came from the
// Recibo Certo history (commit 50b1847): when the act cut and the bar had separate timelines, a
// pause split them. Here ONE clock does both, so these properties are what keep them together.
//   node test-demo-core.js
const CORE = require("./assets/demo-stage-core.js");

let fails = 0;
const bad = (m) => { console.log("  FAIL " + m); fails++; };
const ok = (m) => console.log("  ok   " + m);

/* fake frame scheduler: we control time completely */
function scheduler() {
  var queue = [], id = 0, now = 0;
  return {
    requestFrame: function (cb) { queue.push({ id: ++id, cb: cb }); return id; },
    cancelFrame: function (cancelId) { queue = queue.filter((q) => q.id !== cancelId); },
    step: function (ms) {
      now += ms;
      var q = queue; queue = [];
      q.forEach((f) => f.cb(now));
    },
    pending: function () { return queue.length; }
  };
}

function makeClock(duration, sch) {
  var frames = [], completes = 0;
  var clock = CORE.createStageClock({
    durationMs: duration,
    onFrame: function (p) { frames.push(p); },
    onComplete: function () { completes++; },
    requestFrame: sch.requestFrame,
    cancelFrame: sch.cancelFrame
  });
  return { clock, frames, completesRef: () => completes };
}

// --- progress is monotonic and completes exactly once --------------------------------------
{
  const sch = scheduler();
  const { clock, frames, completesRef } = makeClock(1000, sch);
  clock.play();
  for (let i = 0; i < 30; i++) sch.step(50);
  const mono = frames.every((p, i) => i === 0 || p >= frames[i - 1]);
  if (!mono) bad("progresso nao monotono");
  else ok("progresso monotono");
  if (completesRef() !== 1) bad(`onComplete disparou ${completesRef()}x, esperado 1`);
  else ok("completa exatamente uma vez");
  if (frames[frames.length - 1] !== 1) bad("nao terminou em 1");
  if (sch.pending()) bad("continuou a pedir frames depois de completo - loop");
  else ok("para no fim: zero frames pendentes (sem loop)");
}

// --- pause preserves; resume does not add the stopped interval ------------------------------
{
  const sch = scheduler();
  const { clock } = makeClock(1000, sch);
  clock.play();
  sch.step(16); sch.step(300);           // first tick anchors, second advances 100 (clamped)
  const atPause = clock.getSnapshot().elapsed;
  clock.pause();
  sch.step(5000);                        // a long stop
  if (clock.getSnapshot().elapsed !== atPause) bad("a pausa nao conservou o progresso");
  else ok("pausa conserva o progresso");
  clock.play();
  sch.step(16);                          // re-anchor frame
  const after = clock.getSnapshot().elapsed;
  if (after - atPause > CORE.MAX_DELTA) bad("retomar somou o tempo parado");
  else ok("retomar nao soma o tempo parado");
}

// --- huge and negative deltas are clamped ---------------------------------------------------
{
  const sch = scheduler();
  const { clock } = makeClock(10000, sch);
  clock.play();
  sch.step(16);
  sch.step(60000);                       // background tab returns
  if (clock.getSnapshot().elapsed > 16 + CORE.MAX_DELTA + 1) bad("delta gigante nao foi limitado");
  else ok("delta gigante limitado a " + CORE.MAX_DELTA + "ms");
  sch.step(-50);                         // timer skew backwards
  const snap = clock.getSnapshot();
  if (snap.elapsed < 0) bad("delta negativo recuou o relogio");
  else ok("delta negativo ignorado");
}

// --- seek is deterministic and never autoplays ----------------------------------------------
{
  const sch = scheduler();
  const { clock, frames } = makeClock(1000, sch);
  clock.seek(0.5);
  if (Math.abs(frames[frames.length - 1] - 0.5) > 1e-9) bad("seek(0.5) nao produziu 0.5");
  else ok("seek produz exatamente o estado pedido");
  if (clock.getSnapshot().running) bad("seek arrancou o relogio");
  clock.seek(1);
  if (!clock.getSnapshot().completed) bad("seek(1) nao marca completo");
  else ok("seek(1) da o estado final sem autoplay");
  if (sch.pending()) bad("seek deixou frames pendentes");
}

// --- reset and destroy ----------------------------------------------------------------------
{
  const sch = scheduler();
  const { clock } = makeClock(1000, sch);
  clock.play(); sch.step(16); sch.step(100);
  clock.reset(2000);
  const s = clock.getSnapshot();
  if (s.elapsed !== 0 || s.durationMs !== 2000 || s.running) bad("reset nao zerou");
  else ok("reset zera e aceita nova duracao");
  clock.destroy(); clock.destroy();      // idempotent
  clock.play(); sch.step(16);
  if (clock.getSnapshot().running) bad("play depois de destroy");
  else ok("destroy e idempotente e final");
}

// --- duration 0 completes in a controlled way -----------------------------------------------
{
  const sch = scheduler();
  const { clock, frames } = makeClock(0, sch);
  clock.seek(1);
  if (frames[frames.length - 1] !== 1) bad("durationMs 0 nao reporta progresso 1");
  else ok("durationMs 0 e um estado final controlado");
}

// --- block set: independent reasons ---------------------------------------------------------
{
  const changes = [];
  const blocks = CORE.createBlockSet((runnable) => changes.push(runnable));
  blocks.add("explicit");
  blocks.add("hover");
  blocks.remove("hover");
  if (blocks.isEmpty()) bad("remover hover anulou explicit");
  else ok("remover hover nao remove explicit (razoes independentes)");
  blocks.remove("explicit");
  if (!blocks.isEmpty()) bad("o conjunto nao esvaziou");
  if (JSON.stringify(changes) !== JSON.stringify([false, true]))
    bad(`onChange disparou ${JSON.stringify(changes)}, esperado [false,true] (so nas transicoes)`);
  else ok("onChange so nas transicoes vazio<->bloqueado");
  let threw = false;
  try { blocks.add("qualquer-coisa"); } catch (e) { threw = true; }
  if (!threw) bad("aceitou uma razao fora do enum");
  else ok("razoes fora do enum sao rejeitadas");
}

// --- keyframe interpolation is pure and clamped ---------------------------------------------
{
  const F = [
    { at: 0.0, x: 0, opacity: 0 },
    { at: 0.5, x: 10, opacity: 1, pressed: false },
    { at: 0.6, x: 10, opacity: 1, pressed: true },
    { at: 1.0, x: 20, opacity: 0 }
  ];
  const mid = CORE.interpolateKeyframes(0.25, F);
  if (Math.abs(mid.x - 5) > 1e-9 || Math.abs(mid.opacity - 0.5) > 1e-9)
    bad(`interpolacao linear errada: ${JSON.stringify(mid)}`);
  else ok("interpolacao linear entre frames");
  if (CORE.interpolateKeyframes(0.55, F).pressed !== false) bad("boolean nao segura o frame anterior");
  if (CORE.interpolateKeyframes(0.65, F).pressed !== true) bad("boolean nao muda no frame certo");
  else ok("booleans seguram o valor do frame anterior");
  if (CORE.interpolateKeyframes(2, F).x !== 20) bad("progresso >1 nao foi limitado");
  if (CORE.interpolateKeyframes(-1, F).x !== 0) bad("progresso <0 nao foi limitado");
  else ok("progresso fora de [0,1] limitado");
  // same input, same output - the property that makes seek/pause/replay consistent
  const a = CORE.interpolateKeyframes(0.4, F), b = CORE.interpolateKeyframes(0.4, F);
  if (JSON.stringify(a) !== JSON.stringify(b)) bad("interpolacao nao determinista");
  else ok("determinista: mesmo progresso, mesmo estado");
}

// --- derived reveal -------------------------------------------------------------------------
{
  if (CORE.itemsVisible(0, 5) !== 0) bad("itens visiveis a 0 devia ser 0");
  if (CORE.itemsVisible(1, 5) !== 5) bad("itens visiveis a 1 devia ser 5");
  if (CORE.itemsVisible(0.5, 5) !== 5) bad("apos a janela de reveal, todos visiveis");
  const t1 = CORE.typedSlice(0, "abcdef"), t2 = CORE.typedSlice(1, "abcdef");
  if (t1 !== "" || t2 !== "abcdef") bad("typedSlice nos extremos");
  else ok("reveal e digitacao derivados do progresso (seek-safe)");
}

console.log(fails ? `\n  ${fails} FALHA(S) no nucleo` : "\n  nucleo deterministico conforme");
process.exit(fails ? 1 : 0);
