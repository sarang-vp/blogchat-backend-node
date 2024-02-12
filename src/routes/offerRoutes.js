const express = require("express");
const router = express.Router();
const offerController = require("../controller/offerController");
const { validateLocation, validateUserRegistration } = require('../controller/validator');
const { validationResult } = require('express-validator');

router.post("/viewCoupon", async(req,res)=>{
    console.log("object");
    const errors = validationResult(req);

    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }
let result = await offerController.viewCoupon(req)
res.send(result.data).status(result.status)
})
module.exports = router;
