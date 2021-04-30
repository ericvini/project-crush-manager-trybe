const frisby = require('frisby');
const fs = require('fs');
const path = require('path');
const crushsSeed = require('./seed.json');

const url = 'http://localhost:3000';

describe('1 - Crie o endpoint GET /crush', () => {
  beforeEach(() => {
    const crushSeed = fs.readFileSync(
      path.join(__dirname, 'seed.json'),
      'utf8',
    );

    fs.writeFileSync(
      path.join(__dirname, '..', 'crush.json'),
      crushSeed,
      'utf8',
    );
  });

  it('Será validado que o endpoint retorna um array com todos os crushs cadastrados', async () => {
    await frisby
      .get(`${url}/crush`)
      .expect('status', 200)
      .then((responseGet) => {
        const { json } = responseGet;
        expect(json).toEqual(crushsSeed);
      });
  });

  it('Será validado que o endpoint retorna um array vazio caso não haja crushs cadastrados', async () => {
    fs.writeFileSync(path.join(__dirname, '..', 'crush.json'), '[]', 'utf8');

    await frisby
      .get(`${url}/crush`)
      .expect('status', 200)
      .then((responseGet) => {
        const { json } = responseGet;
        expect(json).toEqual([]);
      });
  });
});
