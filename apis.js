const { PrismaClient } = require("@prisma/client");
const express = require("express");
const prisma = new PrismaClient();
const router = express.Router();
const jwt = require("jsonwebtoken");
const { userAuthenticated } = require("./config/auth");
const { v4: uuidv4 } = require("uuid");

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
          email: email
        }
      })
      res.json({
        message: "user Registered",
        data : user
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
      res.json({ message: "Login successful", data:user });
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
      let app = await prisma.app.findFirst({
        where : {
          branchName : branchName
        } 
      })

      res.json({ message: "Registration successful", data : app});
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
  res.json({ data: app });
});

//get all user branches
router.get("/userbranches", userAuthenticated, async (req, res) => {
  let app = await prisma.app.findMany({
    where: {
      user: req.session.user.id,
    },
  });
  res.json({ data: app });
});

//get list of transactions for one user's branch
router.get('/transactions/:id', userAuthenticated, async (req, res) => {
  const transactions = []
  const id = req.params.id
    const branch = await prisma.app.findFirst({
        where: {
        user: req.session.user.id,
        id : id
        }
    })
  try {
    fetch(`https://api.withmono.com/accounts/${id}/transactions`)
      .then((res) => res.data())
      .then(data => res.json(data))
  }
  catch (err) {
    res.send(err)
  }
})

// getting list of transactions for user branches
router.post('/transactions', userAuthenticated, async (req, res) => {
  const transactions = []
  const appIds = []
    const Apps = await prisma.user.findMany({
        where: {
            user: req.session.user.id
        }
    })
  Apps.forEach(element => {
    appIds.push(element.monoAppId)
  });
  try {
    while (count < transactions.length) {
      fetch(`https://api.withmono.com/accounts/${id}/transactions`)
        .then((res) => res.data())
        .then((data) => transactions.push(data));
    }
    res.json(transactions);
  } catch (err) {
    res.send(err);
  }
})

module.exports = router;
