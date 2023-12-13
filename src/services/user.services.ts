import database from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'

import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { tokenType } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { UserVerifyStatus } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import Follow from '~/models/schemas/Follow.schema'
import axios from 'axios'

config()
class userService {
  private signAccessToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: tokenType.AccessToken,
        verify
      },
      privatekey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: tokenType.AccessToken,
        verify
      },
      privatekey: process.env.JWT_SECRET_REFERSH_TOKEN as string,
      options: {
        expiresIn: process.env.REFESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifytToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: tokenType.EmailVerifyToken,
        verify
      },
      privatekey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }

  private signForgotPasswordToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: tokenType.ForgotPasswordToken,
        verify
      },
      privatekey: process.env.JWT_SECRET_EMAIL_FORGOTPASSWORD_TOKEN as string
    })
  }

  private signAccessTokenAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ userId: user_id, verify }),
      this.signRefreshToken({ userId: user_id, verify })
    ])
  }
  async createUser(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifytToken({
      userId: user_id.toString(),
      verify: UserVerifyStatus.Unverifited
    })

    await database.Users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token: email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        username: `${user_id.toString()}${payload.name}`
      })
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverifited
    })

    await database.RefreshToken.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async loginUser({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify
    })
    await database.RefreshToken.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logOut(token: string) {
    await database.RefreshToken.deleteOne({ token: token })
    return {
      result: 'logout thanh cong'
    }
  }

  async verifyEmailToken({ user_id }: { user_id: string }) {
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Verifited }),
      database.Users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verifited
          },
          // thay thế thăngf update ad ở trên
          $currentDate: {
            update_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    return {
      mesage: 'verify email token thanh con',
      access_token,
      refresh_token
    }
  }

  async reSendEmailVerifyToken(user_id: string) {
    const tokenEmailVerify = await this.signEmailVerifytToken({ userId: user_id, verify: UserVerifyStatus.Unverifited })
    database.Users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: tokenEmailVerify
        }
      }
    )
    return {
      message: 'reSendVerifyEmailToken thành công'
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const tokenForgotPassword = await this.signForgotPasswordToken({ userId: user_id, verify })
    database.Users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: tokenForgotPassword
        }
      }
    )

    return {
      message: 'forgotPasswordToken thành công'
    }
  }

  async resetPassword(userId: string, password: string) {
    await database.Users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          update_at: true
        }
      }
    )

    return {
      message: 'reset password thành công'
    }
  }

  async getMe(user_id: string) {
    const result = await database.Users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { email_verify_token: 0, password: 0, forgot_password_token: 0 } }
    )

    return result
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const result = await database.Users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          update_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return result
  }

  async getProfileUser(userName: string) {
    const result = await database.Users.findOne(
      { username: userName },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0
        }
      }
    )
    if (result === null) {
      return new ErrorWithStatus({
        message: 'khong tim thay user',
        status: 404
      })
    }
    return {
      message: 'thanh cong',
      result
    }
  }

  async createFollow(payload: { user_id: string; follow_user_id: string }) {
    const user = await database.Follow.findOne({
      followed_user_id: new ObjectId(payload.follow_user_id),
      user_id: new ObjectId(payload.user_id)
    })
    if (user === null) {
      const result = await database.Follow.insertOne(
        new Follow({
          followed_user_id: new ObjectId(payload.follow_user_id),
          created_ad: new Date(),
          user_id: new ObjectId(payload.user_id)
        })
      )
      return result
    }
    return {
      message: 'da follow tai khoan nay roi'
    }
  }

  async unFollowUser(payload: { user_id: string; follow_user_id: string }) {
    const user = await database.Follow.findOne({
      followed_user_id: new ObjectId(payload.follow_user_id),
      user_id: new ObjectId(payload.user_id)
    })

    if (user === null) {
      return {
        message: 'da bo follow thanh cong'
      }
    }
    await database.Follow.deleteOne({
      followed_user_id: new ObjectId(payload.follow_user_id),
      user_id: new ObjectId(payload.user_id)
    })

    return {
      message: 'da bo follow thanh cong'
    }
  }
  async changePasswordServices({
    password,
    userId,
    new_password
  }: {
    password: string
    userId: string
    new_password: string
  }) {
    await database.Users.findOneAndUpdate(
      {
        _id: new ObjectId(userId),
        password: hashPassword(password)
      },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          update_at: true
        }
      }
    )

    return {
      message: 'da change password thanh cong'
    }
  }

  private getToken = async (code: string) => {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_AUTHORIZED_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private getInfoUser = async (access_token: string, id_token: string) => {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token: access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data
  }

  async oauthController(code: string) {
    const { id_token, access_token } = await this.getToken(code)
    const data = await this.getInfoUser(access_token, id_token)
    const result = await database.Users.findOne({
      email: data.email
    })

    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2)
    if (result) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: result._id.toString(),
        verify: result.verify
      })
      await database.RefreshToken.insertOne(
        new RefreshToken({
          user_id: new ObjectId(result._id),
          token: refresh_token
        })
      )
      return {
        access_token,
        refresh_token,
        newUser:false
      }
    } else {
      const result= await this.createUser({
        name: data.name,
        email: data.email,
        date_of_birth: new Date().toISOString(),
        password: password
      })

      return{
        ...result,
        newUser:true
      }
    }
  }
  async checkEmailExit(email: string) {
    const result = await database.Users.findOne({ email })
    return Boolean(result)
  }

  async checkPassWordExit(password: string) {
    const result = await database.Users.findOne({ password: hashPassword(password) })
    return Boolean(result)
  }
}

const userservice = new userService()

export default userservice
