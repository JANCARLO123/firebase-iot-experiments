'use strict';

const tessel = require('tessel');
const firebase = require('firebase');
const storage = require('node-storage');

firebase.initializeApp({
  databaseURL: "https://tesseldemo.firebaseio.com/",
  serviceAccount: __dirname + '/firebaseCredentials.json'
});

const db = firebase.database();
const dataRef = db.ref("/");

const inputs = {accelerometer:
					{enabled:false,
					   debug:true,
					  sensor:true,
					    port:'B'
					},
				ambient:
					{enabled:true,
					   debug:true,
					  sensor:true,					   
					    port:'A'
					},				
				climate:
					{enabled:false,
					   debug:true,
					  sensor:true,					   
					    port:'B'
					},				
				gps:
					{enabled:false,
				       debug:true,
				      sensor:true,
					    port:'A'
					},									
				twitter:
					{enabled:false,
				  	   debug:false,
				  	  sensor:false
				  	}
			  };

const LIKES = 'likes';
const MENTIONS = 'mentions';
const RETWEETS = 'retweets';
const twitterValues = {likes: 0, mentions: 0, retweets: 0};

const dbName = 'tweets.db';
const tweetDB = new storage('./' + dbName);

global.accelerometer = function(currentPort, dataRef, debug) {
	const accel = require('accel-mma84').use(tessel.port[currentPort]);
	
	accel.on('ready', function () {	
	  console.log("accelerometer ready!");
	  dataRef.child('enabled').set(true);
	  accel.on('data', function (xyz) {
	  	const values = {
									        x:xyz[0].toFixed(4),
									        y:xyz[1].toFixed(4),
									        z:xyz[2].toFixed(4)}; 

	  	dataRef.child('values').set(values);
	  	
	  	if (debug) {
		  	console.log('accelerometer',values);

	  	}
	  });
	});

	accel.on('error', function(err){
	  console.log('Accelerometer Error:', err);
	  dataRef.child('enabled').set(false);
	});		
}

global.ambient = function(currentPort, dataRef, debug) {
	const ambient = require('ambient-attx4').use(tessel.port[currentPort]);
	
	ambient.on('ready', function () {
	  console.log("ambient ready!");
	  dataRef.child('enabled').set(true);
	  setInterval( function () {
	    ambient.getLightLevel( function(err, lightdata) {	      
	      ambient.getSoundLevel( function(err, sounddata) {
	        if (typeof lightdata != 'undefined' && typeof sounddata != 'undefined') {
	    	  	const values = {light:lightdata.toFixed(5), 
		        			  				sound:sounddata.toFixed(5)}; 
		        dataRef
		        	.child('values')
		        		.set(values);
		        if (debug) {
							console.log('ambient',values);
						}	        	
	        } else {
	        	console.log('ambient module throwing undefined values');
	        }
	      });
	    });
	  }, 1000); 

	});

	ambient.on('error', function(err){
	  console.log('Ambient Error:', err);
	  dataRef.child('enabled').set(false);
	});	
}

global.climate = function(currentPort, dataRef, debug) {
	const climate = require('climate-si7020').use(tessel.port[currentPort]);
	
	climate.on('ready', function () {
	  console.log("climate ready!");
	  dataRef.child('enabled').set(true);
	  setImmediate(function loop () {
	    climate.readTemperature('f', function (err, temp) {
	      climate.readHumidity(function (err, humid) {
	      	const tempInCelsius = (temp-32)/1.8;
    	  	const values = {temp:tempInCelsius.toFixed(4),
    	  								  humidity:humid.toFixed(4)}
	        dataRef
	        	.child('values')
	        		.set(values);
	      	if (debug) {
	      		console.log(values);
	      	}
	      	setTimeout(loop, 300);
	      });
	    });
	  });	 
	});

	climate.on('error', function(err){
	  console.log('climate Error:', err);
	  dataRef.child('enabled').set(false);
	});		
}

global.gps = function(currentPort, dataRef, debug) {
	var fixed = false;
	var gpsValues = {};
	var prevLat, prevLon, prevTimestamp;
//deg-dec format

	const gps = require('gps-a2235h').use(tessel.port[currentPort]);

	gps.on('ready', function () {
	  console.log("gps ready!");	  
	  dataRef.child('enabled').set(true);		

	  gps.on('fix', function (data) {
	  	if (data.numSat > 0) {
	  		fixed = true;	
	  	}
	    
	    if (debug) {
	    	console.log(data.numSat + ' satellites fixed');
	    }	    
	  });

	  gps.on('coordinates', function (coords) {
	    if (fixed) {
	    	gpsValues['lat'] = (coords.lat[0] + coords.lat[1]/60).toFixed(4);
	    	gpsValues['lon'] = (coords.lon[0] + coords.lon[1]/60).toFixed(4);
	    	if (prevLat != undefined && prevLon != undefined) {
	    		if (prevLat != gpsValues['lat'] && prevLon != gpsValues['lon']) {
		    		const distance = distanceOnGeo(prevLat, prevLon, gpsValues['lat'], gpsValues['lon']);
		    		const time = (coords.timestamp - prevTimestamp) / 1000.0;
		    		const speed = distance / time;
	//(speed_mps * 3600.0) / 1000.0;
		    		console.log("\tdistance: " + distance,"speed:" + speed);
	    		}
	    	} 
    		prevLat = gpsValues['lat'];
    		prevLon = gpsValues['lon'];	
    		prevTimestamp = coords.timestamp; 	

			dataRef.child('values').set(gpsValues);
			
		    if (debug) {
		    	//console.log('Lat: ', coords.lat, '\tLon:', coords.lon);  
		    }	        			  
	    }    
	  });

	  gps.on('altitude', function (alt) {
	    if (fixed) {
			gpsValues['alt'] = alt.alt;
	        dataRef.child('values').set(gpsValues);

		    if (debug) {
		    	//console.log('Alt: ', alt.alt);
		    }
	    }
	  });
	  	

	  if (fixed) {
	  }
 
	  gps.on('dropped', function() {
	  	//TODO: reconnect
	  });
	});

	gps.on('error', function(err) {
	  console.log("gps got this error", err);
	  dataRef.child('enabled').set(false);
	});	
}

