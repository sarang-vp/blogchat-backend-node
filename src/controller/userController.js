/** @format */

const { userModel, ChatModel } = require("../model/userModel");
const xlsx = require("xlsx");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { default: mongoose, isObjectIdOrHexString } = require("mongoose");
//const userSockets = require("../../app.js");

exports.createUser = async (req, res) => {
  try {
    //req.body.details = JSON.parse(req.body.details);
    // const { username, email } = req.body;
    const newUser = new userModel(req.body);
    // console.log(newUser);
    let data = await newUser.save();
    return (res = { data: data, status: 200 });
    //res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return (res = { data: {}, status: 500 });
    //res.status(500).json({ error: "Failed to create user" });
  }
};
module.exports.signUp = async (req, res) => {
  //console.log(connectedClients);
  try {
    console.log("object");
    const { userName, passWord, db } = req.body;
    console.log(req.userSockets);
    // Check if username already exists
    const existingUser = await userModel.findOne({ userName });
    if (existingUser) {
      return (res = { data: "Useraname already exists", status: 400 });
      //return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the passWord
    const hashedpassWord = await bcrypt.hash(passWord, 10);

    // Create new user
    const newUser = new userModel({ userName, passWord: hashedpassWord, db });
    let savedData = await newUser.save();

    //req.app.get("io").emit("newOrder", savedData);
    const userSocket = req.userSockets.get(req.body.userId);
    if (userSocket) {
      userSocket.emit("newUser", savedData);
    } else {
      console.log(`User socket not found for user with ID ${userId}`);
    }
    return (res = { data: savedData, status: 200 });
    //res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("Error signing up:", error);
    return (res = { data: "int server error", status: 500 });
  }
};
module.exports.login = async (req, res) => {
  try {
    const { userName, passWord } = req.body;
    // Define your payload (the data you want to include in the token)
    const existingUser = await userModel.findOne({ userName });
    if (existingUser == null) {
      return (res = { data: "Username not found", status: 404 });
      //return res.status(400).json({ message: 'Username already exists' });
    }

    const passwordMatch = await bcrypt.compare(passWord, existingUser.passWord);
    if (!passwordMatch) {
      return (res = { data: "Invalid username or password", status: 401 });
    }
    const payload = {
      userName: existingUser.userName,
      _id: existingUser._id,
      db: existingUser.db ? existingUser.db : null,
    };
    // Define your secret key (used to sign the token)
    const secretKey = "your_secret_key";

    // Define additional options (optional)
    const options = {
      expiresIn: "1h", // Token will expire in 1 hour
    };

    // Generate the JWT
    const token = jwt.sign(payload, secretKey, options);

    console.log("Generated JWT:", token);
    return (res = { data: { token: token }, status: 200 });
    //res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return (res = { data: {}, status: 500 });
    //res.status(500).json({ error: "Failed to create user" });
  }
};
module.exports.userList = async (req, res) => {
  try {
    // Check if username already exists
    let existingUser = null;
    if (isObjectIdOrHexString(req.body.userName)) {
      existingUser = await userModel.find({
        _id: { $ne: req.body.userName },
      });
    }
    existingUser = await userModel.find({});
    if (existingUser) {
      return (res = { data: existingUser, status: 200 });
      //return res.status(400).json({ message: 'Username already exists' });
    } else {
      return (res = { data: "not found", status: 200 });
    }
    //res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("Error:", error);
    return (res = { data: "int server error", status: 500 });
  }
};
// module.exports.userChatHistory = async (req, res) => {
//   try {
//     const chatHistExist = await ChatModel.find({
//       sender: req.body.sender,
//       receiver: req.body.receiver,
//     });
//     if (chatHistExist.length > 0) {
//       return (res = { data: chatHistExist, status: 200 });
//     } else {
//       return (res = { data: "not found", status: 404 });
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     return (res = { data: "int server error", status: 500 });
//   }
// };

module.exports.userChatHistory = async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    const senderObjectId = new mongoose.Types.ObjectId(sender);
    const receiverObjectId = new mongoose.Types.ObjectId(receiver);
    const chatHist = await ChatModel.aggregate([
      {
        $match: {
          $or: [
            { sender: senderObjectId, receiver: receiverObjectId },
            { sender: receiverObjectId, receiver: senderObjectId },
          ],
        },
      },
      {
        $addFields: {
          isSender: {
            $cond: [{ $eq: ["$sender", senderObjectId] }, true, false],
          },
        },
      },
      {
        $sort: { timestamp: 1 }, // Sort in ascending order by timestamp
      },
      {
        $limit: 10,
      },
      {
        $project: {
          message: 1,
          isSender: 1,
        },
      },
    ]);

    if (chatHist.length > 0) {
      return (res = { data: chatHist, status: 200 });
    } else {
      return (res = { data: [], status: 200 });
    }
  } catch (error) {
    console.error("Error:", error);
    return (res = { data: "int server error", status: 500 });
  }
};

