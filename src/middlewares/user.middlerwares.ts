import { Request, Response, NextFunction } from 'express'
import database from '~/services/database.services'
import { checkSchema, ParamSchema } from 'express-validator'
import userservice from '~/services/user.services'
import { ErrorWithStatus } from '~/models/Errors'
import { usersMessages } from '~/constants/messages'
import { verifyToken } from '~/utils/jwt'
import httpStatus from '~/constants/httpStatus'
import { JsonWebTokenError } from 'jsonwebtoken'
import { config } from 'dotenv'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import { tokenPayload } from '~/models/requests/User.requests'
import {hashPassword} from '~/utils/crypto'

config()

const passwordValidate: ParamSchema = {
  isString: {
    errorMessage: usersMessages.password_must_be_a_string
  },
  notEmpty: {
    errorMessage: usersMessages.confirm_password_is_required
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: usersMessages.password_length_must_be_from_6_to_50
  }
  // isStrongPassword: {
  //   options: {
  //     minLength: 6,
  //     minLowercase: 1,
  //     minUppercase: 1,
  //     minNumbers: 1,
  //     minSymbols: 1
  //   },
  //   errorMessage: usersMessages.password_must_be_strong
  // }
}

const confirm_password_validate: ParamSchema = {
  isString: {
    errorMessage: usersMessages.confirm_password_must_be_a_string
  },
  notEmpty: {
    errorMessage: usersMessages.confirm_password_is_required
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: usersMessages.confirm_password_length_must_be_from_6_to_50
  },
  // isStrongPassword: {
  //   options: {
  //     minLength: 6,
  //     minLowercase: 1,
  //     minUppercase: 1,
  //     minNumbers: 1,
  //     minSymbols: 1
  //   },
  //   errorMessage: usersMessages.confirm_password_must_be_strong
  // },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('khong giong password')
      }
      return true
    }
  }
}

const validateIdSchema: ParamSchema={
  custom:{
    options:async (value) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          status: 401,
          message: ' follow_user_id khong phai la ObjectId'
        })
      }
      const result = await database.Users.findOne({ _id: new ObjectId(value) })
      if (result === null) {
        throw new ErrorWithStatus({
          status: 401,
          message: 'khong co user nao co id nay'
        })
      }
    }
  }
}

const access_token_validate: ParamSchema = {
  notEmpty: {
    errorMessage: usersMessages.access_token_is_required
  },
  custom: {
    options: async (value, { req }) => {
      const access_token = value.split(' ')[1]
      if (!access_token) {
        throw new ErrorWithStatus({
          message: usersMessages.access_token_is_required,
          status: httpStatus.unauthorized
        })
      }
      try {
        const decode_accesstoken = await verifyToken({
          token: access_token,
          privatekey: process.env.JWT_SECRET_ACCESS_TOKEN as string
        })
        req.decode_accesstoken = decode_accesstoken
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({ message: 'loi veryfi', status: 401 })
        }
        throw error
      }
    }
  }
}

const forgot_password_token_validate: ParamSchema = {
  notEmpty: {
    errorMessage: 'forgot_password_token khong duoc de trong'
  },
  isString: {
    errorMessage: 'forgot_password_token la mot chuoi'
  },
  trim: true,
  custom: {
    options: async (value, { req }) => {
      try {
        const forgot_password_token = await verifyToken({
          token: value,
          privatekey: process.env.JWT_SECRET_EMAIL_FORGOTPASSWORD_TOKEN as string
        })
        const user = await database.Users.findOne({ _id: new ObjectId(forgot_password_token.userId) })

        if (user === null) {
          throw new ErrorWithStatus({
            message: 'khong ton tai user',
            status: httpStatus.unauthorized
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: 'forgot_password_token khong ton tai',
            status: httpStatus.unauthorized
          })
        }
        req.forgot_password_token = forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: 'decode_verifyForgotPasswordToken khong ton tai',
            status: httpStatus.unauthorized
          })
        }
        throw error
      }
    }
  }
}

const nameValidte: ParamSchema = {
  isString: {
    errorMessage: usersMessages.name_must_be_a_string
  },
  isLength: {
    options: {
      min: 1,
      max: 255
    },
    errorMessage: usersMessages.name_length_must_be_from_1_to_100
  },

  notEmpty: {
    errorMessage: usersMessages.name_is_required
  },
  trim: true
}

const date_of_birth_validate = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: usersMessages.date_of_birth
  }
}

export const validateMiddleswares = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      message: 'that bai'
    })
  }
  next()
}

export const registerValidate = checkSchema({
  name: nameValidte,
  email: {
    notEmpty: {
      errorMessage: usersMessages.email_is_required
    },
    isEmail: {
      errorMessage: usersMessages.email_is_invalid
    },
    trim: true,
    custom: {
      options: async (value) => {
        const result = await userservice.checkEmailExit(value)
        if (result) {
          throw new ErrorWithStatus({ message: 'loi roi', status: 401 })
        }
        return true
      }
    }
  },
  password: passwordValidate,
  confirm_password: confirm_password_validate,
  date_of_birth: date_of_birth_validate
})

