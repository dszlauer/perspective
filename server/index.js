const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const socket = require('socket.io')
const massive = require('massive')
const session = require('express-session')
const userController = require('./controllers/UserController')
const socketController = require('./controllers/SocketController')

app.use(bodyParser.json())
require('dotenv').config()

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60 * 60 * 1000 * 24 * 14
        }
    })
)

massive(process.env.CONNECTION_STRING)
    .then(db => {
        console.log('Connected to database.')
        app.set('db', db)
        db.init()
    })
    .catch((err) => {
        console.log(err)
    })

app.get('/api/sessionInfo', userController.sessionInfo)
app.post('/api/register', userController.register)
app.post('/api/login', userController.login)
app.post('/api/logout', userController.logout)

const port = process.env.PORT || 4000
const io = socket(app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
}))

io.on('connection', socket => {
    console.log('User Connected')

    socket.on('join room', data => {
        console.log('Data --> ', data)
        socket.join(data.room)
        io.in(data.room).emit('join room', {room: data.room, user: data.user})
    })

    socket.on('message sent', data => {
        console.log('Data ==> ', data)
        io.in(data.room).emit('message from server', {user: data.user, message: data.message, room: data.room})
    })
})