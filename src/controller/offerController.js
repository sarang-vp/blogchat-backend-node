/** @format */

const couponModel = require("../model/offerModel");
//const ObjectId = require('mongodb').ObjectId;
exports.viewCoupon = async (req, res) => {
  try {
    //const objectId = new ObjectId(req.body.id);
    console.log(req.body.id);
    const coupomExist = await couponModel.aggregate([
      {
        $unwind: "$couponCode", // Unwind the couponCode array
      },
      {
        $match: {
          "couponCode.id": req.body.id,
        },
      },
      {
        $project: {
          couponCode: 1,
          redeemed: 1,
          _id: 1,
        },
      },
      {
        $group: {
          _id: "$_id", // Group by document _id
          couponCode: { $first: "$couponCode" }, // Select the first matching couponCode object in each group
        },
      },
    ]);
    console.log(coupomExist);
    return (res = { data: coupomExist, status: 200 });
    //res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return (res = { data: {}, status: 500 });
    //res.status(500).json({ error: "Failed to create user" });
  }
};

module.exports.updateRequestForQuotationById = async (req) => {
  const { purchaseModel } = conn.purchase(req.decode.db);
  const {
    _id,
    supplierId,
    quotationDate,
    branchId,
    payTerms,
    expiryDate,
    customerNote,
    termsAndConditions,
    currency,
    deliveryTerms,
  } = req.body;
  try {
    let productInfo = JSON.parse(req.body.productInfo);
    if (!Array.isArray(productInfo) && productInfo.length < 0) {
      return (res = {
        data: "product info array empty ",
        status: STATUSCODES.BADREQUEST,
      });
    }
    const rfqExist = await purchaseModel.findOne({ id: id });
    if (!rfqExist) {
      return (res = {
        data: "not exist by this id ",
        status: STATUSCODES.ERROR,
      });
    } else {
      let IMAGEURL = [];
      if (req.files?.file.length > 0) {
        for (let i = 0; i < req.files.file.length; i++) {
          let imgUuid = await generateUuid();
          let prod = req.files.file[i];
          let fp = await createDirectory(
            `./public/${req.decode.db}/purchaseOrder`
          );

          prod.mv(
            `./public/${req.decode.db}/purchaseOrder/${rfqExist.purchaseID}-${imgUuid}-` +
              prod.name.replace(/ +/g, "")
          );
          IMAGEURL.push({
            url:
              `Images/${req.decode.db}/purchaseOrder/${rfqExist.purchaseID}-${imgUuid}-` +
              prod.name.replace(/ +/g, ""),
          });
        }
      } else {
        if (req.files?.file) {
          let imgUuid = await generateUuid();
          req.files?.file.mv(
            `./public/${req.decode.db}/purchaseOrder/${rfqExist.purchaseID}-${imgUuid}-` +
              req.files.file.name.replace(/ +/g, "")
          );
          IMAGEURL.push({
            url:
              `Images/${req.decode.db}/purchaseOrder/${rfqExist.purchaseID}-${imgUuid}-` +
              req.files.file.name.replace(/ +/g, ""),
          });
        } else {
          IMAGEURL = null;
        }
      }
      if (req.body.uploadUrl) {
        req.body.uploadUrl = JSON.parse(req.body.uploadUrl);
      }
      console.log(req.body.uploadUrl);
      if (Array.isArray(req.body.uploadUrl) && req.body.uploadUrl.length > 0) {
        // req.body.uploadUrl.map((element) => {
        console.log(req.body.uploadUrl.length);
        for (let i = 0; i < req.body.uploadUrl.length; i++) {
          const element = req.body.uploadUrl[i];

          console.log(element);
          if (element.url) {
            const parts = element.url.split(process.env.FILEURL);
            console.log("par", parts);
            element.url = parts[1];
            console.log("ele url", element);
            IMAGEURL.push(element);
          }
        }
      }
      rfqExist.imageUrl.forEach(async (element) => {
        const imageUrl = element.url;
        console.log("imageUrl:", imageUrl);
        const lastPart = imageUrl.split("/").pop();
        console.log("lastPart", lastPart);
        //console.log("fileUrl", fileUrl);
        // Check if the image URL is in the fileUrl array
        if (!IMAGEURL.some((url) => url.url === imageUrl)) {
          console.log(IMAGEURL);
          console.log("URL not found in fileUrl. Deleting image...");
          console.log(`public/${imageUrl.split("Images/")[1]}`);
          fs.unlink(`public/${imageUrl.split("Images/")[1]}`, (err) => {
            if (err) console.log(err);
          });
          // fs.unlink(
          //   `public/${req.decode.db}/inventory/operation/branchTransfer/${lastPart}`,
          //   (err) => {
          //     if (err) console.log(err);
          //   }
          // );
        } else {
          // If the URL is found in fileUrl, push it to newImageURLs
          console.log("URL found in fileUrl. Pushing the element...");
          IMAGEURL.push({ ...element.toObject() });
        }
      });
      console.log(IMAGEURL);
      // =======================================================
      rfqExist.supplierId = supplierId;
      rfqExist.branchId = branchId;
      rfqExist.quotationDate = new Date(quotationDate).getTime();
      rfqExist.productInfo = productInfo;
      rfqExist.payTerms = payTerms;
      rfqExist.expiryDate = new Date(expiryDate).getTime();
      rfqExist.customerNote = customerNote;
      rfqExist.termsAndConditions = termsAndConditions;
      rfqExist.currency = currency;
      rfqExist.deliveryTerms = deliveryTerms;
      rfqExist.log.push({
        empId: req.decode._id,
        status: NEWLOG.EDIT,
        date: Date.now(),
        amount: null,
      });
      rfqExist.imageUrl = IMAGEURL;
      const updatedData = await rfqExist.save();
      if (!updatedData) {
        return {
          data: ERRORMSG.SAVEFAILED,
          status: STATUSCODES.ERROR,
        };
      } else {
        return {
          data: updatedData,
          status: STATUSCODES.SUCCESS,
        };
      }
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

module.exports.postInternalTransfer = async (req) => {
  try {
    const { internalTransferModel, warehouselocModel, warehouseModel } =
      conn.inventory(req.decode.db);
    const { stockModel, stockMoveModel } = conn.stock(req.decode.db);

    const internalTransferExist = await internalTransferModel.findOne({
      _id: req.body._id,
    });

    if (!internalTransferExist) {
      return { data: {}, status: STATUSCODES.NOTFOUND };
    }

    const destinationWareHouseLoc = await warehouselocModel.findOne({
      _id: internalTransferExist.destination,
    });

    const destinationWareHouse = await warehouseModel.findOne({
      _id: destinationWareHouseLoc.warehouseId,
    });

    if (destinationWareHouseLoc == null || destinationWareHouse == null) {
      return {
        data: "warehouse or location not found",
        status: STATUSCODES.NOTFOUND,
      };
    }

    const products = internalTransferExist.productInfo;
    let dbStockDatas = [];
    let dbStockMoveData = [];
    for (let i = 0; i < products.length; i++) {
      let element = products[i];

      const sourceStock = await stockModel.findOne({
        itemId: element._id,
        locationId: internalTransferExist.source,
        warehouseId: internalTransferExist.wareHouseId,
        branchId: internalTransferExist.branchId,
      });

      if (sourceStock == null || sourceStock.stock < element.transferQty) {
        return {
          data: `Stock not Found for ${element._id}`,
          status: STATUSCODES.NOTFOUND,
        };
      } else {
        let destinationStock = await stockModel.findOne({
          itemId: element._id,
          locationId: internalTransferExist.destination,
          warehouseId: destinationWareHouse._id,
          branchId: internalTransferExist.branchId,
        });
        if (destinationStock == null) {
          destinationStock = new stockModel({
            itemType: element.mainCatgeoryId,
            itemId: element._id,
            locationId: internalTransferExist.destination,
            wareHouseId: destinationWareHouse._id,
            stock: 0,
            branchId: internalTransferExist.branchId,
          });
          //destinationStock = await createDestStock.save();

          sourceStock.stock = sourceStock.stock - element.transferQty;
          destinationStock.stock = destinationStock.stock + element.transferQty;
          dbStockDatas.push(sourceStock);
          dbStockDatas.push(destinationStock);
          dbStockMoveData.push(
            new stockMoveModel({
              date: Date.now(),
              reference: internalTransferExist._id,
              productId: element._id,
              itemType: sourceStock.itemType,
              from: sourceStock.locationId,
              to: destinationStock.locationId,
              Quantity: element.transferQty,
              uom: element.uom,
              type: STOCKMOVETYPE.INTTRANS,
              status: true,
              branchId: internalTransferExist.branchId,
            })
          );
        }
      }
    }
    const insertedStockData = await stockModel.insertMany(dbStockDatas);
    if (insertedStockData) {
      const insertedStockMoveData = await stockMoveModel.insertMany(
        dbStockMoveData
      );
      if (insertedStockMoveData) {
        internalTransferExist.log = [
          {
            empId: req.decode._id,
            status: NEWLOG.POST,
            date: new Date(),
          },
        ];

        internalTransferExist.status = INTTRANSSTATUS.COM;

        const updateInternalTransferStatus = await internalTransferExist.save();

        if (updateInternalTransferStatus) {
          return {
            data: updateInternalTransferStatus,
            status: STATUSCODES.SUCCESS,
          };
        } else {
          return {
            data: "Failed to Update Internal Transfer Status",
            status: STATUSCODES.ERROR,
          };
        }
      } else {
        return {
          data: "Failed to Update Stock move",
          status: STATUSCODES.ERROR,
        };
      }
    } else {
      return {
        data: "Failed to Update Stock",
        status: STATUSCODES.ERROR,
      };
    }
  } catch (e) {
    console.log(e);
    return { data: ERRORMSG.INTSERERR, status: STATUSCODES.ERROR };
  }
};
