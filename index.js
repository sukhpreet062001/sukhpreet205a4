let express = require('express')
let exphbs  = require('express-handlebars')

const { Client } = require('pg')

const client = new Client({
  user: 'oooufoclfzfilm',
  host: 'ec2-44-192-245-97.compute-1.amazonaws.com',
  database: 'db67bifof96j3a',
  password: '1a11d0881ab389350a58babd9b18445cba204c639732448a5a17dc3a6c0a051e',
  port: 5432,
  sslmode: 'require'
})

client.connect()

let app = express()
let router = express.Router()
let path = require('path')
const { response } = require('express')

app.use(express.urlencoded({ extended: true }))
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')

router.get('/', function (req, res) {
  res.render('home')
})

router.get('/home', function (req, res) {
  res.render('home')
})

router.get('/plans', function (req, res) {

  const query = {
    name: 'fetch-plans',
    text: 'SELECT * FROM plans'
  }
  
  client.query(query, (err, response) => {
    if (err) {
      console.log(err.stack)
    } else {
      let plans = [
        [response.rows[0]['plan'], response.rows[0]['cost'], response.rows[0]['websites'], response.rows[0]['storage'], response.rows[0]['visits'], response.rows[0]['emails'], response.rows[0]['ssl'], response.rows[0]['domains'], response.rows[0]['bandwidth']],
        [response.rows[1]['plan'], response.rows[1]['cost'], response.rows[1]['websites'], response.rows[1]['storage'], response.rows[1]['visits'], response.rows[1]['emails'], response.rows[1]['ssl'], response.rows[1]['domains'], response.rows[1]['bandwidth']],
        [response.rows[2]['plan'], response.rows[2]['cost'], response.rows[2]['websites'], response.rows[2]['storage'], response.rows[2]['visits'], response.rows[2]['emails'], response.rows[2]['ssl'], response.rows[2]['domains'], response.rows[2]['bandwidth']]
      ]
      
      res.render('cwh', {plans: plans})  
    }
  })
})

router.get('/dashboard', function(req, res) {
  let data = {
    name: req.query.name,
    username: req.query.user,
    admin: req.query.admin
  }
  
  if(data.name !== undefined && data.username !== undefined) {
    res.render('dashboard', data)
  } else {
    res.redirect('/login')
  }
})

router.get('/registration', function (req, res) {
  res.render('registration')
})

router.post('/registration', function (req, res) {
  let username = req.body.username
  let password = req.body.password
  let fullname = req.body.fullname
  let company = req.body.company
  let address = req.body.address
  let phone = req.body.phone
  let admin = req.body.admin ?? "FALSE"

  let usernameError = "", passwordError = "", fullnameError = "", companyError = "", addressError = "", phoneError = "";

  let usernamePattern = /^[a-zA-Z0-9]*$/
  let passwordPattern = /^([a-zA-Z0-9]){6,12}$/
  let fullnamePattern = /^([a-z\s]|[A-Z\s]){1,30}$/ //Maximum 30 characters
  let companyPattern = /^([a-z\s]|[A-Z\s]){1,20}$/
  let addressPattern = /^([a-z\s]|[A-Z\s]){1,100}$/
  let phonePattern = /^([0-9]){1,14}$/

  if(username.trim().length === 0) {
    usernameError = "Username cannot be empty"
  } else if(!usernamePattern.test(username)) {
    usernameError = "Username cannot contain special characters"
  }

  if(password.trim().length === 0) {
    passwordError = "Password cannot be empty"
  } else if(!passwordPattern.test(password)) {
    passwordError = "Password should be 6 to 12 characters long"
  }

  if(fullname.trim().length === 0) {
    fullnameError = "Fullname cannot be empty"
  } else if(!fullnamePattern.test(fullname)) {
    fullnameError = "Fullname should be less than 30 characters"
  }

  if(company.trim().length === 0) {
    companyError = "Company name cannot be empty"
  } else if(!companyPattern.test(company)) {
    companyError = "Company Name should be less than 20 characters"
  }

  if(address.trim().length === 0) {
    addressError = "Address cannot be empty"
  } else if(!addressPattern.test(address)) {
    addressError = "Address should be less than 100 characters"
  }

  if(phone.trim().length === 0) {
    phoneError = "Phone cannot be empty"
  } else if(!phonePattern.test(phone)) {
    phoneError = "Phone should contain less than 15 digits"
  }

  if(usernameError.length === 0 && passwordError.length === 0 && fullnameError.length === 0 && companyError.length === 0 && addressError.length === 0 && phoneError.length === 0) {
    
    const query = {
      name: 'create-user',
      text: `INSERT INTO users (username, password, fullname, company, address, phone, admin) VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, $6, $7)`,
      values: [username, password, fullname, company, address, phone, admin]
    }
    
    client.query(query, (err, response) => {
      if (err) {
        console.log(err.stack)
      } else {
        admin === "TRUE" ? res.redirect('/dashboard?admin=yes&name='+fullname+'&user='+username) : res.redirect('/dashboard?name='+fullname+'&user='+username)
      }
    })
  } else {
    res.render('registration', {
      usernameError: usernameError,
      passwordError: passwordError,
      fullnameError: fullnameError,
      companyError: companyError,
      addressError: addressError,
      phoneError: phoneError,
      usernameSent: username,
      passwordSent: password,
      fullnameSent: fullname,
      companySent: company,
      addressSent: address,
      phoneSent: phone,
    })
  }
})

router.get('/login', function (req, res) {
  res.render('login')
})

router.post('/login', function(req, res) {
  let username = req.body.username
  let password = req.body.password

  let usernameError = "", passwordError = "";

  let usernamePattern = /[a-zA-Z0-9]/

  if(username.trim().length === 0) {
    usernameError = "Username cannot be empty"
  } else if(!usernamePattern.test(username)) {
    usernameError = "Username cannot contain special characters"
  }

  if(password.trim().length === 0) {
    passwordError = "Password cannot be empty"
  }

  if(usernameError.length === 0 && passwordError.length === 0) {
    
    const query = {
      name: 'fetch-user',
      text: `SELECT * FROM users WHERE username = $1 AND password = crypt($2, password)`,
      values: [username, password]
    }
    
    client.query(query, (err, response) => {
      if (err) {
        console.log(err.stack)
      } else {
        if(response.rowCount !== 0) {
          let fullname = response.rows[0]['fullname'];
          let username = response.rows[0]['username'];
          let admin = response.rows[0]['admin'];

          admin === true ? res.redirect('/dashboard?admin=yes&name='+fullname+'&user='+username) : res.redirect('/dashboard?name='+fullname+'&user='+username)
        }
        else {
          res.render('login', {
            usernameError: "Check username and password"
          })
        }
      }
    })
  } else {
    res.render('login', {
      usernameError: usernameError,
      passwordError: passwordError,
      usernameSent: username,
      passwordSent: password
    })
  }
})

let port = process.env.PORT || 3000;
app.use(express.static('views'));
app.use(router);

app.listen(port, function () {
  console.log(`Listening at Port:${port}`)
});