import { JwtPayload } from 'jsonwebtoken'
import { tokenType, UserVerifyStatus } from '~/constants/enum'
import {ParamsDictionary} from'express-serve-static-core'

export interface RegisterReqBody {
  name: string
  email: string
  date_of_birth: string
  password: string
}

export type LoginUser = Omit<RegisterReqBody, 'name' | 'date_of_birth'>

export interface tokenPayload extends JwtPayload {
  userId: string
  tokenType: tokenType
  verify: UserVerifyStatus
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface ChangePasswordBody{
  password:string,
  new_password:string,
  new_confirm_password:string

}


export interface FollowReqUser { 
  follow_user_id:string
} 

export interface unFollowReqUser extends ParamsDictionary{
  user_id:string
}
