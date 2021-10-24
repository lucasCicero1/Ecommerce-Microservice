const express = require('express')
const PORT = process.env.PORT_ONE || 7070
const mongoose = require('mongoose')
const User = require('./User')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const DB_USER = 'lucas'
const DB_PASSWORD = encodeURIComponent('SZqvhsAjBerGXGmL')

mongoose.connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@apicluster.rehjd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
).then(() => {
    console.log(`Auth-Service DB Connected`)
    app.listen(PORT, () => {
        console.log(`Auth-Service at ${PORT}`)
    })
})
.catch()


app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if(!user){
        return res.json({ message: "User doesn't exist" })
    }else{
        if(password !== user.password){
            return res.json({ message: "Password Incorrect" })
        }
        
        const payload = {
            email,
            name: user.name
        }
        jwt.sign(payload, "secret", (err, token) => {
            if(err){
                throw err
            }else{
                return res.json({ token: token })
            }
        })

    }
})

app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body

    const useExists = await User.findOne({ email })
    if(useExists){
        return res.json({ message: "User already exists" })
    }else{
        const newUser = new User({
            name,
            email,
            password
        })
        newUser.save()
        return res.json(newUser)
    }
})

