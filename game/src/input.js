// Desktop pointer lock and independent captured touch pointers share one input state.
export function createInput(canvas, onLockChange) {
  const keys = new Set();
  const touch = navigator.maxTouchPoints > 0 || new URLSearchParams(location.search).get('touch') === '1';
  const state = { keys, locked: false, firing: false, scoped: false, lookX: 0, lookY: 0, moveX: 0, moveY: 0, touch };
  const controls = document.getElementById('touch-controls');
  document.body.classList.toggle('touch-mode', touch);
  const stick = document.getElementById('move-stick'), knob = document.getElementById('move-knob');
  let moveId = null, lookId = null, lastX = 0, lastY = 0;
  const held = new Map();
  function clear() {
    keys.clear(); held.clear(); state.firing = false; state.scoped = false;
    state.moveX = state.moveY = state.lookX = state.lookY = 0;
    moveId = lookId = null; knob.style.transform = ''; updateScope();
  }
  function updateScope() {
    document.getElementById('touch-scope').setAttribute('aria-pressed', String(state.scoped));
    document.body.classList.toggle('scoped', state.scoped);
  }
  function pause() { clear(); state.locked = false; controls.classList.remove('active'); onLockChange(false); }
  window.addEventListener('keydown', e => { keys.add(e.code); if(e.code === 'Space') e.preventDefault(); if(e.code === 'KeyQ' && !e.repeat) {state.scoped = !state.scoped; updateScope();} });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { if(touch && state.locked) pause(); else clear(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && touch && state.locked) pause(); });
  window.addEventListener('mousemove', e => { if(state.locked && !touch) {state.lookX += e.movementX; state.lookY += e.movementY;} });
  window.addEventListener('mousedown', e => { if(state.locked && !touch && e.button === 0) state.firing = true; if(state.locked && e.button === 2) {state.scoped = !state.scoped; updateScope();} });
  window.addEventListener('mouseup', e => { if(e.button === 0 && !touch) state.firing = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerlockchange', () => {
    if(touch) return;
    state.locked = document.pointerLockElement === canvas;
    if(!state.locked) clear();
    onLockChange(state.locked);
  });
  function capture(el, e) { e.preventDefault(); el.setPointerCapture(e.pointerId); }
  function move(e) {
    const r = stick.getBoundingClientRect(), radius = r.width * .34;
    let x = (e.clientX-r.left-r.width/2)/radius, y = (e.clientY-r.top-r.height/2)/radius;
    const length = Math.max(1, Math.hypot(x,y)); x /= length; y /= length;
    state.moveX = x; state.moveY = -y; knob.style.transform = `translate(${x*radius}px,${y*radius}px)`;
  }
  stick.addEventListener('pointerdown', e => { if(!state.locked || moveId !== null) return; moveId = e.pointerId; capture(stick,e); move(e); });
  stick.addEventListener('pointermove', e => { if(e.pointerId === moveId) move(e); });
  function releaseMove(e) { if(e.pointerId !== moveId) return; moveId = null; state.moveX = state.moveY = 0; knob.style.transform = ''; }
  for(const name of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(name,releaseMove);
  canvas.addEventListener('pointerdown', e => { if(!touch || !state.locked || lookId !== null) return; lookId=e.pointerId; lastX=e.clientX; lastY=e.clientY; capture(canvas,e); });
  canvas.addEventListener('pointermove', e => { if(e.pointerId !== lookId) return; state.lookX += e.clientX-lastX; state.lookY += e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; });
  for(const name of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(name,e => { if(e.pointerId === lookId) lookId=null; });
  for(const button of controls.querySelectorAll('[data-hold]')) {
    button.addEventListener('pointerdown', e => {
      if(!state.locked) return; capture(button,e); held.set(e.pointerId,button.dataset.hold);
      if(button.dataset.hold === 'fire') state.firing=true; else keys.add(button.dataset.hold);
    });
    const release=e => {
      const action=held.get(e.pointerId); if(!action) return; held.delete(e.pointerId);
      if(![...held.values()].includes(action)) {if(action === 'fire') state.firing=false; else keys.delete(action);}
    };
    for(const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name,release);
  }
  document.getElementById('touch-scope').addEventListener('click', () => {if(state.locked) {state.scoped=!state.scoped; updateScope();}});
  document.getElementById('touch-pause').addEventListener('click',pause);
  return {
    state,
    requestLock() {
      if(touch) {state.locked=true; controls.classList.add('active'); onLockChange(true);}
      else canvas.requestPointerLock();
    },
    pause,
    takeLook() { const x=state.lookX,y=state.lookY; state.lookX=state.lookY=0; return {x,y}; },
  };
}
