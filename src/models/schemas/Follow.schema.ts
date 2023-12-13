import { ObjectId } from 'mongodb'

interface type_Follow{
  _id?:ObjectId
  user_id:ObjectId
  followed_user_id:ObjectId
  created_ad: Date
}

export default class Follow {
  _id:ObjectId
  user_id:ObjectId
  followed_user_id:ObjectId
  created_ad:Date
  constructor({_id,user_id,followed_user_id,created_ad}:type_Follow){
    this._id= new ObjectId(),
    this.user_id=user_id,
    this.followed_user_id=followed_user_id,
    this.created_ad= created_ad || new Date()
  }
}