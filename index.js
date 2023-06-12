const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe =require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// for secure data
const verifyJWT=(req,res, next)=>{
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:'Unauthorized access'})
  }

  const token=authorization.spilt(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:'Unauthorized access'})
    }
    res.decoded=decoded;
    next()
  })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vzgfrzr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const instructorsCollection = client.db("milSchooldb").collection("instructors");
    const userCollection=client.db("milSchooldb").collection("users")
    const classesCollection=client.db("milSchooldb").collection("classes")
    const selectedClassCollection=client.db("milSchooldb").collection("usersClass")
    const paymentsCollection=client.db("milSchooldb").collection("payments")

    // JWT
    app.post('/jwt',(req, res)=>{
      const user=req.body;
      const token= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({token})
    })

    // post user data
     app.post('/users', async(req, res)=>{
        const user=req.body;
        console.log("new user",user)
        // const decodedEmail=req.decoded.email;
        // if(email !== decodedEmail){
        //   return res.status(403).send({error:true,message:'forbidden access'})
        // }
        const query={email:user.email}
        const existingUser=await userCollection.findOne(query);
        if(existingUser){
          return res.send({message:'user already exists'})
        }
        const result=await userCollection.insertOne(user)
        res.send(result)
     })

    //  post selected classes
    app.post('/selectedClass',async(req, res)=>{
      const classes=req.body;
      console.log(classes);
      const result= await selectedClassCollection.insertOne(classes)
      res.send(result)

    })

    // find admin
    app.get('/users/admin/:email', async(req, res)=>{
      const email=req.params.email;
      // if(req.decoded.email != email){
      //   res.send({admin:false})
      // }
      const query={email: email};
      const user= await userCollection.findOne(query);
      const result={admin:user?.role ==='admin'};
      res.send(result)
    })

   



    // get specifice user by email

     app.get('/users',async(req, res)=>{
      const result = await userCollection.find({ email: req.query.email}).toArray()
      res.send(result)
 
  })

  
     //  get user data
     app.get('/getinstructor',async(req, res)=>{
     const query={role:'instructor'}
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })


      // app.get('/add',async(req,res)=>{
      //       const filter={};
      //       const option = { upsert: true }
      //       const updatedDoc = {
      //           $set: {
      //              classStatus:false
      //           }
      //       }
      //       const result = await classesCollection.updateMany(filter, updatedDoc, option);
      //       res.send(result);
      //   }); 


    // get classes data for specific role
    app.get('/spacificclasses',async(req,res)=>{
      const query={role:'approved'}
      const result=await classesCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/allusers',async(req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // get classes
    app.get('/getclasses',async(req, res)=>{
      const result=await classesCollection.find().toArray()
      res.send(result)

    })

    // get usersClasses data
    app.get('/userclasses',async(req,res)=>{
      const result = await selectedClassCollection.find({email: req.query.email}).toArray()
      res.send(result)
    })

    app.delete('/userclasses/:id',async(req, res)=>{
      const id = req.params.id;
      const query={_id:new ObjectId(id)}
      const result =await selectedClassCollection.deleteOne(query)
      res.send(result)
    })

    //  patch user role changed to admin
    app.patch('/users/admin/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)};
      const updateDoc={
        $set:{
          role:"admin"
        }
      };
      const result=await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    
    //  patch user role changed to admin
    app.patch('/users/instructor/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)};
      const updateDoc={
        $set:{
          role:"instructor"
        }
      };
      const result=await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // patch classes role changed to approved
    app.patch('/classes/approved/:id',async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)};
      const updateDoc={
        $set:{
          role:"approved"
        }
      };
      const result=await classesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // patch classes role changed to approved
    app.patch('/classes/denied/:id',async(req, res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)}
      const updateDoc={
        $set:{
          role:"denied"
        }
      };
      const result=await classesCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

  //  post classes
    app.post('/classes',async(req, res)=>{
      const classe=req.body;
      console.log(classe)
      const result =await classesCollection.insertOne(classe)
      res.send(result)
    })

    //  get classes data
    app.get('/classes',async(req, res)=>{
      const result = await classesCollection.find().sort({student:-1}).collation({locale:"en_US",numericOrdering:true}).toArray()
      res.send(result)
    })
     
    // get instructors data
    app.get('/instructors', async(req, res)=>{
        const result= await instructorsCollection.find().toArray()
        res.send(result)
    })

    // create peyment intent
    app.post('/create-payment-intent',async(req, res)=>{
      const{ price }=req.body;
      const amount= price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types:['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    // paymet related api
    app.post('/payments',async(req,res)=>{
      const payment = req.body;
      const result =await paymentsCollection.insertOne(payment);
      res.send(result)
    })

    // get payment data
    app.get('/allpayments',async(req,res)=>{
      const result = await paymentsCollection.find({email: req.query.email}).toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req, res)=>{
    res.send('server is running...')
})
app.listen(port,(req,res)=>{
    console.log(`server is running on port ${port}`)
})