const router = require('koa-router')();
const sqlite3 = require('sqlite3').verbose();

db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

const promisifyDbGet = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(
            sql, params, (err, row) => {
                if (err) {
                    reject(err);
                }

                resolve(row);
            }
        );
    });
}

const promisifyDbRun = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(
            sql, params, (err) => {
                if (err) {
                    console.error(err.message);
                    resolve(false);
                }

                resolve(true);
            }
        );
    });
}

const generateAccountNumber = (length) => {
    let accNum = '';
    for (let i = 0; i < length; i++) {
        accNum += Math.floor(Math.random()*10).toString();
    }
    return accNum;
};

router.get(
    '/api/create-account',
    async (ctx, next) => {
        const name = ctx.request.query.name;
        if (!name) {
            await ctx.render('create-account', {message: 'Prosze podac imie'});
            await next();
            return;
        }
        const surname = ctx.request.query.surname;
        if (!surname) {
            await ctx.render('create-account', {message: 'Prosze podac nazwisko'});
            await next();
            return;
        }
        const pesel = ctx.request.query.pesel;
        if (!pesel || pesel.length !== 11 || isNaN(parseInt(pesel))) {
            await ctx.render('create-account', {message: 'Prosze podac PESEL o dlugosci 11 cyfr'});
            await next();
            return;
        }
        const accNum = generateAccountNumber(10);
        await db.serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,\n' +
                '        first_name VARCHAR(30) NOT NULL,\n' +
                '        last_name VARCHAR(30) NOT NULL,\n' +
                '        pesel BIGINT,\n' +
                '        balance REAL,\n' +
                '        account_number NUMERIC\n' +
                '        );',
                [],
                (err) => {if (err) console.log(err.message)}
                ).run(
                    'INSERT INTO users(first_name,last_name,pesel,balance,account_number) VALUES (?, ?, ?, ?, ?)',
                    [name, surname, pesel, 0, accNum],
                    (err) => {if (err) console.log(err.message)}
                ).get(
                    'SELECT * FROM users WHERE account_number=(?)',
                    [accNum],
                    (err, row) => {if (err) console.log(err.message); console.log(row)}
                );
        })
        await ctx.render('create-account', {message: 'Konto zostalo utworzone. Numer konta: ' + accNum});
        await next();
    }
)

router.get(
    '/api/check-balance',
    async (ctx, next) => {
        const accNum = ctx.request.query.accnum;

        const sql = 'SELECT * FROM users WHERE account_number = ?'
        const acc = await promisifyDbGet(sql, [accNum]);

        if (acc) {
            await ctx.render('check-balance', {balance: acc.balance.toString()});
        } else {
            await ctx.render('check-balance', {error: 'Konto nie istnieje'});
        }
    }
)

router.get('/api/cashin', async (ctx, next) => {
    const accnum = ctx.request.query.accnumin;
    const amount = parseInt(ctx.request.query.amount);

    const sqlGet = 'SELECT * FROM users WHERE account_number = ?';
    const acc = await promisifyDbGet(sqlGet, [accnum]);

    if (!acc) {
        await ctx.render('cashin', {message: 'Konto nie istnieje'});
    }

    const sqlUpdate = 'UPDATE users SET balance = ? WHERE account_number = ?'
    const result = await promisifyDbRun(sqlUpdate, [acc.balance + amount, accnum]);

    if (result) {
        await ctx.render('cashin', {message: 'Wplata dokonana'});
    } else {
        await ctx.render('cashin', {message: 'Wplata nie dokonana'});
    }
})

router.get('/api/cashout', async (ctx, next) => {
    const accnum = ctx.request.query.accnum;
    const amount = parseInt(ctx.request.query.amount);

    const sqlGet = 'SELECT * FROM users WHERE account_number = ?';
    const acc = await promisifyDbGet(sqlGet, [accnum]);

    if (!acc) {
        await ctx.render('cashout', {message: 'Konto nie istnieje'});
        return;
    }

    if (acc.balance < amount) {
        await ctx.render('cashout', {message: 'Brak srodkow na koncie'});
        return;
    }

    const sqlUpdate = 'UPDATE users SET balance = ? WHERE account_number = ?'
    const result = await promisifyDbRun(sqlUpdate, [acc.balance - amount, accnum]);

    if (result) {
        await ctx.render('cashout', {message: 'Wyplata dokonana'});
    } else {
        await ctx.render('cashout', {message: 'Wyplata nie dokonana'});
    }
})

router.get('/api/transfer', async (ctx, next) => {

    const accnumout = ctx.request.query.accnumout;
    const accnumin = ctx.request.query.accnumin;
    const amount = parseInt(ctx.request.query.amount);

    const sqlGet = 'SELECT * FROM users WHERE account_number = ?';
    const accin = await promisifyDbGet(sqlGet, [accnumin]);

    if (!accin) {
        await ctx.render('transfer', {message: 'Konto odbiorcy nie istnieje'});
        return;
    }

    const accout = await promisifyDbGet(sqlGet, [accnumout]);

    if (!accout) {
        await ctx.render('transfer', {message: 'Konto nadawcy nie istnieje'});
        return;
    }

    if (parseInt(accout.balance) < amount) {
        await ctx.render('transfer', {message: 'Brak srodkow na koncie nadawcy'});
        return;
    }

    const sqlUpdate = 'UPDATE users SET balance = ? WHERE account_number = ?'
    const resultOut = await promisifyDbRun(sqlUpdate, [accout.balance - amount, accnumout]);
    const resultIn = await promisifyDbRun(sqlUpdate, [accin.balance + amount, accnumin]);

    if (resultIn && resultOut) {
        await ctx.render('transfer', {message: 'Przelew dokonany'});
    } else {
        await ctx.render('transfer', {message: 'Przelew nie dokonany'});
    }
})

module.exports = router;