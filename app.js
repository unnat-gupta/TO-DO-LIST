//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const connectDB = require("./db.js");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
connectDB();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//FOR LOCAL DATABASE
// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true,
// });

const itemsSchema = {
  name: { type: String },
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to My TO DO List!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: { type: String },
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  const foundItems = await Item.find({});
  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    const day = date.getDate();
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({ name: customListName });
  if (foundList == null) {
    const list = new List({
      name: customListName,
      items: [],
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
    });
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkboxName;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.deleteOne({ _id: checkedItemId });
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
    // console.log(foundList);
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
