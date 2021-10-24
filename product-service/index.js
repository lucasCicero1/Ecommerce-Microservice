const express = require('express')
const PORT = process.env.PORT_ONE || 8080
const mongoose = require('mongoose')
const amqp = require('amqplib')
const Product = require('./Product')
const isAuthenticated = require('../isAuthenticated')

let channel, connection
let order

const app = express()
app.use(express.json())

const DB_USER = 'lucas'
const DB_PASSWORD = encodeURIComponent('SZqvhsAjBerGXGmL')

mongoose.connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@apicluster.rehjd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
).then(() => {
    console.log(`Product-Service DB Connected`)
    app.listen(PORT, () => {
        console.log(`Product-Service at ${PORT}`)
    })
}).catch()
    

;(async () => {
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("PRODUCT")
})()

app.post('/product/create', isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body

    const newProduct = new Product({
        name,
        description,
        price
    })
    newProduct.save()
    return res.json(newProduct)
})

app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body
    const products = await Product.find({ _id: { $in: ids } })

    channel.sendToQueue("ORDER", Buffer.from(JSON.stringify({
        products,
        userEmail: req.user.email
    })))
    channel.consume("PRODUCT", data => {
        console.log("Consuming PRODUCT Queue")
        order = JSON.parse(data.content)
        channel.ack(data)
    })
    return res.json(order)
})
