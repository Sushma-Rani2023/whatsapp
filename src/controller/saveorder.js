const Item = require("../model/Product");
const Message = require("../model/Msg");
const connectDB = require("../config/db");
const Levenshtein = require("js-levenshtein");
const XLSX = require("xlsx");
const aws = require("aws-sdk");
const axios = require("axios");

function fuzzyMatch(searchTerm) {
  const escapedTerm = escapeRegExp(searchTerm);
  const regexPattern = `.*${escapedTerm.split(" ").join(".*")}.*`;
 
  return regexPattern;
}

function escapeRegExp(string) {
  const pattern = string.replace(/[.*+?^${}()|[\]\\]/g, "");
 
  return pattern;
}

const uploadToS3 = async (bucket, key, buffer) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.accesskey,
    secretAccessKey: process.env.secretkey,
    region: "ap-south-1",
  });
  const uploadparams = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
  };
  return s3.upload(uploadparams).promise();
};

module.exports.saveorder = async (body) => {
  try {
    
    await connectDB();

    const msg = body.entry[0].changes[0].value.messages[0].text.body;
    const msg_arrayed = msg.split("\n");
    const costumer_reference = msg_arrayed[0];
    const msg_array = msg_arrayed.slice(1);

    const order_list = [];

    if (msg_array.length === 0) {
      return {
        body: { message: "No order found " },
      };
    }

    for (const text of msg_array) {
      let dotIndex = text.indexOf(".");
      let spaceIndex = text.indexOf(" ");

      if (dotIndex === -1 && spaceIndex !== -1) {
        dotIndex = spaceIndex;
      }

      const number = text.substring(0, dotIndex);
      let rest = text
        .substring(dotIndex + 2)
        .replace(/[^a-zA-Z0-9,\/() ]/g, "");
     
      let option1 = "";
      let option2 = "";

      const commaIndex = rest.indexOf(",");
      const slashIndex = rest.indexOf("/");
      if (commaIndex !== -1 && slashIndex !== -1) {
        option1 = rest.substring(commaIndex + 1, slashIndex).trim();
        option2 = rest.substring(slashIndex + 1).trim();
        rest = rest.substring(0, commaIndex).trim();
      } else if (commaIndex !== -1) {
        option1 = rest.substring(commaIndex + 1).trim();
        rest = rest.substring(0, commaIndex).trim();
      } else if (slashIndex !== -1) {
        option2 = rest.substring(slashIndex + 1).trim();
        rest = rest.substring(0, slashIndex).trim();
      }


      const regexPattern = fuzzyMatch(rest);

      const regexQuery = {
        Item_name: { $regex: new RegExp(regexPattern, "i") },
      };
      const option1Query = {
        Item_name: { $regex: new RegExp(fuzzyMatch(option1), "i") },
      };
      const option2Query = {
        Item_name: { $regex: new RegExp(fuzzyMatch(option2), "i") },
      };

      
      const fuzzySearchQuery = {
        Status: "Active",
        Item_name: { $regex: new RegExp(regexPattern, "i") },
      };

      const searchResults = await Item.find(fuzzySearchQuery);
      console.log("Products:", searchResults);

      if (searchResults.length > 0) {
        searchResults.sort((a, b) => {
          const searchTerm = rest.toLowerCase();
          const scoreA = Levenshtein(searchTerm, a.Item_name.toLowerCase());
          const scoreB = Levenshtein(searchTerm, b.Item_name.toLowerCase());
          return scoreA - scoreB;
        });

        const bestMatch = searchResults[0];
        console.log("Best Match:", bestMatch);
        order_list.push({
          Item_id: bestMatch.Item_id,
          Item_name: bestMatch.Item_name,
          Quantity: number,
        });
      } else {
        return {
          statusCode: 400,
          body: { message: `No match found of product, ${rest}` },
        };
      }
    }

    const newMessage = new Message({
      order: order_list,
      Meta_object: body,
    });

    // Save to MongoDB
    await newMessage.save();

    const workbook = XLSX.utils.book_new();
    const date = new Date();
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const formattedDate = `${day} ${month} ${year}`;

    const worksheetData = order_list.map((order, index) => ({
      "Sr. No.": index + 1,
      Product_Name: order.Item_name,
      Quantity: order.Quantity,
      Product_ID: order.Item_id,
      Costumer_Reference: costumer_reference,
      Date: formattedDate,
    }));

   

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const xlsxBuffer = XLSX.write(workbook, { type: "buffer" });

    const bucket = process.env.bucket;
    const key = `Order_PF_${Date.now()}.xlsx`;

    // Upload to S3 using the utility function
    await uploadToS3(bucket, key, xlsxBuffer);

   

    return {
      statusCode: 200,
      body: { message: "Order is saved Successfully" },
    };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: { message: "Internal Server Error" },
    };
  }
};
