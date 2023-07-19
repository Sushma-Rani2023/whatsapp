const Item = require("../model/Product");
const Message = require("../model/Msg");
const connectDB = require("../config/db");
const Levenshtein = require("js-levenshtein");
const XLSX = require("xlsx");
const aws = require("aws-sdk");

function fuzzyMatch(searchTerm) {
  const escapedTerm = escapeRegExp(searchTerm);
  const regexPattern = escapedTerm.split("").join(".*");
  console.log("regex pattern", regexPattern);
  return regexPattern;
}

function escapeRegExp(string) {
  const pattern = string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  console.log("pattern is", pattern);
  return pattern;
}

// Function to upload file to S3
const uploadToS3 = async (bucket, key, buffer) => {
  const s3=new aws.S3({
    accessKeyId: process.env.accesskey,
secretAccessKey: process.env.secretkey,
region: "ap-south-1",
})
  const uploadparams = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
  };
  return s3.upload(uploadparams).promise();
};

module.exports.saveorder = async (body) => {
  try {
    console.log("Let's Start");
    console.log("Hi", body);
    await connectDB();

    const msg = body.entry[0].changes[0].value.messages[0].text.body;
    const msg_arrayed = msg.split("\n");
    const costumer_reference = msg_arrayed[0];
    const msg_array = msg_arrayed.slice(1);

    console.log("Message Array:", msg_array);
    const order_list = [];

    for (const text of msg_array) {
      let dotIndex = text.indexOf(".");
      let spaceIndex = text.indexOf(" ");

      if (dotIndex === -1 && spaceIndex !== -1) {
        dotIndex = spaceIndex;
      }

      const number = text.substring(0, dotIndex);
      const rest = text.substring(dotIndex + 2).replace(/[^a-zA-Z0-9 ]/g, "");

      console.log("Number:", number);
      console.log("Rest:", rest);

      const regexPattern = fuzzyMatch(rest);

      const fuzzySearchQuery = {
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
        throw new Error("No matching products found");
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
      'Sr. No.': index + 1,
      'Product_Name': order.Item_name,
      'Quantity': order.Quantity,
      'Product_ID': order.Item_id,
      'Costumer_Reference': costumer_reference,
      'Date': formattedDate,
    }));

    console.log("worksheet data is", worksheetData);

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer' });

    const bucket = process.env.bucket;
    const key = `Order_PF_${Date.now()}.xlsx`;

    // Upload to S3 using the utility function
    await uploadToS3(bucket, key, xlsxBuffer);

    console.log("Order List saved:", newMessage);

    return {
      statusCode: 200,
      body: "Order is saved Successfully",
    };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
