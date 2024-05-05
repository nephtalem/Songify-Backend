import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { customMail } from "./mailer.js";

export async function verifyUser(req, res, next) {
  try {
    const { userName } = req.method == "GET" ? req.query : req.body;

    // check the user existance
    let exist = await Admin.findOne({ userName });
    if (!exist) return res.status(200).send({ status:"error", data: "Can't find User!" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}


export async function registerAdmin(req, res) {
  try {

    // res.status(201).send(req.body)
    let { password } = req.body;

    if (password) {
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
         
          const user = new Admin(
            {
              ...req.body, password: hashedPassword
            }
          );

          // return save result as a response
          user
            .save()
            .then((result) =>
              res.status(201).send({ status: "Success", data: result })
            )
            .catch((error) =>
              res.status(201).send({ status: "error", data: error })
            );
        })
        .catch((error) => {
          return res.status(201).send({
            status: "error",
            data: "Enable to hashed password",
          });
        });
      }     
  } catch (error) {
    return res.status(201).send({ status: "error", data: error });
  }
}

export async function loginAdmin(req, res) {
  const { email, password } = req.body;

  try {
    Admin.findOne({ email })
      .then((user) => {
        // return res.status(200).send({status:"error",  data: email });
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck)
              return res.status(200).send({status:"error",  data: "Password does not Match" });

            // create jwt token
            const token = jwt.sign(
              {
                userId: user._id,
                userName: user.userName,
                email: user.email,
                role: "Admin",
                profilePicture: user.profilePicture || "",
              },
              process.env.JWT,
              { expiresIn: "24h" }
            );

            return res.status(200).send({
              status: "Success",
              data: "Login Successful...!",
              userName: user.userName,
              token,
            });
          })
          .catch((error) => {
            return res.status(200).send({ status:"error",  data: error });
          });
      })
      .catch((err) => {
        return res.status(200).send({status:"error", data: err });
      });
  } catch (error) {
    return res.status(200).send({ status:"error",  data: error });
  }
}

export async function resetPassword(req, res) {
  try {
    // if (!req.app.locals.resetSession)
    //   return res.status(440).send({ error: "Session expired!" });

    const { userName, password } = req.body;

    try {
      Admin.findOne({ userName })
        .then((user) => {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              Admin.updateOne(
                { userName: user.userName },
                { password: hashedPassword },
                function (err, data) {
                  if (err) throw err;
                  req.app.locals.resetSession = false; // reset session
                  return res.status(201).send({ msg: "Record Updated...!" });
                }
              );
            })
            .catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not Found" });
        });
    } catch (error) {
      return res.status(500).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}
       

export async function changePassword(req, res) {
  try {
    const { id, oldPassword, newPassword } = req.body;

      Admin.findOne({ _id:id })
        .then((user) => {
          bcrypt
            .compare(oldPassword, user.password)
            .then((passwordCheck) => { 
              if (!passwordCheck)
              return res.status(200).send({status:"error",  data: "Password does not Match" }); 

              bcrypt.hash(newPassword, 10)
              .then((hashedPassword) =>{
              Admin.findOneAndUpdate(
                id,
                { $set: {password:hashedPassword}},
                { new: true },
                function (err, data) {
                  if (err) {
                    return res.status(200).send({
                    status:"error updating password", data: e,
                  })};
                  return res.status(201).send({status: 'Success'});
                }
              );
            }).catch((e) => {
              return res.status(200).send({
                status:"Enable to hashed password hashing", data: e,
              });
            })
          }).catch((e) => {
              return res.status(500).send({
                error: "Enable to hashed password comparing",
              });
            });

    }).catch((e) => {
      return res.status(200).send({
        status:"error", data:"user Not Found",
      });
    });

  }
  catch(err){
    return res.status(200).send({
      status:"error", data:err,
    });
  }
}

export async function sendOTPToChangePassword(req, res) {
  try{
  const email = req.body.email;
  const code = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  // console.log(email)
  Admin.findOne({ email:req.body.email })
  .then((user) => {
    // console.log(user)
    if(user){
    bcrypt.hash(code, 10).then((hashedcode) => {
      Admin.findOneAndUpdate(email, {
        passwordChangeOTP: hashedcode,
        resetOTPExpires: Date.now() + 3600000,
      }).then(async(admin) => {
        const username = `${admin?.first_name} ${admin?.last_name}`;
        const subject = "Password Reset"
        const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please copy this OTP to complete the process:\n\n${code}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        const data = { username, subject, text, userEmail:email}
        await customMail(data);

        return res
          .status(201)
          .send({ status: "Success" });
      });
    });

  }else{
    res
          .status(200)
          .send({ status: "error", error:"Email Not Found" });
  }
  })
} catch (error) {
  res
  .status(200)
  .send({ status: "error", error:"Error sending OTP" });
}
}
export async function verifyOTPToChangePassword(req, res) {
  try {
    const { email, OTP, newPassword } = req.body;

    // console.log(email, OTP, newPassword);
    const a = await Admin.findOne({ email }); // , resetOTPExpires: { $gt: new Date.now() }
    if (a) {
      // console.log(a.resetOTPExpires);
      const dateNow = Date.now();
      const isSessionValid = a?.resetOTPExpires > dateNow;
      if (isSessionValid) {
        const OTPCheck = await bcrypt.compare(OTP, a.passwordChangeOTP);

        if (OTPCheck === false) {
          res.status(200).send({ status: "error", data: "Invalid OTP" });
        } else {
          bcrypt
            .hash(newPassword, 10)
            .then((hashedPassword) => {
              Admin.findOneAndUpdate(
                email,
                { $set: { password: hashedPassword, resetOTPExpires: null, passwordChangeOTP: null } },
                { new: true },
                function (err, data) {
                  if (err) {
                    return res.status(200).send({
                      status: "error",
                      data: "Error updating password",
                    });
                  }
                  return res.status(201).send({ status: "Success" });
                }
              );
            })
            .catch((e) => {
              return res.status(200).send({
                status: "Enable to hashed password hashing",
                data: e,
              });
            });
        }
      } else {
        res.status(200).send({
          status: "error",
          data: "Session Out",
        });
      }
    } else {
      res.status(200).send({
        status: "error",
        data: "Email Not Found",
      });
    }
  } catch (err) {
    return res.status(200).send({
      status: "error",
      data: err,
    });
  }
}



export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
}


export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).send({ msg: "Verify Successsfully!" });
  }
  return res.status(400).send({ error: "Invalid OTP" });
}


export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    return res.status(201).send({ flag: req.app.locals.resetSession });
  }
  return res.status(440).send({ error: "Session expired!" });
}
