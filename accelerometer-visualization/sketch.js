var config = {
  apiKey: "AIzaSyDEirbDBsMyL5xqKQXwv-IidQbfgDSlC4c",
  authDomain: "tesseldemo.firebaseapp.com",
  databaseURL: "https://tesseldemo.firebaseio.com",
  storageBucket: "tesseldemo.appspot.com",
};
firebase.initializeApp(config);

var x, y;
var r, g, b;
var prevX, prevY;
var statusColor = 'white';

function setup() {
  createCanvas(displayWidth, displayHeight);
  
  var statusDataRef = firebase.database().ref('accelerometer/enabled');
  statusDataRef.on('value', function(snapshot) {
    if (snapshot.val()) {
      statusColor = 'green';
    } else {
      statusColor = 'red';
    }
  });

  var accelerometerDataRef = firebase.database().ref('accelerometer/values');
  accelerometerDataRef.on('child_changed', function(snapshot) {    
    if (snapshot.key === 'x') {
      x = map(snapshot.val(), -1, 1, 0, displayWidth);
      r = map(snapshot.val(), -1, 1, 0, 255);
    } else if (snapshot.key === 'y') {
      y = map(snapshot.val(), -1, 1, 0, displayHeight);
      g = map(snapshot.val(), -1, 1, 0, 255);
    } else if (snapshot.key === 'z') {
      b = map(snapshot.val(), -1, 1, 0, 255);
    }
  });    
}

function draw() { 
  background(r,g,b);
  fill(r,g,b);
  rectMode(RADIUS);
  strokeWeight(0);
  rect(prevX, prevY, 30, 30);  
  fill(statusColor);    
  ellipse(x, y, 50, 50);  
  
  prevX = x;
  prevY = y;
}
