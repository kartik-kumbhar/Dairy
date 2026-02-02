import Farmer from "../models/Farmer.js";

export const addFarmer = async (req, res) => {
  const farmer = await Farmer.create(req.body);
  res.status(201).json(farmer);
};

export const getFarmers = async (req, res) => {
  const farmers = await Farmer.find().sort({ createdAt: -1 });
  res.json(farmers);
};
