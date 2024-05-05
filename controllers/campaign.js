import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import { customMail } from "./mailer.js";

export const updateCampaign = async (req, res, next) => {
  const { dataUpdate } = req.body;
  const id = req.params.id;
  try {
    const d = await Campaign.findById(id);
    if (d?.user === req.user.userId) {
      Campaign.findOneAndUpdate({ _id: id }, dataUpdate).then(
        (updatedDocument) => {
          res.status(200).json({ status: "Success" });
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


export async function addCampaign(req, res) {
  try {
    const campaign = new Campaign(req.body);
    campaign.save().then(async (result) => {
      await User.findByIdAndUpdate(
        result.user,
        { $push: { campaigns: result._id } },
        { new: true }
      )
        .then((result2) => {
          const { email, first_name, last_name } = result2;
          const username = `${first_name} ${last_name}`;
          const subject = "Successful Campaign Submission";
          const text = [
            `You have successfully submitted the Campaign:  "${result?.title}" `,
            `Reference ID: ${result._id}`,
            `For all future correspondence please quote the above reference number.`,
          ];
          const data = { username, subject, text, userEmail: email };
          customMail(data).then(() => {
            res.status(201).send({ status: "Success", data: result });
          });
        })
        .catch((error) =>
          res.status(201).send({ status: "error", data: error })
        );
    });
  } catch (error) {
    return res.status(201).send({ status: "error", data: error });
  }
}

export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const d = await Campaign.findById(id);
    User.updateOne(
      { _id: d.User },
      { $pull: { campaigns: id } },
      (error, result) => {
        if (error) {
          console.error("Error updating document:", error);
        } else {
          console.log("Element removed from array:", result);
        }
      }
    );

    await Campaign.findByIdAndDelete(id);
    res.status(200).json({ status: "Success", data: id });
  } catch (err) {
    next(err);
  }
};
export const getCampaign = async (req, res, next) => {
  const { id } = req.query;
  try {
    const doc = await Campaign.findById(id);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

export const getCampaignFromUserName = async (req, res, next) => {
  const { userName } = req.query;
  try {
    const doc = await Campaign.findOne({ userName });
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};




export const fetchUsersCampaigns = async (req, res, next) => {
  try {
    const { userId , type} = req.body;

    const campaign = await Campaign.find({ user: userId, type: type }); 

    res.status(200).json(campaign);
  } catch (err) {
    next(err);
  }
};


export const getCampaigns = async (req, res, next) => {
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

    const Campaigns = await Campaign.find({
      title: { $regex: search, $options: "i" },
    })
      .where("status")
      .in([...status])

      .skip(page * limit)
      .limit(limit);

    const total = await Campaign.countDocuments({
      status: { $in: [...status] },
      title: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      search,
      Campaigns,
      status,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

