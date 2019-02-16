require('dotenv').config();

// init project
const express = require('express');
const app = express();
const CORS = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

let subscriptions = []

webpush.setVapidDetails(
  "mailto:test@test.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY,
);

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(CORS());
app.use(bodyParser.json());

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
  response.status(200).send('OK')
});

app.get('/subscriptions', (request, response) => {
  response.status(200).send(subscriptions);
});

app.get('/notificate', (request, response) => {
  console.log('se enviarán notificaciones');
  
  const data = { ...request.query, date: new Date().toISOString() };
  
  console.log('data:', data);
  
  const payload = JSON.stringify(data);
  subscriptions.forEach(sub => {
    webpush
    .sendNotification(sub, payload)
    .catch(err => console.error(err));
  });
  response.status(200).send({ data, subscriptions });
});

app.put('/subscribe', (request, response) => {
  console.log('Alguien se esta anulando su suscripción');
  const subscription = request.body;

  const index = subscriptions.indexOf(subscription)
  if (index != -1 && subscriptions.length > 0) subscriptions.splice(index, 1);

  // Response to the request
  response.status(201).send({ message: 'OK', subscriptions });
});

app.post('/subscribe', (request, response) => {
  console.log('Alguien se está suscribiendo');
  const subscription = request.body;
    
  // Save the subscription
  if (subscriptions.indexOf(subscription) === -1)
    subscriptions.push(subscription);

  // Create payload
  const payload = JSON.stringify({
    title: 'Subscription succeed',
    body: 'This is the body of the notification',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Android_robot.png',
    date: new Date().toISOString(),
  });

  // Pass object into sendNotification
  webpush
    .sendNotification(subscription, payload)
    .catch(err => console.error(err));

  // Response to the request
  response.status(201).send({ message: 'OK', subscriptions });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
