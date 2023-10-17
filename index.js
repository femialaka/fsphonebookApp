require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const Person = require('./models/person')

morgan.token('post-data', (req) => {
  if (req.method === 'POST' && req.body) {
    return JSON.stringify(req.body)
  }
  return '-'
})

app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :post-data',
    {
      skip: function (req) {
        return req.method !== 'POST' // Log only POST requests
      },
    }
  )
)

const errorHandler = (error, request, response, next) => {
  console.error(`ERROR NAME: ${error.name}`)
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

app.get('/', (req, res) => {
  res.send('<h3>Phonebook api</h3>')
})
app.get('/info', (req, res) => {
  Person.find({}).then((people) => {
    res.send(`<p>Phonebook has info for ${people.length} people</p>
    <p>${Date()}</p>`)
  })
})

app.get('/api/persons', (req, res) => {
  Person.find({}).then((people) => {
    res.json(people)
  })
})

app.get('/api/persons/:id', (request, response) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => {
      console.log(error)
      response.status(400).send({ error: 'malformatted id' })
    })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(response.status(204).end())
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(
    request.params.id,
    person,
    { new: true, runValidators: true }
  )
    .then((updatedPerson) => {
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
