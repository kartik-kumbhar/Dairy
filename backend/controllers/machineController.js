import { getMachineReading } from "../services/machineService.js";

export const getMachineData = (req, res) => {
  const data = getMachineReading();
  res.json(data);
};
