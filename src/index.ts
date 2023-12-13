import express from 'express'
import usersRouter from '~/routes/users.router'
import mediaRouter from './routes/medias.router'
import staticRouter from '~/routes/static.router'
import database from '~/services/database.services'
import { defaultErrorHandler } from '~/middlewares/errors.middlewares'
import { initFileImg,initFileVideo } from '~/utils/file'
import { config } from 'dotenv'
import {staticFileController,staticFileVideoController} from '~/controllers/staticfile.controller'

import path from 'path'
config()
const app = express()

database.connect()
const port = 4000
initFileImg()
initFileVideo()
app.use(express.json())
app.use('/test', usersRouter)
app.use('/', usersRouter)
app.use('/medias', mediaRouter)
app.use('/medias', staticRouter)
// app.use(`/medias/video`,express.static(path.resolve('upload/video'))  )


app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log('run ning port')
})
