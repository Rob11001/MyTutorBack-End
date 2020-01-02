// Import dotenv
const dotenv = require('dotenv');
// Configure dotenv
dotenv.config();

const nodemailer = require('nodemailer');
const template = require('../static/template-emails.json');
const user = {
  email: 'noreply.mytutor@gmail.com', // Si potrebbero mettere nel .env
  password: 'MyTutorPassword',
};
const domain = 'localhost:3000'; // Mettere nel .env

exports.sendEmailToProfessor = (receiver, token) => {
  const transport = createTransport();
  const email = template.toProfessor;
  let body = email.body;
  body = `${body}${email.link.substring(0, 20)}"http://${domain}/signin?token=${token}"${email.link.substring(22)}`;
  body = `${body}${email.greetings}`;
  const mailOptions = {
    from: user.email,
    to: receiver,
    subject: email.subject,
    html: body,
  };
  return transport.sendMail(mailOptions); // Return a promise to check if there is an error
};

createTransport = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
    auth: {
      user: user.email,
      pass: user.password,
    },
  });
};