import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import OTP from "../models/otp.js";
import sgMail from "@sendgrid/mail";
import axios from "axios";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);



export function createUser(req, res) {
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);

	const user = new User({
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		password: hashedPassword,
	});
	user
		.save()
		.then(() => {
			res.json({ message: "User created successfully" });
		})
		.catch((error) => {
			res.json({ message: "Error creating user", error: error });
		});
}

export async function createUserAsync(req, res) {
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);

	const user = new User({
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		password: hashedPassword,
	});
	try {
		await user.save();
		res.json({ message: "User created successfully" });
	} catch (error) {
		res.json({ message: "Error creating user", error: error });
	}
}

export function loginUser(req, res) {
	User.findOne({
		email: req.body.email,
	})
		.then((user) => {
			if (user == null) {
				res.status(404).json({
					message: "User with given email not found",
				});
			} else {
				if (user.isBlocked) {
					res
						.status(403)
						.json({
							message:
								"Your account is blocked. Please contact support for more information.",
						});
					return;
				}
				const isPasswordValid = bcrypt.compareSync(
					req.body.password,
					user.password,
				);

				if (isPasswordValid) {
					//check if attempts are more that 3 times and if so, we do not send this token
					const token = jwt.sign(
						{
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							role: user.role,
							image: user.image,
							isEmailVerified: user.isEmailVerified,
						},
						process.env.JWT_SECRET,
						{ expiresIn: req.body.rememberme ? "30d" : "48h" },
					);

					res.json({
						message: "Login successfull",
						token: token,
						role: user.role,
					});
				} else {
					res.status(401).json({
						message: "Invalid password",
						//we should add a record in data base of this failed attempt for the specific email
					});
				}
			}
		})
		.catch(() => {
			res.status(500).json({
				message: "Internal server error",
			});
		});
}

export function getUser(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized",
		});
		return;
	}

	res.json({
		email: req.user.email,
		firstName: req.user.firstName,
		lastName: req.user.lastName,
		role: req.user.role,
		image: req.user.image,
		isEmailVerified: req.user.isEmailVerified,
	});
}

export async function updateUserProfile(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized",
		});
		return;
	}
	try {
		await User.updateOne(
			{ email: req.user.email },
			{
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				image: req.body.image,
			},
		);
		const user = await User.findOne({ email: req.user.email });
		const token = jwt.sign(
			{
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				image: user.image,
				isEmailVerified: user.isEmailVerified,
			},
			process.env.JWT_SECRET,
			{ expiresIn: req.body.rememberme ? "30d" : "48h" },
		);
		res.json({ message: "Profile updated successfully", token: token });
	} catch (error) {
		res.status(500).json({ message: "Error updating profile", error: error });
	}
}

export async function changeUserPassword(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized",
		});
		return;
	}

	try {
		const hashedPassword = bcrypt.hashSync(req.body.password, 10);

		await User.updateOne(
			{ email: req.user.email },
			{ password: hashedPassword },
		);
		res.json({ message: "Password changed successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error changing password", error: error });
	}
}

export function isAdmin(req) {
	if (req.user == null) {
		return false;
	}
	if (req.user.role == "admin") {
		return true;
	} else {
		return false;
	}
}

export async function sendOTP(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: "User with given email not found",
      });
    }

    const otp = Math.floor(10000 + Math.random() * 90000);

    const msg = {
      to: req.body.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME,
      },
      subject: "Your OTP for password reset",
      text: `Your OTP is ${otp}`,
      html: `<h2>Your OTP is ${otp}</h2>`,
    };

    await sgMail.send(msg);

    await OTP.deleteMany({ email: req.body.email });

    await new OTP({
      email: req.body.email,
      otp,
    }).save();

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error sending OTP",
      error,
    });
  }
}

export async function verifyOTP(req, res) {
	try {
		const otpCode = req.body.otp;
		const email = req.body.email;
		const newPassword = req.body.newPassword;

		const otpRecord = await OTP.findOne({ email: email });

		if (otpRecord == null) {
			res.status(404).json({ message: "OTP not found for the given email" });
			return;
		}

		if (otpRecord.otp != otpCode) {
			res.status(400).json({ message: "Invalid OTP" });
			return;
		}

		const hashedPassword = bcrypt.hashSync(newPassword, 10);

		await User.updateOne({ email: email }, { password: hashedPassword });

		await OTP.deleteOne({ email: email });

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error verifying OTP", error: error });
	}
}

export async function googleLogin(req, res) {
	try {
		//
		const googleResponse = await axios.get(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				headers: {
					Authorization: "Bearer " + req.body.token,
				},
			},
		);

		const user = await User.findOne({ email: googleResponse.data.email });

		console.log(user);

		if (user == null) {
			const newUser = new User({
				email: googleResponse.data.email,
				firstName: googleResponse.data.given_name,
				lastName: googleResponse.data.family_name,
				password: "google-login",
				image: googleResponse.data.picture,
				isEmailVerified: true,
			});

			await newUser.save();

			const token = jwt.sign(
				{
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role,
					image: newUser.image,
					isEmailVerified: newUser.isEmailVerified,
				},
				process.env.JWT_SECRET,
			);

			res.json({
				message: "Login successfull",
				token: token,
				role: newUser.role,
			});
		} else {
			if (user.isBlocked) {
				res
					.status(403)
					.json({
						message:
							"Your account is blocked. Please contact support for more information.",
					});
				return;
			}
			const token = jwt.sign(
				{
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					image: user.image,
					isEmailVerified: user.isEmailVerified,
				},
				process.env.JWT_SECRET,
			);

			res.json({
				message: "Login successfull",
				token: token,
				role: user.role,
			});
		}
	} catch (error) {
		console.log("Error logging in with Google", error);
		res
			.status(500)
			.json({ message: "Error logging in with Google", error: error });
	}
}

export async function getAllUsers(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}
	try {
		const pageSizeInString = req.params.pageSize || "10";

		const pageNumberInString = req.params.pageNumber || "1";

		const pageSize = parseInt(pageSizeInString);

		const pageNumber = parseInt(pageNumberInString);

		const numberOfUsers = await User.countDocuments();

		const numberOfPages = Math.ceil(numberOfUsers / pageSize);

		const users = await User.find({})
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize);

		res.json({
			users: users,
			totalPages: numberOfPages,
		});
	} catch (error) {
		res.status(500).json({ message: "Error getting users", error: error });
	}
}

export async function blockOrUnblockUser(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	const email = req.body.email;

	if (req.user.email == email) {
		res.status(400).json({
			message: "You cannot block yourself",
		});
		return;
	}
	try {
		const user = await User.findOne({ email: email });

		if (user == null) {
			res.status(404).json({ message: "User with given email not found" });
			return;
		}
		await User.updateOne({ email: email }, { isBlocked: !user.isBlocked });
		res.json({
			message: user.isBlocked
				? "User unblocked successfully"
				: "User blocked successfully",
		});
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error blocking/unblocking user", error: error });
	}
}

export async function changeRole(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	const email = req.body.email;

	if (req.user.email == email) {
		res.status(400).json({
			message: "You cannot change your own role",
		});
		return;
	}
	try {
		const user = await User.findOne({ email: email });

		if (user == null) {
			res.status(404).json({ message: "User with given email not found" });
			return;
		}
		await User.updateOne(
			{ email: email },
			{ role: user.role == "admin" ? "customer" : "admin" },
		);
		res.json({
			message:
				user.role == "admin"
					? "User role changed to customer successfully"
					: "User role changed to admin successfully",
		});
	} catch (error) {
		res.status(500).json({ message: "Error changing user role", error: error });
	}
}