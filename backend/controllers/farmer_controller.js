import Farmer from "../models/Farmer.js";

export const addFarmer = async (req, res) => {
  const farmer = await Farmer.create(req.body);
  res.status(201).json(farmer);
};

export const getFarmers = async (req, res) => {
  const farmers = await Farmer.find().sort({ createdAt: -1 });
  res.json(farmers);
};

export const deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findById(id);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    await Farmer.findByIdAndDelete(id);

    res.json({ message: "Farmer deleted successfully" });
  } catch (err) {
    console.error("Delete farmer failed:", err);
    res.status(500).json({ message: "Failed to delete farmer" });
  }
};

export const updateFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    res.json(farmer);
  } catch (err) {
    console.error("Update farmer failed:", err);
    res.status(500).json({ message: "Failed to update farmer" });
  }
};
