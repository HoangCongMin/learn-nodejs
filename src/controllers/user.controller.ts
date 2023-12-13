import { Request, Response, NextFunction } from 'express'
import userservice from '~/services/user.services'
import database from '~/services/database.services'
import Follow from '~/models/schemas/Follow.schema'
import { config } from 'dotenv'

import { ParamsDictionary } from 'express-serve-static-core'
import {
  RegisterReqBody,
  tokenPayload,
  UpdateMeReqBody,
  FollowReqUser,
  unFollowReqUser,
  ChangePasswordBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import httpStatus from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enum'
import User from '~/models/schemas/User.schema'
import { json } from 'stream/consumers'

config()
export const validateController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'minh' && password === 'hoang') {
    return res.status(200).json({
      message: 'ok'
    })
  }
  return res.status(400).json({
    message: 'loi'
  })
}

export const registerUser = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await userservice.createUser(req.body)
  return res.status(200).json({
    message: 'ok',
    result
  })
}

export const LoginUser = async (req: Request, res: Response) => {
  const { user }: any = req

  const result = await userservice.loginUser({ user_id: user._id.toString(), verify: user.verify })
  return res.status(200).json({
    message: 'login ok',
    result
  })
}

export const logoutUser = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await userservice.logOut(refresh_token)
  return res.status(200).json(result)
}

export const verifyEmail = async (req: Request, res: Response) => {
  const { userId } = req.decode_email_verify_token as tokenPayload
  const result = await database.Users.findOne({ _id: new ObjectId(userId) })
  if (!result) {
    return res.status(httpStatus.unauthorized).json({
      message: 'khong co user cos email verify token nay'
    })
  }
  if (result?.email_verify_token === '') {
    return res.status(httpStatus.ok).json({
      message: 'tai khoan da verify'
    })
  }
  const mesage = await userservice.verifyEmailToken({ user_id: userId })

  return res.status(httpStatus.ok).json({ mesage })
}

export const resendEmailVerifyToken = async (req: Request, res: Response) => {
  const { userId } = req.decode_accesstoken as tokenPayload
  const user = await database.Users.findOne({ _id: new ObjectId(userId) })
  if (!user) {
    return res.status(httpStatus.unauthorized).json({
      message: 'khong ton tai user'
    })
  }
  if (user.verify === UserVerifyStatus.Verifited) {
    return res.status(httpStatus.unauthorized).json({
      message: 'emai da tung verify roi'
    })
  }

  const result = await userservice.reSendEmailVerifyToken(userId)

  return res.json(result)
}

export const forgetPasswordController = async (req: Request, res: Response) => {
  const { _id, verify } = req.user as User

  const result = await userservice.forgotPassword({ user_id: _id?.toString() as string, verify })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = (req: Request, res: Response) => {
  return res.status(httpStatus.ok).json({
    message: 'verifyForgotPasswordToken thanh cong'
  })
}

export const resetPasswordController = async (req: Request, res: Response) => {
  const { userId } = req.forgot_password_token as tokenPayload
  const { password } = req.body
  const result = await userservice.resetPassword(userId, password)
}

export const getMeController = async (req: Request, res: Response) => {
  const { userId } = req.decode_accesstoken as tokenPayload
  const result = await userservice.getMe(userId)
  return res.status(httpStatus.ok).json({
    message: 'lay thong tin cua ban thanh cong',
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { userId } = req.decode_accesstoken as tokenPayload
  const { body } = req
  const result = await userservice.updateMe(userId, body)
  return res.json({
    message: 'thanh con',
    result
  })
}

export const getUserController = async (req: Request, res: Response) => {
  const { username } = req.params
  const result = await userservice.getProfileUser(username)
  return res.json(result)
}

export const followController = async (req: Request<ParamsDictionary, any, FollowReqUser>, res: Response) => {
  const { userId } = req.decode_accesstoken as tokenPayload
  const { follow_user_id } = req.body
  const result = await userservice.createFollow({ user_id: userId, follow_user_id: follow_user_id })
  return res.json({
    message: 'thanh cong',
    result
  })
}

export const unFollowController = async (req: Request<unFollowReqUser>, res: Response) => {
  const { userId } = req.decode_accesstoken as tokenPayload

  const { user_id: followUserId } = req.params
  const result = await userservice.unFollowUser({ user_id: userId, follow_user_id: followUserId })
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordBody>,
  res: Response
) => {
  const { password, new_password } = req.body
  const { userId } = req.decode_accesstoken as tokenPayload

  const result = await userservice.changePasswordServices({ password, userId, new_password })
  return res.json(result)
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const {access_token,refresh_token,newUser} = await userservice.oauthController(code as string)

  const url = `${process.env.REDIRECT}?ac_token=${access_token}&rf_token=${refresh_token}&newUser=${newUser}`
  res.redirect(url as string)
}
