import { Router } from 'express'
import {
  validateMiddleswares,
  registerValidate,
  loginVlidater,
  accessTokenValidate,
  refreshTokenValidate,
  email_verify_token_validate,
  forgetPassword,
  verifyForgotPasswordToken,
  validateResetPassword,
  verifyUpdateUser,
  validateBodyUpdateUser,
  followReqUserValidate,
  unFollowReqUserValidate,
  validatbBodyUpdateChangePassWord
} from '~/middlewares/user.middlerwares'
import { filterMiddllewares } from '~/middlewares/common.middlewares'
import {
  validateController,
  registerUser,
  LoginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerifyToken,
  forgetPasswordController,
  verifyForgotPasswordTokenController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getUserController,
  followController,
  unFollowController,
  changePasswordController,
  oauthController
} from '~/controllers/user.controller'
import { validate } from '~/utils/validate'
import { wrapAsync } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.get('/tweets', validateMiddleswares, validateController)
usersRouter.post('/register', validate(registerValidate), wrapAsync(registerUser))
usersRouter.post('/login', validate(loginVlidater), wrapAsync(LoginUser))
usersRouter.post('/logout', validate(accessTokenValidate), validate(refreshTokenValidate), wrapAsync(logoutUser))
usersRouter.post('/email-verify', validate(email_verify_token_validate), wrapAsync(verifyEmail))
usersRouter.post('/resendEmailverifyToken', validate(accessTokenValidate), wrapAsync(resendEmailVerifyToken))
usersRouter.post('/forgotPassword', validate(forgetPassword), wrapAsync(forgetPasswordController))
usersRouter.post(
  '/verifyForgotPasswordToken',
  validate(verifyForgotPasswordToken),
  wrapAsync(verifyForgotPasswordTokenController)
)
usersRouter.post('/resetPassword', validate(validateResetPassword), wrapAsync(resetPasswordController))
usersRouter.get('/getMe', validate(accessTokenValidate), wrapAsync(getMeController))
usersRouter.patch(
  '/updateMe',
  validate(accessTokenValidate),
  verifyUpdateUser,
  filterMiddllewares(['name', 'date_of_birth', 'bio', 'website', 'location', 'username', 'avatar', 'cover_photo']),
  validate(validateBodyUpdateUser),
  wrapAsync(updateMeController)
)
usersRouter.get('/:username', wrapAsync(getUserController))
usersRouter.post(
  '/follow',
  validate(accessTokenValidate),
  verifyUpdateUser,
  validate(followReqUserValidate),
  wrapAsync(followController)
)

usersRouter.delete(
  '/follow/:user_id',
  validate(accessTokenValidate),
  verifyUpdateUser,
  validate(unFollowReqUserValidate),
  wrapAsync(unFollowController)
)

usersRouter.post(
  '/changePassWord',
  validate(accessTokenValidate),
  verifyUpdateUser,
  validate(validatbBodyUpdateChangePassWord),
  wrapAsync(changePasswordController)
)

usersRouter.get('/api/oauth/google',wrapAsync(oauthController))
export default usersRouter


