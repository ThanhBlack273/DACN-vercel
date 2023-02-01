const express = require('express');
//const { ObjectId } = require('mongodb');
const app = express();
const mongoClient = require('mongodb').MongoClient;
//const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const nodemailer = require("nodemailer");

const { json } = require('express');
const cloudinary= require("cloudinary").v2
const multer = require("multer")
const path = require("path");
const { type } = require('os');
const { ObjectID, ObjectId } = require('bson');

//config đăng nhập cloudinary
cloudinary.config({
  cloud_name: 'dcllp2b8r',
  api_key: '786475196392548',
  api_secret: '0FHkZlrgOAFGqcOk1mhKwi5oYbI'
})

//phát hiện file hình ảnh
const filestore= multer.diskStorage({
  fileFilter: (req, file, cb)=>{
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== "/jpeg" && ext !== ".png"){
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
})
const upload= multer({ storage: filestore})

//const PostModel = require("../Models/PostModel");
//const router = express.Router();
//const MyModel = require("../Models/MyModels");

//Link mongodb 
//const url = "mongodb+srv://oenoen:oenoen@dacn.kxrrsop.mongodb.net/test"
const url ="mongodb+srv://admin:admin@cluster0.mxicf65.mongodb.net/da"
app.use(express.json())

mongoClient.connect(url, (err, db) =>{
  if (err) {
    console.log("Error while connecting mongo client")
  }else {
    
    app.get('/', (req,res) =>{
      res.status(200).send("Hello")
    })

    // Đăng ký
    app.post('/signup', (req,res) =>{
      const myDb = db.db('test')
      const collection = myDb.collection('Users')

      const newUser = {
        email: req.body.email,
        tenngdung: req.body.tenngdung,
        matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds),
        otp: "",
        createAt: Date.now(),
        expiresAt: Date.now(),
        avatar: "http://res.cloudinary.com/dcllp2b8r/image/upload/v1669049364/galqynrofgin4x6cyxsq.jpg", //ảnh mặc định
        cloudinary_id: "galqynrofgin4x6cyxsq"
      }
      const query = { email: newUser.email }
      collection.findOne(query, (err, result) => {
        if (result==null) {
          collection.insertOne(newUser, (err, result) =>{
            res.status(200).send()
          })
        }
        else if (query.email==result.email) {
          res.status(201).send()
          //Đã có email trên db
        }else {
          res.status(404).send("Lỗi")
        }
      })
    })

    // Đăng nhập
    app.post('/login', (req,res) =>{
      const myDb = db.db('test')
      const collection = myDb.collection('Users')
      const query = {email: req.body.email}
      const matkhau = req.body.matkhau

      collection.findOne(query, (err, result) =>{
        if (result!=null) {
          //so sánh mật khẩu mã hóa lưu trên db
          if (bcrypt.compareSync(matkhau, result.matkhau))
          {
            const objToSend = {
              email : result.email,
              tenngdung : result.tenngdung,
              avatar : result.avatar
            }
            res.status(200).send(JSON.stringify(objToSend))
          }
          else {
            res.status(402).send()
            //Sai mật khẩu
          }
        } else if (result==null) {
          res.status(401).send("Không tìm thấy tài khoản")
            //Sai email
        } else {
          res.status(404).send("Lỗi")
        }
      })
    })

    // Post bo đề
    app.post('/list', (req,res) =>{
      const myDb = db.db('da')
     
      collection = myDb.collection(req.body.sub)
        collection.find({},{ projection: { _id: 0, Code: 1 } }).toArray(function(err, result) {
        if (result!=null) {
          res.status(200).send(JSON.stringify(result))
        } else {
          res.status(404).send()
          console.log("die")
        }
        })
    })

    // post câu hỏi
    app.post('/ques', (req,res) =>{
      const myDb = db.db('da')
      const query = {Code: req.body.Code}

      //random 4 câu trả lời
      function ran(obj)
      {
        sourceArray=["a", "b", "c", "d"]
        for (var i = 0; i < sourceArray.length - 1; i++) {
          var j = i + Math.floor(Math.random() * (sourceArray.length - i)); //tạo thứ tự
  
          var temp = sourceArray[j];
          sourceArray[j] = sourceArray[i];
          sourceArray[i] = temp;
        }
        obj1 = { a: "", b: "", c: "", d: ""}
        for (var i = 0; i < sourceArray.length ; i++) {
          obj1[sourceArray[i]] = obj[sourceArray[i]]
        }
        obj.a=obj1[sourceArray[0]]
        obj.b=obj1[sourceArray[1]]
        obj.c=obj1[sourceArray[2]]
        obj.d=obj1[sourceArray[3]]
        return obj
      }

      function fond(col1,col2)
      {
        collection = myDb.collection(col1)
        //collection.find(query,{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{
          collection.findOne(query,async(err, result) =>{
            if (result!=null) {
              collection = myDb.collection(col2)
              
               let obj = new Array()
               for(i=0;i<result.Questions.length;i++)
               {
                const ques = {_id: ObjectId(result.Questions[i])}
                var found = await collection.findOne(ques)
                obj.push(ran(found))
               }
              res.status(200).send(obj)
            } else {
              res.status(404).send()
              console.log("die1")
            }
          }) 
      }

      if(req.body.sub=="Eng_exam"||req.body.sub=="Eng_review")
      {
        col2="English"
        fond(req.body.sub, col2)
      }

      else if(req.body.sub=="His_exam"||req.body.sub=="His_review")
      {
        col2="History"
        fond(req.body.sub, col2)
      }
      
      else if(req.body.sub=="Geo_exam"||req.body.sub=="Geo_review")
      {
        
        col2="Geography"
        fond(req.body.sub, col2)
      }
      
      else if(req.body.sub=="Gdcd_exam"||req.body.sub=="Gdcd_review")
      {
        col2="Gdcd"
        fond(req.body.sub, col2)
      }              
    })
    
    // Gửi OTP
    app.post('/sendOTP', function(req, res) {
      const myDb = db.db('test')
      const collection = myDb.collection('Users')
      
      const query = { email: req.body.email }
      
      collection.findOne(query, (err, result) => {
         if (result!=null) {
          console.log(result)
            var transporter =  nodemailer.createTransport({ // config mail server
            service: 'Gmail',
            auth: {
              user: 'kaitothompson273@gmail.com',
              pass: 'rfeuydoyskalctfh'
            }
            });
            const otp = `${Math.floor(1000+ Math.random() * 9000)}`; //random 4 số otp
            var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
              from: 'App',
              to: result.email,
              subject: 'Xác thực OTP',
              html: `<p>Mã OTP của bạn là: <b>${otp}</b></p>
                      <p>Mã sẽ hết hiệu lực sau 5 phút.</p>`,
            }
            transporter.sendMail(mainOptions, function(err, info){ //bắt đầu gửi mail
              if (err) {
                  console.log(err);
              } else {
                  res.status(200).send("Gửi mail thành công")
                  console.log("Gửi mail thành công")
                  //gửi thành công
                  const userOTPverify={  //cập nhật otp trong db
                    $set: {
                      otp: bcrypt.hashSync(otp, saltRounds),  //mã hóa otp
                      createAt: Date.now(),
                      expiresAt: Date.now()+300000 
                    }
                  };
                  collection.updateOne(query, userOTPverify, function(err, res){
                    if (err) throw err;
                  })
              }
            });
          } else if (result==null){
            res.status(400).send()
            //khong tim thay tk
          } else res.status(404).send()

        })
      
    });

    // Xác nhận OTP
    app.post('/verifyOTP', function(req, res){
      const myDb = db.db('test')
      const collection = myDb.collection('Users')

      const query = { email: req.body.email}
      const otp=  req.body.otp
      
      collection.findOne(query, (err,result)=>{
        if (result!=null){
          if(result.expiresAt<Date.now()){
            //timeout
            res.status(201).send()
          } else{
            if (bcrypt.compareSync(otp, result.otp)){  //so sánh otp đã lưu trong db
              res.status(200).send("Đổi mật khẩu thành công")
              console.log("Đổi mật khẩu thành công")
              const deleteOTP= { $set:{ otp: ""}} //xóa otp
              collection.updateOne(query, deleteOTP, function(err, res){
                if (err) throw err;
              })
            }
            else{
              res.status(202).send("Sai OTP")
              console.log("Sai OTP")
            }
            //sai otp 
          }
        }
        else if (result==null){
          res.status(400).send("Không tìm thấy tài khoản")
          console.log("Không tìm thấy tài khoản")
        }
        //không tìm thấy tk
        else {
          res.status(404).send("Lỗi")
          console.log("Lỗi")
        }
      })

    });

    // Đổi mật khẩu
    app.post('/changepass', function(req,res){
      const myDb = db.db('test')
      const collection = myDb.collection('Users')

      const query = { email: req.body.email }
      collection.findOne(query, (err, result) => {
         if (result!=null) {
            const newpass= { $set:{ matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds)}}
            collection.updateOne(query, newpass, function(err, result){
            if (!err) res.status(200).send("Đổi mật khẩu thành công");
          })
          } else if (result==null){
            res.status(400).send("Không thấy tài khoản")
            //khong tim thay tk
          } else res.status(404).send("Lỗi")

        })
    })

    // Đổi thông tin user
    app.post('/changeinfo', function(req,res){
      const myDb = db.db('test')
      const collection = myDb.collection('Users')

      console.log("changeinfo")
      console.log(req.body)

      const query = { email: req.body.email }

      collection.findOne(query, (err, result) => {
         if (result!=null) {
            if (req.body.matkhau!=""){
              newinfo= { $set:{ tenngdung: req.body.tenngdung, matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds) }}
              console.log("!null")
            }
            else if (req.body.matkhau=="") {
              newinfo= { $set:{ tenngdung: req.body.tenngdung}}
              console.log("null")
            }
            collection.updateOne(query, newinfo, function(err, result){
            if (!err) res.status(200).send("Đổi thông tin thành công");
            })
          } else if (result==null)
          {
            res.status(400).send("Không thấy tài khoản")
            //khong tim thay tk
          } else res.status(404).send("Lỗi")

        })
    })

    // Upload ảnh
    app.post('/uploadimg', upload.single('image'), async (req,res)=>{
      if (req.body.image != "")
      {
        var upImg = await cloudinary.uploader.upload(req.file.path) //up anh len cloudinary
      
        const myDb = db.db('test')
        const collection = myDb.collection('Users')
        // up anh len mongo
        const ava= { $set:{avatar: upImg.url, cloudinary_id: upImg.public_id}}
        const query = { email: req.body.email }
        collection.findOne(query, async (err, result) => {
          if (result!=null) {
            if(result.avatar != "" && result.cloudinary_id != "galqynrofgin4x6cyxsq")
            {
              await cloudinary.uploader.destroy(result.cloudinary_id)
            }
              collection.updateOne(query, ava, function(err, result){
                if (!err) res.status(200).send("Up ảnh thành công");
              })
            } 
            else if (result==null){
              res.status(400).send()
            } 
            else res.status(404).send()
          })
      }
      else res.status(404).send("Không có ảnh")
   })

   app.post('/changeinfo2', upload.single('image'), async (req,res)=>{
    try{
      const myDb = db.db('test')
      const collection = myDb.collection('Users')

      
      const query = { email: req.body.email }
      await collection.findOne(query, async (err, result) => {
        
        if (result!=null) {
          let temp=0
          //nếu có mk
          if (req.body.matkhau!=""){
            newinfo= { $set:{ tenngdung: req.body.tenngdung, matkhau: bcrypt.hashSync(req.body.matkhau,saltRounds) }}
              collection.updateOne(query, newinfo, function(err, result)
              {
                if (result!=null) temp+=4;
                console.log("mk ten")
              })
          }
          //nếu không có mk
          else if (req.body.matkhau=="") {
            newinfo= { $set:{ tenngdung: req.body.tenngdung}}
              collection.updateOne(query, newinfo, function(err, result)
              {
                if (result!=null) temp+=2;
                console.log("ten")
              })
          }

          //nếu có ảnh
          if (req.body.image != "")
          {
            var upImg = await cloudinary.uploader.upload(req.file.path) //up anh len cloudinary
            const ava= { $set:{avatar: upImg.url, cloudinary_id: upImg.public_id}}
            await collection.updateOne(query, ava, function(err, result)
            {
              if (result!="") temp+=1;
              console.log("hinh")
            })
            if(result.avatar != "" && result.cloudinary_id != "galqynrofgin4x6cyxsq")
            {
              await cloudinary.uploader.destroy(result.cloudinary_id)
            }
          }  
          
          const resul= collection.findOne(query, (err, resul) => {
            const objToSend = {
              email : resul.email,
              tenngdung : resul.tenngdung,
              avatar : resul.avatar
            }       
            console.log(temp)
            switch(temp){
              case 5:  //cập nhật tất cả
                res.status(200).send(JSON.stringify(objToSend));
                break;
              case 4:   //cập nhật tên, mk
                res.status(201).send(JSON.stringify(objToSend));
                break;
              case 3:   //cập nhật tên, hinh
                res.status(202).send(JSON.stringify(objToSend));
                break;
              case 2:    //cập nhật tên
                res.status(203).send(JSON.stringify(objToSend));
                break;
              default:
                res.status(203).send(JSON.stringify(objToSend));
                break;
            }
          })

        } else if (result==null){
          res.status(400).send()
          //khong tim thay tk
        } else res.status(404).send("Lỗi")
      })

    }
    catch(err)
    {
      console.log(err)
      throw(err)
    }
    
  })

    app.post('/search', async (req,res)=>{
      const myDb = db.db('da')
      var collection1, collection2, collection 
           
      if(req.body.sub=="Eng")
      {
        collection = myDb.collection('English')   
        collection1 = myDb.collection('Eng_exam')
        collection2 = myDb.collection('Eng_review')
      }
      else if(req.body.sub=="His")
      {
        collection = myDb.collection('History')  
        collection1 = myDb.collection('His_exam')
        collection2 = myDb.collection('His_review')
      }
      else if(req.body.sub=="Geo")
      {
        collection = myDb.collection('Geography')  
        collection1 = myDb.collection('Geo_exam')
        collection2 = myDb.collection('Geo_review')
      }
      else if(req.body.sub=="Gdcd")
      {
        collection = myDb.collection('Gdcd')  
        collection1 = myDb.collection('Gdcd_exam')
        collection2 = myDb.collection('Gdcd_review')
      }   

      var query = {
        "$or":[
          {Question:{ $regex: '.*' + req.body.search + '.*'}},
          {a:{ $regex: '.*' + req.body.search + '.*'}},
          {b:{ $regex: '.*' + req.body.search + '.*'}},
          {c:{ $regex: '.*' + req.body.search + '.*'}},
          {d:{ $regex: '.*' + req.body.search + '.*'}},
        ]
      }
      collection.find(query).toArray(async function(err,result){
        if (result!=null) {
          
          let obj = new Array()
          for( let i=0; i<result.length;i++ )
          {
            const send ={
              Question: result[i].Question,
              anw: result[i].anw,
              exam: new Array(),
              review : new Array()
            }
            var result1, result2

            for (let j=1;j<=20;j++){
              const ques = {Questions: result[i]._id.toString(),Code: j.toString()}
                
              result1 = await collection1.findOne(ques)
              if (result1!=null){
                send.exam.push(j.toString())
              }

              result2 = await collection2.findOne(ques)
              if (result2!=null){
                send.review.push(j.toString())
              }
              
            }

            // result1 = await collection1.findOne(ques)
            // //console.log(result1)
            // if (result1!=null){
            //   //console.log(result1)
            //   Object.assign(send,{Code: result1.Code, Sub: collection1.collectionName})
            //   obj.push(send )
            //   console.log(obj)
            // }
            
            obj.push(send)
          }    
          //console.log(obj)
          res.status(200).send(obj)    
        }else if (result==null) {
          res.status(401).send("Không tìm thấy từ khóa")
            //Sai email
        } else {
          res.status(404).send("Lỗi")
        }
      })

    })

    //searchid
    app.get('/searchid', async(req,res)=>{
      const myDb = db.db('da')
      const collection = myDb.collection('Gdcd_new')
      const query = {_id: ObjectID(req.body.id) }

    
      collection.findOne(query, (err, result) =>{
        if (result!=null) {
          
          res.status(200).send(JSON.stringify(result))
         
        } else if (result==null) {
          res.status(401).send("Không tìm thấy tài khoản")
            //Sai email
        } else {
          res.status(404).send("Lỗi")
        }
      })
    })

    app.get('/searchid2', async(req,res)=>{
      const myDb = db.db('da')
      const collection = myDb.collection('Gdcd_new')
      const query = {Questions: req.body.id,
                    Code: req.body.Code}
      
      const que = {nice: ` ${req.body.Code}`} 
        
      collection.findOne(query, (err, result) =>{
        if (result!=null) {
          
          res.status(200).send(JSON.stringify(result))
         
        } else if (result==null) {
          res.status(401).send("Không tìm thấy tài khoản")
            //Sai email
        } else {
          res.status(404).send("Lỗi")
        }
      })
    })

    app.post('/saveresult', async (req,res)=>{
      const myDb = db.db('test')
      const collection = myDb.collection('save2')

      const query = {email: req.body.email}
      
      if(req.body.sub=="Eng_exam"||req.body.sub=="Eng_review")
      {
        var sub="English"
      }
      else if(req.body.sub=="His_exam"||req.body.sub=="His_review")
      {
        var sub="History"
      }
      else if(req.body.sub=="Geo_exam"||req.body.sub=="Geo_review")
      {
        var sub="Geography"
      }
      else if(req.body.sub=="Gdcd_exam"||req.body.sub=="Gdcd_review")
      {
        var sub="Gdcd"
      }        
      else {
        var sub = req.body.sub
      }

      const type = req.body.type
      const mix = `${type}.${sub}`
      const count = c+`${req.body.type}`
      //const 

      collection.findOne(query,(err,result)=>{
        if (result != null)
        {
          const save = {
            $push: {[mix]:
              {_id: ObjectID(), 
                code: req.body.code,
                time: req.body.time,
                done: req.body.done}}
          }
          
          collection.updateOne(query,save, (err, result) =>{
            res.status(200).send(result)
          })
          //collection.updateOne(query,{$set:{count:}})
        }
        else if (result == null)
        {


            const save = {
              email: req.body.email,
              [count]:"1",
              [type]: 
                {
                  [sub]:[
                    {
                      _id: ObjectID(), 
                      code: req.body.code,
                      time: req.body.time,
                      done: req.body.done
                    }
                  ]
                }
            }
          collection.insertOne(save, (err, result) =>{
            res.status(200).send(result)
          })
        }
        else {
          console.log("Lôi")
        }
      })

    })

    app.get('/getresult', async(req,res)=>{
      const myDb = db.db('test')
      const collection = myDb.collection('save2')
      const query = {email: req.query.email}
      
      const sub = req.query.sub
      const type = req.query.type
      const mix = `${type}.${sub}`

      // collection.findOne(query,{ projection: { _id: 0, Questions: 1 } }).toArray((err, result) =>{

      // })

      collection.findOne(query,{ projection: { _id: 0, [mix]: 1 } },(err,result)=>{
        if( result!=null){
          res.status(200).send(result)
        }
      })
    })

    app.post('/test', async (req,res)=>{
      const myDb = db.db('test')
      const collection = myDb.collection('save2')

      const send = {email: req.body.email}
      const query = { 
        $push:{
          //email: req.body.email,
          list: 
              {
                sub: req.body.sub,
                time: req.body.time,
                done: req.body.done
                }
              
        }
      }
      collection.updateOne(send,query, (err, result) =>{
        res.status(200).send()
      })
      // collection.insertOne(query)
      res.status(200).send(query)
    })

  }
});


const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log("Listening on port: ",port)
})


//NGUYEN LAM


// Router.post("/show-post", async (req, res) => {
//   var check = req.body["handle"]
//   if (check === "admin"){
//     var posts = await PostModel.find({}, { __v: 0, _id:0, });

//     res.json(posts);
//   }
// })

// Router.get("/show-post", async (req, res) => {
  
  
//     var posts = await PostModel.find({}, { __v: 0, _id:0, });

//     res.json(posts);
  
// })


// @GET("/ques")
// Call<Ques> getQues(@Body("Question") String Question
//                   @Body("Anwser") Array Answer
//                   @Body("_id") ObjectId _id);

// @GET("/ques")
// Call<Ques> getQues(@Body Map(ObjectId, String, Array) map)


