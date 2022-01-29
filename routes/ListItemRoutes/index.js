const { CreateListItemRoutes } = require('./CreateRoutes')
const { GetListItemRoutes } = require('./GetRoutes')
const { ResolveListItemRoutes } = require('./ResolveRoutes')

const router = require('express').Router()

router.use(CreateListItemRoutes)
router.use(ResolveListItemRoutes)
router.use(GetListItemRoutes)

module.exports = {
    ListItemRoutes: router,
}
