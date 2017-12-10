const atto = require('./src');

const { call, fresh, eqeq, disj, conj, zzz } = atto;

// const fives = x => disj(eqeq(x)(5))(sc => () => fives(x)(sc));
const fives = x => disj(eqeq(x)(5))(zzz(() => fives(x)));

const init = call(fresh(x => fives(x)));

for (let i = 0, res = init; i < 5; i++, res = res[1]()) {
  console.log(JSON.stringify(res[0]));
}
