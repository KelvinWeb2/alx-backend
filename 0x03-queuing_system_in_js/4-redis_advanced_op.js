import { createClient, print } from 'redis'
import { promisify } from 'util'


const client = createClient()
client.on('error', (err) => {
  console.log(`Redis client not connected to the server: ${err}`)
});

client.on('connect', () => {
  console.log('Redis client connected to the server')
});

const hobj = {
  'Portland': 50,
  'Seattle': 80,
  'New York': 20,
  'Bogota': 20,
  'Cali': 40,
  'Paris': 2,
}

for (const [field, value] of Object.entries(hobj)) {
  client.hset('HolbertonSchools', field, value, print)
}

client.hgetall('HolbertonSchools', (err, rep) => {
  console.log(rep)
})
