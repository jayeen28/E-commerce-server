const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const { sendMail } = require('../emails/mailsender');

/**
 * @api {post} /users Create a new user
 */
router.post('/users', async (req, res) => {
    try {
        const allowedInfo = ['name', 'email', 'password'];
        const isValid = Object.keys(req.body).every(key => allowedInfo.includes(key));
        if (!isValid) return res.status(400).send('Invalid request');
        req.body.role = 'buyer'
        req.body.active = true;
        const user = await new User(req.body);
        let status = await sendMail({
            receiver: user.email,
            subject: "Thanks for joining in!",
            type: "text",
            body: `Welcome to the app, ${user.name}. Please wait till approval.`,
        });
        if (!status) return res.status(400).send({ error: 'Invalid Email, please try again' })
        await user.save();
        res.status(201).send(user)
    } catch (e) {
        res.status(400).send('Unable to signup.')
    }
})


/**
 * @api {post} /users/login Login a user
 */
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token })
    } catch (e) { res.status(500).send('Login failed.') }
})

/**
 * @api {post} /users/logout Logout a user
 */
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.status(200).send()
    } catch (e) { res.status(500).send('Logout failed.') }
})

/**
 * @api {post} /users/logoutAll Logout all users
 */
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) { res.status(500).send('Logout from all sessions failed.') }
})

/**
 * @api {get} /users/me Get user info
 */
router.get('/users/me', auth, async (req, res) => res.status(200).send(req.user))

/**
 * @api {get} /users get all users
 */
router.get('/users', auth, async (req, res) => {
    try {
        const match = {}
        const sort = {}
        if (req.query.active) match.active = req.query.active
        if (req.query.role) match.role = req.query.role
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }
        if (req.user.role !== 'admin') return res.status(401).send()
        let users = await User.find(
            match,
            null,
            {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        ).exec()
        res.status(200).send(users)
    } catch (e) { res.status(500).send('Failed to get all users.') }
})

/**
 * @api {get} /users/:id get user by id
 * @apiParam {String} id user id
 */
router.get('/users/:id', auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id).exec()
        user = user.toObject()
        delete user.dob
        delete user.theme
        delete user.tokens
        delete user.password
        delete user.updatedAt
        res.status(200).send(user)
    } catch (error) { res.status(500).send('Failed to get user profile.') }
})

/**
 * @api {patch} /users/:id update current logged in user
 */
router.patch('/users/me', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'email', 'password', 'dob', 'avatar', 'designation', 'role', 'avatar']
        let isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (updates.includes('role') && !['buyer', 'seller'].includes(req.body.role)) isValidOperation = false;
        if (!isValidOperation) return res.status(400).send('Invalid updates!')
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.status(200).send(req.user)
    } catch (e) { res.status(400).send('Failed to update your profile.') }
})

/**
 * @api {patch} /users/:id update user by id
 * @apiParam {String} id user id
 */
router.patch('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(400).send(`You don't have permission to access this page`)
        const targetUser = await User.findOne({ _id: req.params.id })
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'email', 'password', 'dob', 'role', 'active', 'avatar']
        let isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (updates.includes('role') && !['buyer', 'seller'].includes(req.body.role)) isValidOperation = false;
        if (!isValidOperation) return res.status(400).send('Invalid updates!')
        updates.forEach((update) => targetUser[update] = req.body[update])
        await targetUser.save()
        res.status(200).send(targetUser)
    } catch (e) { res.status(500).send('Failed to update the user.') }
})

/**
 * @params {String} id user id
 * @params {String} action active
 * @body {Object} Status: true or false. True means active and false meand deactive.
 * NOTE: Dont need body while deleting user. 
 */
router.post('/user/:id/:action', auth, async (req, res) => {
    try {
        const action = {
            active: (user, status) => {
                user.active = status
                user.save()
                res.status(200).send(user)
            },
            delete: (user) => {
                user.remove()
                res.status(200).send(user)
            }
        }
        if (req.user.role !== 'admin') return res.status(400).send(`Unauthorized`)
        const user = await User.findById(req.params.id)
        if (!user && typeof req.body.status !== 'boolean') return res.status(400).send({ error: 'Something went wrong please try again.' })
        action[req.params.action](user, req.body.status)
    }
    catch (e) { res.status(500).send('Failed to do the action.') }
});

module.exports = router