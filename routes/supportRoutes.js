const express = require("express")
const Router = express.Router()
const authController = require("../controllers/authController")
const supportController = require("../controllers/supportController")
Router.use(authController.protect)
Router.post("/open-ticket", supportController.messageSupport)
Router.post("/resolve-ticket/:supportId", supportController.resolveSupport)
module.exports = Router