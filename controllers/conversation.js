import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import OpenAI from 'openai'
import { customMail } from "./mailer.js";

export const updateConversation = async (req, res, next) => {
  const { dataUpdate } = req.body;
  const id = req.params.id;
  try {
    const d = await Conversation.findById(id);
    if (d?.user === req.user.userId) {
      Conversation.findOneAndUpdate({ _id: id }, dataUpdate).then(
        (updatedDocument) => {
          res.status(200).json({ status: "Success", data:updatedDocument });
        }
      ).catch((err)=>{
        res.status(200).json({ status: "Error", data: err });
    })

    } else {
      res.status(200).json({ status: "Error", data: "Not authorized" });
    }
  } catch (err) {
    next(err);
  }
};

export const AIupdateConversation = async (req, res, next) => {
  const openai = new OpenAI();
  const { description,userId } = req.body;


  // const description = undefined
  const messages = [
    {
        "role": "system",
        "content": `You are a Conversation maker. You will be given a job requerment details,
         you should be able to take the key words and give 10 skills in the form 
         Skills: skill number one, skill number 2 separated by comma. Don't take the works literally, 
         instead change as people write in there Conversations. Make the skills specific.
          Remember each skill sould not have more than three words. Separate them by a comma. `,
    }
];
messages.push({
  "role": "user",
  "content": `Job description: ${description}`,
});
let didAnswer=true
let skills
let i=0
  try {
    let doc = await User.findById(userId);
    let freeTrial = doc.freeTrial;
    if(!freeTrial){
       doc = await User.findOneAndUpdate(
        { _id: userId },
        { $set: {freeTrial:0} },
        { new: true }
      );
      freeTrial = doc.freeTrial;
    }
    if(freeTrial <=10){
    while(didAnswer){
  
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 1024,
      messages: messages,
  });

  const message = response.choices[0].message;
  const message_text = message.content;

  const myArray = message_text.split("Skills: ");
  skills = myArray[1]

  if(skills){
    didAnswer = false
  }else{
    i++
    if(i>=2) {
      console.log("Try",i)
      didAnswer = true
      res.status(201).send({ status: "error", data:"unable to ask the AI, Please modify your prompt" });
    }
  }
}
await User.findOneAndUpdate(
  { _id: userId },
  { $set: {freeTrial:(freeTrial+1)} },
  { new: true }
);
res.status(201).send({ status: "Success", data:skills });
    }else{
      res.status(201).send({ status: "error", data:"Your Trial Ended" });
    }

  } catch (err) {
    next(err);
  }
};


export async function addConversation(req, res) {
  try {
  
    const Conversation = new Conversation(req.body);
    Conversation.save()
        res.status(201).send({ status: "Success", data: Conversation });
  } catch (error) {
    return res.status(201).send({ status: "error", data: error });
  }
}

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Conversation.findByIdAndDelete(id);
    res.status(200).json({ status: "Success", data: id });
  } catch (err) {
    next(err);
  }
};
export const getConversation = async (req, res, next) => {
  const { id } = req.query;
  try {
    const doc = await Conversation.findById(id);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};





export const fetchUsersConversations = async (req, res, next) => {
  try {
    const id = req.params.id;

    const Conversations = await Conversation.find({ user: id }); 

    res.status(200).json(Conversations);
  } catch (err) {
    next(err);
  }
};


export const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let status = req.query.status || "All";
    let researchArea = req.query.researchArea || "";

    const statusOptions = [
      "Screening",
      "Did Not Pass Screening",
      "Reviewing",
      "Payment Verified Waiting For DOI",
      "Payment Verified And DOI is Added",
      "Did Not Pass Review",
      "Published",
    ];


    status === "All"
      ? (status = [...statusOptions])
      : (status = req.query.status.split(","));

    const Conversations = await Conversation.find({
      title: { $regex: search, $options: "i" },
    })
      .where("status")
      .in([...status])

      .skip(page * limit)
      .limit(limit);

    const total = await Conversation.countDocuments({
      status: { $in: [...status] },
      title: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      search,
      Conversations,
      status,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

