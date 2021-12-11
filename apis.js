const { PrismaClient } = require("@prisma/client");
const express = require("express");
const prisma = new PrismaClient();
const router = express.Router();
const jwt = require("jsonwebtoken");
const { userAuthenticated } = require("./config/auth");
const { v4: uuidv4 } = require("uuid");

//admin signup
router.post("/register", (req, res) => {
  const { firstName, lastName, userName, businessName, Email, password } =
    req.body;
  async function addAdmin() {
    let user = await prisma.user.findFirst({
      where: {
        email: Email,
      },
    });
    if (user != null) {
      res.send("Admin already exists found");
    } else {
      await prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          userName: userName,
          businessName,
          businessName,
          email: Email,
          password: password,
          id: uuidv4(),
        },
      });

      res.send("Registration successful");
    }
  }
  try {
    addAdmin()
      .catch((err) => {
        throw err;
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
  } catch (err) {
    console.log(err);
  }
});

//admin login
router.post("/", (req, res) => {
  const { Email, password } = req.body;
  async function Login() {
    let user = await prisma.user.findFirst({
      where: {
        email: Email,
      },
    });

    if (user == null) {
      res.send("User not found");
    } else if (user.password != password) {
      res.send("password is Incorrect");
    } else {
      const token = jwt.sign(
        { user_id: user.id, Email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      let session = req.session;
      session.token = token;
      session.user = user;
      res.send(user);
    }
  }

  try {
    Login(Email, password)
      .catch((err) => {
        throw err;
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
  } catch (err) {
    console.log(err);
  }
});

//get user
router.get("/user/:id", userAuthenticated, async (req, res) => {
  const id = req.params.id;
  let user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  res.json(user);
});

//create user branch
router.post("/user/createBranch", userAuthenticated, (req, res) => {
  const { branchName, address, monoAppId, description} = req.body;
  async function addAdmin() {
    let app = await prisma.app.findFirst({
      where: {
        user: req.session.user.id,
        branchName: branchName
      },
    });
    console.log(app)
    if (app != null) {
      res.send("BranchName already exists found");
    } else {
      await prisma.app.create({
        data: {
          branchName: branchName,
          address: address,
          description: description,
          monoAppId: monoAppId,
          user: req.session.user.id,
          id: uuidv4(),
        },
      });

      res.send("Registration successful");
    }
  }
  try {
    addAdmin()
      .catch((err) => {
        throw err;
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
  } catch (err) {
    console.log(err);
  }
});

//get user branch
router.get("/user/:id/:branchName", userAuthenticated, async (req, res) => {
  const branchName  = req.params.branchName;
  
  let app = await prisma.app.findMany({
    where: {
      user: req.session.user.id,
      branchName: branchName,
    },
  });
  res.json(app);
});

//get all user branches
router.get("/userbranches", userAuthenticated, async (req, res) => {
  let app = await prisma.app.findMany({
    where: {
      user: req.session.user.id,
    },
  });
  res.json(app);
});

//getting list of transactions for user
// router.post('/transactions', userAuthenticated, async (req, res) => {
//     const transactions = []
//     const user = await prisma.user.findFirst({
//         where: {
//             email: req.session.user.email
//         }
//     })
//     const transData = await prisma.transaction.findMany({
//         where: {
//             user: req.session.user.email
//         }
//     });
//     transactions.push(transData)
//     res.json(transactions);
// })

module.exports = router;