export const loginVlidater = checkSchema({
  email: {
    notEmpty: {
      errorMessage: usersMessages.email_is_required
    },
    isEmail: {
      errorMessage: usersMessages.email_is_invalid
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const result = await database.Users.findOne({ email: value,password: hashPassword(req.body.password) })
        if (result === null) {
          throw new ErrorWithStatus({ message: usersMessages.user_not_found, status: 401 })
        }
        req.user = result
        return true
      }
    }
  },
  password: {
    isString: {
      errorMessage: usersMessages.password_must_be_a_string
    },
    notEmpty: {
      errorMessage: usersMessages.confirm_password_is_required
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: usersMessages.password_length_must_be_from_6_to_50
    },
    // isStrongPassword: {
    //   options: {
    //     minLength: 6,
    //     minLowercase: 1,
    //     minUppercase: 1,
    //     minNumbers: 1,
    //     minSymbols: 1
    //   },
    //   errorMessage: usersMessages.password_must_be_strong
    // },

    custom: {
      options: async (value) => {
        const result = await userservice.checkPassWordExit(value)
        if (!result) {
          throw new ErrorWithStatus({ message: 'password khong ton tai', status: 401 })
        }
        return true
      }
    }
  }
})

export const accessTokenValidate = checkSchema({
  Authorization: access_token_validate
})

export const refreshTokenValidate = checkSchema({
  refresh_token: {
    notEmpty: {
      errorMessage: usersMessages.access_token_is_required
    },
    isString: {
      errorMessage: usersMessages.refresh_token_is_string
    },
    custom: {
      options: async (value, { req }) => {
        try {
          const [decode_refresh_token, refresh_token] = await Promise.all([
            verifyToken({ token: value, privatekey: process.env.JWT_SECRET_REFERSH_TOKEN as string }),
            database.RefreshToken.findOne({ token: value })
          ])
          if (refresh_token === null) {
            throw new ErrorWithStatus({ message: 'token la null', status: httpStatus.unauthorized })
          }
          req.decode_refresh_token = decode_refresh_token
        } catch (error) {
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({
              message: 'decode_refresh_token khong ton tai',
              status: httpStatus.unauthorized
            })
          }
          throw error
        }
        // return true
      }
    }
  }
})

export const email_verify_token_validate = checkSchema({
  email_verify_token: {
    custom: {
      options: async (value, { req }) => {
        if (!value) {
          throw new ErrorWithStatus({
            status: httpStatus.unauthorized,
            message: 'email_verify_token  khong duoc trong'
          })
        }
        try {
          const decode_email_verify_token = await verifyToken({
            token: value,
            privatekey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
          })

          req.decode_email_verify_token = decode_email_verify_token
        } catch (error) {
          throw new ErrorWithStatus({
            message: capitalize((error as JsonWebTokenError).message),
            status: httpStatus.unauthorized
          })
        }

        return true
      }
    }
  }
})

export const forgetPassword = checkSchema({
  email: {
    notEmpty: {
      errorMessage: usersMessages.email_is_required
    },
    isEmail: {
      errorMessage: usersMessages.email_is_invalid
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const result = await database.Users.findOne({ email: value })
        if (result === null) {
          throw new ErrorWithStatus({ message: usersMessages.user_not_found, status: 401 })
        }
        req.user = result
        return true
      }
    }
  }
})

export const verifyForgotPasswordToken = checkSchema({
  forgot_password_token: forgot_password_token_validate
})

export const validateResetPassword = checkSchema({
  password: passwordValidate,
  confirm_password: confirm_password_validate,
  forgot_password_token: forgot_password_token_validate
})

export const verifyUpdateUser = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_accesstoken as tokenPayload
  if (verify !== UserVerifyStatus.Verifited) {
    next(new ErrorWithStatus({ message: 'loi roi aaa', status: 401 }))
  }
  next()
}

export const validateBodyUpdateUser = checkSchema({
  name: {
    ...nameValidte,
    optional: true,
    notEmpty: undefined
  },
  date_of_birth: {
    ...date_of_birth_validate,
    optional: true
  },

  bio: {
    isString: {
      errorMessage: 'bio la 1 string'
    },
    optional: true,
    trim: true
  },
  location: {
    isString: {
      errorMessage: 'location la 1 string'
    },
    optional: true,
    trim: true
  },
  website: {
    isString: {
      errorMessage: 'website la 1 string'
    },
    optional: true,
    trim: true
  },
  username: {
    isString: {
      errorMessage: 'username la 1 string'
    },
    optional: true,
    trim: true,
    custom:{
      options: async(value)=>{
        const result= await database.Users.findOne({username:value})
        if(result){
            throw new ErrorWithStatus({
              status:401,
              message:'da co user co ten nay roi'
            })
        }
      }
    }
  },
  avatar: {
    isString: {
      errorMessage: 'avatar la 1 string'
    },
    optional: true,
    trim: true
  }
})

export const followReqUserValidate = checkSchema({
  follow_user_id: validateIdSchema
})

export const unFollowReqUserValidate= checkSchema({
  user_id:validateIdSchema
})


export const validatbBodyUpdateChangePassWord= checkSchema({
  password:{
    ...passwordValidate,
    custom:{
      options:async (value)=>{
        const result= await database.Users.findOne({password:hashPassword(value)})
        if(!result){
          throw new ErrorWithStatus({
            status:401,
            message:'sai password roi'
          })
        }
      }
    }
  },
  new_password:{
    isString: {
      errorMessage: usersMessages.password_must_be_a_string
    },
    notEmpty: {
      errorMessage: usersMessages.confirm_password_is_required
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: usersMessages.password_length_must_be_from_6_to_50
    },

  },
  new_confirm_password:{
    isString: {
      errorMessage: usersMessages.confirm_password_must_be_a_string
    },
    notEmpty: {
      errorMessage: usersMessages.confirm_password_is_required
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: usersMessages.confirm_password_length_must_be_from_6_to_50
    },
    // isStrongPassword: {
    //   options: {
    //     minLength: 6,
    //     minLowercase: 1,
    //     minUppercase: 1,
    //     minNumbers: 1,
    //     minSymbols: 1
    //   },
    //   errorMessage: usersMessages.confirm_password_must_be_strong
    // },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error('khong giong new_password')
        }
        return true
      }
    }
  }
})
