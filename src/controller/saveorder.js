const Item = require("../model/Product");
const Message = require("../model/Msg");
const connectDB = require("../config/db");
const Levenshtein = require("js-levenshtein");
const XLSX = require("xlsx")
const aws = require("aws-sdk")
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

module.exports.saveorder = async (body) => {
  try {
    console.log("Let's Start");
    console.log("Hi", body);
    await connectDB();
    const s3=new aws.S3({
        accessKeyId: process.env.accesskey,
  secretAccessKey: process.env.secretkey,
  region: "ap-south-1",
    })
   

      const msg = body.entry[0].changes[0].value.messages[0].text.body;
      const msg_arrayed = msg.split("\n");
      const costumer_reference = msg_arrayed[0];
      const msg_array = msg_arrayed.slice(1);
     
      console.log("Message Array:", msg_array);
      const searchResults = [];
      const order_list = [];

      for (const text of msg_array) {
        const spaceIndex = text.indexOf(" ");
        const number = text.substring(0, spaceIndex);
        const rest = text.substring(spaceIndex + 1);

        console.log("Number:", number);
        console.log("Rest:", rest);

        const regexPattern = fuzzyMatch(rest);

        const fuzzySearchQuery = {
          Status: "Active",
          Item_name: { $regex: new RegExp(regexPattern, "i") },
        };

        const result = await Item.find(fuzzySearchQuery);
        console.log("Search Result:", result);
        searchResults.push(...result);

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
        Meta_object:body,
      });
      const workbook = XLSX.utils.book_new();

const worksheetData = order_list.map((order,index) => ({
    'Sr. No.':index+1,
  'Product_Name': order.Item_name,
  'Quantity': order.Quantity,
  'Product_ID': order.Item_id,
  'Costumer_Reference':costumer_reference,
  'Date':Date.now()
}));

// Date(Number(body.entry[0].changes[0].value.messages[0].timestamp))
console.log("worksheet data is",worksheetData)

const worksheet = XLSX.utils.json_to_sheet(worksheetData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
const xlsxBuffer = XLSX.write(workbook, { type: 'buffer' });



const uploadparams = {
    Bucket: process.env.bucket,
    Key: `Order_PF_${Date.now()}.xlsx`,
    Body: xlsxBuffer
  };
  
await new Promise((resolve, reject) => {
    s3.upload(uploadparams, (err, data) => {
      if (err) {
        console.error('Error uploading file:', err);
        reject(err);
      } else {
        console.log('File uploaded successfully:', data.Location);
        resolve();
      }
    });
  });
      await newMessage.save();






      console.log("Order List saved:", newMessage);
      
      return{
        statusCode:200,
        body:"Order is saved Successfully"
      }

    }
   catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
