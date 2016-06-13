// https://tessel.github.io/t2-start/blinky.html
var tessel = require('tessel');

tessel.led[2].on();

setInterval(function () {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 100);

console.log("¡Parpadeando! (Press CTRL + C para detener)");