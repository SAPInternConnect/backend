const { admin, db } = require('../util/admin');
const config = require('../util/config');

const firebase = require('firebase');

firebase.initializeApp(config);

const { validateLoginData, validateSignUpData } = require('../util/validators');

// Login
exports.loginUser = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password,
    };

    const { valid, errors } = validateLoginData(user);
    if (!valid) return response.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return response.json({ token });
        })
        .catch(error => {
            console.error(error);
            return response.status(403).json({
                general: 'wrong credentials, please try again',
            });
        });
};

// Sign up
exports.signUpUser = (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        phoneNumber: '',
        country: '',
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        username: request.body.username,
    };

    const { valid, errors } = validateSignUpData(newUser);

    if (!valid) return response.status(400).json(errors);

    let token, userId;
    db.doc(`/users/${newUser.username}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return response
                    .status(400)
                    .json({ username: 'this username is already taken' });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password,
                    );
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idtoken => {
            token = idtoken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                country: newUser.country,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId,
            };
            return db.doc(`/users/${newUser.username}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return response
                    .status(400)
                    .json({ email: 'Email already in use' });
            } else {
                return response.status(500).json({
                    general: 'Something went wrong, please try again',
                });
            }
        });
};

deleteImage = imageName => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`;
    return bucket
        .file(path)
        .delete()
        .then(() => {
            return;
        })
        .catch(error => {
            return;
        });
};

// Upload profile picture
exports.uploadProfilePhoto = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const busboy = new BusBoy({ headers: request.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
            return response
                .status(400)
                .json({ error: 'Wrong file type submited' });
        }
        const imageExtension = filename.split('.')[
            filename.split('.').length - 1
        ];
        imageFileName = `${request.user.username}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filePath, mimetype };
        file.pipe(fs.createWriteStream(filePath));
    });
    deleteImage(imageFileName);
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype,
                    },
                },
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${request.user.username}`).update({
                    imageUrl,
                });
            })
            .then(() => {
                return response.json({
                    message: 'Image uploaded successfully',
                });
            })
            .catch(error => {
                console.error(error);
                return response.status(500).json({ error: error.code });
            });
    });
    busboy.end(request.rawBody);
};

exports.getUserDetail = (request, response) => {
    let userData = {};
    db.doc(`/users/${request.user.username}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.userCredentials = doc.data();
                return response.json(userData);
            }
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({ error: error.code });
        });
};

exports.updateUserDetails = (request, response) => {
    let document = db.collection('users').doc(`${request.user.username}`);
    document
        .update(request.body)
        .then(() => {
            response.json({ message: 'Updated successfully' });
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({
                message: 'Cannot Update the value',
            });
        });
};

exports.getAllUsers = (request, response) => {
    let users = db.collection('users');

    users
        .get()
        .then(users => {
            let listOfUsers = [];

			users.forEach((user) => {
				listOfUsers.push(
                    user.data()
                );
			});

            return response.json(listOfUsers);
        })
        .catch(error => {
            console.log(error);
            return response.status(404).json({
                message: 'Users not found',
            });
        });
};

exports.addFriend = (request, response) => {
    const user = request.user.username;
    const friend = request.body.friend;

    db.collection('friends')
        .where('friends', 'array-contains', user)
        .get()
        .then(data => {
            let new_request = true;
            data.forEach(friendship => {
                if (
                    friendship.data().user1 == user &&
                    friendship.data().user2 == friend
                ) {
                    new_request = false;
                    if (friendship.data().status == 'accepted') {
                        return response
                            .status(400)
                            .json({ body: 'Already friends!' });
                    } else if (friendship.data().status == 'pending') {
                        return response.status(400).json({
                            body: 'Already requested to be friends!',
                        });
                    }
                } else if (
                    friendship.data().user1 == friend &&
                    friendship.data().user2 == user
                ) {
                    new_request = false;
                    if (friendship.data().status == 'accepted') {
                        new_request = false;
                        return response
                            .status(400)
                            .json({ body: 'Already friends!' });
                    } else if (friendship.data().status == 'pending') {
                        db.collection('friends').doc(friendship.id).update({
                            status: 'accepted',
                        });
                        db.collection('users')
                            .doc(user)
                            .update({
                                friend_list: admin.firestore.FieldValue.arrayUnion(
                                    friend,
                                ),
                            });
                        db.collection('users')
                            .doc(friend)
                            .update({
                                friend_list: admin.firestore.FieldValue.arrayUnion(
                                    user,
                                ),
                            });
                        return response
                            .status(200)
                            .json({ body: 'Added as friend!' });
                    }
                }
            });
            if (new_request) {
                const newFriendship = {
                    user1: user,
                    user2: friend,
                    friends: [user, friend],
                    status: 'pending',
                };

                db.collection('friends')
                    .add(newFriendship)
                    .then(doc => {
                        const responseFriendship = newFriendship;
                        responseFriendship.id = doc.id;
                        return response.json(responseFriendship);
                    })
                    .catch(error => {
                        console.error(error);
                        response
                            .status(500)
                            .json({ error: 'Something went wrong' });
                    });
            }
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.getFriends = (request, response) => {
    let friend_usernames = [];
    db.collection('users')
        .doc(request.user.username)
        .get()
        .then(data => {
            console.log('friend_list', data.data().friend_list);
            let friend_list = data.data().friend_list;
            for (let i = 0; i < friend_list.length; i++) {
                if (friend_list[i]) {
                    friend_usernames.push(friend_list[i]);
                }
            }
        })
        .then(() => {
            let users = db.collection('users');
            let listOfUsers = [];
            users
                .get()
                .then(users => {
                    users.forEach(user => {
                        console.log('user', user.data().username);
                        listOfUsers.push({
                            userName: user.data().username,
                            firstName: user.data().firstName,
                            lastName: user.data().lastName,
                            email: user.data().email,
                            userId: user.data().userId,
                        });
                    });

                    return listOfUsers;
                })
                .then(listOfUsers => {
                    let friend_objects = [];
                    console.log('user list inside', listOfUsers);
                    friend_usernames.forEach(friend => {
                        listOfUsers.forEach(user => {
                            if (friend == user.username) {
                                friend_objects.push({
                                    username: user.data().username,
                                    lastName: user.data().lastName,
                                    email: user.data().email,
                                    userId: user.data().userId,
                                });
                            }
                        });
                    });
                    return response.json(friend_objects);
                })
                .catch(error => {
                    console.log(error);
                    return response.status(404).json({
                        message: 'Users not found',
                    });
                });
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};
