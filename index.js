const tessel = require('tessel');
const firebase = require("firebase");
var accel = require('accel-mma84').use(tessel.port['A']);

firebase.initializeApp({
  databaseURL: "https://tesseldemo.firebaseio.com/",
  serviceAccount: __dirname + '/firebaseCredentials.json'
});

const db = firebase.database();
const rootRef = db.ref("/");
var lastMeasure = [];

accel.on('ready', function () {
  console.log("listo");
  accel.on('data', function (xyz) {
    xyz.every((v,i)=> xyz[i] = v.toFixed(4))    
    if (!(xyz.every((v,i)=> v === lastMeasure[i]))) {
      console.log(xyz);
      rootRef.child("accel").set(xyz);
      rootRef.child("data").push().set({
        x: xyz[0],
        y: xyz[1],
        z: xyz[2]
      });

      lastMeasure = xyz;
    }
  });
});

accel.on('error', function(err){
  console.log('Error:', err);
});
