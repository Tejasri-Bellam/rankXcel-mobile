import { genericGet } from "./genericService";

export async function getCountriesService() {
  return await genericGet(
    "/v1/masters/options/countries/",
    true
  );
}