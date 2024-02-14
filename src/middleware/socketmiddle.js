const userSockets = require("../../app");

const injectUserSockets = (req, res, next) => {
    req.userSockets = userSockets;
    next();
};

module.exports = injectUserSockets;
