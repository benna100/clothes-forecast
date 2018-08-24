const express = require('express');
const webpush = require('web-push');
const path = require('path');
const fetch = require('node-fetch');
var fs = require('fs');
const schedule = require('node-schedule');
console.log(process.env.PUBLIC_VAPID_KEY);

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

// Replace with your email
webpush.setVapidDetails('mailto:benjamin.dals.hughes@gmail.com', publicVapidKey, privateVapidKey);

const app = express();

app.use(require('body-parser').json());

let currentTemperature;
let subscription;

app.post('/subscribe', (req, res) => {
    console.log('subscribe');
    subscription = req.body;
    res.status(201).json({});
    const payload = JSON.stringify({
        title: 'Welcome :)',
        body: 'Welcome to your personal clothes forecaster!',
    });

    webpush.sendNotification(subscription, payload).catch(error => {
        console.error(error.stack);
    });
});

schedule.scheduleJob('08 * *', function(){
    notifyUser(getCurrentWeather(), currentTemperature, subscription);
});

schedule.scheduleJob('22 * * * *', function() {
    console.log(4);
    
    notifyUser(getCurrentWeather(), currentTemperature, subscription);
});

/* fetch('http://api.openweathermap.org/data/2.5/weather?q=copenhagen,%20dk&APPID=a5f5a9ca4a2951ba85f18383a047b718&units=metric')
  .then(res => res.text())
  .then(body => console.log(body)); */

const tempToClothes = function(temp) {
    temp = parseFloat(temp);

    let clothes = '';
    if (temp < 0) {
        clothes = 'Warm clothes'
    } else if (temp < 14) {
        clothes = 'Jacket and jeans'
    } else if (temp < 16) {
        clothes = 'Jeans and sweater'
    } else if (temp < 18) {
        clothes = 'Jeans and tshirt'
    } else if (temp < 25) {
        clothes = 'Shorts and tshirt'
    }

    return clothes;
}

function getCurrentWeather() {
    return JSON.parse(fs.readFileSync('weather.json', 'utf8'));
}



function notifyUser(weatherObj, currentTemperature, subscription) {
    if (! currentTemperature) {
        const temp = weatherObj.main.temp;
        console.log(temp);
        
        const clothesToWear = tempToClothes(temp);
        console.log(clothesToWear);

        const payload = JSON.stringify({
            title: 'Change clothes today!',
            body: `Wear ${clothesToWear}`,
        });
        webpush.sendNotification(subscription, payload).catch(error => {
            console.error(error);
        });
    }
}




app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use(require('express-static')('./'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));
