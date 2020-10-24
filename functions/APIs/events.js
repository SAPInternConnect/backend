const { db } = require('../util/admin');

exports.createEvent = (request, response) => {
    const ref = db.collection('events').doc();

    const event = {
        eventId: ref.id,
        name: request.body.name,
        maxSize: request.body.maxSize,
        membersList: [],
        date: request.body.date,
        location: request.body.location,
        userId: request.body.userId,
        createdAt: new Date().toUTCString(),
    };

    ref.set(event)
        .then(res => {
            console.log('success');
            return response.json(res);
        })
        .catch(error =>
            response.status(400).json({
                message: 'Could not add event',
            }),
        );
};

exports.getEvents = (request, response) => {
    let events = db.collection('events');

    events
        .get()
        .then(events => {
            let listOfEvents = [];

            events.forEach(event => {
                listOfEvents.push({
                    name: event.data().name,
                    maxSize: event.data().maxSize,
                    membersList: event.data().membersList,
                    location: event.data().location,
                    date: event.data().date,
                    userId: event.data().userId,
                });
                console.log(event.id);
            });

            return response.json(listOfEvents);
        })
        .catch(error => {
            console.log(error);
            return response.status(404).json({
                message: 'Could not find events',
            });
        });
};

exports.updateEvent = async (request, response) => {
    if (!request.body.username || !request.body.eventId)
        return response.status(401).json({
            message: 'Missing argument(s)',
        });

    // only return one user
    let users = await db
        .collection('users')
        .where('username', '==', request.body.username)
        .get();

    if (!users)
        return response.status(404).json({
            message: 'User does not exist',
        });

    let tempUser;
    users.forEach(user => {
        tempUser = user.data();
    });

    // only return one event
    let events = await db
        .collection('events')
        .where('eventId', '==', request.body.eventId)
        .get();
    if (!events) {
        return response.status(400).message({
            message: 'could not update event',
        });
    }

    events.forEach(event => {
            let membersList = event.data().membersList;
            membersList.push(tempUser);

            db.collection('events').doc(request.body.eventId).update({
                membersList: membersList,
            });
        })

    // return value doesnt matter
    return response.json(events);
};
