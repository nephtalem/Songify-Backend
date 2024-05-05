import Author from "../models/User.js";
import Editor from "../models/Editor.js";
import Paper from "../models/Paper.js";
import { customMail, registerMail } from "./mailer.js";

export const updateReviewer = async (req, res, next) => {
  try {
    const a = await Editor.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({ status: "Success", data: a });
  } catch (err) {
    next(err);
  }
};
export const addReviewingPaper = async (req, res, next) => {
  const { paperId, reviewerAgreementHash } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper = await Paper.findById(paperId);
      const reviewer = await Editor.findById(id);
      const { orcidId } = reviewer;
      let orcidMatched = false;
      paper.authors?.map((author) => {
        if (author.orcidId === orcidId) {
          orcidMatched = true;
        }
      });
      if (!orcidMatched) {
        const reviewersofpaperCount = paper.reviewerCount;
        if (reviewersofpaperCount < 5) {
          const reviewer = await Editor.findById(id);
          const isAlreadyReviwing =
            reviewer?.papersReviewing?.indexOf(paperId) > -1;
          const isAlreadyReviewed =
            reviewer?.papersReviewed?.indexOf(paperId) > -1;
          if (!isAlreadyReviwing && !isAlreadyReviewed) {
            await Editor.findByIdAndUpdate(
              id,
              {
                $push: {
                  papersReviewing: paperId,
                },
              },
              { new: true }
            );
            await Paper.findByIdAndUpdate(
              paperId,
              {
                $push: {
                  reviewers: {
                    id,
                    comment: "",
                    decision: "Pending",
                    reviewerAgreementHash,
                  },
                },
                $inc: { reviewerCount: 1 },
              },
              { new: true }
            );
            res.status(200).json({ status: "Success" });
          } else {
            res.status(200).json({
              status: "error",
              data: "You Already Are Reviewing The Paper",
            });
          }
        } else {
          res.status(200).json({
            status: "error",
            data: "Paper Is Already reviewed by 5 reviewers",
          });
        }
      } else {
        res.status(200).json({
          status: "error",
          data: "Your ORCID ID is matched with one of the authors of this paper",
        });
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
export const ApproveReviewingPaper = async (req, res, next) => {
  const { paperId, comment } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper = await Paper.findById(paperId);
      const paperReviewers = paper.reviewers;
      await Promise.all(
        paperReviewers?.map(async (rev, index) => {
          if (rev.id === id) {
            await Paper.findByIdAndUpdate(
              paperId,
              {
                $set: {
                  [`reviewers.${index}`]: { decision: "Approved", comment, id },
                },
              },
              { new: true }
            );
          }
        })
      );
      Editor.findByIdAndUpdate(
        id,
        {
          $pull: { papersReviewing: paperId },
          $push: { papersReviewed: paperId },
          $inc: { rewardPoints: 10 },
        },
        { new: true }
      ).catch((error) => {
        console.log(error);
      });
      const paper2 = await Paper.findById(paperId);
      const alreadyReviewed = paper2.isPaperReviewed;
      const paperReviewers2 = paper2.reviewers;
      let ApprovalCountA = 0;
      let RejectionCountA = 0;
      let ResubmitCountA = 0;
      if (!alreadyReviewed) {
        await Promise.all(
          paperReviewers2?.map(async (rev) => {
            if (rev.decision === "Approved") {
              ApprovalCountA++;
            } else if (rev.decision === "Rejected") {
              RejectionCountA++;
            } else if (rev.decision === "Resubmit") {
              ResubmitCountA++;
            }
          })
        );
        if (ApprovalCountA >= 3) {
          const acceptedDate = new Date();
          await Paper.findByIdAndUpdate(
            paperId,
            {
              $set: {
                status: "Payment Pending",
                isPaperReviewed: true,
                acceptedDate,
              },
            },
            { new: true }
          );
          const authorData = await Author.findById(paper2?.author);
          const { email, first_name, last_name } = authorData;
          const username = `${first_name} ${last_name}`;
          const subject = "Decision made on your paper";
          const text = [
            `Decision has been made to your research paper: "${paper2?.title}"`,
            `Reference ID: ${paper2?._id}`,
            `Congratulations!!! Your paper is accepted for publication.`,
            `Please login to http://jbrahma.io/ know the reviewers comments.`,
            `Steps to be followed:`,
            `   1.	Make payment`,
            `   2.	Transfer copyright`,
            `   3.	Submit final camera ready paper.`,
          ];
          const data = { username, subject, text, userEmail: email };
          await customMail(data);
        } else if (ApprovalCountA + RejectionCountA + ResubmitCountA >= 3) {
          try {
            const authorData = await Author.findById(paper2?.author);
            const { email, first_name, last_name } = authorData;
            const username = `${first_name} ${last_name}`;
            const subject = "Decision made on your paper";
            const text = [
              `Decision has been made to your research paper: ${paper2?.title}`,
              `Reference ID: ${paper2?._id}`,
              `Congratulations!!! Your paper is accepted with revisions for publication.`,
              `Please login to http://jbrahma.io/  to know the reviewer’s comments. You are requested to incorporate the reviewer’s comments and submit final camera  ready paper.`,
              `Steps to be followed:`,
              `   1.	Make payment`,
              `   2.	Transfer copyright`,
              `   3.	Submit final camera ready paper.`,
            ];

            const data = { username, subject, text, userEmail: email };
            await customMail(data);
          } catch (error) {
            res.status(200).json({ status: "error1", data: error });
          }
          await Paper.findByIdAndUpdate(
            paperId,
            {
              $set: {
                status: "Resubmit for Review",
                isPaperReviewed: true,
              },
            },
            { new: true }
          );
        }
      }
      res.status(200).json({
        status: "Success",
        data: {
          alreadyReviewed,
          RejectionCountA,
          ApprovalCountA,
          ResubmitCountA,
        },
      });
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    next(err);
  }
};
export const RejectReviewingPaper = async (req, res, next) => {
  const { paperId, comment } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper = await Paper.findById(paperId);
      const paperReviewers = paper.reviewers;
      await Promise.all(
        paperReviewers?.map(async (rev, index) => {
          if (rev.id === id) {
            await Paper.findByIdAndUpdate(
              paperId,
              {
                $set: {
                  [`reviewers.${index}`]: { decision: "Rejected", comment, id },
                },
              },
              { new: true }
            );
          }
        })
      );
      Editor.findByIdAndUpdate(
        id,
        {
          $pull: { papersReviewing: paperId },
          $push: { papersReviewed: paperId },
          $inc: { rewardPoints: 10 },
        },
        { new: true }
      ).catch((error) => {
        console.log(error);
      });
      const paper2 = await Paper.findById(paperId);
      const alreadyReviewed = paper2.isPaperReviewed;
      const paperReviewers2 = paper2.reviewers;
      let ApprovalCount = 0;
      let RejectionCount = 0;
      let ResubmitCount = 0;
      if (!alreadyReviewed) {
        await Promise.all(
          paperReviewers2?.map(async (rev) => {
            if (rev.decision === "Approved") {
              ApprovalCount++;
            } else if (rev.decision === "Rejected") {
              RejectionCount++;
            } else if (rev.decision === "Resubmit") {
              ResubmitCount++;
            }
          })
        );
        if (RejectionCount >= 2) {
          const authorData = await Author.findById(paper2?.author);
          const { email, first_name, last_name } = authorData;
          const username = `${first_name} ${last_name}`;
          const subject = "Decision made on your paper";
          const text = [
            `Decision has been made to your research paper: "${paper2?.title}"`,
            `Reference ID: ${paper2?._id}`,
            `We regret to inform you that your paper did not pass through the review process.`,
            `Please login to http://jbrahma.io/  to know the reviewer’s comments. `,
            `You may resubmit as a new submission after major revision incorporating reviewer’s comments.`,
          ];
          const data = { username, subject, text, userEmail: email };
          await customMail(data);
          await Paper.findByIdAndUpdate(
            paperId,
            {
              $set: {
                status: "Did Not Pass Review",
                isPaperReviewed: true,
              },
            },
            { new: true }
          );
        } else if (ApprovalCount + RejectionCount + ResubmitCount >= 3) {
          try {
            const authorData = await Author.findById(paper2?.author);
            const { email, first_name, last_name } = authorData;
            const username = `${first_name} ${last_name}`;
            const subject = "Decision made on your paper";
            const text = [
              `Decision has been made to your research paper: ${paper2?.title}`,
              `Reference ID: ${paper2?._id}`,
              `Congratulations!!! Your paper is accepted with revisions for publication.`,
              `Please login to http://jbrahma.io/  to know the reviewer’s comments. You are requested to incorporate the reviewer’s comments and submit final camera  ready paper.`,
              `Steps to be followed:`,
              `   1.	Make payment`,
              `   2.	Transfer copyright`,
              `   3.	Submit final camera ready paper.`,
            ];
            const data = { username, subject, text, userEmail: email };
            await customMail(data);
          } catch (error) {
            res.status(200).json({ status: "error1", data: error });
          }
          await Paper.findByIdAndUpdate(
            paperId,
            {
              $set: {
                status: "Resubmit for Review",
                isPaperReviewed: true,
              },
            },
            { new: true }
          );
        }
      }
      res.status(200).json({
        status: "Success",
        data: {
          alreadyReviewed,
          RejectionCount,
          ApprovalCount,
          ResubmitCount,
        },
      });
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    next(err);
  }
};
export const ResubmitReviewingPaper = async (req, res, next) => {
  const { paperId, comment } = req.body;
  const { id } = req.params;
  try {
    if (paperId && id) {
      const paper = await Paper.findById(paperId);
      const paperReviewers = paper.reviewers;
      await Promise.all(
        paperReviewers?.map(async (rev, index) => {
          if (rev.id === id) {
            await Paper.findByIdAndUpdate(
              paperId,
              {
                $set: {
                  [`reviewers.${index}`]: { decision: "Resubmit", comment, id },
                },
              },
              { new: true }
            );
          }
        })
      );
      const paper2 = await Paper.findById(paperId);
      const alreadyReviewed = paper2.isPaperReviewed;
      const paperReviewers2 = paper2.reviewers;
      let ApprovalCount = 0;
      let RejectionCount = 0;
      let ResubmitCount = 0;
      if (!alreadyReviewed) {
        await Promise.all(
          paperReviewers2?.map(async (rev) => {
            if (rev.decision === "Approved") {
              ApprovalCount++;
            } else if (rev.decision === "Rejected") {
              RejectionCount++;
            } else if (rev.decision === "Resubmit") {
              ResubmitCount++;
            }
          })
        );
        if (ResubmitCount + RejectionCount + ApprovalCount >= 3) {
          try {
            const authorData = await Author.findById(paper2?.author);
            const { email, first_name, last_name } = authorData;
            const username = `${first_name} ${last_name}`;
            const subject = "Decision made on your paper";
            const text = [
              `Decision has been made to your research paper: ${paper2?.title}`,
              `Reference ID: ${paper2?._id}`,
              `Congratulations!!! Your paper is accepted with revisions for publication.`,
              `Please login to http://jbrahma.io/  to know the reviewer’s comments. You are requested to incorporate the reviewer’s comments and submit final camera  ready paper.`,
              `Steps to be followed:`,
              `   1.	Make payment`,
              `   2.	Transfer copyright`,
              `   3.	Submit final camera ready paper.`,
            ];
            const data = { username, subject, text, userEmail: email };
            await customMail(data);
          } catch (error) {
            res.status(200).json({ status: "error1", data: error });
          }
          await Paper.findByIdAndUpdate(
            paperId,
            {
              $set: {
                status: "Resubmit for Review",
                isPaperReviewed: true,
              },
            },
            { new: true }
          );
        }
      }
      res.status(200).json({
        status: "Success",
        data: {
          alreadyReviewed,
          RejectionCount,
          ApprovalCount,
          ResubmitCount,
        },
      });
    } else {
      res
        .status(200)
        .json({ status: "error", data: "IDs Not Supplied Correctly" });
    }
  } catch (err) {
    res.status(200).json({ status: "error", data: err });
  }
};
export const deleteReviewer = async (req, res, next) => {
  try {
    await Editor.findByIdAndDelete(req.params.id);
    res.status(200).json("Reviewer has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const addReviewer = async (req, res, next) => {
  try {
    const user = new Editor({
      email: req.body.email,
      userName: req.body.userName,
    });

    // return save result as a response
    user
      .save()
      .then((result) =>
        res.status(201).send({ status: "Success", data: result })
      )
      .catch((error) => res.status(201).send({ status: "error", data: error }));
  } catch (err) {
    next(err);
  }
};
export const getReviewer = async (req, res, next) => {
  const { id } = req.query;
  try {
    const doc = await Editor.findById(id);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};
export const getReviewerFromUserName = async (req, res, next) => {
  const { userName } = req.query;
  try {
    const doc = await Editor.findOne({ userName });
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

export const getReviewers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let researchArea = req.query.researchArea;

    const researchAreaOptions = [
      "Computer Hardware And Architecture",
      "Networks And Distributed Systems",
      "Security And Privacy",
      "Robotics And Artificial Intelligence",
      "Information Systems And Management",
      "Software And Its Engineering ",
      "Theoretical Foundations",
      "Human Centered Computing",
      "Mathematics Of Computing",
      "Applied Computing",
      "Quantum Technology",
      "Graphics And Multimedia",
      "Computing For Social Good",
      "Distributed Ledger Technology",
      "Informatics",
    ];

    researchArea === ""
      ? (researchArea = [...researchAreaOptions])
      : (researchArea = [researchArea]);

    const reviewers = await Editor.find({
      first_name: { $regex: search, $options: "i" },
    })
      // .where("researchArea")
      // .in([...researchArea])
      .skip(page * limit)
      .limit(limit);

    const total = await Editor.countDocuments({
      // title: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      reviewers,
      researchArea,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};
