/** Auth/role probe timed out or Auth API failed — not the same as «no session». */
export class StaffAuthUnavailableError extends Error {
  constructor(message = "Не удалось проверить сессию") {
    super(message);
    this.name = "StaffAuthUnavailableError";
  }
}

export function isStaffAuthUnavailableError(err: unknown): boolean {
  return err instanceof StaffAuthUnavailableError || (err instanceof Error && err.name === "StaffAuthUnavailableError");
}
