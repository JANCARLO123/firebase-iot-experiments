const tessel = require('tessel');
const firebase = require("firebase");
var accel = require('accel-mma84').use(tessel.port['B']);

firebase.initializeApp({
  databaseURL: "https://tesseldemo.firebaseio.com/",
  serviceAccount: __dirname + '/firebaseCredentials.json'
});

const db = firebase.database();
const accelRef = db.ref("/accel");

var accValues = {};
accel.on('ready', function () {
  console.log("listo");
  //accel.setOutputRate(1.56, function rateSet() {
    accel.on('data', function (xyz) {
      accValues = {
        x:xyz[0].toFixed(4),
        y:xyz[1].toFixed(4),
        z:xyz[2].toFixed(4)};      
  console.log(accValues);
  accelRef.set(accValues);  

    });
  //});
});

accel.on('error', function(err){
  console.log('Error:', err);
});
