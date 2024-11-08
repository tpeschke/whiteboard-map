const express = require('express')
    , bodyParser = require('body-parser')
    , massive = require('massive')
    , cors = require('cors')
    , { port, databaseCredentials, origin } = require('./server-config')
    , path = require('path')
    , { Server } = require('socket.io')

const app = new express()
app.use(bodyParser.json())
app.use(cors())

app.get('/loadMap', (req ,res) => {
    const db = req.app.get('db')
    db.get().then(map => {
        res.send(JSON.parse(map[0].map))
    })
})

const root = require('path').join(__dirname, '../build')
app.use(express.static(root));
app.get("*", (req, res) => {
    res.sendFile('index.html', { root });
})

// ================================== \\
massive(databaseCredentials).then(dbInstance => {
    app.set('db', dbInstance);
    const io = new Server(app.listen(port, _ => {
        console.log(`All I have to give to the world is fear and anxiety ${port}`)
        // ====================================================
        
        io.on('connection', socket => {
            const db = app.get('db')
            socket.on('subscribe', interval => {
                setInterval(_ => {
                    socket.emit('timer', new Date());
                }, interval)
            })
        
            socket.on('whiteboard-listener', data => {
                db.update(JSON.stringify(data.elements))
                io.emit('whiteboard-frontend', data)
            })
        })

        // ====================================================
    }), {
        cors: {
            origin
        }
    });
});


