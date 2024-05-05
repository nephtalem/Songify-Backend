import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Editor from "../models/Editor.js";
import Paper from "../models/Campaign.js";
import { customMail } from "./mailer.js";

export const updateAdmin = async (req, res, next) => {
  try {
    const a = await Admin.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({ status: "Success", data: a });
  } catch (err) {
    next(err);
  }
};
export const deleteAdmin = async (req, res, next) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json("Admin has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getAdmin = async (req, res, next) => {
  const { id } = req.query;
  try {
    const doc = await Admin.findById(id);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};
export const getAdminFromUserName = async (req, res, next) => {
  const { userName } = req.query;
  try {
    const doc = await Admin.findOne({ userName });
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

export const ApproveScreeningPaper = async (req, res, next) => {
  const { paperId } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper1 = await Paper.findById(paperId);
      if (
        paper1.status === "Screening" ||
        paper1.status === "Resubmitted For Screening"
      ) {
        await Paper.findByIdAndUpdate(
          paperId,
          {
            $set: {
              status: "Reviewing",
              isPaperScreened: true,
            },
          },
          { new: true }
        );

        const UserData = await User.findById(paper1?.User);
        const { email, first_name, last_name, prefix } = UserData;
        const username = `${first_name} ${last_name}`;
        const subject = "Change In Paper Status";
        const text = [
          `Your paper “${paper1?.title}” has successfully passed the Screening and reviewers invited.`,
          `Reference ID: ${paper1?._id}`,
          `Please login to http://jbrahma.io/ know the status of your paper. `,
        ];
        const data = { username, subject, text, userEmail: email };
        await customMail(data);

        const editors = await Editor.find({
          researchArea: { $in: [paper1?.researchArea] },
        });
        await Promise.all(
          editors?.map(async (editor, index) => {
            const { email, first_name, last_name, prefix } = editor;
            const username = `${prefix} ${first_name} ${last_name}`;
            const subject = "New paper related to your research area";
            const text = `New paper called "${paper1?.title}" has been screened, It is related to your research area which is "${paper1?.researchArea}" \n You can review the paper here  http://jbrahma.io/paper/${paper1._id}. \n Note that only 5 reviewers are allowed to review a paper, add this paper as soon as possible.`;
            const data = { username, subject, text, userEmail: email };
            await customMail(data);
          })
        );

        res.status(200).json({ status: "Success", data: editors });
      } else {
        res
          .status(200)
          .json({ status: "Error", data: "Paper status wasn't screening" });
      }
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    next(err);
  }
};
export const ResubmitScreeningPaper = async (req, res, next) => {
  const { paperId, comment } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper1 = await Paper.findById(paperId);
      if (
        paper1.status === "Screening" ||
        paper1.status === "Resubmitted For Screening"
      ) {
        const paper = await Paper.findByIdAndUpdate(
          paperId,
          {
            $set: {
              status: "Resubmit For Screening",
              adminsComment: comment,
            },
          },
          { new: true }
        );

        const UserData = await User.findById(paper?.User);
        const { email, first_name, last_name } = UserData;
        const username = `${first_name} ${last_name}`;
        const subject = "Decision made on your paper";
        const text = [
          `We regret to inform you that your paper “${paper?.title}” did not pass the screening.`,
          `Reference ID: ${paper?._id}`,
          `Please login to http://jbrahma.io/ know the comments.`,
        ];

        const data = { username, subject, text, userEmail: email };
        await customMail(data);

        res.status(200).json({ status: "Success", data: paper });
      } else {
        res
          .status(200)
          .json({ status: "error", data: "Paper status wasn't screening" });
      }
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    next(err);
  }
};

export const RejectScreeningPaper = async (req, res, next) => {
  const { paperId } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper1 = await Paper.findById(paperId);
      if (
        paper1.status === "Screening" ||
        paper1.status === "Resubmitted For Screening"
      ) {
        const paper = await Paper.findByIdAndUpdate(
          paperId,
          {
            $set: {
              status: "Did Not Pass Screening",
            },
          },
          { new: true }
        );

        const UserData = await User.findById(paper?.User);
        const { email, first_name, last_name } = UserData;
        const username = `${first_name} ${last_name}`;
        const subject = "Decision made on your paper";
        const text = [
          `We regret to inform you that your paper “${paper?.title}” did not pass the screening.`,
          `Reference ID: ${paper?._id}`,
          `Please login to http://jbrahma.io/ know the comments.`,
        ];

        const data = { username, subject, text, userEmail: email };
        await customMail(data);

        res.status(200).json({ status: "Success", data: paper });
      } else {
        res
          .status(200)
          .json({ status: "error", data: "Paper status wasn't screening" });
      }
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    next(err);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let sort = req.query.sort || "pricing";
    let specialization = req.query.specialization || "All";
    let cities = req.query.cities || "All";

    const specializationOptions = [
      "urology",
      "neurology",
      "dentist",
      "orthopedic",
      "cardiologist",
    ];

    const cityOptions = [
      "Addis Ababa",
      "Dere Dawa",
      "Gonder",
      "Arba Mench",
      "Mekele",
      "Adama",
    ];

    specialization === "All"
      ? (specialization = [...specializationOptions])
      : (specialization = req.query.specialization.split(","));
    cities === "All"
      ? (cities = [...cityOptions])
      : (cities = [req.query.cities]);
    req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

    let sortBy = {};
    if (sort[1]) {
      sortBy[sort[0]] = sort[1];
    } else {
      sortBy[sort[0]] = "asc";
    }

    const docs = await Admin.find({
      userName: { $regex: search, $options: "i" },
    })
      .where("specialization")
      .in([...specialization])
      .where("city")
      .in([...cities])
      .sort(sortBy)
      .skip(page * limit)
      .limit(limit);

    // const {userName, first_name, last_name, pricing, experienceYears} = docs;
    // const Admins = {userName, first_name, last_name, pricing, experienceYears};

    const total = await Admin.countDocuments({
      specialization: { $in: [...specialization] },
      userName: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      specializations: specializationOptions,
      cities: cityOptions,
      docs,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};
