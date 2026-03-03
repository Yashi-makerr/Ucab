const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);
console.log("TOKEN GENERATED:", token);
console.log("SECRET USED:", process.env.JWT_SECRET);