import { filters } from "./types";

export function getStatusFromTitle(status: string) {
  const statusFull = filters.find((stat) => stat.title === status);
  if (!statusFull) {
    return null;
  }
  return statusFull;
}
export function getStatusFromName(status: string) {
  const statusFull = filters.find((stat) => stat.name === status);
  if (!statusFull) {
    return null;
  }
  return statusFull;
}
