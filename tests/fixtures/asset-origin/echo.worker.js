"use strict";
self.onmessage = function (event) {
  if (event.data === "asset-probe") self.postMessage("asset-worker-ready:42");
};
