const { CreateListItemRoutes } = require('./CreateRoutes')
const { ResolveListItemRoutes } = require('./ResolveRoutes')

const router = require('express').Router()

router.use(CreateListItemRoutes)
router.use(ResolveListItemRoutes)

module.exports = {
    ListItemRoutes: router,
}
