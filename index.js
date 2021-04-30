const express = require('express');
const rescue = require('express-rescue');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(bodyParser.json());

const SUCCESS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(SUCCESS).send();
});

const readCrushFile = async () => {
  try {
    const content = await fs.readFile(path.resolve(__dirname, '.', 'crush.json'));
  return JSON.parse(content.toString('utf-8'));
  } catch (error) {
    throw new Error(error);
  }  
};
const writeCrushFile = async (content) => (
  fs.writeFile(
    path.resolve(__dirname, '.', 'crush.json'),
    JSON.stringify(content),
    (err) => {
      if (err) throw err;
    },
  ));
function tokenGenerate() {
  const rand1 = Math.random().toString(36).substr(2);
  const rand2 = Math.random().toString(36).substr(2);
  const token = rand1 + rand2;
  const token16Characters = token.slice(0, 16);
  return token16Characters;
}
function validateToken(req, res, next) { 
  const token = req.headers.authorization;
  if (token === undefined) {
      return res.status(401).send({ message: 'Token não encontrado' });
  }
  
  if (token.length !== 16) return res.status(401).send({ message: 'Token inválido' });
  next();  
}
function validateName(name) {
  if (!name) return { message: 'O campo "name" é obrigatório' };
  if (name.length < 3) {
    return { message: 'O "name" deve ter pelo menos 3 caracteres' }; 
  }
} 

function validateAge(age) {
  if (!age) return { message: 'O campo "age" é obrigatório' };
  if (age < 18) {
    return { message: 'O crush deve ser maior de idade' };
  } 
}

function validateDateFormat(date) {
  const { datedAt } = date;
  const reg = /^(0[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  const validateBoolean = reg.test(datedAt);
  if (!validateBoolean) return { message: 'O campo "datedAt" deve ter o formato "dd/mm/aaaa"' };
}
function validateRate(date) {
  const { rate } = date;
  if (Number(rate) < 1 || Number(rate) > 5) {
    return { message: 'O campo "rate" deve ser um inteiro de 1 à 5' }; 
  }
}
function validateDate(date) {
  if (date === undefined || date.datedAt === undefined || date.rate === undefined) {  
    return { message: 'O campo "date" é obrigatório e "datedAt" e "rate" não podem ser vazios' };
  }
}

function validateFildeData(date) {
  const isInvalidDate = validateDate(date);
  if (isInvalidDate) return isInvalidDate;
  const isInvalidDateFormat = validateDateFormat(date);
  if (isInvalidDateFormat) return isInvalidDateFormat;
  const isInvalidRate = validateRate(date);
  if (isInvalidRate) return isInvalidRate;
}

function validateNameAndAge(name, age) {
  const isValidateName = validateName(name);
  if (isValidateName) return isValidateName;
  const isValidateAge = validateAge(age);
  if (isValidateAge) return isValidateAge;
}

function verifyEmail(email) {
  const reg = /\S+@\S+\.\S+/;
  return reg.test(email);
} 
function verifyPassword(password) {
  const passwordParsed = password.toString();
  const arrayPassword = passwordParsed.split('');
  if (arrayPassword.length < 6) {
   return 0;
  } 
    return 1;
}  
 
  app.get('/crush/search', validateToken, rescue(async (req, res) => {
  const { q } = req.query.q;
  const crushList = await readCrushFile();
  if (!q) res.status(200).send(crushList); 

  const crushMatch = crushList.filter((crush) => crush.name.includes(q));
  res.status(200).send(crushMatch);
  }));

  app.post('/crush', validateToken, async (req, res) => {
    const { name, age, date } = req.body;
    const resultValidateNameAndAge = validateNameAndAge(name, age);
    if (resultValidateNameAndAge) return res.status(400).send(resultValidateNameAndAge);
    const resultValidateFildeData = validateFildeData(date);
    if (resultValidateFildeData) return res.status(400).send(resultValidateFildeData);

    const crushList = await readCrushFile();
    const id = crushList.length + 1;
    const newCrush = { id, name, age, date };
    const newCrushList = [...crushList, newCrush];

    await writeCrushFile(newCrushList);
    res.status(201).send(newCrush);
  }); 
  app.get('/crush', async (_req, res) => {
    const result = await readCrushFile();
    if (result.length === 0) res.status(200).send([]);
    return res.status(200).send(result);
  });  

  app.get('/crush/:id', async (req, res) => {
    const crushList = await readCrushFile();
    const { id } = req.params;
    const crushId = parseInt(id, 10);  
    const filteredCrush = crushList.find((crush) => crush.id === crushId);
    if (filteredCrush) return res.status(200).send(filteredCrush);
    return res.status(404).send({ message: 'Crush não encontrado' });  
  });

  app.post('/login', (req, res) => {   
    const { email, password } = req.body;
    if (!email) res.status(400).send({ message: 'O campo "email" é obrigatório' });
    if (!verifyEmail(email)) {
       res.status(400).send({ message: 'O "email" deve ter o formato "email@email.com"' });
    }
   
    if (!password) {    
      res.status(400).send({ message: 'O campo "password" é obrigatório' });
    }
   const resultverifyPassword = verifyPassword(password);
  
    if (resultverifyPassword === 0) {
      res.status(400).send({ message: 'A "senha" deve ter pelo menos 6 caracteres' });
    }
    res.status(200).send({ token: tokenGenerate() });
  });

  app.delete('/crush/:id', validateToken, rescue(async (req, res) => {
    const { id } = req.params; 
    const crushId = parseInt(id, 10);
   
    const crushList = await readCrushFile();
    const crushsFiltered = crushList.filter((crush) => crush.id !== crushId);
    
    await writeCrushFile(crushsFiltered);
    res.status(200).json({ message: 'Crush deletado com sucesso' });    
    }));
app.use((err, _req, res, _next) => 
res.status(500).send(`Algo deu errado! Mensagem: ${err.message}`));

app.listen(PORT, () => { console.log('Online'); });
