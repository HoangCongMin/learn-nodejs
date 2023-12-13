import { Router } from 'express'
import {staticFileController,staticFileVideoController} from '~/controllers/staticfile.controller'

const staticRouter=Router()

staticRouter.get('/image/:name',staticFileController)
staticRouter.get('/video/:name',staticFileVideoController)



export default staticRouter