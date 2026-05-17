import User from "../models/userModel.js";

const createAdmin = async () => {
  try {
    const admin = await User.findOne({
      where: { email: "sravankumargaddamedhi@gmail.com" },
    });

    if (admin) {
      console.log("Admin already exists");
      return;
    }

    await User.create({
      name: "sravan",
      email: "sravankumargaddamedhi@gmail.com",
      phone: "7032376748",
      password: "admin@123",
      role: "admin",
      address: {
        houseNo: "1-1",
        street: "Admin Street",
        village: "Admin Village",
        city: "Hyderabad",
        pincode: "500001",
      },
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.log(error);
  }
};

export default createAdmin;

createAdmin();