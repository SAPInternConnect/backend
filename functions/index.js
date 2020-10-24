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

app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetails);
app.get('/users', getAllUsers)

exports.api = functions.https.onRequest(app);
