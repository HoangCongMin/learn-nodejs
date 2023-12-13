import { Request } from 'express'
import User from '~/models/schemas/User.schema'
import { tokenPayload, FollowReqUser } from '~/models/requests/User.requests'

declare module 'express' {
  interface Request {
    user?: User
    decode_authorrization?: tokenPayload
    decode_email_verify_token?: tokenPayload
    decode_accesstoken?: tokenPayload
    forgot_password_token?: tokenPayload
  }
}
