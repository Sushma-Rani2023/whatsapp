// import XLSX from "xlsx"
const XLSX = require("xlsx");
const Item = require("../model/Product");
const connectDB = require("../config/db");

exports.savedata = async (event) => {
  try {
    await connectDB();
    const workbook = XLSX.readFile(`${__dirname}/../../public/data.xlsx`);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('data is',data[0])

    const result = await Item.insertMany(data);
    console.log('Items saved:');

    return {
      statusCode: 200,
      body: JSON.stringify("Data read and saved successfully"),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An error occurred while reading the Excel file.",
      }),
    };
  }
};
