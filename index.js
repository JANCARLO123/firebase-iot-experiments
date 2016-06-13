const tessel = require('tessel');
const firebase = require("firebase");


firebase.initializeApp({
  databaseURL: "https://tesseldemo.firebaseio.com/",
  serviceAccount: __dirname + '/firebaseCredentials.json'
});

const db = firebase.database();
const ref = db.ref("restricted_access/secret_document");

var usersRef = ref.child("users");
usersRef.set({
  alanisawesome: {
    date_of_birth: "June 23, 1912",
    full_name: "Alan Turing"
  },
  gracehop: {
    date_of_birth: "December 9, 1906",
    full_name: "Grace Hopper"
  }
});

tessel.led[2].on();

setInterval(function () {
  tessel.led[2].toggle();
  tessel.led[3].toggle();
}, 100);

console.log("¡parpadeando!");
