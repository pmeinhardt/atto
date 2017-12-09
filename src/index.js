// https://github.com/jasonhemann/microKanren/blob/0f4505db0d2525fc3d567c5183e45f28992cfe72/microKanren.scm

const cons = x => xs => [x, ...xs];       // prepend element to list
const car = v => v[0];                    // get list head
const cdr = v => v.slice(1);              // get list tail

const isnull = x => Array.isArray(x) && x.length === 0;
const isproc = x => typeof x === 'function';
const ispair = x => Array.isArray(x) && x.length === 2;
const iseqv = u => v => {
  if (Array.isArray(u) && Array.isArray(v)) return u.length === v.length && u.every((x, i) => iseqv(x, v[i]));
  return false;
};

const assp = pred => alist => alist.find(x => pred(car(x)));


class Variable {
  constructor(c) {
    this.c = c;
  }

  toString() {
    return `_.${this.c}`;
  }

  toJSON() {
    return this.toString();
  }
}

const mkvar = c => new Variable(c);
const isvar = x => x instanceof Variable;
const vareq = x1 => x2 => x1.c === x2.c;

const walk = u => s => {
  const pr = isvar(u) && assp(v => vareq(u)(v))(s);
  return pr ? walk(car(cdr(pr)))(s) : u;
};

const exts = x => v => s => [[x, v], ...s];

const eqeq = u => v => sc => {
  const s = unify(u)(v)(car(sc));
  return s ? unit([s, ...cdr(sc)]) : mzero;
};

const unit = sc => cons(sc)(mzero);
const mzero = [];

const unify = u => v => s => {
  const un = walk(u)(s);
  const vn = walk(v)(s);

  if (isvar(un) && isvar(vn) && vareq(un)(vn)) return s;
  else if (isvar(un)) return exts(un)(vn)(s);
  else if (isvar(vn)) return exts(vn)(un)(s);
  else if (ispair(un) && ispair(vn)) {
    const sn = unify(car(un))(car(vn))(s);
    return s && unify(cdr(un))(cdr(vn))(sn);
  }
  return iseqv(un)(vn) && s;
};

const fresh = f => sc => {
  const c = car(cdr(sc));
  return f(mkvar(c))([car(sc), c + 1]);
};

const disj = g1 => g2 => sc => mplus(g1(sc))(g2(sc));
const conj = g1 => g2 => sc => bind(g1(sc))(g2);

const mplus = r1 => r2 => {
  if (isnull(r1)) return r2;
  if (isproc(r1)) return () => mplus(r2)(r1());
  return cons(car(r1))(mplus(cdr(r1))(r2));
};

const bind = r => g => {
  if (isnull(r)) return mzero;
  if (isproc(r)) return () => bind(r())(g);
  return mplus(g(car(r)))(bind(cdr(r))(g));
};

// ---

const empty = [[], 0];

const call = g => g(empty);

// const run = n => ...
// const runall = ...

// ---

const result1 = call(fresh(x => {
  const cond1 = eqeq(x)(3);
  const cond2 = eqeq(x)(4);
  return disj(cond1)(cond2);
}));

console.log(JSON.stringify(result1));
// => [ [[[[0],3]],1],    x = 3
//      [[[[0],4]],1] ]   x = 4

const result2 = call(fresh(x => fresh(y => {
  const cond1 = eqeq(x)(3);
  const cond2 = eqeq(x)(4);
  const cond3 = eqeq(x)(y);
  return conj(disj(cond1)(cond2))(cond3);
})));

console.log(JSON.stringify(result2));
// => [ [[[[1],3],[[0],3]],2],    y = 3, x = 3
//      [[[[1],4],[[0],4]],2] ]   y = 4, x = 4
