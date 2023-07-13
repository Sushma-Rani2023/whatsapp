const Item = require("../model/Product");
const Message = require("../model/Msg");
const connectDB = require("../config/db");
const Levenshtein = require('js-levenshtein');

let isRunning = false;

function fuzzyMatch(searchTerm) {
  const escapedTerm = escapeRegExp(searchTerm);
  const regexPattern = escapedTerm.split('').join('.*');
  console.log('regex pattern', regexPattern);
  return regexPattern;
}

function escapeRegExp(string) {
  const pattern = string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  console.log('pattern is', pattern);
  return pattern;
}

exports.receivedmsg = async (event) => {
  try {
    await connectDB();
    console.log("Lets Start")
    console.log('Hi', event.body);
    const body_param = JSON.parse(event.body);
    console.log('Received Message:', JSON.stringify(body_param));

    if (
      body_param.object &&
      body_param.entry &&
      body_param.entry[0].changes &&
      body_param.entry[0].changes[0].value.messages &&
      body_param.entry[0].changes[0].value.messages[0]
    ) {
      const msg = body_param.entry[0].changes[0].value.messages[0].text.body;
      const msg_array = msg.split("\n");
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
          Item_name: { $regex: new RegExp(regexPattern, "i") }
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
            Quantity: number
          });
        } else {
          console.log("No matching products found");
        }
      }

      const newMessage = new Message({
        order: order_list
      });

      await newMessage.save();
      console.log("Order List saved:", newMessage);

    } else {
      return {
        statusCode: 404,
        body: "Message Not Found",
      };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
