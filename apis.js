const { PrismaClient } = require("@prisma/client");
const express = require("express");
const prisma = new PrismaClient();
const router = express.Router();
const jwt = require("jsonwebtoken");
const { userAuthenticated } = require("./config/auth");
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");
const { Mono } = require('mono-node');
const Data  = require('./dummy');

//getting authCode
const getAccountId = (secretKey, authCode) => {
  const monoClient = new Mono({
    secretKey: secretKey,
  });
  monoClient.auth.getAccountId({ code: authCode }, (err, results) => {
    if (err) console.log(err)
    if (results) {
      return results.id
    }
  });
}

//admin signup
router.post("/register", (req, res) => {
  const { firstName, lastName, userName, businessName, email, password } =
    req.body;
  async function addAdmin() {
    let user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (user != null) {
      res.send("user already exists");
    } else {
      await prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          userName: userName,
          businessName: businessName,
          email: email,
          password: password,
          id: uuidv4(),
        },
      });
      let user = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });
      res.json({
        message: "user Registered",
        data: user,
      });
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
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  async function Login() {
    let user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user == null) {
      res.send("User not found");
    } else if (user.password != password) {
      res.send("password is Incorrect");
    } else {
      const token = jwt.sign(
        { user_id: user.id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      let session = req.session;
      session.token = token;
      session.user = user;
      res.json({ message: "Login successful", data: user });
    }
  }

  try {
    Login(email, password)
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

  res.json({ data: user });
});

//create user branch
router.post("/user/createBranch", userAuthenticated, (req, res) => {
  const { branchName, address, publicKey, description, secretKey } =
    req.body;
  async function addAdmin() {
    let app = await prisma.app.findFirst({
      where: {
        user: req.session.user.id,
        branchName: branchName,
      },
    });
    console.log(app);
    if (app != null) {
      res.send("BranchName already exists found");
    } else {
      await prisma.app.create({
        data: {
          branchName: branchName,
          address: address,
          description: description,
          publicKey: publicKey,
          secretKey: secretKey,
          user: req.session.user.id,
          id: uuidv4(),
        },
      });
      let app = await prisma.app.findFirst({
        where: {
          branchName: branchName,
        },
      });

      res.json({ message: "Registration successful", data: app });
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
  const branchName = req.params.branchName;

  let branch = await prisma.app.findMany({
    where: {
      user: req.session.user.id,
      branchName: branchName,
    },
  });
  res.json({ data: branch });
});

//get all user branches
router.get("/userbranches", userAuthenticated, async (req, res) => {
  let branchData = []
  let branches = await prisma.app.findMany({
    where: {
      user: req.session.user.id,
    },
  });
  branches.forEach((ele) => {
    let element = {
      id: ele.id,
      publicKey: ele.publicKey,
      secretKey: ele.secretKey
    }
    branchData.push(element)
  })
  res.json({ data: branchData });
});

//get list of transactions for one user's branch
router.post("/transactions/:id", userAuthenticated, async (req, res) => {
  const {acctId} = req.body;
  const transactions = [];
  const id = req.params.id;
  try {
    const response = await fetch(`https://api.withmono.com/accounts/${acctId}/transactions`)
    const data = await response.json()
    res.send(Data.data[0])
  } catch (err) {
    res.send(err);
  }
});



// getting list of transactions for user branches
router.post("/transactions", userAuthenticated, async (req, res) => {
  const accountIds = req.body.accountIds;
  const transactions = [];
  try {
    // accountIds.forEach((ele) => {
    //   fetch(`https://api.withmono.com/accounts/${id}/transactions`)
    //     .then((res) => res.data())
    //     .then((data) => transactions.push(data));
    // })
    res.json(Data);
  } catch (err) {
    res.send(err);
  }

});

module.exports = router;
