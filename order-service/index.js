const express = require('express')
const PORT = process.env.PORT_ONE || 9090
const mongoose = require('mongoose')
const amqp = require('amqplib')
const Order = require('./Order')

let channel, connection

const app = express()
app.use(express.json())

const DB_USER = 'lucas'
const DB_PASSWORD = encodeURIComponent('SZqvhsAjBerGXGmL')

mongoose.connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@apicluster.rehjd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
)
.then(() => {
    console.log(`Order-Service DB Connected`)
    app.listen(PORT, () => {
        console.log(`Order-Service at ${PORT}`)
    })
})
.catch()

async function connect() {
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("ORDER")
}

function createOrder(products, userEmail){
    let total = 0
    for(let i = 0; i < products.length; i++){
        total += products[i].price
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total
    })
    newOrder.save()
    return newOrder
}

connect().then(() => {
    channel.consume("ORDER", data => {
        console.log("Consuming ORDER Queue")
        const { products, userEmail } = JSON.parse(data.content)
        const newOrder = createOrder(products, userEmail)
        channel.ack(data)
        channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })))

        console.log(products)
    })
})
