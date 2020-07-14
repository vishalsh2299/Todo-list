const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs"); // ejs for templating

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://vishal-admin:26lemon26@cluster0.ymtzt.mongodb.net/todolistdb?retryWrites=true&w=majority", {useNewUrlParser: true});

//const items = ["Eat Food","Cook Food"]; // as when we add new post it should add in li instead of just replacing the last one like in case of item=""
//const workItems = [];

const itemsSchema = {
    name: String
};

//mongoose model (captilize name)
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist"
});


// const item2 = new Item ({
//     name: "Hey kid"
// });


// const item3 = new Item ({
//     name: "Kill me sexy"
// });

const defaultItems = [item1];//,item2,item3];

const listScehma ={
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listScehma);

app.get("/", (req,res) => {

    Item.find({}, (err, foundItems) => {
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, (err) => {
                if(err) {
                    console.log(err);
                }else {
                    console.log("Successfully saved data to database");
                }
            });
            res.redirect("/"); // to render it it will go and check root again and then come to else
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
    
});

// app.get("/work", (req,res) => {
//     res.render("list", {listTitle: "Work List", newListItems: workItems})
// });
// now we will create a dynamic route for custom list
// using express route parameters
app.get("/:customListName", (req,res) => {
    const customeListName = _.capitalize(req.params.customListName);

    List.findOne({name: customeListName}, (err,foundList)=> {
        // findOne will give single object and find gives the array
        if(!err){
            if(!foundList){
                //console.log("Doesn't exist"); // create new list
                const list = new List({
                    name: customeListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+ customeListName);
            }else{
                //console.log("exists"); // create new list
                res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    })

});

app.post("/", (req,res) => {

    const itemName = req.body.newItem;// getting from list.ejs

    const listName = req.body.list; // for rendering custom list check name in EJS

    console.log(listName);
    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
         item.save();
         res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            //console.log(foundList);
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName); // custom list
        })
    }


   // console.log(req.body.newItem);
//    item = req.body.newItem;

//    console.log(req.body);
   
//    if(req.body.list === "Work List"){
//        workItems.push(item);
//        res.redirect("/work");
//    }else {
//     items.push(item);
//     res.redirect("/");
//    }
    // we can't render here as here we will not pass kindOfDay so it will show error
    // so we redirect to "/" route and render it there.
    
});

app.post("/delete", (req,res) => {
   // console.log(req.body.checkbox);
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if(!err){
                console.log("Successfully deleted item");
                res.redirect("/"); // to render it on page
            }else{
                console.log(err);
            }
        });
    } else{
        // delete as per the list name
        List.findOneAndUpdate({name: listName},
            { $pull: {items: {_id: checkedItemId}} },
            (err,foundList) => {
                if(!err){
                    res.redirect("/"+listName);
                }
            });
    }
    
   
})


app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on port 3000"); 
});