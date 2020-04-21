const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Client Terminal'
  })
})

router.get('/transfer', async (ctx, next) => {
  await ctx.render('transfer', {})
})

router.get('/withdraw', async (ctx, next) => {
  await ctx.render('withdraw', {})
})

router.get('/cashin', async (ctx, next) => {
  await ctx.render('cashin', {})
})

router.get('/cashout', async (ctx, next) => {
  await ctx.render('cashout', {})
})

module.exports = router
