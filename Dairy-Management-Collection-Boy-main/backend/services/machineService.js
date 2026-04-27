import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

// 🔥 ENV SWITCH (IMPORTANT)
const MACHINE_MODE = process.env.MACHINE_MODE || "SIMULATOR"; 
// "SIMULATOR" | "LIVE"

// 🔥 Shared state
let latestReading = {
  fat: 0,
  snf: 0,
  status: "DISCONNECTED",
};

// =======================
// 🟡 SIMULATOR MODE
// =======================
export const getMachineReading = () => {
  if (MACHINE_MODE === "SIMULATOR") {
    return {
      fat: +(Math.random() * 1 + 3.5).toFixed(1),
      snf: +(Math.random() * 1 + 8).toFixed(1),
      status: "CONNECTED",
    };
  }

  return latestReading;
};

// =======================
// 🟢 LIVE MACHINE MODE
// =======================
if (MACHINE_MODE === "LIVE") {
  console.log("🔌 Connecting to FAT Machine...");

  const port = new SerialPort({
    path: process.env.MACHINE_PORT || "COM3",
    baudRate: 9600,
  });

  const parser = port.pipe(
    new ReadlineParser({ delimiter: "\r\n" })
  );

  parser.on("data", (data) => {
    console.log("Machine Raw:", data);

    try {
      // Example: FAT:4.2 SNF:8.5
      const fatMatch = data.match(/FAT[:=]\s*(\d+\.?\d*)/i);
      const snfMatch = data.match(/SNF[:=]\s*(\d+\.?\d*)/i);

      if (fatMatch && snfMatch) {
        latestReading = {
          fat: parseFloat(fatMatch[1]),
          snf: parseFloat(snfMatch[1]),
          status: "CONNECTED",
        };

        console.log("Parsed:", latestReading);
      }
    } catch (err) {
      console.error("Parsing error:", err);
    }
  });

  port.on("error", (err) => {
    console.error("Machine Error:", err.message);
    latestReading.status = "DISCONNECTED";
  });

  port.on("open", () => {
    console.log("✅ Machine Connected");
    latestReading.status = "CONNECTED";
  });
}

// =======================
// API FUNCTION
// =======================
// export const getMachineReading = () => latestReading;