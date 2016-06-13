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

function setup() {
  createCanvas(displayWidth, displayHeight);
   
  var accelerometerDataRef = firebase.database().ref('accel');
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
  fill(255);    
  ellipse(x, y, 50, 50);  
  
  prevX = x;
  prevY = y;
}
