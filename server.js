require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'24kb'}));
app.use(express.static(path.join(__dirname,'public')));
const dataDir = path.join(__dirname,'data');
fs.mkdirSync(dataDir,{recursive:true});
const db = path.join(dataDir,'customers.json');
const inquiriesFile = path.join(dataDir,'inquiries.json');
function read(file){try {return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return [];}}
function write(file, data){fs.writeFileSync(file, JSON.stringify(data,null,2),{mode:0o600});}
function clean(x,max=200){return String(x??'').trim().slice(0,max);}
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const hits = new Map();
function limit(req,res,next){const key=req.ip,now=Date.now(),list=(hits.get(key)||[]).filter(t=>now-t<600000);if(list.length>=15)return res.status(429).json({error:'Too many requests. Please try again later.'});list.push(now);hits.set(key,list);next();}
app.post('/api/register',limit,async(req,res)=>{
  const name=clean(req.body.name,100),email=clean(req.body.email,200).toLowerCase(),phone=clean(req.body.phone,60),password=String(req.body.password??'');
  const role=clean(req.body.role,20);
  if(!name||!emailOk(email)||password.length<8||password.length>128||!['buy','sell','both'].includes(role))return res.status(400).json({error:'Please enter valid details and a password of at least 8 characters.'});
  const users=read(db);if(users.some(u=>u.email===email))return res.status(409).json({error:'This email is already registered.'});
  users.push({id:crypto.randomUUID(),name,email,phone,role,passwordHash:await bcrypt.hash(password,12),createdAt:new Date().toISOString()});
  write(db,users);
  res.status(201).json({message:'Your account has been registered. Welcome to TOOS REAL ESTATE!'});
});
app.post('/api/inquire',limit,async(req,res)=>{
 const type=clean(req.body.type,20),name=clean(req.body.name,100),email=clean(req.body.email,200),phone=clean(req.body.phone,60),location=clean(req.body.location,160),property=clean(req.body.property,60),budget=clean(req.body.budget,60),message=clean(req.body.message,2500);
 if(!['buy','sell'].includes(type)||!name||!emailOk(email)||!message)return res.status(400).json({error:'Name, valid email and message are required.'});
 const item={id:crypto.randomUUID(),type,name,email,phone,location,property,budget,message,createdAt:new Date().toISOString()};
 const all=read(inquiriesFile);all.push(item);write(inquiriesFile,all);
 const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,SMTP_FROM,BUSINESS_EMAIL}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS||!BUSINESS_EMAIL||BUSINESS_EMAIL.includes('example.com'))return res.status(503).json({error:'Your inquiry was saved, but email delivery is not yet configured. Please contact the business directly.'});
 try {
  const transporter=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT)||587,secure:process.env.SMTP_SECURE==='true',auth:{user:SMTP_USER,pass:SMTP_PASS}});
  await transporter.sendMail({from:SMTP_FROM||SMTP_USER,to:BUSINESS_EMAIL,replyTo:email,subject:`TOOS REAL ESTATE — ${type.toUpperCase()} property inquiry`,text:`Type: ${type}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}\nProperty: ${property}\nBudget / Asking price: ${budget}\n\nMessage:\n${message}`});
  res.status(200).json({message:'Your inquiry has been emailed to TOOS REAL ESTATE. Thank you!'});
 }catch(e){console.error('Email delivery error:',e.message);res.status(502).json({error:'Your inquiry was saved, but email delivery failed. Please contact the business directly.'});}
});
app.listen(Number(process.env.PORT)||3000,()=>console.log('TOOS REAL ESTATE running on port '+(process.env.PORT||3000)));