function distanceOnGeo(latA, lonA, latB, lonB) { 
	latA = latA * Math.PI / 180.0;
	lonA = lonA * Math.PI / 180.0;
 
	latB = latB * Math.PI / 180.0;
	lonB = lonB * Math.PI / 180.0;
 
	const earthRadius = 6378100;
 
	const rho1 = earthRadius * Math.cos(latA);
	const z1 = earthRadius * Math.sin(latA);
	const x1 = rho1 * Math.cos(lonA);
	const y1 = rho1 * Math.sin(lonA);
 
	const rho2 = earthRadius * Math.cos(latB);
	const z2 = earthRadius * Math.sin(latB);
	const x2 = rho2 * Math.cos(lonB);
	const y2 = rho2 * Math.sin(lonB);
 
	// Dot product
	const dot = (x1 * x2 + y1 * y2 + z1 * z2);
	const cos_theta = dot / (earthRadius * earthRadius);
 
	const theta = Math.acos(cos_theta);
 
 	//distance in meters
	return earthRadius * theta;
}

global.twitter = function(dataRef, debug) {
	const Twit = require('twit');	
	const T = new Twit(require('./twitterConfig.js'));
	
	const twitterIntervalTime = 3 * 1000 * 60;
	const valuesRef = dataRef.child('values');
	valuesRef.set(twitterValues);

	console.log("looking for tweets..."); 
	setInterval(function(){
	    T.get('statuses/user_timeline', {include_rts:false}, function (error, data) {
		  twitterAPICall(data, LIKES, dataRef, debug);
	    });

	    T.get('statuses/mentions_timeline', {count:5}, function (error, data) {
		  twitterAPICall(data, MENTIONS, dataRef, debug);
	    });    	

	    T.get('statuses/retweets_of_me', {count:5}, function (error, data) {
		  twitterAPICall(data, RETWEETS, dataRef, debug);
	    });		    
	}, twitterIntervalTime);

	setInterval(function(){
		var newDataAvailable = false;
		Object.keys(twitterValues).forEach(function (key) {
			var count = twitterValues[key];
		  	if (count > 0) {
		    	newDataAvailable = true;
		    }
		});		

		if (newDataAvailable) {
			valuesRef.once("value", function(snapshot) {
			  	if (snapshot.exists()) {	
			  		const dbVal = snapshot.val();
						Object.keys(twitterValues).forEach(function (key) {
							twitterValues[key] += dbVal[key];
						});
			  	}

			  	valuesRef.set(twitterValues);
					Object.keys(twitterValues).forEach(function (key) {
					twitterValues[key] = 0;
				});				
			});			
		}
	}, 3000);
}

function twitterAPICall(data, type, dataRef, debug) {
	if (debug) {
  		console.log('Twitter request for',type);
  	}
  	const now = new Date(); 
  	if (data.errors) {
		console.log(data.errors);
  	} else {
		data.forEach(function (tweet) {
		  	const tweetDate = new Date(tweet.created_at);
		  	if(now - tweetDate < (1000*60*60*24)) {  		
		  		const storedTweet = tweetDB.get(tweet.id_str);
		  		if (typeof storedTweet != undefined) {
  					if (type === LIKES && tweet.favorite_count > value) {
						if (debug) {
							console.log('adding', tweet.text);	
						}  						
  						tweetDB.put(tweet.id_str, tweet.favorite_count);
  						twitterValues[type] += 1;					
  					}	  				
		  		} else {
					tweetDB.put(tweet.id, tweet.favorite_count);
					if (type === LIKES) {
						if (tweet.favorite_count > 0) {
							if (debug) {
								console.log('adding', tweet.text);	
							}
							twitterValues[type] += 1;
						}
					} else {					
						if (debug) {
							console.log('adding', tweet.text);	
						}
						twitterValues[type] += 1;
					}
		  		}
		  	}
		});
  	}  	
}

Object.keys(inputs).forEach(k => {	
	if (inputs[k].enabled) {				
		const currentDebug = inputs[k].debug;
		const currentDataRef = dataRef.child(k);
		
		if (inputs[k].sensor) {
			const currentPort = inputs[k].port;
			global[k](currentPort, currentDataRef, currentDebug);
		} else {
			global[k](currentDataRef, currentDebug);
		}
	} else {
		dataRef.child(k).child('enabled').set(false);
	}
});

console.log("ready!");

var count = 0;
const blink = setInterval(function () {	
  tessel.led[2].toggle();
  tessel.led[3].toggle();
  if (count == 10) {
		clearInterval(this);
		tessel.led[2].off();
		tessel.led[3].off();
	} else {
		count++;
	}
}, 400);

//twitter(dataRef.child('twitter'),true);
