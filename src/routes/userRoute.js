/** @format */

const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const {
  validateLocation,
  validateUserRegistration,
} = require("../controller/validator");
const { validationResult } = require("express-validator");
// const injectUserSockets = require("../middleware/socketmiddle");

// Route for creating a new user
// router.post("/add", userController.createUser);
router.post("/signUp", async (req, res) => {
  let result = await userController.signUp(req);
  res.status(result.status).send(result.data);
});
router.post("/login", async (req, res) => {
  let result = await userController.login(req);
  res.status(result.status).send(result.data);
});
router.post("/userList", async (req, res) => {
  let result = await userController.userList(req);
  res.status(result.status).send(result.data);
});
router.post("/userChatHistory", async (req, res) => {
  let result = await userController.userChatHistory(req);
  res.status(result.status).send(result.data);
});
router.post("/addMany", userController.createUserArray);
router.post("/testArray", userController.testArray);
router.get("/testing", userController.testing);
// router.get('/viewUsers', async (req, res) => {
//     try {
//       const usersList = await users.find();
//       if(usersList){
//         res.status(200).json(usersList);
//       } else {
//         res.status(404).res.json({});
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Failed to retrieve customers.' });
//     }
//   });
// router.post("/add",validateUserRegistration, async(req,res)=>{
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
// let result = await userController.createUser(req)
// res.send(result.data).status(result.status)
// })

router.post("/add", async (req, res) => {
  const errors = validationResult(req);

  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }
  let result = await userController.createUser(req);
  res.send(result.data).status(result.status);
});
// added for excel import test
router.post("/importExcel", async (req, res) => {
  let result = await userController.importExcel(req);
  res.status(result.data).send(result.status);
});

router.post("/addMany1", userController.createUserArray1);

module.exports = router;
