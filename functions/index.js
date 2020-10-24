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

app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetails);
app.get('/users', getAllUsers);

app.post('/add_friend', auth, addFriend);
app.post('/get_friends', auth, getFriends);

exports.api = functions.https.onRequest(app);
