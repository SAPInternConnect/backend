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
	addFriend,
	getFriends,
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

// friends
app.post('/add_friend', auth, addFriend);
app.post('/get_friends', auth, getFriends);

exports.api = functions.https.onRequest(app);
