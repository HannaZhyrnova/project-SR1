const router = require('koa-router')()
const fs = require('fs');

router.get('/api/check-balance', async (ctx, next) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const pesel = ctx.request.query.pesel;
    const accnum = ctx.request.query.accnum;
    const acc = data.clients.find((client) => client.pesel === pesel && client.accountnumber === accnum);
    if (acc !== undefined) {
        await ctx.render('withdraw', {balance: acc.saldo});
    } else {
        await ctx.render('withdraw', {error: 'Konto nie istnieje'});
    }
})

router.get('/api/cashin', async (ctx, next) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const accnum = ctx.request.query.accnumin;
    const amount = parseInt(ctx.request.query.amount);
    const acc = data.clients.find((client) => client.accountnumber === accnum);
    if (acc !== undefined) {
        acc.saldo += amount;
        fs.writeFileSync('data.json', JSON.stringify(data));
        await ctx.render('cashin', {message: 'Wplata dokonana'});
    } else {
        await ctx.render('cashin', {message: 'Konto nie istnieje'});
    }
})

router.get('/api/transfer', async (ctx, next) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const accnumout = ctx.request.query.accnumout;
    const accnumin = ctx.request.query.accnumin;
    const amount = parseInt(ctx.request.query.amount);
    const accout = data.clients.find((client) => client.accountnumber === accnumout);
    const accin = data.clients.find((client) => client.accountnumber === accnumin);

    if (accout === undefined) {
        await ctx.render('transfer', {message: 'Konto nadawcy nie istnieje'});
        return;
    }

    if (accin === undefined) {
        await ctx.render('transfer', {message: 'Konto odbiorcy nie istnieje'});
        return;
    }

    if (parseInt(accout.saldo) < amount) {
        await ctx.render('transfer', {message: 'Brak srodkow na koncie nadawcy'});
        return;
    }

    accout.saldo -= amount;
    accin.saldo += amount;
    fs.writeFileSync('data.json', JSON.stringify(data));
    await ctx.render('transfer', {message: 'Przelew dokonany'});
})

module.exports = router;