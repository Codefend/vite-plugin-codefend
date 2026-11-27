import { c_Calculator } from "./calculator.js";

const secret = "predefined_secret";
const node_modules = "node_modules";

export default function () {
  const l_calculator = new c_Calculator();
  const l_result = l_calculator.f_sum(2, 3);

  console.log("secret:", secret);
  console.log("node_modules:", node_modules);
  console.log("result:", l_result);

  return l_result;
}
