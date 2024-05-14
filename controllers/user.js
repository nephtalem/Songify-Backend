


import puppeteer from 'puppeteer';
import fs from 'fs';
import User from "../models/User.js";


export const generatePdf = async (req, res, next) => {
    try {
      const {html,template} = req.body;
      let css;
    
      if(html){
        if(template === 1){
        css = fs.readFileSync('template1.css', 'utf-8');
        }else if(template === 2)
        {
        css = fs.readFileSync('template2.css', 'utf-8');
        }
 
        // const css = fs.readFileSync(path.resolve(__dirname, 'your-component-styles.css'), 'utf8');

        // Combine component HTML and CSS into a single HTML string
        const html1 = `
          <html>
            <head>
              <style>${css}</style>
            </head>
            <body>
              <div id="root">${html}</div>
            </body>
          </html>
        `;
        console.log(html1)
        const browser = await puppeteer.launch(
          {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH? process.env.PUPPETEER_EXECUTABLE_PATH : false,
          args : [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      );
  
  
        const page = await browser.newPage();

        // Load the HTML content
        // await page.goto(`https://dashboard.resumez.tech/resume1`, { waitUntil: 'domcontentloaded' });
      
      
        await page.setContent(html1, { waitUntil: 'domcontentloaded' });
      
   
        await page.emulateMediaType('screen');
      

        const pdf = await page.pdf({
          // path: 'result.pdf',
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          printBackground: true,
          format: 'A4',
        });
      
        // Close the browser instance
        await browser.close();
        res.contentType("application/pdf");
        res.send(pdf);
      }
      // res.status(200).json({ status: "Success", data: a });
    } catch (err) {
        res.status(200).json({ status: "error", data: err });
    }
  };

export const updateUser = async (req, res, next) => {
    try {
      const a = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { new: true }
      );
      res.status(200).json({ status: "Success", data: a });
    } catch (err) {
      next(err);
    }
  };
  export const deleteUser = async (req, res, next) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted.");
    } catch (err) {
      next(err);
    }
  };
  export const getUser = async (req, res, next) => {
    const { id } = req.query;
    try {
      const doc = await User.findById(id);
      res.status(200).json(doc);
    } catch (err) {
      next(err);
    }
  };

  
export const getUsers = async (req, res, next) => {
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
  
      const docs = await User.find({
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
      // const Users = {userName, first_name, last_name, pricing, experienceYears};
  
      const total = await User.countDocuments({
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