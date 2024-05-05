import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';


const email1 = process.env.EMAIL;
const password1 = process.env.EMAILPASSWORD;



const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: "nattyinthehouse4@gmail.com",
      pass: "I4NhJp8MW7vBRkQ0",
    }
});


let MailGenerator = new Mailgen({
    theme: "default",
    product : {
        name: "JBrahma",
        link: 'https:/jbrahma.io/'
    }
})

export const registerMail = async (req, res) => {
    console.log("EMAIL", email1 ,password1, process.env.EMAIL)
    
    const { username, userEmail, text, subject } = req.body;

    // body of the email
    var email = {
        body : {
            name: username,
            intro : text,
            // outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }

    let emailBody = MailGenerator.generate(email);

    let message = {
        from : process.env.EMAIL,
        to: userEmail,
        subject : subject || "Signup Successful",
        html : emailBody
    }

    // send mail
    transporter.sendMail(message)
        .then(() => {
            return res.status(200).send({ status:"Success", data: "You should receive an email from us."})
        })
        .catch(error => res.status(200).send({status:"error", data: error }))

}
export const registerEditorMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;

    // body of the email
    var email = {
        body : {
            name: username,
            intro : text || 'Welcome to Editor! We\'re very excited to have you on board.',
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }

    let emailBody = MailGenerator.generate(email);

    let message = {
        // from : process.env.EMAIL,
        from : "nattyinthehouse4@gmail.com",
        to: userEmail,
        subject : subject || "Signup Successful",
        html : emailBody
    }

    // send mail
    transporter.sendMail(message)
        .then(() => {
            return res.status(200).send({ msg: "You should receive an email from us."})
        })
        .catch(error => res.status(500).send({ error }))

}

export const customMail = async (data) => {
    const { username, userEmail, text, subject } = data;

    // body of the email
    var email = {
        body : {
            name: username,
            intro : text || 'Welcome to Editor! We\'re very excited to have you on board.',
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }

    let emailBody = MailGenerator.generate(email);

    let message = {
        // from : process.env.EMAIL,
        from : "nattyinthehouse4@gmail.com",
        to: userEmail,
        subject : subject || "Signup Successful",
        html : emailBody
    }

    // send mail
    const res = transporter.sendMail(message)
        .then(() => {
            return "Success"
        })
        .catch(error => res.status(500).send({ error }))
}