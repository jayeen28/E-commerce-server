/**
 * VRole means verify role. This function verify the user role for a specific request.
 * @param {Array} roles Array of roles to verify.
 * @returns It returns the next function.
 */
function VRole(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(401).send('Unauthorized')
        next()
    }
}
module.exports = VRole;