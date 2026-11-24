import type {Metadata} from "next";
import StudioV2Page from "../studio-v2/page";

export const metadata:Metadata={
 title:"eventiq Studio 2.0 — бесконечный холст",
 description:"Актуальное рабочее пространство eventiq Studio.",
 robots:{index:false,follow:false},
};

// Both historical entry points render the same workspace (including static previews).
export default StudioV2Page;
