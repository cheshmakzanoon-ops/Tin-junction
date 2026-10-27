const icon = (paths: string): string => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const icons = {
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'),
  dusk: icon('<path d="M4 16h16M6 20h12M8 12a4 4 0 0 1 8 0M12 3v2M4 7l2 2m14-2-2 2"/>'),
  moon: icon('<path d="M19 15a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z"/>'),
  overview: icon('<path d="m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 6 9-6"/>'),
  macro: icon('<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M10 7v6m-3-3h6"/>'),
  top: icon('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/>'),
  edit: icon('<path d="m4 16 12-12 4 4L8 20H4v-4Zm9-9 4 4"/>'),
  save: icon('<path d="M5 3h12l4 4v14H3V3h2Zm2 0v7h10V3M7 21v-7h10v7"/>'),
  reverse: icon('<path d="M4 7h16M4 7l4-4M4 7l4 4m12 6H4m16 0-4-4m4 4-4 4"/>'),
  whistle: icon('<path d="M5 10h7V6h4v5a6 6 0 1 1-11-1Zm14-8 2 2M19 8h3M14 2V1"/>'),
  undo: icon('<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"/>'),
  redo: icon('<path d="m16 4 5 5-5 5m5-5H11a7 7 0 0 0 0 14"/>'),
  rotate: icon('<path d="M20 8a8 8 0 1 0 0 8m0-14v6h-6"/>'),
  trash: icon('<path d="M4 7h16M9 7V3h6v4M6 7l1 14h10l1-14M10 11v6m4-6v6"/>'),
  fir: icon('<path d="m12 2-6 9h3l-5 8h16l-5-8h3l-6-9Zm0 17v3"/>'),
  oak: icon('<path d="M12 22v-8m0 3-4-3m4 0 4-3M5 15a5 5 0 0 1-1-9 6 6 0 0 1 11-2 6 6 0 0 1 4 11"/>'),
  house: icon('<path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/>'),
  lamp: icon('<path d="M12 22V8M8 22h8M7 4h10l2 4H5l2-4Zm0 4 2 6h6l2-6M12 4V2"/>'),
  bench: icon('<path d="M3 5h18v8H3zM2 16h20M5 16v6m14-6v6M7 13v3m10-3v3"/>'),
  rock: icon('<path d="m3 16 3-9 7-4 7 7 2 10H5l-2-4Zm3-9 6 8 8-5m-8 5 1 5"/>'),
};

