// // src/types/farmer.ts

// export type MilkType = "Cow" | "Buffalo";

// export type FarmerStatus = "Active" | "Inactive";

// export interface Farmer {
//   /** Internal unique id */
//   _id: string;

//   /** Application farmer code e.g. F001 */
//   code: string;

//   /** Farmer full name */
//   name: string;

//   /** Primary mobile number (10 digits) */
//   mobile: string;

//   /** Milk type supplied by farmer */
//   milkType: MilkType;

//   /** Active / Inactive for payments & collection */
//   status: FarmerStatus;

//   /** Optional address text */
//   address?: string;

//   /** ISO date string (YYYY-MM-DD) when farmer joined */
//   joinDate: string;
// }
// export type AddFarmerRequest = {
//   name: string;
//   mobile: string;
//   milkType: MilkType;
//   address?: string;
// };


export type MilkType = "cow" | "buffalo";
export type FarmerStatus = "Active" | "Inactive";

export interface Farmer {
  _id: string;
  code: string;
  name: string;
  mobile: string;
  milkType: MilkType;
  status: FarmerStatus;
  joinDate: string;
  address?: string;
}

export interface AddFarmerRequest {
  name: string;
  mobile: string;
  milkType: MilkType;
  address?: string;
}
