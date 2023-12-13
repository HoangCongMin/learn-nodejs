export enum tokenType{
  AccessToken,RefreshToken,ForgotPasswordToken,EmailVerifyToken
}

export enum UserVerifyStatus{
  Unverifited,
   // chưa xác thực email mặc định là 0
   Verifited,
   // đã xác thực email
   Banned,
   // bị khoá
 }