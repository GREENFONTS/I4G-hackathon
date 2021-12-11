const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
module.exports = {
  
  userAuthenticated:  (req, res, next) => {
    let token = req.session.token;

    if (req.session.user == undefined) {
      res.sendStatus(403);
    }
    if (!token) {
      res.sendStatus(403);
    }
    else{
      jwt.verify(token, process.env.TOKEN_KEY, (err, user) => {
        if (err) {
          res.sendStatus(200);
        }
        req.user = user;
        return next();
      });
    }
  },
};
