import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  { ignores: [".next/**", "out/**", ".wrangler/**", "next-env.d.ts"] },
];

export default eslintConfig;
