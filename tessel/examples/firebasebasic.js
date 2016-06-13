const tessel = require('tessel');
const firebase = require("firebase");
var accel = require('accel-mma84').use(tessel.port['A']);

firebase.initializeApp({
  databaseURL: "https://tesseldemo.firebaseio.com/",
  serviceAccount: __dirname + '/firebaseCredentials.json'
});

const db = firebase.database();
accel.on('ready', function () {
  accel.on('data', function (xyz) {
    console.log(
      'x:', xyz[0].toFixed(2),
      'y:', xyz[1].toFixed(2),
      'z:', xyz[2].toFixed(2));

    db.ref("accel").set(xyz);
  });
});

accel.on('error', function(err){
  console.log('Error:', err);
});