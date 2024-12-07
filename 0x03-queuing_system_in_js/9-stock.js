import express from 'express'
import { createClient, print } from 'redis'
import { promisify } from 'util'
const client = createClient()


client.on('error', (err) => {                           console.log(`Redis client not connected to the server: ${err}`)
});
                                                      client.on('connect', () => {                            console.log('Redis client connected to the server') });

const listProducts = [
  {
    'id': 1, 'name': "Suitcase 250",
    'price': 50, 'stock': 4
  },
  {'id': 2, 'name': 'Suitcase 450',
    'price': 100, 'stock': 10
  },
  {
    'id': 3, 'name': 'Suitcase 650',
    'price': 350, 'stock': 2
  },
  {
    'id': 4, 'name': 'Suitcase 1050',
    'price': 550, 'stock': 5
  }
]

function getItemById(id) {
  for (const product of listProducts) {
    if (product.id === id) {
      return product
    }
  }
}

const app = express()
app.get('/list_products', (req, res) => {
  const list = []
  for (const product of listProducts) {
    const res_product = {'itemId': product.id, 'itemName': product.name, 'price': product.price, "initialAvailableQuantity": product.stock}
    list.push(res_product)
  }
  res.send(list)
})

function reserveStockById(itemId, stock) {
  const asyncSet = promisify(client.set).bind(client)
    asyncSet(`item.${itemId}`, stock)
}

async function getCurrentReservedStockById(itemId) {
  const asyncGet = promisify(client.get).bind(client)
  return asyncGet(`item.${itemId}`)
}

app.get('/list_products/:itemId(\\d+)', (req, res) => {
  const id = Number.parseInt(req.params.itemId)
  const product = getItemById(id)

  if (!product) {
    res.json({"status":"Product not found"})
    return;
  }

  getCurrentReservedStockById(id).
    then((stock) => Number.parseInt(stock || 0)).
    then((res_stock) => {
      const res_product = {
	'itemId': product.id, 'itemName': product.name,
	'price': product.price, "initialAvailableQuantity": product.stock,
	'currentQuantity': product.stock - res_stock
      }
      res.json(res_product)
    })
})

app.get('/reserve_product/:itemId(\\d+)', (req, res) => {
  const id = Number.parseInt(req.params.itemId)
  const product = getItemById(id)
  if (!product) {
    res.json({"status":"Product not found"})
    return;
  }

  getCurrentReservedStockById(id).
    then((stock) => Number.parseInt(stock || 0)).
    then((res_stock) => {
      if (product.stock - res_stock < 1) {
	res.json({"status":"Not enough stock available","itemId":1})
	return
      }
      reserveStockById(id, res_stock + 1)
      res.json({"status":"Reservation confirmed","itemId":id})
    })
})


app.listen(1245)
