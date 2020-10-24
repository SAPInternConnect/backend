const functions = require('firebase-functions');
const app = require('express')();
const auth = require('./util/auth');

const {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetail,
    updateUserDetails,
    getAllUsers,
} = require('./APIs/users');

const { createEvent, getEvents, updateEvent } = require('./APIs/events');

// user
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetails);
app.get('/users', getAllUsers);

// events
app.post('/event', createEvent);
app.get('/events', getEvents);
app.put('/event', updateEvent);

exports.api = functions.https.onRequest(app);