export function mountInterface(): void {
  document.querySelector<HTMLElement>("#app")!.innerHTML = `
    <canvas id="world" aria-label="Interactive miniature railway in a walnut folding case. Use the train controls below or arrange scenery." tabindex="0"></canvas>
    <header class="masthead">
      <div class="brand"><span class="brand-mark" aria-hidden="true">TJ<span></span></span><div><p class="eyebrow">A LITTLE WORLD, YOURS.</p><h1>Tin Junction<span class="brand-dot">.</span></h1></div></div>
      <div class="header-tools"><button id="save" class="quiet-button" aria-label="Save layout">${icons.save}<span id="save-status" role="status">Opening your railway…</span></button><button id="help" class="help-button" aria-label="How to play">?</button></div>
    </header>
    <section class="layout-heading" aria-label="Current railway"><span class="overline">THE FIRST COLLECTION</span><h2 id="layout-title">Alpine afternoon</h2><p><span class="live-dot"></span><span id="mode-label">Your own little escape</span></p></section>
    <aside class="view-tools" aria-label="Scene controls">
      <div class="segmented time-controls" aria-label="Time of day"><button data-time="day" aria-label="Daylight" aria-pressed="true">${icons.sun}</button><button data-time="dusk" aria-label="Evening" aria-pressed="false">${icons.dusk}</button><button data-time="night" aria-label="Night" aria-pressed="false">${icons.moon}</button></div>
      <div class="camera-controls"><button data-view="overview" aria-label="Overview camera" title="Overview">${icons.overview}<span>Overview</span></button><button data-view="trackside" aria-label="Trackside camera" title="Up close">${icons.macro}<span>Up close</span></button><button data-view="top" aria-label="Overhead camera" title="From above">${icons.top}<span>Above</span></button></div>
    </aside>
    <section id="editor" class="editor-panel" aria-label="Scenery workshop" hidden>
      <div class="panel-heading"><div><p class="overline">MAKE IT YOURS</p><h3>A place for everything.</h3></div><button id="close-editor" class="close-button" aria-label="Close scenery workshop">×</button></div>
      <label class="name-label" for="layout-name">LAYOUT NAME</label><input id="layout-name" type="text" maxlength="80" spellcheck="false" value="Alpine afternoon" aria-label="Layout name" />
      <p class="editor-hint" id="editor-hint">Choose a miniature, then tap a clear spot on the board.</p>
      <div class="scenery-palette">${(["fir", "oak", "house", "lamp", "bench", "rock"] as const).map((kind, index) => `<button data-piece="${kind}" aria-label="Place ${["fir tree", "oak tree", "house", "lamp", "bench", "rock"][index]}" aria-pressed="false">${icons[kind]}<span>${["Fir tree", "Oak tree", "Cottage", "Lamp", "Bench", "Rock"][index]}</span></button>`).join("")}</div>
      <div class="editor-actions"><button id="undo" aria-label="Undo edit" disabled>${icons.undo}<span>Undo</span></button><button id="redo" aria-label="Redo edit" disabled>${icons.redo}<span>Redo</span></button><button id="rotate" aria-label="Rotate selected scenery" disabled>${icons.rotate}<span>Rotate</span></button><button id="remove" aria-label="Remove selected scenery" disabled>${icons.trash}<span>Remove</span></button></div>
      <p class="editor-footer">The railway rests while you arrange it.</p>
    </section>
    <div id="notice" class="notice" role="alert" hidden></div>
    <div class="bottom-area">
      <div class="above-controls"><p id="status" role="status">A quiet afternoon. A railway of your own.</p><button id="edit" class="arrange-button" aria-pressed="false">${icons.edit}<span>Arrange scenery</span></button></div>
      <section class="control-desk" aria-label="Train controls">
        <div class="engine-name"><span class="number-plate">01</span><div><p class="overline">THE LITTLE LOCAL</p><p class="engine-state" id="train-status">At the station</p></div></div>
        <button id="run" class="run-button" aria-label="Run train"><span id="run-symbol" aria-hidden="true">▶</span></button>
        <div class="throttle-control"><div class="throttle-caption"><label for="throttle">THROTTLE</label><output id="speed">0 <span>mm/s</span></output></div><input id="throttle" type="range" min="0" max="100" value="0" step="1" aria-label="Throttle" /><div class="range-labels"><span>TAKE YOUR TIME</span><span>FULL STEAM</span></div></div>
        <div class="train-buttons"><button id="reverse" aria-label="Reverse direction">${icons.reverse}<span id="direction-label">Forward</span></button><button id="whistle" aria-label="Sound whistle">${icons.whistle}<span>Whistle</span></button><button id="stop" class="stop-button" aria-label="Stop train"><span class="stop-square" aria-hidden="true"></span><span>Stop</span></button></div>
      </section>
      <footer class="caption"><span>CRAFTED FOR SLOW MOMENTS</span><span id="camera-hint">Drag to look around · scroll to get closer</span></footer>
    </div>
    <dialog id="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><span class="overline">WELCOME TO YOUR RAILWAY</span><button id="close-help" class="close-button" aria-label="Close help">×</button></div><h2 id="help-title">Small world.<br>All yours.</h2><p>Start the little local with the play button or slide the throttle. Stop before changing direction, and give the whistle a try.</p><p>Drag to turn the case, pinch or scroll to move closer. The three camera buttons offer a fresh perspective.</p><p><strong>Make yourself at home.</strong> Open Arrange scenery, choose a miniature, then tap the board. Tap an existing object to move, rotate or remove it. Undo is always there for a change of mind.</p><p>Your edits save automatically. A saved layout always reopens with the train safely stopped.</p><div class="help-shortcuts"><kbd>Space</kbd> stop <kbd>E</kbd> arrange <kbd>W</kbd> whistle <kbd>Esc</kbd> cancel</div><details><summary>About this development build</summary><p>The first operating workbench: a fixed oval, original procedural art, one locomotive and two wagons. The general track editor, final artwork and physical-device performance review are still ahead. The browser is an internal development harness.</p><p id="metrics"></p></details><button id="start-playing" class="primary-button">Back to the little world</button></dialog>
  `;
}

export function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing interface element ${id}`);
  return node as T;
}