// exports.createUserArray = async (req, res) => {
//   try {
//     req.body.map( (eachUser) => {
//       let newUser = new userModel({
//         userName: eachUser.userName,
//         email: eachUser.email,
//         mobileNo: eachUser.mobileNo,
//         passWord: eachUser.passWord,
//       });
//       // console.log(newUser);
//       setTimeout(async() => {
//         let data = await newUser.save();
//         console.log(data);

//       }, 1000);
//     });
//     console.log("fir");
//     res.status(201).json({});
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Failed to create user" });
//   }
// };
exports.createUserArray = async (req, res) => {
  try {
    //for (const eachUser of req.body) {
    await Promise.all(
      req.body.map(async (eachUser) => {
        let newUser = new userModel({
          userName: eachUser.userName,
          email: eachUser.email,
          mobileNo: eachUser.mobileNo,
          passWord: eachUser.passWord,
        });

        try {
          // Save the user document and wait for it to complete before moving to the next one
          let data = await newUser.save();
          if (data == null) {
            console.log(data);
          }
        } catch (error) {
          console.error(`Error saving user: ${error}`);
          // Handle the error (e.g., logging, response, etc.)
        }
      })
    );
    console.log("Finished creating users");
    res.status(201).json({});
  } catch (error) {
    console.error(`Error creating users: ${error}`);
    res.status(500).json({ error: "Failed to create users" });
  }
};
exports.createUserArray1 = async (req, res) => {
  try {
    // for (const eachUser of req.body) {
    //    //req.body.map(async (eachUser) => {
    //   let newUser = new userModel({
    //     userName: eachUser.userName,
    //     email: eachUser.email,
    //     mobileNo: eachUser.mobileNo,
    //     passWord: eachUser.passWord,
    //   });

    //   try {
    //     // Save the user document and wait for it to complete before moving to the next one
    //     let data = await newUser.save();
    //   } catch (error) {
    //     console.error(`Error saving user: ${error}`);
    //     // Handle the error (e.g., logging, response, etc.)
    //   }
    // };
    let dataArray = [];
    let userExist = await userModel.findOne({});
    console.log(userExist);
    if (userExist) dataArray.push(userExist);
    req.body.forEach((body) => {
      let newUser = new userModel({
        userName: body.userName,
        email: body.email,
        mobileNo: body.mobileNo,
        passWord: body.passWord,
      });
      dataArray.push(newUser);
    });
    console.log(dataArray);
    //const insertedUsers = await userModel.insertMany(req.body);
    for (let i = 0; i < dataArray.length; i++) {
      const element = dataArray[i];
      let savedData = await element.save();
      if (!savedData) {
        console.error(error);
      } else {
        console.log("Document saved successfully:", savedData);
      }
    }
    //console.log(`Created ${insertedUsers.length} users`);
    res.status(201).send({
      message: `Created users`,
      data: "insertedUsers",
    });
    //const savedUserDocuments = await Promise.all(promises);
    console.log("Finished creating users");
    //res.status(201).json({});
  } catch (error) {
    console.error(`Error creating users: ${error}`);
    res.status(500).json({ error: "Failed to create users" });
  }
};

