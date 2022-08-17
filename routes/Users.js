let products = [
  {
    id: 100,
    name: "4gb 128",
    price: 80000,
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam, cupiditate.",
    path: "iphone.jpeg",
  },
  {
    id: 101,
    name: "8gb 256ssd",
    price: 45000,
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam, cupiditate.",
    path: "laptop.jpeg",
  },
  {
    id: 102,

    name: "AAA",
    price: 2500,
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam, cupiditate.",
    path: "dress1.jpeg",
  },
  {
    id: 103,
    name: "BBB",
    price: 3200,
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam, cupiditate.",
    path: "dress2.jpeg",
  },
];

const pdf = require("pdf-creator-node");
const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/test");
db = mongoose.connection;
db.on("error", (err) => {
  console.log("connection lost", err);
});
db.once("open", () => {
  console.log("db connected to server");
});

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    mobile: {
      type: Number,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    dob: {
      type: Date,
      require: true,
    },
    cart: {
      type: [Object],
    },
  },
  { collection: "user" }
);

const usermodel = mongoose.model("user", schema);

function auth(req, res, next) {
  if (req.session.email) {
    next();
  } else res.redirect("/user/login");
}
router.get("/signup", (req, res) => {
  res.render("Users/signup");
});

router.post("/signup", async (req, res) => {
  console.log(req.body);
  try {
    const user = await usermodel.findOne({ email: req.body.email });
    console.log("user", user);
    if (user) res.json({ err: true, msg: "already have a user" });
    else {
      const new_user = new usermodel({
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        password: req.body.password,
        dob: req.body.dob,
      });
      new_user
        .save()
        .then((data) => {
          console.log(data.email, "data");
          req.session["email"] = data.email;
          res.json({ err: false, msg: "user created" });
        })
        .catch((err) => {
          console.log("signup error while user saving ", err);

          res.json({ err: true, msg: "something went wrong" });
        });
    }
  } catch (e) {
    console.log("signup error", e);
    res.json({ err: true, msg: "something went wrong " });
  }
});

router.get("/home", auth, (req, res) => {
  const who = req.session.email;
  console.log("home");
  res.render("Users/home", { data: products });
});

router.get("/login", (req, res) => {
  console.log("login");
  res.render("Users/login");
});

router.post("/login", async (req, res) => {
  console.log(req.body, "jhwegrtuewr");
  const { password, email } = req.body;
  try {
    const user = await usermodel.findOne({ email, password });
    console.log(email, password, user);
    if (user) {
      req.session["email"] = user.email;
      res.json({ err: false, msg: "successfully logined " });
    } else {
      res.json({ err: true, msg: "wrong password or email " });
    }
  } catch (e) {
    res.json({ err: true, msg: "error occured while login" });
  }
});

router.post("/addtocart", auth, async (req, res) => {
  const who = req.session.email;
  console.log("cart", req.body);
  let product;
  for (index in products) {
    if (products[index].id == req.body.id) {
      product = products[index];
      break;
    }
  }
  console.log(product, "pro");
  if (product) {
    product.count = 1;
    try {
      const check = await usermodel.findOne({
        email: who,
        "cart.id": product.id,
      });
      if (check) {
        console.log(product.id, "id");
        usermodel
          .findOneAndUpdate(
            { email: who, "cart.id": product.id },
            { $inc: { "cart.$.count": 1 } }
          )
          .exec()
          .then((data) => {
            console.log(data, "data");
            res.json("product added to cart");
          })
          .catch((err) => {
            console.log(err, "err");
            res.json("could not add product to cart");
          });
      } else {
        usermodel
          .findOneAndUpdate({ email: who }, { $push: { cart: product } })
          .exec()
          .then((data) => {
            console.log(data);
            res.json("product added to cart");
          })
          .catch((err) => {
            console.log("err1", err);
            res.json("could not add product to cart");
          });
      }
    } catch (e) {
      console.log(e, "error");
      res.json("could not add product to cart");
    }
  } else {
    console.log("err2");
    res.json("could not add product to cart");
  }
});

router.get("/cart", auth, async (req, res) => {
  const id = req.session.email;
  const product = usermodel
    .findOne({ email: id })
    .select("email cart -_id")
    .then((data) => {
      const cart = data.cart;
      let sum = 0;
      for (i = 0; i < cart.length; i++)
        [(sum += cart[i].price * cart[i].count)];
      data.total = sum;
      console.log(sum, "sum");

      res.render("Users/cart", { data });
    })
    .catch((err) => {
      console.log(err, "error");
      res.redirect("/home");
    });
});
router.post("/cart_inc/:id", auth, async (req, res) => {
  const who = req.session.email;

  usermodel
    .findOneAndUpdate(
      { email: who, "cart.id": Number(req.params.id) },
      { $inc: { "cart.$.count": 1 } }
    )
    .exec()
    .then((data) => {
      console.log(data, "data");
      res.json({ err: false });
    })
    .catch((err) => {
      console.log(err, "err");
      res.json({ alert: "coould not increase  cart count" });
    });
});

router.post("/cart_dec/:id", auth, async (req, res) => {
  const who = req.session.email;
  usermodel
    .findOneAndUpdate(
      { email: who, "cart.id": Number(req.params.id) },
      { $inc: { "cart.$.count": -1 } }
    )
    .exec()
    .then((data) => {
      console.log(data, "data");
      res.json({ err: false });
    })
    .catch((err) => {
      res.json({ alert: "coould not decrease  cart count" });
    });
});

router.get("/place_order", auth, async (req, res) => {
  const who = req.session.email;

  usermodel
    .findOne({ email: who })
    .select("cart")
    .then(async (data) => {
      let cart = data.cart;
      let id = data._id;

      console.log(cart, "cart");

      let sum = 0;
      for (i = 0; i < cart.length; i++) {
        let temp = cart[i].price * cart[i].count;
        cart[i].total = temp;
        sum += temp;
      }
      console.log(cart, "new cart");

      let html = fs.readFileSync(
        path.join("/home/thanu/shoping_cart/public/orders/index.html"),
        "utf8"
      );
      var options = {
        format: "A3",
        orientation: "portrait",
        border: "10mm",
        header: {
          height: "45mm",
          contents: "",
        },
        footer: {
          height: "28mm",
          contents: {
            first: "",
            2: "Second page",
            default:
              '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
            last: "",
          },
        },
      };
      var document = {
        html: html,
        data: {
          cart: cart,
          total: sum,
        },
        path: "public/orders/" + id + ".pdf",
        type: "",
      };
      pdf
        .create(document, options)
        .then((res) => {
          console.log(res, "pdf created");
        })
        .catch((error) => {
          console.error(error);
        });

      try {
        await usermodel.findOneAndUpdate(
          { email: who },
          { $set: { cart: [] } }
        );
      } catch (e) {
        console.log(e);
        res.render("something went wrong");
      }

      res.render("Users/order", { path: id });
    })
    .catch((err) => {
      console.log(err);
      res.render("something went wrong");
    });
});

module.exports = {
  router: router,
  model: usermodel,
};
