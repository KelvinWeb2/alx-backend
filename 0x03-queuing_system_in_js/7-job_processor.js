import { createQueue } from 'kue'

const queue = createQueue()
const BLACKLIST = ["4153518780", "4153518781"]

function sendNotification(phoneNumber, message, job, done) {
  let total = 2, sent = 0
  const interval = setInterval(() => {
    if (sent < total) {
      job.progress(sent, total)
    }
    if (BLACKLIST.includes(phoneNumber)) {
      done(new Error(`Phone number ${phoneNumber} is blacklisted`))
      clearInterval(interval)
      return
    }

    if (sent === 0) {
      console.log(`Sending notification to ${phoneNumber}, with message: ${message}`)
    }

    ++sent
    if (sent === total) {
      done()
      clearInterval(interval)
    }
  }, 1000);
}


queue.process('push_notification_code_2', 2, (job, done) => {
  sendNotification(job.data.phoneNumber, job.data.message, job, done)
});
