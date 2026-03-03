/**
 * Role-Based Authorization Middleware
 *
 * Usage: protect MUST run first (to decode the JWT and set req.user).
 * Then chain authorize() to restrict by role.
 *
 * Example in routes:
 *   router.get("/admin/users", protect, authorize("admin"), getUsers);
 *   router.put("/ride/accept", protect, authorize("driver", "admin"), acceptRide);
 */

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should never happen if protect runs first, but guard anyway
            console.log("[ROLE] ❌ req.user is missing — protect middleware must run before authorize");
            return res.status(401).json({ message: "Not authenticated" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.log(
                `[ROLE] ❌ Access denied — user role '${req.user.role}' is not in allowed: [${allowedRoles.join(", ")}]`
            );
            return res.status(403).json({
                message: `Access denied. Requires one of: ${allowedRoles.join(", ")}`,
            });
        }

        console.log(`[ROLE] ✅ Role '${req.user.role}' authorized for this route`);
        next();
    };
};

module.exports = { authorize };
