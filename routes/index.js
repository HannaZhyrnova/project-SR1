const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Client Terminal'
  })
})

router.get('/transfer', async (ctx, next) => {
  await ctx.render('transfer', {})
})

router.get('/check-balance', async (ctx, next) => {
  await ctx.render('check-balance', {})
})

router.get('/cashin', async (ctx, next) => {
  await ctx.render('cashin', {})
})

router.get('/cashout', async (ctx, next) => {
  await ctx.render('cashout', {})
})

router.get('/create-account', async(ctx,next) => {
  await ctx.render('create-account', {})
})

module.exports = router
