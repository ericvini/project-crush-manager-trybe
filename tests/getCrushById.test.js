const frisby = require('frisby');
const fs = require('fs');
const path = require('path');

const url = 'http://localhost:3000';

describe('2 - Crie o endpoint GET /crush/:id', () => {
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

  it('Será validado que o endpoint retorna um crush baseado no id da rota', async () => {
    await frisby
      .get(`${url}/crush/1`)
      .expect('status', 200)
      .then((responseGet) => {
        const { json } = responseGet;
        expect(json).toEqual({
          name: 'Madonna',
          age: 62,
          id: 1,
          date: { datedAt: '23/10/2020', rate: 5 },
        });
      });
  });

  it('Será validado que o endpoint retonar um erro caso nenhum crush seja encontrado', async () => {
    await frisby
      .get(`${url}/crush/9`)
      .expect('status', 404)
      .then((responseGet) => {
        const { json } = responseGet;
        expect(json.message).toBe('Crush não encontrado');
      });
  });
});