exports.testArray = async (req, res) => {
  try {
    let data = [];
    let arrayData = [
      {
        name: "Sarang",
        phone: 123456789,
        pin: 673345,
        referedPerson: [{ name: "Athul", phone: 12345323329, pin: 673346 }],
      },
      {
        name: "Alice",
        phone: 987654321,
        pin: 111222,
        referedPerson: [{ name: "Bob", phone: 555555555, pin: 333444 }],
      },
      {
        name: "Eve",
        phone: 333333333,
        pin: 777888,
        referedPerson: [{ name: "Charlie", phone: 777777777, pin: 222333 }],
      },
      {
        name: "David",
        phone: 444444444,
        pin: 999000,
        referedPerson: [{ name: "Emily", phone: 888888888, pin: 444555 }],
      },
      {
        name: "Frank",
        phone: 555555555,
        pin: 123123,
        referedPerson: [{ name: "Grace", phone: 999999999, pin: 777888 }],
      },
      {
        name: "Hannah",
        phone: 666666666,
        pin: 456789,
        referedPerson: [{ name: "Isaac", phone: 111111111, pin: 111222 }],
      },
      {
        name: "Julia",
        phone: 777777777,
        pin: 987654,
        referedPerson: [{ name: "Kevin", phone: 222222222, pin: 222333 }],
      },
      {
        name: "Liam",
        phone: 888888888,
        pin: 345678,
        referedPerson: [{ name: "Mia", phone: 333333333, pin: 333444 }],
      },
      {
        name: "Olivia",
        phone: 999999999,
        pin: 567890,
        referedPerson: [{ name: "Noah", phone: 444444444, pin: 444555 }],
      },
      {
        name: "Sophia",
        phone: 1010101010,
        pin: 987123,
        referedPerson: [{ name: "William", phone: 555555555, pin: 555666 }],
      },
    ];
    arrayData.forEach((eachUser) => {
      data.push({
        name: eachUser.name,
        phone: eachUser.phone,
        pin: eachUser.pin,
      });
      eachUser.referedPerson.forEach((eachReferance) => {
        data.push({
          name: eachReferance.name,
          phone: eachReferance.phone,
          pin: eachReferance.pin,
        });
      });
    });

    res.status(201).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

exports.testing = async (req, res) => {
  try {
    let arrayData = [
      {
        name: "Sarang",
        phone: 123456789,
        pin: 673345,
        referedPerson: [{ name: "Athul", phone: 12345323329, pin: 673346 }],
      },
      {
        name: "Alice",
        phone: 987654321,
        pin: 111222,
        referedPerson: [{ name: "Bob", phone: 555555555, pin: 333444 }],
      },
      {
        name: "Eve",
        phone: 333333333,
        pin: 777888,
        referedPerson: [{ name: "Charlie", phone: 777777777, pin: 222333 }],
      },
      {
        name: "David",
        phone: 444444444,
        pin: 999000,
        referedPerson: [{ name: "Emily", phone: 888888888, pin: 444555 }],
      },
      {
        name: "Frank",
        phone: 555555555,
        pin: 123123,
        referedPerson: [{ name: "Grace", phone: 999999999, pin: 777888 }],
      },
      {
        name: "Hannah",
        phone: 666666666,
        pin: 456789,
        referedPerson: [{ name: "Isaac", phone: 111111111, pin: 111222 }],
      },
      {
        name: "Julia",
        phone: 777777777,
        pin: 987654,
        referedPerson: [{ name: "Kevin", phone: 222222222, pin: 222333 }],
      },
      {
        name: "Liam",
        phone: 888888888,
        pin: 345678,
        referedPerson: [{ name: "Mia", phone: 333333333, pin: 333444 }],
      },
      {
        name: "Olivia",
        phone: 999999999,
        pin: 567890,
        referedPerson: [{ name: "Noah", phone: 444444444, pin: 444555 }],
      },
      {
        name: "Sophia",
        phone: 1010101010,
        pin: 987123,
        referedPerson: [{ name: "William", phone: 555555555, pin: 555666 }],
      },
    ];
    let names = []; // Create an array to store names
    // await Promise.all(
    // arrayData.map(async(eachUser) => {
    //   let name = eachUser.name;

    //   console.log(name)
    //    // Log the name for each user
    //   names.push(name); // Push the name to the array
    // }));
    // names.push("continue");

    // console.log(names);
    // // Continue executing the next line of codes
    // console.log('Continuing with the next code');
    //       res.status(200).send(names)
    //   } catch (error) {

    //   }
    // }
    const promises = arrayData.map(async (eachUser) => {
      await userModel.find();
      let name = eachUser.name;
      console.log(name); // Log the name for each user
      names.push(name); // Push the name to the array
    });
    await Promise.all(promises);

    console.log(names);
    // Continue executing the next line of codes without waiting for the loop to complete
    console.log("Continuing with the next code");

    // Wait for all the promises to resolve
    //await Promise.all(promises);

    names.push("continue");

    res.status(200).send(names);
  } catch (error) {
    // Handle errors
    res.status(500).send("An error occurred.");
  }
};

exports.importExcel = async (req, res) => {
  try {
    const file = req.files.file;
    const workbook = xlsx.read(file.data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(data);
    data.forEach((row) => {
      const image = fs.readFileSync(row.image);
      const base64Image = Buffer.from(image).toString("base64");
      console.log(base64Image);
      // const model = new Model({ ...row, image: base64Image });
      // model.save();
    });
    return (res = { data: {}, status: 200 });
    //res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return (res = { data: {}, status: 500 });
    //res.status(500).json({ error: "Failed to create user" });
  }
};
