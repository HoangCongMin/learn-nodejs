import { Router } from 'express'
import {testFormUploadController,createFileVideosController} from '~/controllers/medias.controller'
import { wrapAsync } from '~/utils/handlers'
 
const mediaRouter = Router()

mediaRouter.post('/image',wrapAsync(testFormUploadController))
mediaRouter.post('/video',wrapAsync(createFileVideosController))

export default mediaRouter