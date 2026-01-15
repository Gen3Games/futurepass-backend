import express from 'express'
import multer from 'multer'
import { handleUpload, handleDelete } from './repositories'

const host = process.env.HOST ?? 'localhost'
const port = process.env.PORT ? Number(process.env.PORT) : 3000

const app = express()

app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

app.post(
  '/customer/:uuid/assets',
  upload.fields([
    { name: 'fonts', maxCount: 100 },
    { name: 'images', maxCount: 100 },
    { name: 'styles', maxCount: 100 },
    { name: 'i18n', maxCount: 100 },
    { name: 'config', maxCount: 1 },
  ]),
  async (req, res) => {
    const { uuid } = req.params
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    if (!Object.keys(files).length) {
      res.sendStatus(204)
      return
    }
    try {
      const result = await handleUpload({
        files,
        uuid,
      })
      res.send(result)
    } catch (err) {
      console.error('error', err)
      res.send(500)
    }
  }
)

app.delete('/customer/:uuid/assets', async (req, res) => {
  const { uuid } = req.params
  const { fileNames } = req.body
  await handleDelete(fileNames, uuid)
  res.send(true)
})

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`)
})
