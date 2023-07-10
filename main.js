require("dotenv").config();

const connectDB = require("./src/config/db")
const aws = require("aws-sdk")

const Msg= require("./src/model/Msg");

const awsConfig = {
  accessKeyId : process.env.AccessKey,
  secretAccessKey : process.env.SecretKey,
  region: process.env.AWS_REGION
}

const SES = new aws.SES (awsConfig)
connectDB();


