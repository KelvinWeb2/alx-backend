import { createClient, print } from 'redis'
import { promisify } from 'util'
import { createQueue } from 'kue'
import express from 'express'


const client = createClient()
client.on('error', (err) => {
  console.log(`Redis client not connected to the server: ${err}`)
});

client.on('connect', () => {
  console.log('Redis client connected to the server')
});

function reserveSeat(number) {
  const asyncSet = promisify(client.set).bind(client)
  asyncSet('available_seats', number)
}
reserveSeat("50")

async function getCurrentAvailableSeats() {
  const asyncGet = promisify(client.get).bind(client)
  return asyncGet('available_seats')
}

let reservationEnabled = true

const queue = createQueue({name: 'reserve_seat'})

const app = express()
app.get('/available_seats', (req, res) => {
  getCurrentAvailableSeats().
    then((num) => {
      res.json({"numberOfAvailableSeats":num})
    })
})

app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    res.json({ "status": "Reservation are blocked" })
    return
  }
  const job = queue.create('reserve_seat', )
  job.on('complete', () => {
    console.log(`Seat reservation job ${job.id} completed`)
  })
  job.on('failed', (err) => {
    console.log(`Seat reservation job ${job.id} failed: ${err.message || err.toString()}`)
  });
  job.save((err) => {
    if (err) {
      res.json({ "status": "Reservation failed" })
      return
    } else {
      res.json({ "status": "Reservation in process" })
      return
    }
  });
})

app.get('/process', (req, res) => {
  res.json({ "status": "Queue processing" })
  queue.process('reserve_seat', (jobs, done) => {
    getCurrentAvailableSeats().
      then((avlSeats) => Number.parseInt(avlSeats))
      .then((avlSeat) => {
	reservationEnabled = avlSeat > 1 ? reservationEnabled : false
	if (avlSeat > 0) {
	  reserveSeat(avlSeat - 1)
	  done()
	} else {
	  done(new Error("Not enough seats available"))
	}
      })
  })
})


app.listen(1245)
